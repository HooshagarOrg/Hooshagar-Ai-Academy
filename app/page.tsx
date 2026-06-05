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
  MessageSquare,
  Trophy,
  Target,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Reveal } from '@/components/motion/reveal'
import { Stagger, StaggerItem } from '@/components/motion/stagger'
import { GlassCard } from '@/components/ui/glass-card'

const features = [
  {
    icon: Brain,
    title: 'هوش مصنوعی پیشرفته',
    description: '۱۲ قابلیت AI با مدل‌های پیشرفته برای تحلیل، آموزش و راهنمایی شخصی',
    accent: 'from-brand-purple/20 to-brand-pink/10',
    iconColor: 'text-brand-purple',
  },
  {
    icon: Users,
    title: 'مدیریت جامع',
    description: '۱۸ نقش سازمانی — هر کس فضای اختصاصی خود را دارد',
    accent: 'from-brand-cyan/20 to-brand-purple/10',
    iconColor: 'text-brand-cyan',
  },
  {
    icon: Trophy,
    title: 'یادگیری بازی‌گونه',
    description: 'XP، نشان، Streak و رتبه‌بندی برای انگیزه پایدار',
    accent: 'from-brand-yellow/20 to-brand-orange/10',
    iconColor: 'text-brand-yellow',
  },
  {
    icon: BarChart3,
    title: 'گزارش‌های هوشمند',
    description: 'تحلیل پیشرفت برای خانواده، معلم و مدیر با نمودارهای زنده',
    accent: 'from-brand-green/20 to-brand-cyan/10',
    iconColor: 'text-brand-green',
  },
  {
    icon: Smartphone,
    title: 'همه‌جا در دسترس',
    description: 'واکنش‌گرا برای موبایل، تبلت و دسکتاپ — بدون اپ جدا',
    accent: 'from-brand-pink/20 to-brand-orange/10',
    iconColor: 'text-brand-pink',
  },
  {
    icon: Shield,
    title: 'امنیت و اعتماد',
    description: 'احراز هویت چندلایه و حفاظت داده برای مدارس و خانواده‌ها',
    accent: 'from-brand-orange/20 to-brand-pink/10',
    iconColor: 'text-brand-orange',
  },
]

const userTypes = [
  {
    icon: GraduationCap,
    role: 'دانش‌آموز',
    gradient: 'from-brand-orange to-brand-pink',
    items: ['دستیار مطالعه AI', 'حل مسئله با عکس', 'انتخاب رشته', 'برنامه کنکور', 'باغ استعداد'],
  },
  {
    icon: BookOpen,
    role: 'معلم',
    gradient: 'from-brand-cyan to-brand-purple',
    items: ['آزمون‌ساز هوشمند', 'تحلیل رفتاری', 'تولید محتوا با AI', 'حضور و نمره', 'گزارش هفتگی'],
  },
  {
    icon: Heart,
    role: 'والدین',
    gradient: 'from-brand-green to-brand-cyan',
    items: ['پیگیری لحظه‌ای', 'گزارش تحصیلی', 'ارتباط با معلم', 'وضعیت مالی', 'مشاوره'],
  },
  {
    icon: BarChart3,
    role: 'مدیر مدرسه',
    gradient: 'from-brand-purple to-brand-pink',
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
    <MarketingShell tone="balanced">
      {/* Hero */}
      <section className="relative pt-10 pb-24 md:pt-16 md:pb-32 premium-hero-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass-panel text-sm border-brand-pink/20">
              <Sparkles className="w-4 h-4 text-brand-yellow" />
              <span className="text-muted-foreground">آینده آموزش، همین امروز</span>
            </div>

            <div className="flex justify-center mb-8">
              <HooshagarLogo size="hero" href="/" showWordmark={false} priority />
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight text-balance">
              <span className="gradient-text">هوشاگر</span>
              <span className="block text-2xl md:text-3xl font-bold text-foreground mt-3">
                سیستم‌عامل یادگیری هوشمند
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              نه یک LMS قدیمی — یک همراه AI که دانش‌آموز را می‌فهمد، رشد می‌دهد و الهام می‌بخشد.
            </p>
            <p className="text-sm text-muted-foreground/80 mb-10 max-w-xl mx-auto">
              از ثبت‌نام تا کنکور؛ برای کودکان جذاب، برای نوجوانان مدرن، برای مدارس قابل اعتماد.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" prefetch={false}>
                <Button size="lg" variant="gradient" className="px-8 h-12 text-base">
                  <Zap className="w-5 h-5" />
                  شروع رایگان
                </Button>
              </Link>
              <Link href="#features" prefetch={false}>
                <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                  کشف امکانات
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Reveal>

          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <StaggerItem key={i}>
                <GlassCard className="p-5 text-center" hover>
                  <p className="text-2xl md:text-3xl font-black gradient-text mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </GlassCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">همه چیز در یک اکوسیستم</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Soft Futurism برای آموزش — شیشه‌ای، زنده، و متمرکز بر انسان
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const FeatureIcon = f.icon
              return (
              <Reveal key={i} delay={i * 0.04}>
              <GlassCard hover className="p-6 group h-full">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4 border border-white/[0.06] group-hover:scale-105 transition-transform`}
                >
                  <FeatureIcon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </GlassCard>
              </Reveal>
            )})}
          </div>
        </div>
      </section>

      {/* User types */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">برای هر نقش، تجربه‌ای منحصربه‌فرد</h2>
            <p className="text-lg text-muted-foreground">یک پلتفرم — چهار جهان متفاوت</p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {userTypes.map((u, i) => {
              const RoleIcon = u.icon
              return (
              <Reveal key={i} delay={i * 0.05}>
              <GlassCard className="overflow-hidden p-0 h-full" hover>
                <div className={`bg-gradient-to-br ${u.gradient} p-6`}>
                  <RoleIcon className="w-8 h-8 mb-3 text-white/90" />
                  <h3 className="text-lg font-bold text-white">{u.role}</h3>
                </div>
                <ul className="p-4 space-y-2.5">
                  {u.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
              </Reveal>
            )})}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-sm mb-6 border-brand-purple/20">
                <Brain className="w-4 h-4 text-brand-yellow" />
                <span>AI Native + Human Centered</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                ۱۲ قابلیت AI
                <br />
                <span className="gradient-text">در خدمت یادگیری</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                از OCR تا مشاوره رشته — هوش مصنوعی که فارسی را می‌فهمد و با فرهنگ آموزش ایران
                هماهنگ است.
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
                    <Sparkles className="w-3.5 h-3.5 text-brand-yellow flex-shrink-0" />
                    {ai}
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
            <GlassCard elevated glow="pink" className="p-8">
              <div className="space-y-4">
                <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/[0.06]">
                  <p className="text-muted-foreground text-xs mb-2">Fallback ۵ لایه‌ای</p>
                  <div className="flex gap-2 flex-wrap">
                    {['Tier 1', 'Tier 2', 'Tier 3', 'Gemini', 'Premium'].map((t, i) => (
                      <span
                        key={i}
                        className="bg-brand-purple/20 text-foreground text-xs px-2.5 py-1 rounded-lg border border-white/[0.06]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/[0.06]">
                  <p className="text-muted-foreground text-xs mb-2">بهینه برای فارسی</p>
                  <p className="text-4xl font-black gradient-text">۱۰۰٪</p>
                </div>
                <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/[0.06]">
                  <p className="text-muted-foreground text-xs mb-1">همیشه در دسترس</p>
                  <p className="font-medium flex items-center gap-2">
                    <Target className="w-4 h-4 text-brand-green" />
                    زیرساخت پایدار و مطمئن
                  </p>
                </div>
              </div>
            </GlassCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          <Reveal>
          <GlassCard elevated glow="cyan" className="p-10 text-center">
            <div className="flex justify-center mb-6">
              <HooshagarLogo size="lg" href="/login" showWordmark={false} />
            </div>
            <h2 className="text-3xl font-black mb-4">مدرسه‌ات را به آینده ببر</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              همین امروز شروع کن — نصب آسان، پشتیبانی فارسی، طراحی برای مدارس ایران
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login">
                <Button size="lg" variant="gradient" className="px-10 h-12">
                  <GraduationCap className="w-5 h-5" />
                  شروع رایگان
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="px-10 h-12">
                  مشاهده پلن‌ها
                </Button>
              </Link>
            </div>
          </GlassCard>
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  )
}
