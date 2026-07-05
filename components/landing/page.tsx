'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award,
  Brain,
  Building2,
  ChevronLeft,
  Flame,
  HeartHandshake,
  Quote,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  DashboardMock,
  HooshiarMark,
  LearningPathNodes,
  ParentPhone,
  ParticleField,
  ScrollCounter,
  TalentRadar,
} from '@/components/landing/graphics'
import { FloatingNav } from '@/components/landing/floating-nav'
import { LandingHero } from '@/components/landing/hero'
import { JourneySection } from '@/components/landing/journey-section'
import {
  MagneticButton,
  ScrubProgress,
  SectionReveal,
  StaggerItem,
  StaggerReveal,
  TextReveal,
  TiltCard,
  ScrollProgressBar,
} from '@/components/landing/gsap'
import { EASE } from '@/components/landing/motion'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { useRef } from 'react'

const TALENT_CARDS = [
  { icon: Target, title: 'رادار چندبعدی', text: 'منطق، خلاقیت، زبان و مهارت اجتماعی در یک نگاه.' },
  { icon: TrendingUp, title: 'روند واقعی', text: 'رشد در طول زمان — نه فقط نمره پایان ترم.' },
  { icon: Brain, title: 'تفسیر هوشمند', text: 'هوشاگر الگوها را به زبان ساده توضیح می‌دهد.' },
]

const TESTIMONIALS = [
  {
    q: 'پسرم دیگر مدرسه را مثل یک بازی می‌بیند. هر روز می‌پرسد امروز چه مسیری داریم.',
    n: 'مریم رضایی',
    r: 'والدین — تهران',
  },
  {
    q: 'تحلیل کلاس با AI کمک کرد زودتر به دانش‌آموزان نیازمند توجه برسم.',
    n: 'امیر حسینی',
    r: 'معلم علوم — اصفهان',
  },
  {
    q: 'گزارش استعداد دخترم اولین‌بار نشان داد کجا قوی است و کجا نیاز به حمایت دارد.',
    n: 'زهرا کاظمی',
    r: 'والدین — شیراز',
  },
]

const FAQ = [
  {
    q: 'هوشاگر با سامانه‌های مدرسه‌ای چه فرقی دارد؟',
    a: 'تمرکز روی یادگیری شخصی، کشف استعداد و همراه AI است — نه فقط ثبت نمره و حضور.',
  },
  {
    q: 'برای چه سنی مناسب است؟',
    a: 'از ۶ تا ۱۸ سال با رابط ساده، تصویری و کاملاً فارسی طراحی شده است.',
  },
  {
    q: 'والدین چه گزارش‌هایی می‌بینند؟',
    a: 'رشد تحصیلی، استعداد، استریک یادگیری و پیشنهاد گفت‌وگو با فرزند.',
  },
  {
    q: 'آیا برای مدارس هم مناسب است؟',
    a: 'بله. ثبت‌نام انبوه، مدیریت نقش‌ها و گزارش‌های تحلیلی در مقیاس مدرسه.',
  },
  {
    q: 'هوشیار چه کاری می‌کند؟',
    a: 'مفاهیم را مرحله‌ای توضیح می‌دهد، تمرین پیشنهاد می‌کند و در تکلیف راهنمایی می‌کند.',
  },
  {
    q: 'امنیت داده‌ها چطور است؟',
    a: 'احراز هویت نقش‌محور، RLS در پایگاه داده و رمزنگاری استاندارد.',
  },
]

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border-b border-[rgba(232,236,244,0.08)] transition-colors"
      style={{
        borderImage: open
          ? 'linear-gradient(270deg, var(--lux-gold), var(--lux-primary)) 1'
          : undefined,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between py-5 text-right text-sm font-black text-[var(--lux-text)]"
      >
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: EASE }}>
          <ChevronLeft className="h-4 w-4 rotate-[-90deg] text-[var(--lux-text-muted)]" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-8 text-[var(--lux-text-muted)]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LandingPage() {
  const progressSectionRef = useRef<HTMLElement>(null)

  return (
    <main className="lux-noise overflow-x-hidden bg-[var(--lux-base)]" dir="rtl">
      <ScrollProgressBar />
      <FloatingNav />
      <LandingHero />

      {/* ۲ — AI Companion */}
      <section
        id="ai-companion"
        className="lux-section lux-section-depth relative overflow-hidden bg-[var(--lux-depth-1)]"
      >
        <ParticleField className="pointer-events-none absolute inset-0 h-full w-full opacity-50" />
        <div className="lux-container relative z-10">
          <SectionReveal>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="lux-kicker mb-3 text-[var(--lux-secondary)]">همراه یادگیری</p>
                <TextReveal as="h2" className="lux-h2">
                  هوشیار — دستیار AI اختصاصی هوشاگر
                </TextReveal>
                <p className="lux-body mt-4 max-w-lg">
                  زمینه درس و سطح تو را می‌فهمد. توضیح مرحله‌ای، تمرین هوشمند و پیشنهاد سؤال —
                  با شخصیت بصری منحصربه‌فرد.
                </p>
                <StaggerReveal className="mt-6 space-y-3">
                  {['توضیح با مثال واقعی', 'کمک به تکلیف بدون تقلب', 'سؤال‌های پیشنهادی', 'آماده گفت‌وگوی صوتی'].map(
                    (t) => (
                      <StaggerItem key={t}>
                        <li className="flex list-none items-center gap-2 text-sm font-bold text-[var(--lux-text)]/90">
                          <Sparkles className="h-4 w-4 shrink-0 text-[var(--lux-accent)]" />
                          {t}
                        </li>
                      </StaggerItem>
                    ),
                  )}
                </StaggerReveal>
              </div>
              <div className="flex flex-col items-center">
                <div className="lux-glass-deep rounded-[2.5rem] px-10 py-12">
                  <HooshiarMark className="h-36 w-36 sm:h-44 sm:w-44" />
                </div>
                <p className="mt-5 text-center text-sm font-black text-[var(--lux-text)]">
                  «امروز از کجا شروع کنیم؟»
                </p>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ۳ — Talent */}
      <section id="talent" className="lux-section bg-[var(--lux-base)]">
        <div className="lux-container">
          <SectionReveal>
            <p className="lux-kicker mb-3">کشف استعداد</p>
            <TextReveal as="h2" className="lux-h2">
              استعداد واقعی را ببین، نه فقط نمره
            </TextReveal>
            <p className="lux-body mt-3 max-w-2xl">رادار چندبعدی و تفسیر AI برای دانش‌آموز و خانواده.</p>
          </SectionReveal>
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[260px_1fr]">
            <SectionReveal delay={0.08}>
              <TalentRadar className="mx-auto h-56 w-56 drop-shadow-[0_0_40px_var(--lux-glow-primary)]" />
            </SectionReveal>
            <StaggerReveal className="grid gap-4 sm:grid-cols-3">
              {TALENT_CARDS.map(({ icon: Icon, title, text }) => (
                <StaggerItem key={title}>
                  <TiltCard className="lux-gradient-border-gold h-full rounded-3xl p-5">
                    <Icon className="mb-3 h-6 w-6 text-[var(--lux-primary)]" />
                    <h3 className="mb-2 text-base font-black text-[var(--lux-text)]">{title}</h3>
                    <p className="text-sm leading-7 text-[var(--lux-text-muted)]">{text}</p>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </div>
        </div>
      </section>

      {/* ۴ — Personalized Learning */}
      <section ref={progressSectionRef} className="lux-section bg-[var(--lux-depth-2)]">
        <div className="lux-container">
          <SectionReveal>
            <p className="lux-kicker mb-3 text-[var(--lux-secondary)]">یادگیری شخصی</p>
            <TextReveal as="h2" className="lux-h2">
              مسیر امروز، مخصوص تو
            </TextReveal>
          </SectionReveal>
          <StaggerReveal className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Zap, label: 'امتیاز XP', val: '۱٬۲۴۰', c: 'var(--lux-gold)' },
              { icon: Flame, label: 'استریک', val: '۷ روز', c: 'var(--lux-accent)' },
              { icon: Award, label: 'نشان', val: 'کاوشگر', c: 'var(--lux-success)' },
            ].map(({ icon: Icon, label, val, c }) => (
              <StaggerItem key={label}>
                <TiltCard className="lux-glass-deep p-6 text-center">
                  <Icon className="mx-auto mb-3 h-8 w-8" style={{ color: c }} />
                  <p className="text-2xl font-black text-[var(--lux-text)]">{val}</p>
                  <p className="mt-1 text-xs font-bold text-[var(--lux-text-muted)]">{label}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerReveal>
          <SectionReveal delay={0.12} className="mt-8">
            <div className="lux-glass-deep p-6">
              <LearningPathNodes />
              <ScrubProgress triggerRef={progressSectionRef} className="mt-4" />
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ۵ — Learning Journey (pinned 3D) */}
      <JourneySection />

      {/* ۶ — Dashboard */}
      <section className="lux-section bg-[var(--lux-base)]">
        <div className="lux-container">
          <SectionReveal>
            <p className="lux-kicker mb-3">داشبورد</p>
            <TextReveal as="h2" className="lux-h2">
              سیستم‌عامل یادگیری، نه پنل مدرسه
            </TextReveal>
            <p className="lux-body mt-3 max-w-xl">مسیر، AI، استعداد و پیشرفت — در یک تجربه زنده.</p>
          </SectionReveal>
          <SectionReveal delay={0.1} className="mt-10">
            <DashboardMock className="mx-auto max-w-4xl" />
          </SectionReveal>
        </div>
      </section>

      {/* ۷ — Parent */}
      <section className="lux-section lux-section-depth bg-[var(--lux-depth-1)]">
        <div className="lux-container grid items-center gap-10 lg:grid-cols-2">
          <SectionReveal>
            <p className="lux-kicker lux-kicker-gold mb-3">تجربه والدین</p>
            <TextReveal as="h2" className="lux-h2">
              رشد فرزندت را ببین
            </TextReveal>
            <p className="lux-body mt-4">
              گزارش هفتگی، هشدار هوشمند و بینش AI — بدون پیچیدگی سامانه‌های قدیمی.
            </p>
            <StaggerReveal className="mt-5 space-y-2">
              {['گزارش استعداد و پیشرفت', 'حضور و ارتباط با مدرسه', 'پیشنهاد گفت‌وگو با فرزند'].map((t) => (
                <StaggerItem key={t}>
                  <li className="flex list-none items-center gap-2 text-sm font-bold text-[var(--lux-text)]">
                    <HeartHandshake className="h-4 w-4 text-[var(--lux-gold)]" />
                    {t}
                  </li>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <ParentPhone />
          </SectionReveal>
        </div>
      </section>

      {/* ۸ — School */}
      <section className="lux-section bg-[var(--lux-depth-2)] text-center">
        <div className="lux-container">
          <SectionReveal>
            <p className="lux-kicker mb-3 text-[var(--lux-secondary)]">مدارس</p>
            <TextReveal as="h2" className="lux-h2">
              مقیاس مدرسه، بینش واقعی
            </TextReveal>
          </SectionReveal>
          <StaggerReveal className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'مدرسه فعال', v: 120, s: '+' },
              { label: 'معلم', v: 2400, s: '+' },
              { label: 'دانش‌آموز', v: 48000, s: '+' },
              { label: 'رضایت', v: 98, s: '٪' },
            ].map(({ label, v, s }) => (
              <StaggerItem key={label}>
                <TiltCard className="lux-glass-deep p-8">
                  <Building2 className="mx-auto mb-4 h-8 w-8 text-[var(--lux-secondary)]" />
                  <p className="text-3xl font-black sm:text-4xl">
                    <ScrollCounter value={v} suffix={s} />
                  </p>
                  <p className="mt-2 text-sm font-bold text-[var(--lux-text-muted)]">{label}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ۹ — Testimonials */}
      <section className="lux-section bg-[var(--lux-base)]">
        <div className="lux-container">
          <SectionReveal>
            <p className="lux-kicker mb-3">نظر کاربران</p>
            <TextReveal as="h2" className="lux-h2 mb-8">
              صدای خانواده‌ها و مدارس
            </TextReveal>
          </SectionReveal>
          <StaggerReveal className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible">
            {TESTIMONIALS.map((t) => (
              <StaggerItem key={t.n}>
                <TiltCard className="lux-glass-deep min-w-[280px] shrink-0 snap-start p-6 lg:min-w-0">
                  <Quote className="mb-3 h-5 w-5 text-[var(--lux-gold)]/70" />
                  <p className="text-sm leading-8 text-[var(--lux-text)]">{t.q}</p>
                  <p className="mt-4 text-sm font-black text-[var(--lux-text)]">{t.n}</p>
                  <p className="text-xs text-[var(--lux-text-muted)]">{t.r}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ۱۰ — FAQ */}
      <section id="faq" className="lux-section bg-[var(--lux-depth-1)]">
        <div className="lux-container max-w-3xl">
          <SectionReveal>
            <p className="lux-kicker mb-3">سوالات</p>
            <TextReveal as="h2" className="lux-h2 mb-8">
              پرسش‌های پرتکرار
            </TextReveal>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            {FAQ.map((item) => (
              <FaqRow key={item.q} q={item.q} a={item.a} />
            ))}
          </SectionReveal>
        </div>
      </section>

      {/* ۱۱ — CTA */}
      <section className="lux-section lux-aurora-bg" style={{ background: 'linear-gradient(180deg, var(--lux-void) 0%, var(--lux-depth-2) 100%)' }}>
        <div className="lux-container relative z-10 text-center">
          <SectionReveal>
            <TextReveal as="h2" className="lux-h2 mx-auto max-w-3xl">
              نسل جدید یادگیری را با هوشاگر شروع کنید
            </TextReveal>
            <p className="lux-body mx-auto mt-4 max-w-lg">
              برای دانش‌آموز الهام‌بخش، برای خانواده شفاف، برای مدرسه عملی.
            </p>
            <MagneticButton href="/register" className="lux-btn-accent mt-8 shadow-[0_0_48px_var(--lux-glow-accent)]">
              شروع رایگان
              <ChevronLeft className="h-4 w-4" />
            </MagneticButton>
          </SectionReveal>
          <footer className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-[rgba(201,169,98,0.15)] pt-10 sm:flex-row">
            <HooshagarLogo size="sm" href="/" surface="void" showWordmark inverted />
            <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-[var(--lux-text-muted)]">
              <Link href="/privacy" className="transition-colors hover:text-[var(--lux-text)]">حریم خصوصی</Link>
              <Link href="/terms" className="transition-colors hover:text-[var(--lux-text)]">قوانین</Link>
              <Link href="/help" className="transition-colors hover:text-[var(--lux-text)]">راهنما</Link>
              <Link href="/login" className="transition-colors hover:text-[var(--lux-text)]">ورود</Link>
            </div>
            <p className="text-xs text-[var(--lux-text-muted)]">© {new Date().getFullYear()} هوشاگر</p>
          </footer>
        </div>
      </section>
    </main>
  )
}
