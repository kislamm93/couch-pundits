---
name: Pitch Dark Elite
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
  tertiary: '#d9e0ed'
  on-tertiary: '#2a313b'
  tertiary-container: '#bdc4d1'
  on-tertiary-container: '#4a515c'
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
  tertiary-fixed: '#dce3f0'
  tertiary-fixed-dim: '#c0c7d4'
  on-tertiary-fixed: '#151c26'
  on-tertiary-fixed-variant: '#404752'
  background: '#10131a'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Archivo Narrow
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Archivo Narrow
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Archivo Narrow
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  gutter: 16px
  card-padding: 20px
---

## Brand & Style
The design system is engineered for the high-stakes environment of sports betting and competition. It targets a passionate, data-driven audience that values speed, precision, and visual energy. 

The style is **High-Contrast / Modern**, leaning into a "stadium at night" aesthetic. By utilizing an obsidian foundation paired with electric accents, the UI evokes a sense of premium exclusivity and urgent action. The interface should feel like a high-end sports broadcast dashboard—utilitarian but aggressive, sharp, and technologically advanced.

## Colors
The palette is anchored by **Obsidian (#0B0E14)** to provide maximum depth and minimize eye strain during late-night match viewing. 

- **Primary:** Electric Green (#00E07A) is reserved strictly for interactive elements, success states, and critical "Call to Action" buttons. It should feel like it is glowing against the dark backdrop.
- **Surface:** Elevated surfaces use #151A23 to create a clear hierarchical distinction from the base background.
- **Accents:** Use a high-vibrancy red for "Live" indicators or losing streaks to maintain the high-contrast competitive feel.

## Typography
The typography strategy balances the aggressive nature of sports with the technical requirements of a prediction engine.

- **Headlines:** Uses **Archivo Narrow**. The condensed, bold nature mirrors sports jersey numbers and scoreboard displays. It allows for longer team names to fit in tight spaces.
- **Body:** Uses **Inter**. This provides maximum legibility for match statistics, user comments, and rules.
- **Data/Labels:** Uses **JetBrains Mono**. This monospaced font is used for scores, odds, and countdown timers, ensuring numbers align perfectly in lists and tables for quick scanning.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

The spacing rhythm is strictly based on an **8px base unit**. Elements are grouped using tight gutters (16px) to maximize the "data density" expected by competitive users. On mobile, horizontal margins are reduced to 16px to prioritize content, while desktop retains 24px-32px margins for a more cinematic feel. Match-up cards should stretch to fill their containers, creating a "wall of data" effect.

## Elevation & Depth
Depth is achieved through **Tonal Layering** rather than traditional shadows. 

1. **Level 0 (Base):** #0B0E14 (Main background).
2. **Level 1 (Cards/Surface):** #151A23. Used for match cards and sidebar containers.
3. **Level 2 (Hover/Active):** #222933. A subtle lift for interactive states.

To emphasize the "Electric" brand, use a **1px inner border** (stroke) on elevated cards using #FFFFFF at 5% opacity. This creates a "glass-edge" effect that defines the shape without needing heavy shadows, which can look muddy in pure dark modes.

## Shapes
The shape language is **Soft (0.25rem)**. 

While the brand is aggressive, slightly rounded corners (4px to 8px) ensure the UI feels modern and professional rather than dated or "industrial." 
- Use **0px (Sharp)** for indicators like "Live" badges or progress bars to maintain a technical edge.
- Use **Full (Pill)** only for secondary tags/chips that indicate categories like "Group A" or "Knockout Stage."

## Components
- **Buttons:** Primary buttons use the #00E07A background with black text for maximum contrast. Secondary buttons use a ghost style (white border, no fill).
- **Match Cards:** Use the #151A23 surface. The scoreline should be centered using JetBrains Mono. Team flags should be circular with a 1px white stroke.
- **Input Fields:** Darker than the card surface (#0B0E14) with a 1px border that turns Electric Green on focus.
- **Chips/Badges:** Small, high-contrast labels. "Live" match badges should pulse with a subtle green outer glow.
- **Prediction Sliders:** Custom-styled track in #222933 with an Electric Green handle to signify the user's active choice.
- **Progress Bars:** Used for "Community Vote" percentages; high-saturation green vs. a muted grey-blue background.