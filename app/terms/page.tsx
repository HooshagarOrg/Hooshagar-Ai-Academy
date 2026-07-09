import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingContentCard, MarketingShell } from '@/components/layout/marketing-shell'

export const metadata: Metadata = {
  title: 'قوانین و شرایط استفاده | هوشاگر',
  description: 'قوانین استفاده از سامانه هوشمند مدیریت مدارس هوشاگر',
}

const sections = [
  {
    id: 'acceptance',
    title: '۱. پذیرش قوانین',
    body: 'با ورود، ثبت‌نام، یا استفاده از سامانه هوشاگر، شما این قوانین را می‌پذیرید. اگر نماینده مدرسه یا والد هستید، تأیید می‌کنید که اختیار قانونی پذیرش این شرایط را دارید.',
  },
  {
    id: 'service',
    title: '۲. شرح خدمات',
    body: 'هوشاگر پلتفرم مدیریت آموزشی است شامل ثبت‌نام، حضور و غیاب، آزمون، گزارش‌دهی، ارتباطات مدرسه، و ابزارهای مبتنی بر هوش مصنوعی.',
  },
  {
    id: 'accounts',
    title: '۳. حساب کاربری و امنیت',
    body: 'شما مسئول حفظ محرمانه بودن نام کاربری، رمز عبور، PIN، یا کد OTP خود هستید. هرگونه فعالیت انجام‌شده از طریق حساب شما به عهده شماست.',
  },
  {
    id: 'ai',
    title: '۴. استفاده از هوش مصنوعی',
    body: 'خروجی‌های AI جنبه راهنما دارند و جایگزین قضاوت انسانی معلم، مشاور، یا پزشک نیستند. ارسال محتوای غیرقانونی از طریق ابزارهای AI ممنوع است.',
  },
  {
    id: 'data-school',
    title: '۵. داده‌های آموزشی',
    body: 'اطلاعات دانش‌آموزان متعلق به مدرسه است. هوشاگر داده‌ها را صرفاً برای ارائه خدمات پردازش می‌کند و بدون مجوز قانونی به اشخاص ثالث واگذار نمی‌کند.',
  },
  {
    id: 'prohibited',
    title: '۶. رفتارهای ممنوع',
    body: 'ممنوع است: دور زدن امنیت سامانه، استخراج داده‌های دیگران، استفاده تجاری غیرمجاز، جعل هویت، و سوءاستفاده از سهمیه AI یا SMS.',
  },
  {
    id: 'subscription',
    title: '۷. اشتراک و پرداخت',
    body: 'مدارس دارای پلن اشتراک با محدودیت کاربر و فراخوانی AI هستند. پرداخت‌ها طبق شرایط درگاه پرداخت انجام می‌شود.',
  },
  {
    id: 'liability',
    title: '۸. محدودیت مسئولیت',
    body: 'سامانه «همان‌گونه که هست» ارائه می‌شود. هوشاگر در حدود قانون، مسئول خسارات غیرمستقیم ناشی از قطعی اینترنت یا خطای AI نیست.',
  },
  {
    id: 'changes',
    title: '۹. تغییر قوانین',
    body: 'ممکن است این قوانین به‌روزرسانی شود. ادامه استفاده پس از انتشار، به منزله پذیرش نسخه به‌روز است.',
  },
]

export default function TermsPage() {
  return (
    <MarketingShell backHref="/login" backLabel="بازگشت به ورود">
      <MarketingContentCard>
        <p className="lux-kicker lp-kicker-gold mb-3">قانونی</p>
        <h1 className="lux-h2 mb-2">قوانین و شرایط استفاده</h1>
        <p className="mb-8 text-sm text-[var(--lux-text-muted)]">آخرین به‌روزرسانی: فروردین ۱۴۰۴</p>

        <nav className="mb-10 rounded-xl border border-[rgba(232,236,244,0.08)] bg-[rgba(15,17,23,0.5)] p-4 text-sm">
          <p className="mb-2 font-bold text-[var(--lux-text)]">فهرست</p>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block py-0.5 text-[var(--lux-primary)] hover:underline">
              {s.title}
            </a>
          ))}
          <a href="#privacy" className="block py-0.5 text-[var(--lux-primary)] hover:underline">
            ۱۰. حریم خصوصی
          </a>
        </nav>

        <article className="space-y-8">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="mb-3 text-xl font-black text-[var(--lux-text)]">{s.title}</h2>
              <p className="leading-8 text-[var(--lux-text-muted)]">{s.body}</p>
            </section>
          ))}

          <section id="privacy" className="scroll-mt-24 border-t border-[rgba(232,236,244,0.08)] pt-6">
            <h2 className="mb-3 text-xl font-black text-[var(--lux-text)]">۱۰. حریم خصوصی</h2>
            <p className="leading-8 text-[var(--lux-text-muted)]">
              جزئیات کامل در{' '}
              <Link href="/privacy" className="text-[var(--lux-primary)] underline">
                صفحه حریم خصوصی
              </Link>{' '}
              آمده است.
            </p>
          </section>
        </article>

        <div className="mt-12 text-center">
          <Link href="/login" className="lux-btn-accent inline-flex px-8">
            بازگشت و ورود به سامانه
          </Link>
        </div>
      </MarketingContentCard>
    </MarketingShell>
  )
}
