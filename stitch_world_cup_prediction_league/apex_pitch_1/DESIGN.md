---
name: Apex Pitch
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2eb'
  on-surface-variant: '#bacbba'
  inverse-surface: '#e1e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#859586'
  outline-variant: '#3c4a3e'
  surface-tint: '#11e37d'
  primary: '#45fd93'
  on-primary: '#00391a'
  primary-container: '#00e07a'
  on-primary-container: '#005d2f'
  inverse-primary: '#006d38'
  secondary: '#c2c6d3'
  on-secondary: '#2c313a'
  secondary-container: '#444953'
  on-secondary-container: '#b4b8c5'
  tertiary: '#d8dff1'
  on-tertiary: '#2a313e'
  tertiary-container: '#bcc3d4'
  on-tertiary-container: '#49505f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#5eff9b'
  primary-fixed-dim: '#11e37d'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#005229'
  secondary-fixed: '#dee2ef'
  secondary-fixed-dim: '#c2c6d3'
  on-secondary-fixed: '#171c25'
  on-secondary-fixed-variant: '#424751'
  tertiary-fixed: '#dce2f4'
  tertiary-fixed-dim: '#c0c6d8'
  on-tertiary-fixed: '#151c28'
  on-tertiary-fixed-variant: '#404755'
  background: '#10131a'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
typography:
  display-score:
    fontFamily: Archivo Narrow
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Anybody
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
  headline-md:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Archivo Narrow
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  stats-numeral:
    fontFamily: Archivo Narrow
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for high-performance sports engagement, specifically tailored for the World Cup 2026. The brand personality is **Electric, Precise, and Authoritative**. It aims to evoke the adrenaline of a live match through a high-contrast, "Dark Mode" first aesthetic that feels like a premium broadcast scoreboard.

The style is **Modern/High-Contrast**, utilizing deep obsidian backgrounds to make vivid neon accents and crisp typography pop. Every interface element is designed for speed and clarity, ensuring users can make split-second predictions with confidence. The aesthetic leans into a "Digital Stadium" feel—clean, structured, and unmistakably sporty.

## Colors
The palette is built on a foundation of deep neutrals to provide maximum contrast for functional elements.

- **Primary Background (#0B0E14):** The "pitch" of the application; a near-black that reduces eye strain and provides a premium backdrop.
- **Surface/Card (#151A23):** Used for elevated containers to create depth and separate content modules.
- **Electric Accent (#00E07A):** The "Action Green." Reserved strictly for success states, active selections, primary buttons, and critical data like points and scores.
- **Border (#222936):** Subtle definition for cards and inputs, ensuring the UI remains structured without becoming cluttered.

## Typography
The typography strategy employs a three-tier system to manage information density and energy:

1.  **Headlines (Anybody):** A variable, expressive sans-serif that brings a technical, sporty vibe. Use Heavy weights for section headers and team names.
2.  **Numerals & Labels (Archivo Narrow):** A condensed typeface used for "Scoreboard" elements. Tabular figures ensure that live scores and point tallies don't jump visually when updating.
3.  **Body (Hanken Grotesk):** A clean, contemporary grotesque that ensures readability for rules, match previews, and user settings.

All display headings should use tighter letter-spacing to maintain a "packed" and energetic feel.

## Layout & Spacing
This design system follows a **Mobile-First Fluid Grid** philosophy. Since the primary use case is "on-the-go" match tracking and predictions, the layout prioritizes thumb-friendly interaction zones.

- **Grid:** A 4-column grid for mobile, scaling to 12 columns for desktop.
- **Rhythm:** An 8px linear scale is used for all spacing. 16px is the standard "gutter" between cards and the screen edge.
- **Verticality:** Content is stacked in cards to allow for infinite scrolling through match-days.
- **Safe Areas:** Strict adherence to bottom safe areas to accommodate the fixed navigation bar.

## Elevation & Depth
Depth is achieved through **Tonal Layering** rather than heavy shadows, maintaining a sleek, modern look.

- **Level 0 (Base):** #0B0E14 - The background canvas.
- **Level 1 (Cards):** #151A23 - Used for the main content blocks. These feature a thin 1px border in #222936 to provide crisp definition against the base.
- **Level 2 (Overlays/Modals):** #1C222D - Slightly lighter than cards, used for bottom sheets and score-adjustment pop-overs.
- **Shadows:** Use extremely subtle, large-radius shadows (0px 8px 24px rgba(0,0,0,0.5)) only on Level 2 elements to provide a slight sense of "float" over the main UI.

## Shapes
The shape language balances professional structure with approachable energy. 

- **Cards & Containers:** Use a consistent 16px (`rounded-lg`) radius. This provides a modern, "hand-held" feel that softens the high-contrast dark theme.
- **Buttons:** Primary buttons should be slightly more rounded than cards to distinguish them as interactive, or fully pill-shaped for "Chip" style filtering.
- **Icons:** Use a 1.5pt stroke weight with slightly rounded terminals to match the typography.

## Components

- **Primary Buttons:** Solid #00E07A background with #0B0E14 text. Use bold, uppercase `label-caps` for the label. High-impact and high-contrast.
- **Secondary Buttons:** Ghost style with a 1px #222936 border and white text. These should feel subordinate to the prediction "Submit" actions.
- **Prediction Steppers:** Large, circular targets (min 44x44px). The "+" and "-" icons should be white, with the central score displayed in `display-score` Archivo Narrow.
- **Match Cards:** Feature the two team flags, the condensed score/prediction, and a 1px #222936 border. Use the Surface color (#151A23).
- **Chips:** Pill-shaped. Inactive: #222936 background with #8A93A3 text. Active: #00E07A background with #0B0E14 text.
- **Bottom Navigation:** Fixed blur effect (Glassmorphism) with 80% opacity on #0B0E14. Active icons and labels are highlighted in Electric Green; inactive in Muted Grey.
- **Status Indicators:** Use the Primary Green for "Live" matches, and a muted amber for "Half-time" or "VAR" alerts to maintain the broadcast-quality feel.