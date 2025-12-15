import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ورود و ثبت‌نام | هوشاگر',
  description: 'ورود به سیستم مدیریت هوشمند مدارس',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {/* لوگو یا عنوان */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            🌱 هوشاگر
          </h1>
          <p className="text-muted-foreground">
            سیستم مدیریت هوشمند مدارس
          </p>
        </div>

        {/* محتوای صفحات login/register */}
        {children}
      </div>
    </div>
  )
}



































































