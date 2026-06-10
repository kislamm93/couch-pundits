# World Cup 2026 Prediction Game — Build Plan (for Cursor)

A small web app where ~20 friends register, predict scorelines for World Cup 2026
group-stage matches, earn points, and see a leaderboard.

## Stack (decided — do not substitute)
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Motor (async MongoDB driver), Pydantic v2
- **DB:** MongoDB Atlas (connection string via env var)
- **Auth:** JWT (HS256) returned on login, sent by the frontend as `Authorization: Bearer <token>`. No cookies, no server-side sessions.
- **Passwords:** hashed with `bcrypt` via `passlib`. Never store plaintext.
- **Deploy:** Render (single web service). CORS open to the frontend origin.
- **Frontend:** built separately (Lovable). Backend is a pure JSON API. Serve nothing but JSON + the OpenAPI docs.
- **Scoring:** a standalone local Python script (`score.py`) run manually after results are entered. NOT an API endpoint.

## Scope rules
- Group stage only (72 matches, already seeded — see `fixtures.json`).
- Open registration: anyone with username + password can create an account.
- Same role for everyone. No admin UI. Results are entered by editing MongoDB directly.
- Keep it simple. No email, no password reset, no rate limiting, no refresh tokens.

---

## Data model (MongoDB collections)

### `users`
```
{
  _id: ObjectId,
  username: string (unique, lowercase, 3–20 chars),
  password_hash: string,
  created_at: datetime
}
```
Create a unique index on `username`.

### `fixtures`
Seeded once from `fixtures.json`. Shape:
```
{
  match_id: int (1–72, stable key — use this everywhere, not _id),
  group: "A".."L",
  home_team: string,
  away_team: string,
  stadium: string,
  city: string,
  kickoff_utc: ISO8601 string (e.g. "2026-06-11T19:00:00Z"),
  stage: "group",
  home_score: int | null,   // filled in manually after the match
  away_score: int | null,
  status: "scheduled" | "finished"
}
```
Create a unique index on `match_id`.

### `predictions`
One per (user, match). Upsert on change.
```
{
  _id: ObjectId,
  username: string,
  match_id: int,
  pred_home: int,   // >= 0
  pred_away: int,   // >= 0
  points: int | null,   // null until scored; written by score.py
  updated_at: datetime
}
```
Create a unique compound index on `(username, match_id)`.

---

## Scoring rules (baked into score.py — easy to tweak later)
For each finished match, for each user prediction:
- **Exact score correct** (pred_home == home_score AND pred_away == away_score) → **5 pts**
- **Correct outcome only** (same winner, or both draws, but wrong score) → **2 pts**
- **Wrong outcome** → **0 pts**

Outcome is derived: sign(home - away) ∈ {home win, draw, away win}.

---

## Prediction lock rule
A user may create/edit a prediction for a match only **before its `kickoff_utc`**.
Enforce server-side: reject writes when `now_utc >= kickoff_utc` (409 Conflict).

---

## API endpoints

All JSON. All times UTC ISO8601. Protected routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | no | `{username, password}` → create user, return token |
| POST | `/auth/login` | no | `{username, password}` → return token |
| GET | `/me` | yes | current user `{username}` |
| GET | `/fixtures` | no | list all 72 fixtures, sorted by kickoff_utc |
| GET | `/fixtures/{match_id}` | no | single fixture |
| GET | `/predictions/me` | yes | all of caller's predictions |
| PUT | `/predictions/{match_id}` | yes | `{pred_home, pred_away}` → upsert (locked after kickoff) |
| GET | `/leaderboard` | no | `[{username, total_points, exact_count, correct_count}]` sorted desc |

### Response shapes
- Token: `{ "access_token": "<jwt>", "token_type": "bearer" }`
- Leaderboard row: `{ username, total_points, exact_count, correct_count, played }`
  - `total_points` = sum of `points` over scored predictions
  - `exact_count` = # predictions worth 5
  - `correct_count` = # predictions worth 2
  - `played` = # scored predictions
- Errors: standard FastAPI `{ "detail": "..." }` with correct status codes
  (400 bad input, 401 bad/missing token, 409 prediction locked, 404 not found).

### Auth details
- JWT payload: `{ "sub": username, "exp": <now + 30 days> }`. Secret from `JWT_SECRET` env.
- Username normalized to lowercase on register/login.
- Reject duplicate username on register with 400.

---

## Project layout
```
wc2026-api/
  app/
    __init__.py
    main.py            # FastAPI app, CORS, router mounting
    config.py          # env: MONGODB_URI, DB_NAME, JWT_SECRET, CORS_ORIGINS
    db.py              # Motor client + collection helpers + index creation on startup
    security.py        # bcrypt hash/verify, JWT encode/decode, get_current_user dep
    models.py          # Pydantic request/response models
    routers/
      auth.py
      fixtures.py
      predictions.py
      leaderboard.py
  scripts/
    seed_fixtures.py   # load fixtures.json into the fixtures collection (idempotent upsert by match_id)
    score.py           # recompute points for all finished matches; standalone
  fixtures.json        # the 72 seeded matches (provided)
  requirements.txt
  .env.example
  render.yaml          # Render web service config
  README.md
```

## requirements.txt
```
fastapi
uvicorn[standard]
motor
pydantic>=2
pydantic-settings
passlib[bcrypt]
python-jose[cryptography]
python-dotenv
```

## .env.example
```
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net
DB_NAME=wc2026
JWT_SECRET=change-me-to-a-long-random-string
CORS_ORIGINS=http://localhost:5173,https://your-lovable-app-url
```

## Behavior details to implement
1. On startup, connect to Mongo and ensure the three indexes exist.
2. `seed_fixtures.py`: read `fixtures.json`, upsert each by `match_id` (so re-running won't duplicate and won't clobber any scores already entered — only set fields that are missing).
3. `PUT /predictions/{match_id}`: validate match exists, validate non-negative ints, check kickoff lock, upsert, set `points: null`, `updated_at: now`.
4. `score.py` (run locally, `python scripts/score.py`):
   - connect to Mongo
   - for every fixture with status "finished" and non-null scores, recompute `points` for each prediction on that match per the scoring rules
   - print a summary (matches scored, predictions updated)
   - safe to re-run anytime (idempotent)
5. To record a result, I will manually set `home_score`, `away_score`, and `status: "finished"` on the fixture in Mongo, then run `score.py`.

## Deploy on Render
- `render.yaml` defines one web service:
  - build: `pip install -r requirements.txt`
  - start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - env vars: MONGODB_URI, DB_NAME, JWT_SECRET, CORS_ORIGINS
- After first deploy, run the seed once (Render Shell or locally pointed at Atlas):
  `python scripts/seed_fixtures.py`

## Acceptance checks
- Register two users, log in, get tokens.
- GET /fixtures returns 72 matches sorted by kickoff.
- PUT a prediction before kickoff succeeds; faking a past kickoff returns 409.
- Manually finish a match in Mongo, run score.py, GET /leaderboard reflects points.
- All protected routes 401 without a valid token.

Build all files, wire it up, and make sure `uvicorn app.main:app` boots clean.
