---
name: Umbra Technical Lab
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb869'
  on-tertiary: '#482900'
  tertiary-container: '#ca801e'
  on-tertiary-container: '#3f2300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdcbb'
  tertiary-fixed-dim: '#ffb869'
  on-tertiary-fixed: '#2c1700'
  on-tertiary-fixed-variant: '#673d00'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  panel-padding: 20px
---

## Brand & Style
The design system is a "Minimal Technical Lab" aesthetic designed for Umbra, a didactic ray tracer. It prioritizes high precision, low noise, and a focused atmosphere that centers on the physics of light, shadow, and geometry. 

The style leans into **Minimalism** with a **Technical** edge. It avoids the neon-heavy aesthetics of gaming interfaces in favor of a sophisticated engineering tool environment. The interface remains "mysterious" through the use of deep obsidian voids and focused, high-clarity accent points. Visual hierarchy is established through structural alignment and purposeful whitespace rather than decorative elements.

## Colors
The palette is rooted in deep, light-absorbing neutrals to simulate a physical darkroom or laboratory environment. 

- **Primary (#8B5CF6):** A soft violet used for key interactive states, light source indicators, and primary call-to-actions.
- **Secondary (#06B6D4):** A technical cyan reserved for data visualization, coordinate axes, and successful ray-trace completion states.
- **Backgrounds:** The interface utilizes `#0B0B0C` for the base canvas (the "Void") and `#141416` for UI containers and panels to create subtle depth.
- **Accents:** Use low-opacity white (8-12%) for structural borders to maintain a "ghost-line" appearance that defines space without adding visual weight.

## Typography
The typographic system utilizes a dual-font approach. **Inter** provides high legibility for menus, descriptions, and headers, ensuring the tool feels approachable. **JetBrains Mono** is used for all technical data, coordinate readouts, ray-tracing parameters, and mathematical outputs to reinforce the "Engineering Tool" feel.

For mobile devices, `headline-lg` should scale down to 24px. Ensure all monospaced data maintains a minimum size of 12px for precision reading.

## Layout & Spacing
The design system employs a **Fixed Grid** for the control sidebars and a **Fluid Canvas** for the ray-tracer viewport. 

- **Sidebars:** Fixed at 320px to ensure technical controls remain consistent.
- **Rhythm:** An 8px linear scale is used for most spacing, but 4px increments are allowed for tight technical readouts (e.g., coordinate inputs).
- **Whitespace:** Generous padding (20px-24px) inside containers is essential to prevent the "cluttered dashboard" look common in engineering tools. The goal is "High Precision, Low Noise."

## Elevation & Depth
In a dark, light-focused UI, depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines**.

- **Surfaces:** Use `#141416` for primary panels floating over the `#0B0B0C` background.
- **Borders:** Instead of heavy shadows, use 1px solid borders at 8% white opacity. This mimics a blueprint or a physical technical drawing.
- **Focus States:** When an element is active, use a subtle 0 0 12px outer glow in the primary color (#8B5CF6) at 20% opacity to simulate light emission.

## Shapes
The design system uses a **Soft** (Level 1) roundedness. 4px (0.25rem) corners are the standard for buttons, input fields, and panels. This retains a sharp, professional edge while avoiding the harshness of a purely 0px-rounded interface. High-level containers like the main viewport may use `rounded-lg` (8px) to softly frame the rendered output.

## Components
- **Buttons:** Ghost-style by default with a 1px border. On hover, the border opacity increases. Primary buttons use a solid violet background with white text.
- **Technical Inputs:** Numeric inputs for coordinates (X, Y, Z) should use JetBrains Mono. Use a subtle vertical bar as a divider between grouped inputs rather than separate boxes.
- **Chips:** Small, rectangular tags with monospace text. Used for indicating object types (e.g., `SPHERE`, `PLANE`, `LIGHT`).
- **Cards:** Used for individual objects in the scene tree. Minimalist appearance with a "visibility" toggle icon that glows cyan when active.
- **Value Sliders:** Minimal 2px-thick tracks. The slider thumb is a simple 12px circle with a high-contrast center.
- **Scene Tree:** A vertical list with thin connectors to show parent-child relationships between geometries, utilizing the "label-caps" typographic style for headers.