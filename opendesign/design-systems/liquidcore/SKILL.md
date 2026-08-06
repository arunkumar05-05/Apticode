---
name: liquidcore
description: LiquidCore design system — AptiCode's liquid-crystal console aesthetic. Glass slabs, neumorphic keys, morphing liquid ambient, Three.js 3D scenes. Dark-first, light-ready, gamified energy.
---

# LiquidCore Design System

**Scope:** AptiCode placement-prep platform — all student, admin, and public surfaces.

## Pillars

| Pillar | Primitive | Responsibility |
|--------|-----------|----------------|
| Glass | `GlassCard` | Structure, cards, nav, modals, tables |
| Neo | `NeoKey`, `NeoSegment`, `NeoSlider`, `NeoSwitch` | Tactile controls |
| Liquid | `LiquidBackdrop` | Living ambient layer |
| Visual | `VisualPattern` (variants) | Responsive pattern layer |

## Tokens

See `tokens/colors_and_type.css` — CSS custom properties for dark + light themes.
Exported as `oklch` with fallbacks. Import in your global CSS:

```css
@import "./tokens/colors_and_type.css";
```

## Component API (React + Framer Motion)

```tsx
import { GlassCard, NeoKey, NeoSegment, NeoSlider, NeoSwitch, StatOrb, XPBar, TiltCard, LiquidBackdrop, Scene3D, useDeviceTier } from "./components/ui";
```

All components respect `useDeviceTier()` and `prefers-reduced-motion`.

### Device tiers

```ts
type Tier = "high" | "mid" | "low";
```

| Tier | Blur | 3D | Tilt | FPS |
|------|------|----|------|-----|
| high | 16px | full | 6° | 60 |
| mid  | 12px | simple | off | 30 |
| low  | 0    | none  | off | transform-only |

## Fonts

Load once in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

## Usage in AptiCode

1. Copy `tokens/colors_and_type.css` → `client/src/index.css` (or import).
2. Copy `components/ui/` primitives into `client/src/components/ui/`.
3. Add `LiquidBackdrop` at app root; wrap screens with `Scene3D variant={…}`.
4. Replace existing cards/buttons with `GlassCard` / `NeoKey`.

## Theming

Toggle `.light` on `<html>` for light mode. All tokens auto-switch.

## Accessibility

- `prefers-reduced-motion` → transform-only, no canvas, blobs static.
- Contrast ratios: WCAG AA on text, AAA on primary actions.
- Focus visible outlines on all interactive primitives.