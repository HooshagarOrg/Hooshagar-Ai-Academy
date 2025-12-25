import { NotificationBell } from '@/components/NotificationBell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header با NotificationBell */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">🎓 هوشاگر</h1>
            <span className="text-sm text-gray-500 hidden sm:inline">
              سیستم هوشمند مدیریت مدارس
            </span>
          </div>
          
          {/* Notification Bell */}
          <NotificationBell />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  )
}

