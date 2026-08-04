# AptiCode — LiquidCore Design Plan

> **Concept:** LiquidCore — AptiCode as a liquid-crystal placement console.
> Frosted **glass slabs** for structure, soft-**neumorphic keys** for touch, a living **liquid background**,
> and **Three.js 3D scenes** per screen. Tone: premium EdTech, gamified & energetic.

**Slogan (unchanged):** *Accelerate Your Placement Readiness.*

---

## 1. Aesthetic commitments

- Temperature: **cool-neutral void**. Backgrounds carry `chroma ≤ 0.03`.
- **2 brand accents** sharing chroma/lightness — only hue varies:
  - Violet `#8b5cf6` → `oklch(0.62 0.22 295)`
  - Cyan `#22d3ee` → `oklch(0.78 0.16 210)`
- Status accents (emerald / amber / rose) are **data-only** (XP, streaks, errors).
- **No gradient overload.** Gradients appear only on: primary CTA, XP fill, liquid blobs, active nav.
- No bluish-purple-gradient default backgrounds. Liquid blobs sit on the void, never as a full-screen wash.
- 1–3 fonts only. Numerals use tabular figures.

---

## 2. Design tokens

Source of truth: `./opendesign/design-systems/liquidcore/tokens/colors_and_type.css`
Mirrored into `client/src/index.css` as CSS custom properties.

### 2.1 Color — Dark (primary experience)

| Role | Value |
|---|---|
| Void base | `oklch(0.16 0.02 265)` ≈ `#05060e` |
| Glass slab | `white 4–6%` · `backdrop-blur 16px` |
| Raised glass | `white 8%` |
| Neo key (raised) | `oklch(0.21 0.03 265)` · dual soft shadows |
| Text P / S | ice `oklch(0.97 0.01 265)` / slate `oklch(0.65 0.03 265)` |
| Brand violet / cyan | `oklch(0.66 0.16 295)` / `oklch(0.79 0.16 210)` |

### 2.2 Color — Light (executive/admin)

| Role | Value |
|---|---|
| Void base | `oklch(0.97 0.01 265)` soft ice |
| Glass slab | `white 70%` · `blur 16px` |
| Neo key | `oklch(0.94 0.01 265)` · soft gray dual shadows |
| Text P / S | `oklch(0.20 0.03 265)` / `oklch(0.46 0.03 265)` |
| Violet / cyan | `oklch(0.55 0.20 285)` / `oklch(0.54 0.17 220)` |

### 2.3 Type

| Face | Use | Weights |
|---|---|---|
| **Space Grotesk** | Display / headings (energetic, techy) | 500, 700 |
| **Plus Jakarta Sans** | Body / UI | 400–700 |
| **JetBrains Mono** | Code, data, timestamps, labels | 400, 700 |

Load via Google Fonts in `index.html`. Fallback stacks per `fontFamily` tokens.

### 2.4 Scale, radius, depth

- **Spacing:** base-8 → `4 8 16 24 32 48 64`
- **Radius:** glass slab `20px` · neo key `14px` · pill CTA `999px` · liquid blob organic `38% 62% 63% 37% / 41% 44% 56% 59%` (morphing)
- **Blur:** `12 / 16 / 24 px`
- **Depth stack (z):** void → liquid → glass → neo → UI chrome → 3D canvas (each layer isolated)

---

## 3. Four pillars (layered system)

1. **Glass surfaces** — cards, nav, modals, tables. `backdrop-blur(16px)` + 6% white fill + `1px white/8` border + top inner highlight. Implemented by `GlassCard`.
2. **Neumorphic controls** — buttons, sliders, toggles, segment tabs, chips. Dual soft shadows (dark bottom-right + light top-left), `press = inset`, `hover = lift 2px`. Implemented by `NeoKey`, `NeoSegment`, `NeoSlider`, `NeoSwitch`.
3. **Liquid ambient** — fixed `LiquidBackdrop`: 2–3 morphing violet/cyan blobs, heavy blur, 18–30s drift, pointer parallax. Degrades to static radial gradients on low-tier / reduced-motion.
4. **3D dimension** — R3F `Scene3D` catalogue + CSS `TiltCard`. Layers parallax on scroll.

---

## 4. 3D scene catalogue (`client/src/components/three/`)

Shared `<Scene3D variant={…} />`, lazy-loaded, DPR-capped, 30fps on mid-tier.

| Screen | Variant | Role |
|---|---|---|
| Landing | `orbital` | polyhedron core + orbiting tokens · scroll-linked rotation |
| Auth | `crystal` | morphing blob sphere behind glass form |
| Onboarding | `helix` | double helix fills as steps complete |
| Dashboard | `core` | **XP energy core** — intensity follows XP/streak · floating level orbs |
| Aptitude | `spheregrid` | topic nodes, hover highlight |
| Coding | `shards` | code constellation behind IDE |
| Communication | `waveform` | radial rings react to live speech amplitude |
| Interview | `holoring` | interviewer holo-ring, "listens" with pulse |
| Resume | `papers` | floating sheets, tilt parallax |
| Leaderboard | `podium` | top-3 columns animate upward |
| Analytics | `terrain` | metrics as elevation mesh |
| Admin | `vault` | floating dashboard tiles |

---

## 5. Motion system (Framer Motion + R3F)

- Durations **150–600ms**, spring physics, `cubic-bezier(0.22,1,0.36,1)`.
- Page transitions: `AnimatePresence` scale+fade; staggered content rise.
- **Gamified:** XP number ticker + burst, streak flame pulse, level-up ring + banner, accept-code celebration.
- Neo keys lift 2px / inset press. Glass slabs lift 4px + 3–6° pointer tilt (mid+ tier).
- `prefers-reduced-motion`: transform-only, no canvas, blobs frozen.

---

## 5. Component library (`src/components/ui/`)

Primitives: `GlassCard`, `NeoKey`, `NeoSlider`, `NeoSwitch`, `NeoSegment`, `GlassModal`,
`StatOrb`, `XPBar`, `TiltCard`, `Ticker`, `ConfettiBurst`. Ambient: `LiquidBackdrop`, `Scene3D`.
Motion/canvas are tier-gated via `useDeviceTier()`.

---

## 6. Device tiers & graceful degradation

| Tier | Trigger | Cap |
|---|---|---|
| high | GPU + wide screen + no reduced motion | full glass, liquid, 3D, tilt |
| mid | mobile / DPR>2 / weak GPU | blur ≤ 12px, tile off, DPR ≤ 1.5, 30fps canvas |
| low | `prefers-reduced-motion` / low-end | static gradients, no 3D, no blur, transform-only |

`useDeviceTier()` hook + CSS media queries; R3F lazy-imported per scene.

---

## 7. Screen build order

1. Landing · Auth · Onboarding
2. App shell (Sidebar/Header) + Dashboard
3. Modules: Aptitude, Coding, Communication
4. Interview, Resume
5. Leaderboard, Analytics, Admin

**Per file:** wire framework → tokens → primitives → live data → gamified overlays → light-mode → low-tier pass.

---

### 8. Degradation & caveats

- `three` + R3F ≈ 150–200 kb gz. Lazy-load per screen; Admin/Leaderboard use lighter scenes.
- Light theme liquid blobs need alpha ≤ 0.18 to avoid washing out.
- Dark neumorphism requires dual-shadow discipline — soft dark + light specular — or it reads flat.
- Every 3D/liquid surface must function without its effect (content-first).