# راهنمای برند هوشاگر — Soft Futurism

## پالت Smart Soft Dark

| نقش | Hex | کاربرد |
|-----|-----|--------|
| Deep Space | `#161C25` | پس‌زمینه (+۱ پرده روشن‌تر) |
| Surface | `#1C222C` | کارت |
| Elevated | `#222936` | لایه بالاتر |
| AI Pink | `#FF4DA6` | CTA، یادگیری |
| Learning Orange | `#FF9B54` | انرژی، گیمیفیکیشن |
| Discovery Purple | `#8B7CFF` | اکتشاف |
| Growth Cyan | `#54D2FF` | رشد، حرفه‌ای |
| Success Green | `#39D98A` | موفقیت |
| Focus Yellow | `#FFD166` | تمرکز |
| Text Primary | `#F5F7FA` | متن اصلی |
| Text Secondary | `#B5BED1` | متن ثانویه |

## شدت UI بر اساس نقش

| Tone | نقش‌ها | حس |
|------|--------|-----|
| `vivid` | دانش‌آموز | زنده، رنگی، AI Companion |
| `balanced` | معلم، والد، مشاور | حرفه‌ای و دوستانه |
| `calm` | ادمین، معاونین، مدیر | قابل اعتماد، کنترل‌پذیر |

## کامپوننت‌ها

```tsx
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { GlassCard } from '@/components/ui/glass-card'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
```

## Tailwind

`bg-brand-pink`, `text-brand-cyan`, `glass-panel`, `glass-panel-quiet`, `gradient-text`

## Motion System

| اصل | پیاده‌سازی |
|-----|------------|
| زنده و آرام | easing `cubic-bezier(0.16, 1, 0.3, 1)` |
| سریع | `220ms` |
| غیرحواس‌پرت‌کن | بدون scale بزرگ؛ blob آهسته |

**استاندارد CSS:**
```css
transition: all 220ms cubic-bezier(0.16, 1, 0.3, 1);
```

**کلاس‌ها:** `motion-standard` · `motion-interactive` · `motion-page-enter` · `motion-drawer`

**موبایل:** `100dvh` · `safe-area-inset` · حداقل لمس `44px` · `touch-action: manipulation`

**دسترسی:** `prefers-reduced-motion` انیمیشن‌ها را خاموش می‌کند.

## لوگو و آیکون‌ها

| فایل | ابعاد | کاربرد |
|------|--------|--------|
| `public/logo.png` | 1024×1024 | UI، `HooshagarLogo`، Open Graph |
| `public/brand/logo-full.png` | 1024×1024 | نسخهٔ آرشیو/برند |
| `public/icons/icon-*` | 72–512 | PWA |
| `public/icons/*-maskable.png` | 192، 512 | Android adaptive |
| `public/apple-touch-icon.png` | 180 | iOS home screen |
| `public/favicon.ico` | 16، 32 | تب مرورگر |

**به‌روزرسانی لوگو:**

```bash
# فایل منبع را در assets بگذارید یا مسیر را بدهید:
npm run prepare-logo -- path/to/logo.png
npm run generate-icons
# یا یکجا:
npm run logo:all
```

لوگوی رسمی: حرف **H** سه‌بعدی رنگی با سیلوئت انسان در مرکز؛ منبع `assets/logo-source.png` (۳DLogoSpin). پس‌زمینهٔ شفاف در UI، `#10131A` برای maskable و apple-touch.
