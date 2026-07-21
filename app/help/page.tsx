import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Phone, MessageCircle, HelpCircle, Key, Smartphone, AlertCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { MarketingContentCard, MarketingShell } from '@/components/layout/marketing-shell'

export const metadata: Metadata = {
  title: 'راهنما و پشتیبانی | هوشاگر',
  description: 'راهنمای ورود، فعال‌سازی حساب و پشتیبانی هوشاگر',
}

export default function HelpPage() {
  return (
    <MarketingShell backHref="/login" backLabel="بازگشت به ورود">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center sm:text-right">
          <p className="lux-kicker lp-kicker-gold mb-3">پشتیبانی</p>
          <h1 className="lux-h2 mb-2">راهنما و پشتیبانی</h1>
          <p className="lux-body">راهنمای ورود به سیستم و پاسخ به سؤالات متداول</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {[
            {
              icon: Key,
              title: 'فعال‌سازی حساب',
              desc: 'کد فعال‌سازی خود را از مدرسه دریافت کرده‌اید؟',
              href: '/activate',
              label: 'فعال‌سازی حساب کاربری',
            },
            {
              icon: Smartphone,
              title: 'فراموشی رمز عبور',
              desc: 'می‌توانید با استفاده از OTP وارد شوید',
              href: '/login',
              label: 'ورود با کد یکبار مصرف',
              ghost: true,
            },
          ].map((card) => (
            <div key={card.title} className="lp-glass p-6">
              <div className="mb-3 flex items-center gap-2 text-lg font-black text-[var(--lux-text)]">
                <card.icon className="h-5 w-5 text-[var(--lux-gold)]" aria-hidden="true" />
                {card.title}
              </div>
              <p className="mb-4 text-sm text-[var(--lux-text-muted)]">{card.desc}</p>
              <Link
                href={card.href}
                className={card.ghost ? 'lux-btn-ghost w-full' : 'lux-btn-accent w-full'}
              >
                {card.label}
              </Link>
            </div>
          ))}
        </div>

        <MarketingContentCard className="mb-8">
          <div className="mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[var(--lux-primary)]" aria-hidden="true" />
            <h2 className="text-lg font-black text-[var(--lux-text)]">سؤالات متداول</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                id: '1',
                q: 'چگونه حساب کاربری خود را فعال کنم؟',
                a: (
                  <ol className="list-decimal list-inside space-y-2 text-sm leading-7 text-[var(--lux-text-muted)]">
                    <li>کد فعال‌سازی را از مدرسه دریافت کنید</li>
                    <li>به صفحه <Link href="/activate" className="text-[var(--lux-primary)] hover:underline">فعال‌سازی</Link> بروید</li>
                    <li>کد ۱۶ رقمی را وارد کنید و اطلاعات را تکمیل کنید</li>
                  </ol>
                ),
              },
              {
                id: '2',
                q: 'روش‌های مختلف ورود چیست؟',
                a: (
                  <div className="space-y-2 text-sm leading-7 text-[var(--lux-text-muted)]">
                    <p><strong className="text-[var(--lux-text)]">رمز عبور:</strong> کارکنان و والدین</p>
                    <p><strong className="text-[var(--lux-text)]">OTP:</strong> ورود با پیامک</p>
                    <p><strong className="text-[var(--lux-text)]">PIN:</strong> دانش‌آموزان</p>
                  </div>
                ),
              },
              {
                id: '3',
                q: 'OTP را دریافت نمی‌کنم',
                a: (
                  <ul className="list-disc list-inside space-y-1 text-sm leading-7 text-[var(--lux-text-muted)]">
                    <li>شماره موبایل را با ۰۹ بررسی کنید</li>
                    <li>۲ دقیقه صبر کنید</li>
                    <li>فیلتر پیامک گوشی را چک کنید</li>
                  </ul>
                ),
              },
            ].map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-[rgba(232,236,244,0.08)]">
                <AccordionTrigger className="text-right font-bold text-[var(--lux-text)] hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </MarketingContentCard>

        <MarketingContentCard>
          <div className="mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[var(--lux-accent)]" aria-hidden="true" />
            <h2 className="text-lg font-black text-[var(--lux-text)]">تماس با پشتیبانی</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Mail, label: 'ایمیل', value: 'support@hooshagar.ir', href: 'mailto:support@hooshagar.ir' },
              { icon: Phone, label: 'تلفن', value: '021-8888-8888', href: 'tel:02188888888' },
              { icon: MessageCircle, label: 'تلگرام', value: '@hooshagar_support', href: 'https://t.me/hooshagar_support' },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="flex items-start gap-3 rounded-xl border border-[rgba(232,236,244,0.08)] bg-[rgba(15,17,23,0.5)] p-4 transition-colors hover:border-[rgba(139,124,255,0.28)]"
              >
                <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--lux-gold)]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-[var(--lux-text)]">{c.label}</p>
                  <p className="text-xs text-[var(--lux-text-muted)]">{c.value}</p>
                </div>
              </a>
            ))}
          </div>
        </MarketingContentCard>

        <div className="mt-10 text-center">
          <Link href="/login" className="lux-btn-accent inline-flex px-8">
            بازگشت به صفحه ورود
          </Link>
        </div>
      </div>
    </MarketingShell>
  )
}
