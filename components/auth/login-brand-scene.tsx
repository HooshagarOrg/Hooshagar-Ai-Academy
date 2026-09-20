/**
 * پنل نمایش ویژگی‌ها و هویت بصری هوشاگر در صفحه ورود
 * این کامپوننت فضای خالی سمت راست/شوکیس را به یک پیش‌نمایش زنده و جذاب از امکانات سامانه تبدیل می‌کند.
 */

import {
  Users,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Award,
  Zap,
  TrendingUp,
  CheckCircle2,
  BookOpen,
  School,
  Activity,
  HeartHandshake,
} from 'lucide-react'

export function LoginBrandScene(): JSX.Element {
  return (
    <div className="w-full max-w-lg space-y-6" dir="rtl" aria-hidden="true">
      {/* ── کارت اصلی: پیشخوان زنده مدرسه هوشمند ── */}
      <div className="lp-showcase-mockup relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 shadow-2xl backdrop-blur-xl">
        {/* نوار بالای پنجره (ویندوز/مک استایل) */}
        <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ms-2 text-[11px] font-bold text-[var(--lux-text-muted)]">
              سامانه هوشمند هوشاگر
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            سامانه آنلاین و فعال
          </span>
        </div>

        {/* آمارهای کلیدی مدرسه */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-right">
            <div className="flex items-center gap-1 text-[11px] text-[var(--lux-text-muted)]">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span>پرتال اولیا</span>
            </div>
            <p className="mt-1 font-mono text-base font-black text-white">۱,۲۸۰+</p>
            <span className="text-[10px] text-emerald-400 font-bold">ارتباط لحظه‌ای</span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-right">
            <div className="flex items-center gap-1 text-[11px] text-[var(--lux-text-muted)]">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--lux-primary)]" />
              <span>حضور و غیاب</span>
            </div>
            <p className="mt-1 font-mono text-base font-black text-white">۹۹.۲٪</p>
            <span className="text-[10px] text-[var(--lux-primary)] font-bold">گزارش روزانه</span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-right">
            <div className="flex items-center gap-1 text-[11px] text-[var(--lux-text-muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--lux-secondary)]" />
              <span>هوش مصنوعی</span>
            </div>
            <p className="mt-1 font-mono text-base font-black text-white">۱۲ مدل</p>
            <span className="text-[10px] text-[var(--lux-secondary)] font-bold">تحلیل پیشرفت</span>
          </div>
        </div>

        {/* شبیه‌ساز رویدادهای زنده مدرسه */}
        <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
                <HeartHandshake className="h-3.5 w-3.5" />
              </span>
              <span className="text-white/90">کارنامه هفتگی و نمرات برای اولیا ارسال شد</span>
            </div>
            <span className="text-[10px] text-[var(--lux-text-muted)] font-mono">لحظاتی پیش</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--lux-secondary)]/15 text-[var(--lux-secondary)]">
                <Award className="h-3.5 w-3.5" />
              </span>
              <span className="text-white/90">باغ استعداد: اهدای نشان علمی به دانش‌آموزان</span>
            </div>
            <span className="text-[10px] text-[var(--lux-text-muted)] font-mono">امروز</span>
          </div>
        </div>
      </div>

      {/* ── ۳ ستون اصلی ارزش هوشاگر برای نقش‌ها ── */}
      <div className="grid grid-cols-1 gap-2.5">
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 transition-colors hover:border-amber-500/40">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-right">
            <h4 className="text-xs font-black text-amber-200">پرتال اختصاصی اولیا و خانواده</h4>
            <p className="mt-0.5 text-[11px] leading-5 text-[var(--lux-text-muted)]">
              مشاهده فوری نمرات، حضور و غیاب، کارنامه تحلیلی و ارتباط مستقیم با معلم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[var(--lux-primary)]/20 bg-[var(--lux-primary)]/5 p-3 transition-colors hover:border-[var(--lux-primary)]/40">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--lux-primary)]/20 text-indigo-300">
            <School className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-right">
            <h4 className="text-xs font-black text-indigo-200">میز کار کادر آموزشی، مدیران و معلمان</h4>
            <p className="mt-0.5 text-[11px] leading-5 text-[var(--lux-text-muted)]">
              ثبت سریع نمرات، آزمون‌ساز هوشمند، انضباطی، بهداشت و پرونده تحصیلی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[var(--lux-secondary)]/20 bg-[var(--lux-secondary)]/5 p-3 transition-colors hover:border-[var(--lux-secondary)]/40">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--lux-secondary)]/20 text-cyan-300">
            <GraduationCap className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-right">
            <h4 className="text-xs font-black text-cyan-200">دنیای یادگیری و مأموریت‌های دانش‌آموز</h4>
            <p className="mt-0.5 text-[11px] leading-5 text-[var(--lux-text-muted)]">
              باغ استعداد، کسب امتیاز XP، تکالیف تعاملی و دستیار هوشمند مطالعه
            </p>
          </div>
        </div>
      </div>

      {/* ── نوار اطمینان و امنیت ── */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-[var(--lux-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          رمزنگاری سرتاسری و حفاظت اطلاعات
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-amber-400" />
          زیرساخت ابری پایدار و سریع
        </span>
      </div>
    </div>
  )
}
