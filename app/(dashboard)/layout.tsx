import PersianDate from '@/components/PersianDate'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Persian Date Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <PersianDate className="text-gray-700" showIcon={true} />
          <div className="text-sm text-gray-500">
            سیستم هوشاگر
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      {children}
    </div>
  )
}

