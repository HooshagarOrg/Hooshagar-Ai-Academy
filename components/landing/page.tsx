'use client'

/**
 * لندینگ‌پیج هوشاگر — لاکچری و سینمایی
 * دارک، بدون asset خارجی، GSAP ScrollTrigger، فارسی RTL.
 */

import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  GraduationCap,
  HeartHandshake,
  LineChart,
  MessageCircle,
  ScanText,
  School,
  Sparkles,
  Sprout,
  Trophy,
  Users,
  Wand2,
} from 'lucide-react'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import {
  GlowCounter,
  MagneticButton,
  ScrollProgressBar,
  SectionReveal,
  StaggerReveal,
  TiltCard,
} from './motion'
import LandingHero, { StarfieldCanvas } from './hero'
import { CinematicVideoSection } from './cinematic-video-section'

/* ── ناوبری شناور ── */
function FloatingNav(): JSX.Element {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = (): void => {
      setVisible(window.scrollY > window.innerHeight * 0.7)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`lp-nav ${visible ? 'is-visible' : ''}`} aria-label="ناوبری اصلی">
      <HooshagarLogo size="sm" href="/" inverted showWordmark priority />
      <div className="hidden items-center gap-5 text-sm font-bold text-[var(--lux-text-muted)] sm:flex">
        <a href="#cinematic" className="transition-colors hover:text-[var(--lux-text)]">
          سینما
        </a>
        <a href="#hooshiar" className="transition-colors hover:text-[var(--lux-text)]">
          هوشیار
        </a>
        <a href="#features" className="transition-colors hover:text-[var(--lux-text)]">
          قابلیت‌ها
        </a>
        <a href="#roles" className="transition-colors hover:text-[var(--lux-text)]">
          نقش‌ها
        </a>
      </div>
      <a
        href="/login"
        className="rounded-full bg-[var(--lux-primary)] px-4 py-1.5 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5"
      >
        ورود
      </a>
    </nav>
  )
}

/* ── سکشن هوشیار (همراه هوش مصنوعی) ── */
function HooshiarSection(): JSX.Element {
  const chat: Array<{ from: 'ai' | 'user'; text: string }> = [
    { from: 'user', text: 'هوشیار، فردا امتحان ریاضی دارم و استرس دارم!' },
    {
      from: 'ai',
      text: 'نگران نباش! بر اساس کارنامه‌ات، فقط مبحث «معادلات» نیاز به مرور دارد. یک برنامهٔ ۹۰ دقیقه‌ای برایت چیدم. شروع کنیم؟',
    },
    { from: 'user', text: 'آره، بزن بریم 💪' },
  ]

  return (
    <section id="hooshiar" className="lux-section lp-aurora relative" aria-label="هوشیار">
      <div className="lux-container relative z-10 grid items-center gap-12 lg:grid-cols-2">
        <SectionReveal>
          <p className="lux-kicker lp-kicker-gold mb-4">همراه همیشگی</p>
          <h2 className="lux-h2 mb-5">
            با <span className="lp-gradient-text-animated">هوشیار</span> آشنا شوید
          </h2>
          <p className="lux-body max-w-lg">
            هوشیار، همراه هوش مصنوعی هوشاگر است؛ سؤال حل می‌کند، برنامهٔ مطالعه
            می‌چیند، از روی عکسِ مسئله راه‌حل می‌نویسد و با قصه‌های اختصاصی،
            یادگیری را برای بچه‌ها شیرین می‌کند. ۱۲ قابلیت هوش مصنوعی با پشتیبانی
            کامل از زبان فارسی.
          </p>
          <ul className="mt-7 space-y-3 text-sm font-bold text-[var(--lux-text)]">
            {[
              'پاسخ‌گویی ۲۴ ساعته با درک عمیق از سطح هر دانش‌آموز',
              'حل مسئله از روی عکس با OCR فارسی',
              'قصه‌سازی آموزشی متناسب با سن و علاقه',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Sparkles
                  className="mt-1 h-4 w-4 shrink-0 text-[var(--lux-gold)]"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <TiltCard className="lp-glass p-6" maxTilt={5}>
            <div className="mb-5 flex items-center gap-3 border-b border-[rgba(232,236,244,0.08)] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--lux-primary)] to-[var(--lux-secondary)]">
                <Bot className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-black text-[var(--lux-text)]">هوشیار</p>
                <p className="text-xs text-[var(--lux-success)]">آنلاین</p>
              </div>
            </div>
            <div className="space-y-3">
              {chat.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-7 ${
                    msg.from === 'ai'
                      ? 'ml-auto bg-[rgba(139,124,255,0.14)] text-[var(--lux-text)]'
                      : 'bg-[rgba(232,236,244,0.06)] text-[var(--lux-text-muted)]'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              <div className="mr-1 flex gap-1 pt-1" aria-hidden="true">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--lux-primary)]"
                    style={{ animationDelay: `${d * 140}ms` }}
                  />
                ))}
              </div>
            </div>
          </TiltCard>
        </SectionReveal>
      </div>
    </section>
  )
}

/* ── قابلیت‌ها ── */
interface Feature {
  icon: ReactNode
  title: string
  desc: string
  accent: string
}

function FeaturesSection(): JSX.Element {
  const features: Feature[] = [
    {
      icon: <BrainCircuit className="h-6 w-6" aria-hidden="true" />,
      title: 'تحلیلگر تحصیلی',
      desc: 'نقاط قوت، ضعف و سطح ریسک هر دانش‌آموز با تحلیل هوش مصنوعی از نمرات و رفتار.',
      accent: 'var(--lux-primary)',
    },
    {
      icon: <ScanText className="h-6 w-6" aria-hidden="true" />,
      title: 'حل مسئله از عکس',
      desc: 'عکس مسئله را بفرست؛ راه‌حل گام‌به‌گام با توضیح فارسی دریافت کن.',
      accent: 'var(--lux-secondary)',
    },
    {
      icon: <BookOpen className="h-6 w-6" aria-hidden="true" />,
      title: 'همراه مطالعه',
      desc: 'پرسش‌وپاسخ هوشمند از منابع درسی با جست‌وجوی معنایی و منابع دقیق.',
      accent: 'var(--lux-gold)',
    },
    {
      icon: <Wand2 className="h-6 w-6" aria-hidden="true" />,
      title: 'قصه‌ساز جادویی',
      desc: 'قصه‌های آموزشی اختصاصی بر اساس سن، علاقه و درس هر کودک.',
      accent: 'var(--lux-accent)',
    },
    {
      icon: <Sprout className="h-6 w-6" aria-hidden="true" />,
      title: 'باغ استعداد',
      desc: 'گیمیفیکیشن با XP، نشان و جدول امتیازات؛ رشد مهارت‌ها مثل یک باغ.',
      accent: 'var(--lux-success)',
    },
    {
      icon: <LineChart className="h-6 w-6" aria-hidden="true" />,
      title: 'گزارش والدین',
      desc: 'گزارش‌های دوره‌ای عمیق با بینش هوش مصنوعی، مستقیم برای پدر و مادر.',
      accent: 'var(--lux-parent)',
    },
  ]

  return (
    <section
      id="features"
      className="lux-section relative"
      aria-label="قابلیت‌ها"
    >
      <div className="lux-container">
        <SectionReveal className="mb-14 text-center">
          <p className="lux-kicker lp-kicker-gold mb-4">قدرت هوش مصنوعی</p>
          <h2 className="lux-h2">
            هر آنچه یک مدرسهٔ <span className="lp-gradient-text-animated">آینده‌نگر</span> نیاز دارد
          </h2>
        </SectionReveal>

        <StaggerReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <TiltCard key={f.title} className="lux-card h-full p-6" maxTilt={6}>
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: `color-mix(in srgb, ${f.accent} 14%, transparent)`,
                  color: f.accent,
                }}
              >
                {f.icon}
              </div>
              <h3 className="mb-2 text-lg font-black text-[var(--lux-text)]">{f.title}</h3>
              <p className="text-sm leading-7 text-[var(--lux-text-muted)]">{f.desc}</p>
            </TiltCard>
          ))}
        </StaggerReveal>
      </div>
    </section>
  )
}

/* ── نقش‌ها ── */
interface Role {
  icon: ReactNode
  title: string
  desc: string
  accent: string
}

function RolesSection(): JSX.Element {
  const roles: Role[] = [
    {
      icon: <GraduationCap className="h-7 w-7" aria-hidden="true" />,
      title: 'دانش‌آموز',
      desc: 'داشبورد شخصی، همراه مطالعه، باغ استعداد و آزمون‌های تعاملی.',
      accent: 'var(--arc-student)',
    },
    {
      icon: <Users className="h-7 w-7" aria-hidden="true" />,
      title: 'معلم',
      desc: 'حضور و غیاب، گزارش هفتگی هوشمند و ارتباط مستقیم با والدین.',
      accent: 'var(--arc-teacher)',
    },
    {
      icon: <HeartHandshake className="h-7 w-7" aria-hidden="true" />,
      title: 'والدین',
      desc: 'گزارش‌های عمیق از پیشرفت فرزند با بینش هوش مصنوعی، بدون پیچیدگی.',
      accent: 'var(--arc-parent)',
    },
    {
      icon: <School className="h-7 w-7" aria-hidden="true" />,
      title: 'مدیر مدرسه',
      desc: 'دید کامل به مدرسه؛ آمار، سلامت، مشاوره و مدیریت یکپارچه.',
      accent: 'var(--arc-admin)',
    },
  ]

  return (
    <section id="roles" className="lux-section lp-aurora relative" aria-label="نقش‌ها">
      <div className="lux-container relative z-10">
        <SectionReveal className="mb-14 text-center">
          <p className="lux-kicker lp-kicker-gold mb-4">برای همه</p>
          <h2 className="lux-h2">یک پلتفرم، چهار تجربهٔ اختصاصی</h2>
        </SectionReveal>

        <StaggerReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <TiltCard key={r.title} className="lp-gold-border h-full rounded-3xl p-6 text-center" maxTilt={8}>
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background: `color-mix(in srgb, ${r.accent} 16%, transparent)`,
                  color: r.accent,
                  boxShadow: `0 0 32px color-mix(in srgb, ${r.accent} 25%, transparent)`,
                }}
              >
                {r.icon}
              </div>
              <h3 className="mb-2 text-lg font-black text-[var(--lux-text)]">{r.title}</h3>
              <p className="text-sm leading-7 text-[var(--lux-text-muted)]">{r.desc}</p>
            </TiltCard>
          ))}
        </StaggerReveal>
      </div>
    </section>
  )
}

/* ── آمار ── */
function StatsSection(): JSX.Element {
  const stats = [
    { value: 12, suffix: '', label: 'قابلیت هوش مصنوعی', icon: <BrainCircuit className="h-5 w-5" aria-hidden="true" /> },
    { value: 72, suffix: '', label: 'مدل زبانی پشتیبان', icon: <Bot className="h-5 w-5" aria-hidden="true" /> },
    { value: 4, suffix: '', label: 'نقش کاربری اختصاصی', icon: <Users className="h-5 w-5" aria-hidden="true" /> },
    { value: 100, suffix: '٪', label: 'فارسی و بومی', icon: <Trophy className="h-5 w-5" aria-hidden="true" /> },
  ]

  return (
    <section
      className="lux-section relative"
      aria-label="آمار"
    >
      <div className="lux-container">
        <StaggerReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="lp-glass p-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(201,169,98,0.12)] text-[var(--lux-gold)]">
                {s.icon}
              </div>
              <GlowCounter
                value={s.value}
                suffix={s.suffix}
                className="block text-4xl font-black text-[var(--lux-text)]"
              />
              <p className="mt-2 text-sm font-bold text-[var(--lux-text-muted)]">{s.label}</p>
            </div>
          ))}
        </StaggerReveal>
      </div>
    </section>
  )
}

/* ── دعوت نهایی و فوتر ── */
function CTASection(): JSX.Element {
  return (
    <section
      className="lux-section relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 90% at 50% 110%, rgba(139,124,255,0.2), transparent 60%), var(--lux-void)',
      }}
      aria-label="شروع"
    >
      <div className="lux-container relative z-10 text-center">
        <SectionReveal>
          <p className="lux-kicker lp-kicker-gold mb-5">همین امروز</p>
          <h2 className="lux-display mx-auto max-w-3xl text-[clamp(2rem,6vw,4rem)]">
            آیندهٔ مدرسه‌تان را{' '}
            <span className="lp-gradient-text-animated">امروز</span> بسازید
          </h2>
          <p className="lux-body mx-auto mt-6 max-w-xl">
            به جمع مدارسی بپیوندید که آموزش را با هوش مصنوعی متحول کرده‌اند.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <MagneticButton href="/login" className="lux-btn-accent px-9 text-base">
              شروع کنید
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </MagneticButton>
            <MagneticButton href="#hooshiar" className="lux-btn-ghost px-9 text-base">
              بیشتر بدانید
            </MagneticButton>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}

function Footer(): JSX.Element {
  return (
    <footer className="border-t border-[rgba(232,236,244,0.08)] py-10">
      <div className="lux-container flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-right">
        <div>
          <HooshagarLogo size="sm" href="/" inverted showWordmark={false} />
          <p className="mt-1 text-xs text-[var(--lux-text-muted)]">
            سیستم‌عامل هوشمند مدیریت مدارس
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs font-bold text-[var(--lux-text-muted)]">
          <a
            href="mailto:info@hooshagar.ir"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--lux-text)]"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            info@hooshagar.ir
          </a>
          <span className="inline-flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
            نسخهٔ ۲.۱
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ── صفحهٔ لندینگ ── */
export default function LandingPage(): JSX.Element {
  return (
    <main className="lp-noise lp-aurora relative overflow-hidden" dir="rtl" style={{ background: 'var(--lux-void)' }}>
      <StarfieldCanvas
        density={1.35}
        brightness={1.35}
        className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
      />
      <ScrollProgressBar />
      <FloatingNav />
      <div className="relative z-10">
        <LandingHero />
        <CinematicVideoSection />
        <HooshiarSection />
        <FeaturesSection />
        <RolesSection />
        <StatsSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  )
}
