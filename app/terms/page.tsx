import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'

export const metadata: Metadata = {
  title: 'قوانین و شرایط استفاده | هوشاگر',
  description: 'قوانین استفاده از سامانه هوشمند مدیریت مدارس هوشاگر و سیاست حریم خصوصی',
}

const sections = [
  {
    id: 'acceptance',
    title: '۱. پذیرش قوانین',
    body: `با ورود، ثبت‌نام، یا استفاده از سامانه هوشاگر («سامانه»)، شما این قوانین و شرایط را می‌پذیرید. اگر نماینده مدرسه یا والد هستید، تأیید می‌کنید که اختیار قانونی پذیرش این شرایط را دارید. در صورت عدم موافقت، از استفاده از سامانه خودداری کنید.`,
  },
  {
    id: 'service',
    title: '۲. شرح خدمات',
    body: `هوشاگر پلتفرم مدیریت آموزشی است که شامل ثبت‌نام، حضور و غیاب، آزمون، گزارش‌دهی، ارتباطات مدرسه، و ابزارهای مبتنی بر هوش مصنوعی می‌شود. امکانات بسته به نقش کاربر (مدیر، معلم، دانش‌آموز، والد و …) و پلن اشتراک مدرسه متفاوت است.`,
  },
  {
    id: 'accounts',
    title: '۳. حساب کاربری و امنیت',
    body: `شما مسئول حفظ محرمانه بودن نام کاربری، رمز عبور، PIN، یا کد OTP خود هستید. هرگونه فعالیت انجام‌شده از طریق حساب شما به عهده شماست. در صورت مشاهده دسترسی غیرمجاز، فوراً به مدیر مدرسه یا پشتیبانی هوشاگر اطلاع دهید.`,
  },
  {
    id: 'ai',
    title: '۴. استفاده از هوش مصنوعی',
    body: `خروجی‌های AI (تحلیل، پیشنهاد، تصحیح، داستان آموزشی و …) جنبه راهنما دارند و جایگزین قضاوت انسانی معلم، مشاور، یا پزشک نیستند. مدیران و معلمان مسئول بررسی نهایی تصمیم‌های آموزشی و انضباطی هستند. ارسال محتوای غیرقانونی، توهین‌آمیز، یا نقض‌کننده حقوق دیگران از طریق ابزارهای AI ممنوع است.`,
  },
  {
    id: 'data-school',
    title: '۵. داده‌های آموزشی',
    body: `اطلاعات دانش‌آموزان (نمرات، حضور، گزارش‌ها و …) متعلق به مدرسه و تحت نظارت قوانین آموزشی و حریم خصوصی است. هوشاگر داده‌ها را صرفاً برای ارائه خدمات سامانه پردازش می‌کند و بدون مجوز قانونی یا قراردادی به اشخاص ثالث واگذار نمی‌کند.`,
  },
  {
    id: 'prohibited',
    title: '۶. رفتارهای ممنوع',
    body: `ممنوع است: دور زدن امنیت سامانه، استخراج داده‌های دیگران، استفاده تجاری غیرمجاز، انتشار بدافزار، جعل هویت، سوءاستفاده از سهمیه AI یا SMS، و هر اقدامی که به زیرساخت یا کاربران آسیب برساند.`,
  },
  {
    id: 'subscription',
    title: '۷. اشتراک و پرداخت',
    body: `مدارس دارای پلن اشتراک با محدودیت کاربر، فراخوانی AI، و امکانات مشخص هستند. پرداخت‌ها طبق شرایط درگاه پرداخت (زرین‌پال) انجام می‌شود. بازپرداخت طبق سیاست مدرسه و قرارداد همکاری با هوشاگر است.`,
  },
  {
    id: 'liability',
    title: '۸. محدودیت مسئولیت',
    body: `سامانه «همان‌گونه که هست» ارائه می‌شود. هوشاگر در حدود قانون، مسئول خسارات غیرمستقیم ناشی از قطعی اینترنت، خطای AI، یا سوءاستفاده کاربران از حساب شخصی نیست. مسئولیت اصلی نظارت بر محتوا و تصمیم‌های آموزشی بر عهده مدرسه است.`,
  },
  {
    id: 'changes',
    title: '۹. تغییر قوانین',
    body: `ممکن است این قوانین به‌روزرسانی شود. نسخه جدید در همین صفحه منتشر می‌شود. ادامه استفاده پس از انتشار، به منزله پذیرش نسخه به‌روز است.`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <HooshagarLogo size="sm" href="/" showWordmark />
          <Link href="/login">
            <Button variant="outline" size="sm">
              <ArrowRight className="w-4 h-4 ml-1" />
              بازگشت به ورود
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">قوانین و شرایط استفاده</h1>
        <p className="text-sm text-muted-foreground mb-8">
          آخرین به‌روزرسانی: فروردین ۱۴۰۴ · سامانه هوشاگر (Hooshagar)
        </p>

        <nav className="mb-10 p-4 rounded-2xl bg-white border border-gray-100 text-sm space-y-1">
          <p className="font-semibold text-gray-800 mb-2">فهرست</p>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block text-brand-magenta hover:underline py-0.5">
              {s.title}
            </a>
          ))}
          <a href="#privacy" className="block text-brand-magenta hover:underline py-0.5">
            ۱۰. حریم خصوصی
          </a>
        </nav>

        <article className="space-y-8">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h2>
              <p className="text-gray-600 leading-8 text-justify whitespace-pre-line">{s.body}</p>
            </section>
          ))}

          <section id="privacy" className="scroll-mt-24 pt-4 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">۱۰. حریم خصوصی</h2>
            <div className="text-gray-600 leading-8 space-y-4 text-justify">
              <p>
                هوشاگر متعهد به حفاظت از اطلاعات شخصی دانش‌آموزان، والدین، و کارکنان مدارس است.
                داده‌ها در زیرساخت امن (Supabase) با رمزنگاری در انتقال (HTTPS) ذخیره می‌شوند.
              </p>
              <p>
                <strong>داده‌های جمع‌آوری‌شده:</strong> نام، شماره تماس، نقش، اطلاعات تحصیلی،
                حضور و غیاب، نمرات، تعاملات با AI، و لاگ‌های امنیتی برای جلوگیری از سوءاستفاده.
              </p>
              <p>
                <strong>دسترسی:</strong> هر کاربر فقط به داده‌های مجاز نقش خود (طبق RLS) دسترسی دارد.
                مدیر مدرسه مسئول مدیریت دسترسی کاربران در مدرسه است.
              </p>
              <p>
                <strong>حذف و export:</strong> درخواست حذف یا دریافت کپی داده‌ها از طریق مدیر مدرسه
                یا پشتیبانی هوشاگر قابل پیگیری است.
              </p>
              <p>
                <strong>کوکی و session:</strong> برای نگه‌داشتن ورود شما از session امن استفاده می‌شود.
              </p>
            </div>
          </section>
        </article>

        <div className="mt-12 text-center">
          <Link href="/login">
            <Button className="bg-gradient-to-r from-brand-magenta to-brand-orange text-white border-0">
              بازگشت و ورود به سامانه
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-muted-foreground">
        © ۱۴۰۴ هوشاگر — تمامی حقوق محفوظ است ·{' '}
        <Link href="/" className="text-brand-magenta hover:underline">صفحه اصلی</Link>
      </footer>
    </div>
  )
}
