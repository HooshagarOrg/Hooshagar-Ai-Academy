# Hooshagar — Premium Design System (RTL)

> ادغام: **Smart Soft Dark** (برند هوشاگر) + **ui-ux-pro-max** (Liquid Glass) + اصول فاصله‌گذاری editorial از `DESIGN.md`

## اصول

| اصل | پیاده‌سازی |
|-----|------------|
| RTL فارسی | `dir="rtl"` · Vazirmatn · `text-right` |
| لوکس ولی سبک | انیمیشن 220ms · بدون scale بزرگ · `prefers-reduced-motion` |
| شیشه‌ای | `glass-panel` · `backdrop-blur` · حاشیه hairline |
| عملکرد | بدون کش `/_next` در dev · SW فقط production |
| دسترسی | لمس 44px · focus ring · کنتراست متن |

## رنگ‌ها (ثابت برند)

- پس‌زمینه: `#10131A`
- سطح: `#171B24` / `#1D2330`
- CTA: `#FF4DA6` → `#8B7CFF`

## انیمیشن

- `Reveal` — scroll fade-up
- `Stagger` / `StaggerItem` — لیست‌ها
- `DashboardFrame` — همه صفحات داشبورد (از طریق `dashboard-shell`)
- `luxury-card-hover` — کارت‌های تعاملی

## صفحات

| لایه | کامپوننت |
|------|----------|
| مارکتینگ | `MarketingShell` — landing, auth |
| داشبورد | `DashboardShell` + `DashboardPage` |
| پروفایل | `/profile` |

## الگوی صفحه داخلی

```tsx
import { DashboardPage } from '@/components/layout/dashboard-page'

export default function MyPage() {
  return (
    <DashboardPage title="عنوان" description="توضیح">
      {/* محتوا */}
    </DashboardPage>
  )
}
```
