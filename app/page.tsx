import Link from 'next/link'
import { ArrowLeft, Brain, BookOpen, Sparkles, GraduationCap, Users, TrendingUp, Shield, Zap, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:75px_75px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-4 pt-20 pb-32 md:pt-32 md:pb-40">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">نسل جدید مدیریت آموزشی</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-l from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                هوشاگر
              </span>
        </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium">
          سیستم عامل هوشمند مدیریت مدارس
        </p>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              پلتفرم یکپارچه‌ای که با قدرت هوش مصنوعی، دانش‌آموزان را تحلیل می‌کند،
              معلمان را توانمند می‌سازد و والدین را در مسیر رشد فرزندانشان همراهی می‌کند
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-base px-8 h-12 group">
                <Link href="/login">
            ورود به سیستم
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button asChild size="lg" variant="outline" className="text-base px-8 h-12">
                <Link href="/activate">
                  فعال‌سازی حساب کاربری
                </Link>
              </Button>
        </div>

            {/* Trust Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>امن • سریع • هوشمند</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              قابلیت‌های هوشمند
            </h2>
            <p className="text-muted-foreground text-lg">
              همه‌چیز آنچه برای مدیریت مدرسه نوین نیاز دارید
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">تحلیلگر هوشمند</h3>
                <p className="text-muted-foreground leading-relaxed">
                  تحلیل رفتاری و تحصیلی دانش‌آموزان با هوش مصنوعی پیشرفته و ارائه گزارش‌های جامع
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">یادیار هوشمند</h3>
                <p className="text-muted-foreground leading-relaxed">
                  دستیار درسی مبتنی بر AI با قابلیت حل مسائل، OCR تصاویر و پاسخگویی فوری
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">قطب‌نمای آینده</h3>
                <p className="text-muted-foreground leading-relaxed">
                  راهنمایی تحصیلی و شغلی با استفاده از تحلیل استعدادها و علایق دانش‌آموزان
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">باغ استعداد</h3>
                <p className="text-muted-foreground leading-relaxed">
                  سیستم گیمیفیکیشن و انگیزش‌بخشی برای افزایش تعامل و انگیزه دانش‌آموزان
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">پنل والدین</h3>
                <p className="text-muted-foreground leading-relaxed">
                  دسترسی آسان والدین به عملکرد، گزارش‌ها و اطلاعیه‌های مربوط به فرزندانشان
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">تحلیل پیشرفت</h3>
                <p className="text-muted-foreground leading-relaxed">
                  نمودارها و گزارش‌های تحلیلی جامع برای پیگیری پیشرفت تحصیلی
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">هوش مصنوعی</div>
              <p className="text-muted-foreground text-sm">پیشرفته</p>
            </div>
            
            <div>
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">امنیت</div>
              <p className="text-muted-foreground text-sm">بانک‌محور</p>
            </div>
            
            <div>
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">چند نقشی</div>
              <p className="text-muted-foreground text-sm">کاملاً یکپارچه</p>
          </div>

            <div>
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">کاربرپسند</div>
              <p className="text-muted-foreground text-sm">طراحی مدرن</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-l from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            آماده شروع هستید؟
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            کد فعال‌سازی خود را از مدرسه دریافت کرده‌اید؟ همین حالا حساب خود را فعال کنید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base px-8 h-12">
              <Link href="/activate">
                فعال‌سازی حساب
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 h-12">
              <Link href="/help">
                راهنما و پشتیبانی
              </Link>
            </Button>
        </div>
      </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} هوشاگر. تمامی حقوق محفوظ است.</p>
        </div>
      </footer>
    </main>
  )
}

