import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MessageCircle, HelpCircle, Key, Smartphone, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          بازگشت به ورود
        </Link>
        
        <h1 className="text-4xl font-bold mb-2">راهنما و پشتیبانی</h1>
        <p className="text-muted-foreground text-lg">
          راهنمای ورود به سیستم و پاسخ به سؤالات متداول
        </p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="w-5 h-5 text-primary" />
              فعال‌سازی حساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              کد فعال‌سازی خود را از مدرسه دریافت کرده‌اید؟
            </p>
            <Button asChild className="w-full">
              <Link href="/activate">
                فعال‌سازی حساب کاربری
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5 text-primary" />
              فراموشی رمز عبور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              می‌توانید با استفاده از OTP وارد شوید
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                ورود با کد یکبار مصرف
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            سؤالات متداول
          </CardTitle>
          <CardDescription>
            پاسخ به رایج‌ترین سؤالات کاربران
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-right">
                چگونه حساب کاربری خود را فعال کنم؟
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                <ol className="list-decimal list-inside space-y-2">
                  <li>کد فعال‌سازی خود را از مدرسه دریافت کنید (کارت کاغذی یا پیامک)</li>
                  <li>به صفحه <Link href="/activate" className="text-primary hover:underline">فعال‌سازی حساب</Link> بروید</li>
                  <li>کد 16 رقمی را وارد کنید</li>
                  <li>اطلاعات شخصی خود را تکمیل کنید</li>
                  <li>شماره موبایل را با کد OTP تأیید کنید</li>
                  <li>رمز عبور خود را تنظیم کنید</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-right">
                روش‌های مختلف ورود به سیستم چیست؟
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
                <div>
                  <strong className="text-foreground">۱. ورود با رمز عبور:</strong>
                  <p>برای معلمان، والدین، و کارکنان - با ایمیل و رمز عبور</p>
                </div>
                <div>
                  <strong className="text-foreground">۲. ورود با OTP:</strong>
                  <p>برای همه کاربران - دریافت کد یکبار مصرف از طریق پیامک</p>
                </div>
                <div>
                  <strong className="text-foreground">۳. ورود دانش‌آموز:</strong>
                  <p>برای دانش‌آموزان - با کد دانش‌آموزی و PIN چهار رقمی</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-right">
                کد فعال‌سازی خود را گم کرده‌ام. چه کار کنم؟
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                با دفتر مدرسه تماس بگیرید تا کد جدیدی برای شما صادر کنند. می‌توانید از طریق شماره تماس یا ایمیل پشتیبانی در زیر درخواست دهید.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-right">
                رمز عبور خود را فراموش کرده‌ام
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                دو راه حل دارید:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>از روش <strong>ورود با OTP</strong> استفاده کنید (بدون نیاز به رمز عبور)</li>
                  <li>با پشتیبانی مدرسه تماس بگیرید تا رمز عبور شما بازنشانی شود</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-right">
                کد دانش‌آموزی من کجاست؟
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                کد دانش‌آموزی در کارت فعال‌سازی شما نوشته شده است. به صورت <code className="bg-muted px-2 py-1 rounded">STU-12345678</code> است. همچنین می‌توانید از والدین خود بخواهید که این کد را از پنل والدین دریافت کنند.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-right">
                چرا نمی‌توانم وارد شوم؟
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                <p className="mb-2">موارد زیر را بررسی کنید:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>آیا حساب خود را فعال کرده‌اید؟</li>
                  <li>آیا ایمیل/شماره موبایل را درست وارد کرده‌اید؟</li>
                  <li>آیا حساب شما توسط مدرسه فعال است؟</li>
                  <li>آیا از روش ورود مناسب استفاده می‌کنید؟</li>
                </ul>
                <p className="mt-3">اگر مشکل ادامه داشت، با پشتیبانی تماس بگیرید.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-right">
                OTP را دریافت نمی‌کنم
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                <p className="mb-2">مراحل زیر را امتحان کنید:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>شماره موبایل را دوباره چک کنید (باید با ۰۹ شروع شود)</li>
                  <li>چند دقیقه صبر کنید (ارسال پیامک ممکن است تا 2 دقیقه طول بکشد)</li>
                  <li>فیلترهای پیامکی گوشی را بررسی کنید</li>
                  <li>سیگنال شبکه موبایل خود را چک کنید</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            هنوز به کمک نیاز دارید؟
          </CardTitle>
          <CardDescription>
            تیم پشتیبانی ما آماده کمک به شما است
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium mb-1">ایمیل</p>
                <a
                  href="mailto:support@hooshagar.com"
                  className="text-sm text-muted-foreground hover:text-primary break-all"
                >
                  support@hooshagar.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">تلفن</p>
                <a
                  href="tel:02188888888"
                  className="text-sm text-muted-foreground hover:text-primary"
                  dir="ltr"
                >
                  021-8888-8888
                </a>
                <p className="text-xs text-muted-foreground mt-1">
                  شنبه تا پنجشنبه، ۸ الی ۱۴
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <MessageCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">تلگرام</p>
                <a
                  href="https://t.me/hooshagar_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  @hooshagar_support
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">نکته:</strong> هنگام تماس با پشتیبانی، لطفاً شماره موبایل یا ایمیل ثبت‌شده خود را در اختیار ما قرار دهید تا بتوانیم سریع‌تر به شما کمک کنیم.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Back to Login */}
      <div className="mt-8 text-center">
        <Button asChild size="lg">
          <Link href="/login">
            بازگشت به صفحه ورود
          </Link>
        </Button>
      </div>
    </div>
  )
}

