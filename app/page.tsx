export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-sans text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🌱 هوشاگر
        </h1>
        <p className="text-2xl text-muted-foreground mb-8">
          سیستم عامل هوشمند مدیریت مدارس
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          یک پلتفرم مدیریت مدرسه مبتنی بر هوش مصنوعی که دانش‌آموزان را تحلیل می‌کند،
          معلمان را توانمند می‌سازد و والدین را در جریان نگه می‌دارد.
        </p>

        <div className="mt-12 flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            ورود به سیستم
          </a>
          <a
            href="/register"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors"
          >
            ثبت‌نام
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
          <div className="p-6 border border-border rounded-lg">
            <div className="text-3xl mb-3">🧠</div>
            <h3 className="text-xl font-semibold mb-2">تحلیل هوشمند</h3>
            <p className="text-muted-foreground">
              تحلیل رفتاری و تحصیلی دانش‌آموزان با هوش مصنوعی
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-xl font-semibold mb-2">یادیار هوشمند</h3>
            <p className="text-muted-foreground">
              چت‌بات کمک درسی و حل مسائل با OCR
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <div className="text-3xl mb-3">🎮</div>
            <h3 className="text-xl font-semibold mb-2">باغ استعداد</h3>
            <p className="text-muted-foreground">
              سیستم گیمیفیکیشن و انگیزش دانش‌آموزان
            </p>
          </div>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>استراتژی Gemini First 🚀 | کاهش 80% هزینه AI</p>
        </div>
      </div>
    </main>
  )
}

