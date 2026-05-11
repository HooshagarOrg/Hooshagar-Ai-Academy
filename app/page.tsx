import Link from 'next/link'
import {
  Brain, BookOpen, Sparkles, GraduationCap, Users, TrendingUp,
  Shield, Zap, Heart, CheckCircle2, ArrowLeft, Star,
  BarChart3, MessageSquare, Trophy, Target, Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ============================================
// داده‌های ثابت
// ============================================
const features = [
  {
    icon: Brain,
    title: 'هوش مصنوعی پیشرفته',
    description: '۱۲ قابلیت AI با ۷۲ مدل پیشرفته برای تحلیل، آموزش و راهنمایی',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Users,
    title: 'مدیریت جامع کارکنان',
    description: '۱۸ نقش سازمانی از مدیر تا نگهبان — هر کس صفحه خودش را دارد',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Trophy,
    title: 'Gamification آموزشی',
    description: 'سیستم XP، نشان، Streak و جدول رتبه‌بندی برای انگیزه‌بخشی به دانش‌آموزان',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: BarChart3,
    title: 'گزارش‌های هوشمند',
    description: 'گزارش‌های تحلیلی برای والدین، معلمان و مدیران با نمودارهای پیشرفته',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: Smartphone,
    title: 'موبایل‌پسند',
    description: 'طراحی واکنش‌گرا برای همه دستگاه‌ها — بدون نیاز به اپ جداگانه',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    icon: Shield,
    title: 'امنیت بالا',
    description: 'RLS، احراز هویت چندلایه و حفاظت داده برای اطلاعات دانش‌آموزان',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
]

const userTypes = [
  {
    icon: GraduationCap,
    role: 'دانش‌آموز',
    color: 'from-orange-500 to-amber-500',
    items: ['دستیار مطالعه AI', 'حل مسئله با عکس', 'انتخاب رشته هوشمند', 'برنامه‌ریزی کنکور', 'باغ استعداد'],
  },
  {
    icon: BookOpen,
    role: 'معلم',
    color: 'from-blue-500 to-indigo-500',
    items: ['آزمون‌ساز هوشمند', 'تحلیل رفتاری دانش‌آموز', 'تولید محتوا با AI', 'ثبت حضور و نمره', 'گزارش هفتگی'],
  },
  {
    icon: Heart,
    role: 'والدین',
    color: 'from-green-500 to-teal-500',
    items: ['پیگیری لحظه‌ای فرزند', 'گزارش تحصیلی ماهانه', 'ارتباط با معلم', 'وضعیت مالی و شهریه', 'پورتال مشاوره'],
  },
  {
    icon: BarChart3,
    role: 'مدیر مدرسه',
    color: 'from-purple-500 to-pink-500',
    items: ['داشبورد مدیریتی', 'هشدار زودهنگام', 'قرعه‌کشی ثبت‌نام', 'گزارش جامع مدرسه', 'کنترل AI و امنیت'],
  },
]

const stats = [
  { value: '۱۸+', label: 'نقش سازمانی' },
  { value: '۱۲', label: 'قابلیت AI' },
  { value: '۷۲', label: 'مدل هوش مصنوعی' },
  { value: '۱۰۰%', label: 'ایرانی‌پسند' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ===== Navbar ===== */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">ه</span>
            </div>
            <span className="font-bold text-gray-900">هوشاگر</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">ورود</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                شروع رایگان
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 rounded-full bg-purple-500 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 border border-white/20 text-sm">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>نسل جدید مدیریت آموزشی در ایران</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-l from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                هوشاگر
              </span>
        </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-4 font-medium">
              سیستم‌عامل هوشمند مدیریت مدارس
            </p>
            <p className="text-base text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              از ثبت‌نام تا کنکور — همه چیز در یک پلتفرم. هوش مصنوعی، گیمیفیکیشن و مدیریت جامع
              برای بهترین تجربه آموزشی ایران.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 h-12 text-base shadow-lg shadow-blue-500/30">
                  <Zap className="w-5 h-5 ml-2" />
                  شروع رایگان
                </Button>
                </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 h-12 text-base">
                  مشاهده امکانات
                  <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
                </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ویژگی‌ها ===== */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              همه چیز در یک پلتفرم
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              از مدیریت کلاس تا هوش مصنوعی — هوشاگر برای هر نیاز مدرسه راه‌حل دارد
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
                </div>
                </div>
      </section>

      {/* ===== برای هر کاربر ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              برای همه، نه فقط مدیران
            </h2>
            <p className="text-lg text-gray-500">
              هر نقش صفحه اختصاصی خودش را دارد
            </p>
                </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userTypes.map((u, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className={`bg-gradient-to-br ${u.color} p-6 text-white`}>
                  <u.icon className="w-8 h-8 mb-3 opacity-90" />
                  <h3 className="text-lg font-bold">{u.role}</h3>
                </div>
                <div className="bg-white p-4">
                  <ul className="space-y-2">
                    {u.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI Section ===== */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-sm mb-6">
                <Brain className="w-4 h-4 text-yellow-400" />
                <span>هوش مصنوعی ایران‌پسند</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                ۱۲ قابلیت AI <br /> با ۷۲ مدل رایگان
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                از OCR برای حل مسئله با عکس تا تحلیل استعداد و مشاوره انتخاب رشته —
                هوش مصنوعی در خدمت آموزش ایرانی.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {['تحلیلگر دانش‌آموز', 'حل مسئله OCR', 'دستیار مطالعه', 'قصه‌گوی هوشمند',
                  'مشاور انتخاب رشته', 'پیش‌بینی کنکور', 'تولید آزمون', 'خلاصه‌ساز'].map((ai, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    {ai}
            </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="space-y-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/60 text-xs mb-1">سیستم Fallback ۵ لایه‌ای</p>
                  <div className="flex gap-2 flex-wrap">
                    {['Tier 1', 'Tier 2', 'Tier 3', 'Gemini Pool', 'Premium'].map((t, i) => (
                      <span key={i} className="bg-white/20 text-white text-xs px-2 py-1 rounded-lg">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/60 text-xs mb-2">پشتیبانی از زبان فارسی</p>
                  <p className="text-3xl font-black text-white">۱۰۰٪</p>
                  <p className="text-white/50 text-xs mt-1">بهینه‌شده برای محتوای درسی ایران</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/60 text-xs mb-1">همیشه در دسترس</p>
                  <p className="text-white font-medium">زیرساخت پایدار و مطمئن ✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl font-black">ه</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              مدرسه خود را متحول کنید
          </h2>
            <p className="text-gray-500 mb-8 text-lg">
              همین امروز شروع کنید. نصب آسان، پشتیبانی فارسی، طراحی‌شده برای مدارس ایران
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/login">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-10 h-12 text-base shadow-lg shadow-blue-200">
                  <GraduationCap className="w-5 h-5 ml-2" />
                  شروع رایگان
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="px-10 h-12 text-base border-2">
                  مشاهده پلن‌ها
                </Button>
              </Link>
            </div>
          </div>
      </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">ه</span>
            </div>
            <span className="font-bold">هوشاگر</span>
          </div>
          <p className="text-gray-400 text-sm">
            سیستم‌عامل هوشمند مدیریت مدارس ایران
          </p>
          <p className="text-gray-600 text-xs mt-4">
            © ۱۴۰۴ هوشاگر — ساخته شده با ❤️ برای آموزش ایران
          </p>
        </div>
      </footer>
    </div>
  )
}
