# Hooshagaar Soft Futurism Design System

## Product Positioning

Hooshagaar is an AI-powered personalized learning and talent discovery platform, not a traditional LMS. The interface should feel closer to Linear, Perplexity, Duolingo, and Notion AI than a school ERP.

## Visual Principles

- RTL-first Persian experience.
- Light layered surfaces, not pure-white everywhere.
- Friendly for students aged 6-18, but credible for parents and schools.
- AI-native patterns: insight cards, companion panels, suggested actions, learning context.
- Motion is subtle, purposeful, and respects `prefers-reduced-motion`.

## Color System

- Primary: `#8B7CFF`
- Secondary: `#54D2FF`
- Accent: `#FF4DA6`
- Highlight: `#FFB347`
- Success: `#39D98A`
- Background: `#F4F7FC`
- Surface: `#FFFFFF`
- Sidebar: `#EAF1FF`
- Text Primary: `#111827`
- Text Secondary: `#64748B`

## Type Scale

- Hero: `clamp(2.55rem, 7vw, 5.4rem)`, 950 weight.
- H1: `clamp(2rem, 4vw, 3.5rem)`, 900 weight.
- H2: `clamp(1.65rem, 3vw, 2.5rem)`, 900 weight.
- H3: `1.25rem`, 850 weight.
- Body: `1rem`, line-height `1.9`.
- Caption: `0.75rem`, muted.

## Component Architecture

- `hf-page`: global soft background.
- `hf-container`: consistent max-width.
- `hf-card`: default glass/light card.
- `hf-card-soft`: educational soft card.
- `hf-btn-primary`: gradient primary CTA.
- `hf-btn-secondary`: elevated light secondary CTA.
- `SoftFeatureCard`: landing feature block.
- `LearningIsland`: student learning journey visual.
- `AITutorPreview`: AI-native education assistant preview.
- `TalentRadar`: flagship talent discovery visualization.

## Navigation IA

### Student
Dashboard, Learning Journey, Courses, Assignments, Exams, AI Tutor, Talent Discovery, Goals, Progress Reports, Profile.

### Parent
Child Dashboard, Progress, Talent Reports, AI Insights.

### Teacher
Classes, Students, Assignments, Analytics, AI Assistant.

### Administrator
School Dashboard, Academic Analytics, Reports, Users.

## Responsive Strategy

- Mobile-first: single column, sticky CTA, cards stacked.
- Tablet: two-column previews and feature grids.
- Desktop: 12-column editorial layout with product mockups.
- Avoid horizontal scroll at 375px.

## Accessibility

- Text contrast target 4.5:1.
- Color is never the only status indicator.
- Focus states must be visible.
- Video is muted/autoplay/loop/playsInline and decorative unless explicitly labeled.
