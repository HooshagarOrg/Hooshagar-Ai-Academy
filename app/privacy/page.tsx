import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingContentCard, MarketingShell } from '@/components/layout/marketing-shell'

export const metadata: Metadata = {
  title: 'حریم خصوصی | هوشاگر',
  description: 'سیاست حریم خصوصی سامانه هوشمند مدیریت مدارس هوشاگر',
}

const sections = [
  {
    id: 'intro',
    title: '۱. مقدمه',
    body: 'هوشاگر متعهد است داده‌های شخصی دانش‌آموزان، والدین، معلمان و کارکنان مدارس را مطابق قوانین جمهوری اسلامی ایران و اصول GDPR (در حد قابل اجرا) محافظت کند.',
  },
  {
    id: 'collect',
    title: '۲. داده‌های جمع‌آوری‌شده',
    body: 'نام، شماره تماس، نقش کاربری، نمرات، حضور و غیاب، گزارش‌های آموزشی، پیام‌ها، لاگ استفاده از AI، و داده‌های فنی (IP، مرورگر) برای امنیت و بهبود سرویس.',
  },
  {
    id: 'use',
    title: '۳. نحوه استفاده',
    body: 'داده‌ها فقط برای ارائه خدمات آموزشی، ارتباط مدرسه با خانواده، تحلیل‌های مجاز، و امنیت سامانه استفاده می‌شوند. داده‌ها به تبلیغ‌کنندگان ثالث فروخته نمی‌شوند.',
  },
  {
    id: 'ai',
    title: '۴. پردازش هوش مصنوعی',
    body: 'درخواست‌های AI ممکن است به ارائه‌دهندگان ابری (مانند Google Gemini یا OpenRouter) ارسال شوند. محتوای حساس باید توسط مدرسه کنترل شود. خروجی AI جنبه مشاوره دارد و تصمیم نهایی با انسان است.',
  },
  {
    id: 'cookies',
    title: '۵. کوکی‌ها',
    body: 'کوکی‌های ضروری برای احراز هویت و نشست کاربر استفاده می‌شوند. با پذیرش بنر کوکی، استفاده از کوکی‌های عملکردی نیز مجاز می‌شود.',
  },
  {
    id: 'rights',
    title: '۶. حقوق شما',
    body: 'شما می‌توانید درخواست مشاهده، اصلاح، صادرات (Data Portability) یا حذف داده‌های خود را از طریق پنل «حریم خصوصی حساب» یا تماس با مدیر مدرسه ثبت کنید.',
  },
  {
    id: 'retention',
    title: '۷. نگهداری داده',
    body: 'داده‌ها تا پایان همکاری مدرسه با هوشاگر و طبق الزامات قانونی نگهداری می‌شوند. پس از حذف حساب، داده‌های شخصی طبق فرآیند GDPR حذف یا ناشناس‌سازی می‌شوند.',
  },
  {
    id: 'contact',
    title: '۸. تماس',
    body: 'برای سوالات حریم خصوصی: support@hooshagar.ir',
  },
]

export default function PrivacyPage() {
  return (
    <MarketingShell backHref="/" backLabel="صفحه اصلی">
      <MarketingContentCard>
        <p className="lux-kicker lp-kicker-gold mb-3">قانونی</p>
        <h1 className="lux-h2 mb-2">سیاست حریم خصوصی</h1>
        <p className="mb-8 text-sm text-[var(--lux-text-muted)]">آخرین به‌روزرسانی: خرداد ۱۴۰۵ — نسخه ۱.۰</p>

        <nav className="mb-10 rounded-xl border border-[rgba(232,236,244,0.08)] bg-[rgba(15,17,23,0.5)] p-4 text-sm">
          <p className="mb-2 font-bold text-[var(--lux-text)]">فهرست</p>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block py-0.5 text-[var(--lux-primary)] hover:underline">
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-[rgba(232,236,244,0.08)] pt-6">
              <h2 className="mb-3 text-xl font-black text-[var(--lux-text)]">{s.title}</h2>
              <p className="leading-8 text-[var(--lux-text-muted)]">{s.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-[var(--lux-text-muted)]">
          <Link href="/terms" className="text-[var(--lux-primary)] underline">
            قوانین و شرایط استفاده
          </Link>
        </p>
      </MarketingContentCard>
    </MarketingShell>
  )
}
