# Deployment Guide — WC2026 Prediction Game

Monorepo with two deployable apps:

| App | Folder | Host | URL example |
|-----|--------|------|-------------|
| API (FastAPI) | `wc2026-api/` | Render | `https://couch-pundits-api.onrender.com` |
| UI (Vite/React) | `wc2026-ui/` | GitHub Pages | `https://<user>.github.io/couch-pundits/` |
| Database | — | MongoDB Atlas (M0 free) | `mongodb+srv://…` |

Fixtures **auto-seed on API startup** when the collection is empty — no manual seed step in prod.

---

## 1. MongoDB Atlas

1. Create a free **M0** cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a user (username + password). Save them.
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere — Render egress IPs are dynamic on free tier).
4. **Connect → Drivers** → copy the SRV URI, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
   (URL-encode special characters in the password.)

## 2. Push to GitHub

From the repo root (`wc2026-project/`):

```bash
git init
git add .
git commit -m "WC2026 prediction game"
git branch -M main
git remote add origin git@github.com:<you>/couch-pundits.git
git push -u origin main
```

`.gitignore` keeps `.env`, `.venv/`, `node_modules/`, and `dist/` out of the repo.

## 3. Render — API

1. **New → Blueprint**, pick the repo. Render reads `/render.yaml` and creates `couch-pundits-api`
   (Root Directory `wc2026-api`, free plan, health check `/health`).
2. Set the two `sync: false` env vars in the dashboard:
   - `MONGODB_URI` → the Atlas SRV URI from step 1.
   - `CORS_ORIGINS` → leave as `http://localhost:5173` for now; update after the UI deploys (step 5).
3. `JWT_SECRET` and `ADMIN_KEY` are auto-generated. Open **Environment** and **copy `ADMIN_KEY`** — you need it for posting results via Postman.
4. Deploy. When live, check `https://<api>.onrender.com/health` → `{"status":"ok"}` and
   `…/fixtures` → 72 matches (auto-seeded on first boot).

> Free tier sleeps after ~15 min idle; the first request after a nap takes ~30–60 s.

## 4. GitHub Pages — UI

The UI deploys automatically via GitHub Actions (`.github/workflows/deploy-ui.yml`)
on every push to `main` that touches `wc2026-ui/`. No Vercel, no manual build.

1. **Set the API URL as a repo variable.** Repo → **Settings → Secrets and variables →
   Actions → Variables → New repository variable**:
   - Name `VITE_API_BASE`, value = the Render API URL, **no trailing slash**
     (e.g. `https://couch-pundits-api.onrender.com`).
   The build bakes this into the bundle, so re-run the workflow after changing it.
2. **Enable Pages.** Repo → **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. **Trigger a deploy** — push to `main`, or run the workflow manually from the **Actions** tab
   (**Deploy UI to GitHub Pages → Run workflow**).
4. When the run finishes, the site is live at
   `https://<user>.github.io/couch-pundits/`
   (the workflow derives the `/couch-pundits/` base path from the repo name automatically).

> Using a custom domain or a `<user>.github.io` repo instead? The base path must be `/`.
> Override it by setting a repo variable `VITE_BASE=/` and editing the `VITE_BASE` line in
> the workflow to use it. For a custom domain also add a `CNAME` file to `wc2026-ui/public/`.

## 5. Connect CORS

Back in Render → `couch-pundits-api` → Environment, set `CORS_ORIGINS` to the Pages **origin**
— that's just the host, **no `/couch-pundits/` path, no trailing slash**
(comma-separate multiple origins):

```
CORS_ORIGINS=https://<user>.github.io
```

Save → Render redeploys. The UI can now call the API without CORS errors.

> The Pages origin is predictable from your username, so you can set this before the first
> UI deploy. To also test locally against prod, add `,http://localhost:5173`.

## 6. Smoke test (prod)

1. Open the Pages URL → register a user → save a prediction.
2. Post a result with Postman:
   - `PUT https://couch-pundits-api.onrender.com/fixtures/1/result`
   - Header `x-admin-key: <the ADMIN_KEY from Render>`
   - Body `{ "home_score": 2, "away_score": 1 }`
3. Open the Leaderboard — points appear (+5 exact / +2 correct outcome / 0 wrong).

---

## Entering daily results

Every match day, for each finished match call:

```
PUT  /fixtures/{match_id}/result
Header:  x-admin-key: <ADMIN_KEY>
Body:    { "home_score": <int>, "away_score": <int> }
```

This marks the fixture `finished`, scores every prediction for it immediately, and the
leaderboard recomputes automatically. Re-posting a corrected score re-scores it.

## Local development

```bash
./dev.sh            # docker compose: Mongo + API (:8000) + UI (:5173)
```

Local admin key is `local-admin-key` (set in `docker-compose.yml`). Fixtures auto-seed on
API startup. To reseed any database manually:

```bash
cd wc2026-api
MONGODB_URI="<uri>" python scripts/seed_fixtures.py
```
