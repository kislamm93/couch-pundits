# World Cup 2026 Prediction Game — Project Files

What's in this zip and how the pieces fit together.

## Files
- **BUILD_PLAN.md** — The backend spec. Hand this to Cursor to build the FastAPI + MongoDB
  API (auth, fixtures, predictions, leaderboard) plus the standalone scoring script. The
  source of truth for the API contract.
- **fixtures.json** — All 72 group-stage matches, seeded and ready. Stable `match_id` 1–72,
  teams, stadium, city, `kickoff_utc` (UTC ISO8601), null score fields. Load this into Mongo.
- **STITCH_PROMPT.md** — Design prompt for Google Stitch. Generates the 4 mobile screens
  (Auth, Matches, Leaderboard, Profile) in sporty dark style + a DESIGN.md.
- **LOVABLE_PROMPT.md** — Alternative full-app prompt for Lovable (if you ever go that route
  instead of Stitch + Cursor). Same UI spec, but assumes Lovable builds the working app.
- **build_fixtures.py** — The script that generated fixtures.json (ET → UTC conversion,
  stadium mapping). Keep for reference / if you need to regenerate.

## Recommended build order
1. **Backend first.** Give BUILD_PLAN.md to Cursor → build FastAPI app → deploy to Render →
   seed fixtures.json into MongoDB Atlas → get the live API URL.
2. **Design.** STITCH_PROMPT.md → generate screens in Stitch → export code + DESIGN.md.
3. **Wire it up.** In Cursor (on your other device, via a GitHub repo): take the Stitch
   export + DESIGN.md, point it at the live API URL, build the real React frontend, deploy.
   (The frontend can't function until the backend URL exists and CORS allows the frontend origin.)

## Still to decide / do later
- **Scoring system details** — current placeholder is 5 pts exact / 2 pts correct outcome /
  0 wrong. We can make it richer (goal-difference bonus, escalating points by matchday,
  leaderboard tie-breakers).
- **Cursor wiring prompt** — the prompt that hooks the Stitch UI to the API. Best written
  once you know exactly what Stitch exported (React vs HTML).
- **6 placeholder teams** (UEFA/FIFA Playoff slots) get real names after March 2026 qualifiers;
  rename in Mongo without touching match_id.
