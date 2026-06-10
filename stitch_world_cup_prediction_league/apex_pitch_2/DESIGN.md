---
name: Apex Pitch
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c4a3e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6b7b6d'
  outline-variant: '#bacbba'
  surface-tint: '#006d38'
  primary: '#006d38'
  on-primary: '#ffffff'
  primary-container: '#00e07a'
  on-primary-container: '#005d2f'
  inverse-primary: '#11e37d'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#526069'
  on-tertiary: '#ffffff'
  tertiary-container: '#b6c5d0'
  on-tertiary-container: '#44525b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#5eff9b'
  primary-fixed-dim: '#11e37d'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#005229'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d6e5ef'
  tertiary-fixed-dim: '#bac9d3'
  on-tertiary-fixed: '#0f1d25'
  on-tertiary-fixed-variant: '#3b4951'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Anybody
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Anybody
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Anybody
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Anybody
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Anybody
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Anybody
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
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
  xl: 40px
  container-max: 1280px
  gutter: 20px
---

## Brand & Style
The design system is engineered for the **World Cup 2026 Prediction League**, targeting a global audience of sports enthusiasts who value speed, precision, and competitive engagement. The brand personality is **dynamic, premium, and authoritative**, capturing the high-stakes energy of international football without falling into cliché national team aesthetics.

The visual style is **Corporate Modern with a Sporty Edge**. It utilizes clean, expansive layouts and high-performance typography to convey a sense of a "digital arena." By blending a sophisticated light-base palette with high-visibility action accents, the UI evokes the feeling of a premium sports broadcast—reliable enough for data-heavy league tables, yet energetic enough for last-minute goal celebrations.

## Colors
The palette is anchored by a high-clarity background and sharp functional contrasts.

*   **Primary (Electric Green):** Reserved exclusively for high-priority actions, successful predictions, and "live" status indicators. It provides a sharp, energetic contrast against the cooler base.
*   **Secondary (Slate Navy):** Used for typography, navigation headers, and structural elements to provide a professional, grounded feel that differentiates the UI from casual social apps.
*   **Tertiary (Atmospheric Blue):** A soft, expansive base color for the main background. This shade provides a "stadium-daylight" feel while remaining easy on the eyes during long sessions.
*   **Neutral (Slate):** Used for secondary text, borders, and disabled states to maintain a sophisticated, low-noise environment.

## Typography
This design system utilizes **Anybody** across all levels. As a variable font with a technical, athletic character, it perfectly bridges the gap between editorial sports news and data-heavy interfaces.

*   **Headlines:** Utilize heavy weights (700-800) with slight negative letter-spacing to create a sense of urgency and impact, mimicking stadium scoreboards.
*   **Data Points:** Scorelines and league positions should use Medium or SemiBold weights to ensure they are the primary focal point within cards.
*   **Labels:** Use uppercase for category headers and "Live" tags to enhance scannability in dense information environments.

## Layout & Spacing
The layout employs a **Fluid Grid** system that prioritizes content density for match lists while maintaining white space for editorial content.

*   **Desktop:** 12-column grid with a 1280px max-width. Use 24px gutters to allow the rounded cards to breathe.
*   **Mobile:** 4-column grid with 16px side margins. 
*   **Rhythm:** Spacing follows a 4px baseline. Use 16px (`md`) for internal card padding and 24px (`lg`) for vertical section stacking. 
*   **Grouping:** Related data (e.g., two teams in a match) should be grouped with 8px (`sm`) spacing, while distinct matches use 16px (`md`).

## Elevation & Depth
Depth is created using **Tonal Layers** and extremely soft shadows to maintain a modern, flat-plus aesthetic.

*   **Surface Level 0:** The Tertiary Blue (`#E3F2FD`) acts as the canvas.
*   **Surface Level 1 (Cards):** Pure white backgrounds for match cards and prediction forms, using a very soft, low-opacity Slate shadow (4% opacity) to provide lift without adding visual "weight."
*   **Surface Level 2 (Modals/Dropdowns):** Use a slightly more pronounced shadow and a 1px border in a lighter shade of the Secondary Slate to define boundaries.
*   **Active States:** When a user interacts with a prediction slot, use a subtle 2px inner-stroke of the Primary Green instead of a shadow to signify focus.

## Shapes
The shape language is consistently **Rounded**, reflecting the approachable and friendly nature of a prediction league while softening the "hard" data of statistics.

*   **Match Cards:** Fixed at 16px (`rounded-lg`) to create a friendly, modern container.
*   **Buttons & Inputs:** Use 8px (`rounded-md`) for a standard look, or 100px (pill) for "Live" tags and specific call-to-action buttons like "Submit Prediction."
*   **Avatars:** Always circular to contrast against the predominantly rectangular grid.

## Components
Consistent component styling ensures the league feels unified and premium.

*   **Buttons:** Primary buttons use the Electric Green background with Navy text for maximum contrast. Secondary buttons use a Navy outline with a transparent base.
*   **Match Cards:** The core component. Features the 16px radius, a white background, and a subtle 1px border in a pale slate. Team flags should be circular or slightly rounded.
*   **Prediction Inputs:** Large, clickable zones for score entry. Use a bold, centered weight for the numbers.
*   **Chips/Badges:** Use "pill-shaped" badges for status (e.g., "Finished," "Starting Soon"). Use the Primary Green for "Live" matches with a subtle pulse animation.
*   **Progress Bars:** For "Group Stage Progress" or "Leaderboard Position," use a Navy track with a Green fill.
*   **Leaderboard Lists:** Use zebra-striping with a very faint tint of the Tertiary Blue to assist horizontal eye-tracking across points and ranks.