# Hooshagar Design System — Knowledge Universe

## Vision
Academic dark environment for Iranian schools. Static knowledge field (math, science, Persian, tech symbols) — no shaders, no background animation.

## Identity
- **Feel:** AI laboratory + digital library + future classroom
- **Not:** confetti, rainbow SaaS, generic pink-purple glass, WebGL shaders

## Colors
- Background: `#05070d` (hsl 222 47% 4%)
- Primary: Scholar Blue `#3b82f6`
- Symbols: academic blues `rgba(219,234,254,*)`
- Role accents: logo colors at low opacity only

## Background (`KnowledgeUniverseBg`)
- 4 depth layers — static positioned symbols
- Central AI aura — static radial gradient
- Knowledge grid — 80px, 4% opacity
- Vignette for readability
- **No** requestAnimationFrame, **no** WebGL

## Typography
- UI: Vazirmatn (RTL)
- English symbols in bg: Inter (`--font-inter`)

## Components
| Component | Use |
|-----------|-----|
| `KnowledgeUniverseBg` | All shells via `AmbientBackground` |
| `GlassCard luxury` | Panels |
| `TiltCard` | Interactive cards (hover only) |
| `Button variant="luxury"` | Primary CTA (blue) |

## Motion rules
- Background: **static**
- UI: 220ms transitions, tilt on hover
- `prefers-reduced-motion`: disable tilt transforms

## Phase status
1. ✅ Knowledge Universe static bg
2. ✅ Landing + login shell + sidebar/header
3. Dashboard pages inherit tokens automatically
