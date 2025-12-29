/**
 * صفحه باغ استعدادها (Talent Garden)
 * 
 * نمایش XP، Level، Leaderboard، و Streak برای دانش‌آموز
 */

import { Metadata } from 'next'
import XPCard from '@/components/XPCard'
import LeaderboardCard from '@/components/LeaderboardCard'

export const metadata: Metadata = {
  title: 'باغ استعدادها | هوشاگر',
  description: 'مشاهده امتیازات، سطح، و رتبه‌بندی',
}

export default function TalentGardenPage() {
  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          🌳 باغ استعدادها
        </h1>
        <p className="text-gray-600 text-lg">
          با فعالیت‌های روزانه امتیاز کسب کنید و در رتبه‌بندی بالاتر بروید!
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* XP Card */}
        <XPCard />

        {/* Leaderboard */}
        <LeaderboardCard />
      </div>

      {/* روش‌های کسب XP */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          💡 چطور امتیاز کسب کنم؟
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-semibold text-gray-900">دستیار مطالعه</div>
            <div className="text-sm text-gray-600 mt-1">+10 XP</div>
            <div className="text-xs text-gray-500 mt-2">
              از دستیار هوشمند سوال بپرسید
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-3xl mb-2">🧮</div>
            <div className="font-semibold text-gray-900">حل مسئله</div>
            <div className="text-sm text-gray-600 mt-1">+15 XP</div>
            <div className="text-xs text-gray-500 mt-2">
              با OCR مسئله‌هایتان را حل کنید
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-3xl mb-2">📖</div>
            <div className="font-semibold text-gray-900">ساخت داستان</div>
            <div className="text-sm text-gray-600 mt-1">+20 XP</div>
            <div className="text-xs text-gray-500 mt-2">
              با جادوگر داستان خلاقیت کنید
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-3xl mb-2">🎯</div>
            <div className="font-semibold text-gray-900">تحلیل AI</div>
            <div className="text-sm text-gray-600 mt-1">+25 XP</div>
            <div className="text-xs text-gray-500 mt-2">
              نقاط قوت و ضعفتان را بشناسید
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-3xl mb-2">📝</div>
            <div className="font-semibold text-gray-900">شرکت در آزمون</div>
            <div className="text-sm text-gray-600 mt-1">+5 تا +50 XP</div>
            <div className="text-xs text-gray-500 mt-2">
              بسته به نمره‌ای که می‌گیرید
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-3xl mb-2">🔥</div>
            <div className="font-semibold text-gray-900">ورود روزانه</div>
            <div className="text-sm text-gray-600 mt-1">+10 تا +24 XP</div>
            <div className="text-xs text-gray-500 mt-2">
              هر روز وارد شوید و استریک بسازید
            </div>
          </div>
        </div>
      </div>

      {/* پاداش‌های Level Up */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          🎁 پاداش‌های سطح بعدی
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-4xl mb-2">🪙</div>
            <div className="font-semibold text-gray-900">+10 سکه</div>
            <div className="text-sm text-gray-600 mt-1">
              برای هر سطح جدید
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-4xl mb-2">🏅</div>
            <div className="font-semibold text-gray-900">نشان‌های ویژه</div>
            <div className="text-sm text-gray-600 mt-1">
              در سطوح خاص
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="font-semibold text-gray-900">امتیازات بیشتر</div>
            <div className="text-sm text-gray-600 mt-1">
              سطوح بالاتر = XP بیشتر
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

