export default function TestStudents() {
  return (
    <div className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-600">
          ✅ صفحه تست دانش‌آموزان
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">وضعیت:</h2>
          <p className="text-green-600 text-lg">
            🎉 این صفحه بدون redirect باز شد!
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">قابلیت‌های آینده:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>📋 لیست دانش‌آموزان</li>
            <li>➕ افزودن دانش‌آموز</li>
            <li>✏️ ویرایش دانش‌آموز</li>
            <li>🗑️ حذف دانش‌آموز</li>
            <li>📊 نمایش نمرات</li>
            <li>🤖 تحلیل AI</li>
          </ul>
        </div>
        
        <div className="mt-6">
          <a href="/test-session" className="text-blue-500 underline">
            ← بازگشت به تست session
          </a>
        </div>
      </div>
    </div>
  )
}


































