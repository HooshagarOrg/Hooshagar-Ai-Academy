# راهنمای برند هوشاگر

## پالت رنگ (استخراج از لوگو)

| نام | Hex | کاربرد |
|-----|-----|--------|
| Magenta | `#E6007E` | Primary، CTA، منوی فعال |
| Orange | `#FF8C00` | Accent، گرادیان CTA |
| Blue | `#38BDF8` | Secondary، لینک‌ها |
| Yellow | `#FFD700` | هایلایت، badge |
| Coral | `#F4A7B9` | پس‌زمینه ملایم |

## فایل لوگو

- **مادر:** `public/logo.png` (مربع، حداقل 512×512، PNG)
- **تولید آیکون PWA:** `pnpm run generate-icons`

## کامپوننت

```tsx
import { HooshagarLogo, HooshagarMark } from '@/components/brand/hooshagar-logo'

<HooshagarLogo size="sm" href="/" showWordmark subtitle="نام مدرسه" />
<HooshagarMark size={32} />
```

## Tailwind

`bg-brand-magenta`, `text-brand-orange`, `from-brand-magenta to-brand-orange`
