# راهنمای برند هوشاگر — Soft Futurism

## پالت Smart Soft Dark

| نقش | Hex | کاربرد |
|-----|-----|--------|
| Deep Space | `#10131A` | پس‌زمینه |
| Surface | `#171B24` | کارت |
| Elevated | `#1D2330` | لایه بالاتر |
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
