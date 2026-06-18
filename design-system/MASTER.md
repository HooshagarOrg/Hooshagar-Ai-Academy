# Hooshagar Premium Platform — Design System

## Identity
Premium AI knowledge platform for Iranian schools. Persian-first RTL. Fusion of Apple polish, OpenAI simplicity, Linear precision.

## Tokens
| Token | Value | Use |
|-------|-------|-----|
| Canvas Base | `#020617` | Global background |
| Midnight | `#0B1020` | Cards, panels |
| AI Blue | `#3B82F6` | Primary actions |
| Intel Gold | `#D4AF37` | Accent, highlights |

## Variance
- DESIGN_VARIANCE: 8/10
- MOTION_INTENSITY: 7/10
- VISUAL_DENSITY: 5/10

## Background
`PlatformCanvas` in root layout — radial glow + light particles. No WebGL.

## Typography
- Persian: Vazirmatn
- English: Inter (`font-mono-en`)

## Motion
- Lenis smooth scroll (global)
- GSAP ScrollTrigger (landing sections)
- Framer Motion (micro-interactions)
- `prefers-reduced-motion` respected

## Components
- `premium-glass` — selective glassmorphism
- `HooshyarAvatar` — AI assistant placeholder
- `AuthSplitLayout` — split-screen auth

## Anti-patterns
- Neon cyberpunk overload
- Heavy WebGL shaders
- Generic rainbow SaaS templates
- text-justify for Persian
