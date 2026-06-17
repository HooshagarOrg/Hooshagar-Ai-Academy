import Link from 'next/link'
import {
  Brain,
  BookOpen,
  Sparkles,
  GraduationCap,
  Users,
  Shield,
  Zap,
  Heart,
  CheckCircle2,
  ArrowLeft,
  BarChart3,
  Trophy,
  Target,
  Smartphone,
  Atom,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Reveal } from '@/components/motion/reveal'
import { Stagger, StaggerItem } from '@/components/motion/stagger'
import { GlassCard } from '@/components/ui/glass-card'
import { TiltCard } from '@/components/motion/tilt-card'

const features = [
  {
    icon: Brain,
    title: 'هوش مصنوعی بومی',
    description: '۱۲ قابلیت AI برای تحلیل، آموزش و راهنمایی شخصی — با درک عمیق فارسی و فرهنگ آموزش ایران',
    accent: 'from-blue-500/20 to-indigo-500/10',
    iconColor: 'text-sky-300',
    span: 'md:col-span-2 md:row-span-2',
    large: true,
  },
  {
    icon: Users,
    title: '۱۸ نقش، یک اکوسیستم',
    description: 'از دانش‌آموز تا مدیر — هر نقش فضای اختصاصی',
    accent: 'from-cyan-500/15 to-blue-500/10',
    iconColor: 'text-cyan-300',
    span: '',
    large: false,
  },
  {
    icon: Trophy,
    title: 'یادگیری بازی‌گونه',
    description: 'XP، نشان و Streak برای انگیزه پایدار',
    accent: 'from-amber-400/15 to-orange-400/10',
    iconColor: 'text-amber-300',
    span: '',
    large: false,
  },
  {
    icon: BarChart3,
    title: 'گزارش‌های زنده',
    description: 'تحلیل پیشرفت برای خانواده و مدرسه',
    accent: 'from-emerald-500/15 to-teal-500/10',
    iconColor: 'text-emerald-300',
    span: '',
    large: false,
  },
  {
    icon: Smartphone,
    title: 'همه‌جا در دسترس',
    description: 'موبایل، تبلت و دسکتاپ',
    accent: 'from-violet-500/15 to-blue-500/10',
    iconColor: 'text-violet-300',
    span: '',
    large: false,
  },
  {
    icon: Shield,
    title: 'امنیت مدرسه‌ای',
    description: 'احراز هویت چندلایه و حفاظت داده',
    accent: 'from-slate-400/15 to-blue-500/10',
    iconColor: 'text-slate-300',
    span: 'md:col-span-2',
    large: false,
  },
]

const userTypes = [
  {
    icon: GraduationCap,
    role: 'دانش‌آموز',
    gradient: 'from-blue-600/90 via-indigo-600/80 to-violet-600/70',
    items: ['دستیار مطالعه AI', 'حل مسئله با عکس', 'انتخاب رشته', 'برنامه کنکور', 'باغ استعداد'],
  },
  {
    icon: BookOpen,
    role: 'معلم',
    gradient: 'from-cyan-600/80 via-blue-600/70 to-indigo-600/60',
    items: ['آزمون‌ساز هوشمند', 'تحلیل رفتاری', 'تولید محتوا با AI', 'حضور و نمره', 'گزارش هفتگی'],
  },
  {
    icon: Heart,
    role: 'والدین',
    gradient: 'from-teal-600/80 via-blue-600/70 to-sky-600/50',
    items: ['پیگیری لحظه‌ای', 'گزارش تحصیلی', 'ارتباط با معلم', 'وضعیت مالی', 'مشاوره'],
  },
  {
    icon: BarChart3,
    role: 'مدیر مدرسه',
    gradient: 'from-indigo-600/80 via-blue-600/60 to-slate-600/50',
    items: ['داشبورد مدیریتی', 'هشدار زودهنگام', 'قرعه‌کشی ثبت‌نام', 'گزارش جامع', 'کنترل AI'],
  },
]

const stats = [
  { value: '۱۸+', label: 'نقش سازمانی' },
  { value: '۱۲', label: 'قابلیت AI' },
  { value: '۷۲', label: 'مدل هوشمند' },
  { value: '۱۰۰٪', label: 'ایرانی‌پسند' },
]

export default function LandingPage() {
  return (
    <MarketingShell tone="balanced" background="landing">
      <section className="relative pt-8 pb-20 md:pt-12 md:pb-28 premium-hero-glow">
        <div className="absolute inset-x-0 top-24 h-px premium-shimmer-line" aria-hidden />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            <Reveal className="text-center lg:text-right order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass-panel-luxury text-sm border-blue-400/20">
                <Atom className="w-4 h-4 text-sky-300" />
                <span className="text-muted-foreground">کهکشان دانش — Knowledge Universe</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.15] text-balance">
                <span className="gradient-text">هوشاگر</span>
                <span className="block text-xl md:text-2xl font-bold text-foreground/90 mt-4">
                  آزمایشگاه یادگیری هوشمند مدارس ایران
                </span>
              </h1>

              <p className="text-lg text-muted-foreground mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                پلتفرمی که ریاضی، علوم، فارسی و فناوری را در یک فضای آکادمیک و AI-native گرد هم می‌آورد.
              </p>
              <p className="text-sm text-muted-foreground/75 mb-10 max-w-lg mx-auto lg:mx-0">
                نه LMS قدیمی — همراهی هوشمند از ثبت‌نام تا کنکور، برای مدارس و خانواده‌های ایرانی.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/login" prefetch={false}>
                  <Button size="lg" variant="luxury" className="px-8 h-12 text-base w-full sm:w-auto">
                    <Zap className="w-5 h-5" />
                    ورود به آزمایشگاه
                  </Button>
                </Link>
                <Link href="#features" prefetch={false}>
                  <Button size="lg" variant="outline" className="px-8 h-12 text-base border-blue-400/25 hover:border-blue-400/40 w-full sm:w-auto">
                    کاوش امکانات
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.06} className="flex justify-center order-1 lg:order-2">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full blur-3xl opacity-50"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(99,102,241,0.08) 50%, transparent 72%)',
                  }}
                  aria-hidden
                />
                <HooshagarLogo size="hero" href="/" showWordmark={false} priority />
              </div>
            </Reveal>
          </div>

          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto lg:mr-0 lg:ml-auto">
            {stats.map((stat, i) => (
              <StaggerItem key={i}>
                <GlassCard luxury className="p-5 text-center" hover>
                  <p className="text-2xl md:text-3xl font-black gradient-text mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </GlassCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="section-label text-sky-300/80 mb-3">اکوسیستم آموزشی</p>
            <h2 className="text-3xl md:text-4xl font-black mb-4">همه‌چیز در یک بوم دانش</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              طراحی‌شده برای مدارس — با عمق بصری آکادمیک، نه قالب‌های تکراری SaaS
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-4 auto-rows-fr">
            {features.map((f, i) => {
              const FeatureIcon = f.icon
              return (
                <Reveal key={i} delay={i * 0.04} className={f.span}>
                  <TiltCard className={f.large ? 'h-full min-h-[280px]' : 'h-full'}>
                    <div className={`p-6 h-full flex flex-col ${f.large ? 'md:p-8' : ''}`}>
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4 border border-blue-400/15`}
                      >
                        <FeatureIcon className={`w-6 h-6 ${f.iconColor}`} />
                      </div>
                      <h3 className={`font-bold mb-2 ${f.large ? 'text-xl' : 'text-lg'}`}>{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{f.description}</p>
                      {f.large && (
                        <p className="text-xs text-sky-300/70 mt-4 pt-4 border-t border-blue-400/10">
                          π · AI · فارسی · علوم · آینده
                        </p>
                      )}
                    </div>
                  </TiltCard>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">برای هر نقش، یک جهان یادگیری</h2>
            <p className="text-lg text-muted-foreground">یک پلتفرم — تجربه‌های متمایز و هدفمند</p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {userTypes.map((u, i) => {
              const RoleIcon = u.icon
              return (
                <Reveal key={i} delay={i * 0.05}>
                  <GlassCard luxury className="overflow-hidden p-0 h-full" hover>
                    <div className={`bg-gradient-to-br ${u.gradient} p-6 relative`}>
                      <div className="absolute inset-0 bg-black/25" aria-hidden />
                      <RoleIcon className="w-8 h-8 mb-3 text-white/95 relative" />
                      <h3 className="text-lg font-bold text-white relative">{u.role}</h3>
                    </div>
                    <ul className="p-4 space-y-2.5">
                      {u.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel-luxury text-sm mb-6 border-blue-400/15">
                <Brain className="w-4 h-4 text-sky-300" />
                <span>AI Native · Human Centered</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                ۱۲ قابلیت AI
                <br />
                <span className="gradient-text">در خدمت یادگیری</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                از OCR تا مشاوره رشته — هوش مصنوعی که فارسی را می‌فهمد و با فرهنگ آموزش ایران هماهنگ است.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'تحلیلگر دانش‌آموز',
                  'حل مسئله OCR',
                  'دستیار مطالعه',
                  'قصه‌گوی هوشمند',
                  'مشاور انتخاب رشته',
                  'پیش‌بینی کنکور',
                  'تولید آزمون',
                  'خلاصه‌ساز',
                ].map((ai, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                    {ai}
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <GlassCard luxury glow="scholar" className="p-8">
                <div className="space-y-4">
                  <div className="rounded-2xl p-4 bg-white/[0.03] border border-blue-400/10">
                    <p className="text-muted-foreground text-xs mb-2">Fallback ۵ لایه‌ای</p>
                    <div className="flex gap-2 flex-wrap">
                      {['Tier 1', 'Tier 2', 'Tier 3', 'Gemini', 'Premium'].map((t, i) => (
                        <span
                          key={i}
                          className="bg-blue-500/10 text-foreground text-xs px-2.5 py-1 rounded-lg border border-blue-400/10"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl p-4 bg-white/[0.03] border border-blue-400/10">
                    <p className="text-muted-foreground text-xs mb-2">بهینه برای فارسی</p>
                    <p className="text-4xl font-black gradient-text">۱۰۰٪</p>
                  </div>
                  <div className="rounded-2xl p-4 bg-white/[0.03] border border-blue-400/10">
                    <p className="text-muted-foreground text-xs mb-1">همیشه در دسترس</p>
                    <p className="font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      زیرساخت پایدار و مطمئن
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-20 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          <Reveal>
            <GlassCard luxury glow="scholar" className="p-10 text-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.18), transparent 60%)',
                }}
                aria-hidden
              />
              <div className="relative">
                <div className="flex justify-center mb-6">
                  <HooshagarLogo size="lg" href="/login" showWordmark={false} />
                </div>
                <h2 className="text-3xl font-black mb-4">مدرسه‌ات را به آینده ببر</h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  همین امروز — نصب آسان، پشتیبانی فارسی، طراحی برای مدارس ایران
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/login">
                    <Button size="lg" variant="luxury" className="px-10 h-12">
                      <GraduationCap className="w-5 h-5" />
                      شروع رایگان
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="px-10 h-12 border-blue-400/25">
                      مشاهده پلن‌ها
                    </Button>
                  </Link>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  )
}
