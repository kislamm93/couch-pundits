# Stitch Design Prompt — World Cup 2026 Prediction Game

This is a **design prompt** for Google Stitch. Goal: generate the screens and a sporty dark
UI you can export (HTML/CSS or React + DESIGN.md) and then wire to a FastAPI backend in Cursor.
Stitch designs the look and the screens — it does NOT need to handle real data, auth, or APIs.
Use realistic placeholder/sample content so the screens look populated.

Paste the block below into Stitch. If Stitch asks for platform, choose **mobile**.

---

Design a **mobile-first** web app for a World Cup 2026 football score-prediction game played
by a small group of friends. Sporty, energetic, premium sports-app feel. Target a ~390px phone
viewport. Generate the screens listed below as a connected multi-screen flow with a shared
bottom tab bar.

## Visual style
- **Dark theme.** Near-black background (#0B0E14), elevated cards slightly lighter (#151A23).
- **One electric accent:** vivid green #00E07A — use for primary buttons, the active tab,
  points numbers, countdown highlights, and the current user's leaderboard row.
- High-contrast white/light-grey text. Secondary text in muted grey (#8A93A3).
- **Scoreboard energy:** big bold condensed numerals for scores and points; tabular figures.
- Rounded cards (16px radius), thin 1px borders (#222936), soft shadows.
- Country **flag emoji** beside each team name. Generous tap targets, clean spacing,
  no clutter. Respect mobile safe areas (notch + home indicator).
- Subtle press/active states on buttons, chips, and steppers.

## Global: bottom tab bar (on the 3 main screens)
Fixed bottom navigation with 3 items: **Matches**, **Leaderboard**, **Profile**.
Active item uses the green accent (icon + label); inactive items muted grey. Simple line icons.

## Screen 1 — Auth (Login / Register)
A single clean entry screen with a toggle between **Log in** and **Register**.
- App title "World Cup 2026" with a small "Prediction League" subtitle and a subtle football motif.
- Two fields: Username, Password.
- One large green primary button ("Log in" / "Create account").
- A text toggle to switch modes ("New here? Create an account" / "Have an account? Log in").
- Minimal — no email, no social login, no password reset.
- Show space for an inline error message under the fields.

## Screen 2 — Matches (primary screen)
Header: bold "World Cup 2026", subtitle "Group Stage".
- **Group filter:** a horizontally scrollable row of pill chips: All, A, B, C, D, E, F, G, H, I, J, K, L.
  "All" selected by default (green filled); others outlined.
- Below the filter, a scrollable list of **match cards grouped under date section headers**
  (e.g. a sticky-ish header "Thu, Jun 11", then that day's matches; next "Fri, Jun 12", etc.).
- Design **three card states** so the export shows all of them:
  1. **Open (predictable):**
     - Top row: group badge ("Group C") on the left; kickoff time + "Estadio Azteca · Mexico City" small on the right.
     - A small green **countdown chip**: "in 2d 4h".
     - Two team rows: each with flag emoji + country name on the left and a **stepper control**
       on the right — a minus button, a big number (the predicted goals), a plus button.
       Big circular tap targets, number prominent.
     - A green **Save pick** button (full width, slightly shorter) at the bottom of the card.
  2. **Already predicted:** same as open, but steppers prefilled with the user's numbers and a
     small muted label "Your pick" near the control; Save button shows a checked "Saved ✓" style.
  3. **Locked / finished:** steppers replaced by the **final score** shown big in the center
     (e.g. "2 — 1") with a small lock or "FT" tag, plus a **points badge** in the corner:
     "+5" (exact, green), "+2" (correct outcome, muted green), or "+0" (grey).
     Include "Your pick: 2–0" as a small line so the user sees what they guessed.
- Provide realistic sample matches using real teams (Mexico, South Africa, Brazil, Morocco,
  Scotland, England, Croatia, Argentina, Spain, Germany, France, etc.) so it looks alive.

## Screen 3 — Leaderboard
Header: "Leaderboard", small subtitle "Group Stage".
- A ranked vertical list of players. Each row:
  - Rank number on the left (1, 2, 3 styled with subtle gold/silver/bronze tint for top three).
  - Username.
  - A large **total points** number on the right in the green accent.
  - A small secondary line under the username: "4 exact · 9 correct · 18 played".
- **Highlight the current user's own row** with a green-tinted background / left accent bar.
- Include ~8–12 sample rows so ranking styling is visible. Add a subtle empty-state variant:
  "No results in yet — predictions are open!"

## Screen 4 — Profile
Header: the username (e.g. "@alex") with a simple avatar circle/initial.
- A **stats card** with three big figures side by side: Total Points, Exact Hits, Correct Outcomes.
- A list titled "My predictions": each row = match (flag + teams), the user's predicted score,
  and the points earned if the match finished ("+5", "+2", "+0") or "Pending" if not yet played.
- A **Log out** button at the bottom (outlined, not the green primary — secondary style).

## Output
- Generate all four screens as a connected prototype with the bottom tab bar shared across
  screens 2–4 (auth screen has no tab bar).
- Produce a **DESIGN.md** capturing the color tokens (#0B0E14, #151A23, #00E07A, #8A93A3,
  #222936), typography, radius, and component rules (cards, chips, steppers, tab bar) so a
  coding assistant can reproduce the styling exactly.
- Export code (React if available, otherwise HTML/CSS with Tailwind).

Keep it polished and sporty — it should feel like a real football app, not a generic form.
