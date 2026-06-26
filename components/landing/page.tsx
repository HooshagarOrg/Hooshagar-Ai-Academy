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
  IsometricIslands,
  LearningPathNodes,
  ParentPhone,
  ParticleField,
  ScrollCounter,
  TalentRadar,
} from '@/components/landing/graphics'
import { LandingHero } from '@/components/landing/hero'
import { EASE, FadeUp, StaggerGrid, StaggerItem } from '@/components/landing/motion'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'

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
    <div className="border-b border-[rgba(232,236,244,0.08)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-right text-sm font-black text-[#E8ECF4]"
      >
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronLeft className="h-4 w-4 rotate-[-90deg] text-[#8B95A8]" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-8 text-[#8B95A8]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="overflow-x-hidden bg-[var(--lux-base)]" dir="rtl">
      <LandingHero />

      {/* ۲ — AI Companion */}
      <section id="ai-companion" className="lux-section relative overflow-hidden bg-[#12151C]">
        <ParticleField className="pointer-events-none absolute inset-0 h-full w-full opacity-40" />
        <div className="lux-container relative z-10">
          <FadeUp>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="lux-kicker mb-3 text-[#54D2FF]">همراه یادگیری</p>
                <h2 className="lux-h2">هوشیار — دستیار AI اختصاصی هوشاگر</h2>
                <p className="lux-body mt-4 max-w-lg">
                  زمینه درس و سطح تو را می‌فهمد. توضیح مرحله‌ای، تمرین هوشمند و پیشنهاد سؤال —
                  با شخصیت بصری منحصربه‌فرد.
                </p>
                <ul className="mt-6 space-y-2">
                  {['توضیح با مثال واقعی', 'کمک به تکلیف بدون تقلب', 'سؤال‌های پیشنهادی', 'آماده گفت‌وگوی صوتی'].map(
                    (t) => (
                      <li key={t} className="flex items-center gap-2 text-sm font-bold text-[#E8ECF4]/85">
                        <Sparkles className="h-4 w-4 shrink-0 text-[#FF4DA6]" />
                        {t}
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: EASE }}
              >
                <div
                  className="rounded-[2.5rem] px-10 py-12"
                  style={{
                    background: 'radial-gradient(circle at 50% 30%, rgba(139,124,255,0.22), transparent 65%)',
                  }}
                >
                  <HooshiarMark className="h-36 w-36 sm:h-44 sm:w-44" />
                </div>
                <p className="mt-4 text-center text-sm font-black text-[#E8ECF4]">
                  «امروز از کجا شروع کنیم؟»
                </p>
              </motion.div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ۳ — Talent */}
      <section id="talent" className="lux-section bg-[#0F1117]">
        <div className="lux-container">
          <FadeUp>
            <p className="lux-kicker mb-3">کشف استعداد</p>
            <h2 className="lux-h2">استعداد واقعی را ببین، نه فقط نمره</h2>
            <p className="lux-body mt-3 max-w-2xl">رادار چندبعدی و تفسیر AI برای دانش‌آموز و خانواده.</p>
          </FadeUp>
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[260px_1fr]">
            <FadeUp delay={0.08}>
              <TalentRadar className="mx-auto h-56 w-56" />
            </FadeUp>
            <StaggerGrid className="grid gap-4 sm:grid-cols-3">
              {TALENT_CARDS.map(({ icon: Icon, title, text }) => (
                <StaggerItem key={title}>
                  <div className="lux-card h-full p-5">
                    <Icon className="mb-3 h-6 w-6 text-[#8B7CFF]" />
                    <h3 className="mb-2 text-base font-black text-[#E8ECF4]">{title}</h3>
                    <p className="text-sm leading-7 text-[#8B95A8]">{text}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </div>
      </section>

      {/* ۴ — Personalized Learning */}
      <section className="lux-section bg-[#161B26]">
        <div className="lux-container">
          <FadeUp>
            <p className="lux-kicker mb-3 text-[#54D2FF]">یادگیری شخصی</p>
            <h2 className="lux-h2">مسیر امروز، مخصوص تو</h2>
          </FadeUp>
          <StaggerGrid className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Zap, label: 'امتیاز XP', val: '۱٬۲۴۰', c: '#FFB347' },
              { icon: Flame, label: 'استریک', val: '۷ روز', c: '#FF4DA6' },
              { icon: Award, label: 'نشان', val: 'کاوشگر', c: '#39D98A' },
            ].map(({ icon: Icon, label, val, c }) => (
              <StaggerItem key={label}>
                <div className="lux-card-lit p-6 text-center">
                  <Icon className="mx-auto mb-3 h-8 w-8" style={{ color: c }} />
                  <p className="text-2xl font-black text-[#E8ECF4]">{val}</p>
                  <p className="mt-1 text-xs font-bold text-[#8B95A8]">{label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
          <FadeUp delay={0.12} className="mt-8">
            <div className="lux-card-lit p-6">
              <LearningPathNodes />
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(232,236,244,0.08)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: '68%',
                    background: 'linear-gradient(90deg, #8B7CFF, #54D2FF)',
                  }}
                />
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ۵ — Learning Journey */}
      <section id="journey" className="lux-section bg-[#0B0D12]">
        <div className="lux-container">
          <FadeUp>
            <p className="lux-kicker mb-3">سفر یادگیری</p>
            <h2 className="lux-h2">جزیره به جزیره — یک ماجراجویی آموزشی</h2>
          </FadeUp>
          <FadeUp delay={0.1} className="relative mt-8">
            <IsometricIslands />
          </FadeUp>
        </div>
      </section>

      {/* ۶ — Dashboard */}
      <section className="lux-section bg-[#0F1117]">
        <div className="lux-container">
          <FadeUp>
            <p className="lux-kicker mb-3">داشبورد</p>
            <h2 className="lux-h2">سیستم‌عامل یادگیری، نه پنل مدرسه</h2>
            <p className="lux-body mt-3 max-w-xl">مسیر، AI، استعداد و پیشرفت — در یک تجربه زنده.</p>
          </FadeUp>
          <FadeUp delay={0.1} className="mt-10">
            <DashboardMock className="mx-auto max-w-4xl" />
          </FadeUp>
        </div>
      </section>

      {/* ۷ — Parent */}
      <section className="lux-section bg-[#12151C]">
        <div className="lux-container grid items-center gap-10 lg:grid-cols-2">
          <FadeUp>
            <p className="lux-kicker mb-3 text-[#F59E0B]">تجربه والدین</p>
            <h2 className="lux-h2">رشد فرزندت را ببین</h2>
            <p className="lux-body mt-4">
              گزارش هفتگی، هشدار هوشمند و بینش AI — بدون پیچیدگی سامانه‌های قدیمی.
            </p>
            <ul className="mt-5 space-y-2">
              {['گزارش استعداد و پیشرفت', 'حضور و ارتباط با مدرسه', 'پیشنهاد گفت‌وگو با فرزند'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm font-bold text-[#E8ECF4]">
                  <HeartHandshake className="h-4 w-4 text-[#F59E0B]" />
                  {t}
                </li>
              ))}
            </ul>
          </FadeUp>
          <FadeUp delay={0.1}>
            <ParentPhone />
          </FadeUp>
        </div>
      </section>

      {/* ۸ — School */}
      <section className="lux-section bg-[#161B26] text-center">
        <div className="lux-container">
          <FadeUp>
            <p className="lux-kicker mb-3 text-[#54D2FF]">مدارس</p>
            <h2 className="lux-h2">مقیاس مدرسه، بینش واقعی</h2>
          </FadeUp>
          <StaggerGrid className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'مدرسه فعال', v: 120, s: '+' },
              { label: 'معلم', v: 2400, s: '+' },
              { label: 'دانش‌آموز', v: 48000, s: '+' },
              { label: 'رضایت', v: 98, s: '٪' },
            ].map(({ label, v, s }) => (
              <StaggerItem key={label}>
                <div className="lux-card-lit p-8">
                  <Building2 className="mx-auto mb-4 h-8 w-8 text-[#54D2FF]" />
                  <p className="text-3xl font-black text-[#E8ECF4] sm:text-4xl">
                    <ScrollCounter value={v} suffix={s} />
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#8B95A8]">{label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ۹ — Testimonials */}
      <section className="lux-section bg-[#0F1117]">
        <div className="lux-container">
          <FadeUp>
            <p className="lux-kicker mb-3">نظر کاربران</p>
            <h2 className="lux-h2 mb-8">صدای خانواده‌ها و مدارس</h2>
          </FadeUp>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible">
            {TESTIMONIALS.map((t) => (
              <div key={t.n} className="lux-card min-w-[280px] shrink-0 snap-start p-5 lg:min-w-0">
                <Quote className="mb-3 h-5 w-5 text-[#8B7CFF]/50" />
                <p className="text-sm leading-8 text-[#E8ECF4]">{t.q}</p>
                <p className="mt-4 text-sm font-black text-[#E8ECF4]">{t.n}</p>
                <p className="text-xs text-[#8B95A8]">{t.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ۱۰ — FAQ */}
      <section id="faq" className="lux-section bg-[#12151C]">
        <div className="lux-container max-w-3xl">
          <FadeUp>
            <p className="lux-kicker mb-3">سوالات</p>
            <h2 className="lux-h2 mb-8">پرسش‌های پرتکرار</h2>
          </FadeUp>
          <FadeUp delay={0.08}>
            {FAQ.map((item) => (
              <FaqRow key={item.q} q={item.q} a={item.a} />
            ))}
          </FadeUp>
        </div>
      </section>

      {/* ۱۱ — CTA */}
      <section
        className="lux-section"
        style={{ background: 'linear-gradient(180deg, #0B0D12 0%, #161B26 100%)' }}
      >
        <div className="lux-container text-center">
          <FadeUp>
            <h2 className="lux-h2 mx-auto max-w-3xl">نسل جدید یادگیری را با هوشاگر شروع کنید</h2>
            <p className="lux-body mx-auto mt-4 max-w-lg">
              برای دانش‌آموز الهام‌بخش، برای خانواده شفاف، برای مدرسه عملی.
            </p>
            <Link href="/register" className="lux-btn-accent mt-8 inline-flex">
              شروع رایگان
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </FadeUp>
          <footer className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-[rgba(232,236,244,0.08)] pt-10 sm:flex-row">
            <HooshagarLogo size="sm" href="/" surface="void" showWordmark inverted />
            <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-[#8B95A8]">
              <Link href="/privacy" className="hover:text-[#E8ECF4]">حریم خصوصی</Link>
              <Link href="/terms" className="hover:text-[#E8ECF4]">قوانین</Link>
              <Link href="/help" className="hover:text-[#E8ECF4]">راهنما</Link>
              <Link href="/login" className="hover:text-[#E8ECF4]">ورود</Link>
            </div>
            <p className="text-xs text-[#8B95A8]">© {new Date().getFullYear()} هوشاگر</p>
          </footer>
        </div>
      </section>
    </main>
  )
}
