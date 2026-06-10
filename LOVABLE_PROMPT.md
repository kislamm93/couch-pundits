# Lovable Prompt — World Cup 2026 Prediction Game (mobile-first)

Paste everything below into Lovable. Replace `API_BASE` with your deployed Render URL.

---

Build a **mobile-first** web app for a World Cup 2026 score-prediction game played by a
small group of friends. It talks to an existing REST API (do not build a backend, do not use
Supabase — just call the API with fetch). Design for phones first; it must look slick and
sporty on a ~390px viewport. Desktop can just be the mobile layout centered with max-width.

## API
Base URL: `API_BASE` (e.g. https://my-app.onrender.com)
Auth: JWT. After login/register, store the token in memory + localStorage under `wc_token`.
Send it on protected calls as header `Authorization: Bearer <token>`. All times are UTC ISO8601.

Endpoints:
- `POST /auth/register` body `{username, password}` → `{access_token, token_type}`
- `POST /auth/login` body `{username, password}` → `{access_token, token_type}`
- `GET /me` → `{username}`
- `GET /fixtures` → array of:
  `{match_id, group, home_team, away_team, stadium, city, kickoff_utc, home_score, away_score, status}`
- `GET /predictions/me` → array of `{match_id, pred_home, pred_away, points}`
- `PUT /predictions/{match_id}` body `{pred_home, pred_away}` → upsert. May return 409 if the
  match already kicked off (locked) — handle gracefully.
- `GET /leaderboard` → array of `{username, total_points, exact_count, correct_count, played}` (already sorted desc)

## Visual style — sporty, dark
- Dark background (near-black `#0B0E14`), high-contrast text.
- One electric accent (pick an energetic green or cyan, e.g. `#00E07A`) used for CTAs,
  active tab, points, and the user's own leaderboard row.
- Bold condensed headings, big numerals (scores/points should feel like a scoreboard).
- Rounded cards (16px), subtle borders, soft shadows. Tasteful, not cluttered.
- Smooth micro-interactions: tab switches, stepper taps, card press states.
- Use country flag emoji next to team names (map common country names → flag emoji; for any
  "UEFA Playoff X" / "FIFA Playoff X" placeholder, show a neutral ⚽ and the label as-is).

## Navigation
Fixed **bottom tab bar**, 3 tabs: **Matches**, **Leaderboard**, **Profile**.
Active tab uses the accent color. Tab bar stays above content with safe-area padding.

## Auth gate
If no valid token, show a single clean **Login / Register** screen (toggle between the two).
Just username + password fields, one primary button. On success store token and go to Matches.
Show inline errors (bad credentials, username taken). No email, no password reset.

## Matches tab
- Header: "World Cup 2026" + small subtitle "Group Stage".
- **Group filter:** a normal horizontal scrollable row of chips: `All, A, B, C … L`.
  Tapping filters the list. `All` is default.
- Below the filter, list fixtures **grouped into date sections** (section header = local date,
  e.g. "Thu, Jun 11"). Convert `kickoff_utc` to the device's **local timezone** for all
  display. Sort sections and matches chronologically.
- **Match card** shows:
  - group badge (e.g. "Group C")
  - home team (flag + name) and away team (flag + name)
  - kickoff time in local time + stadium, city
  - a small **live countdown** to kickoff ("in 2d 4h", "in 35m"); when passed, show "Kicked off" / final.
  - **Prediction control:** two compact **steppers** (− value +), one under each team,
    starting at 0, min 0, max ~20. Big tap targets (≥44px). A **Save** button per card,
    enabled only when the prediction changed. On save call PUT; show a quick saved ✓ state.
  - If the user already predicted, prefill the steppers and show "Your pick" subtly.
  - **Locked state:** if `now >= kickoff_utc` (or API returns 409), disable steppers + Save,
    show a lock icon and the text "Locked". If the match is finished (`status==finished`),
    show the **actual score** prominently and, if the user predicted, show points earned
    (badge: "+5", "+2", or "+0") using the scoring the API provides via /predictions/me.
- Pull-to-refresh or a refresh affordance is a nice touch.

## Leaderboard tab
- Title "Leaderboard".
- Ranked list: position (1,2,3 with subtle medal tint for top 3), username, and a big
  **total_points** number on the right.
- Secondary line per row: "X exact · Y correct · Z played" (from exact_count/correct_count/played).
- **Highlight the current user's own row** with the accent color so they spot themselves.
- Empty state if no points scored yet ("No results in yet — predictions are open!").

## Profile tab
- Show username.
- Quick stats card: total points, exact hits, correct outcomes (compute from /leaderboard row
  for this user, or /predictions/me).
- A list of the user's predictions with the match and points (if scored).
- **Logout** button (clears token, returns to auth gate).

## Technical requirements
- React. Keep state simple (Context or hooks). No backend, no DB, no Supabase.
- Create a small `api.js` wrapper: reads token from localStorage, attaches the auth header,
  handles 401 by logging out, and exposes typed functions for each endpoint above.
- Convert all UTC timestamps to local time with the browser's Intl APIs.
- Be resilient: loading skeletons on each tab, error toasts on failed calls, optimistic
  "Saved ✓" on prediction PUT with rollback if it fails.
- Mobile polish: no horizontal overflow, large tap targets, momentum scrolling, respect
  safe-area insets (notch / home indicator), prevent the iOS input-zoom (font-size ≥16px on inputs).
- Accessibility: buttons are real buttons, sufficient contrast, steppers have aria labels.

## Acceptance
- I can register on my phone, see all 72 matches grouped by date, filter by group, set a
  scoreline with steppers, and save it.
- A match in the past shows Locked and (when finished) the real score + my points.
- Leaderboard shows everyone sorted, with me highlighted.
- It looks like a polished sports app, not a generic form.
