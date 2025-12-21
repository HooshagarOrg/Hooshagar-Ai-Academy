'use client'

import Link from 'next/link'
import { ArrowRight, Shield, Info, AlertCircle, Lock, Users } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>بازگشت به ورود</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            شرایط استفاده و حریم خصوصی
          </h1>
          <p className="text-lg text-gray-600">
            پلتفرم هوشاگر | سامانه مدیریت آموزشی هوشمند
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {/* ماهیت خدمات */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">۱. ماهیت خدمات</h2>
                <p className="text-gray-700 leading-relaxed">
                  پلتفرم <strong>هوشاگر</strong> یک سامانه مدیریت آموزشی مبتنی بر هوش مصنوعی است. 
                  خروجی‌های تولیدشده توسط هوش مصنوعی (شامل تحلیل‌ها، پیشنهادات، حل مسائل و محتوای آموزشی) 
                  صرفاً جنبه کمکی و پیشنهادی دارند و <strong className="text-amber-600">جایگزین قضاوت حرفه‌ای 
                  معلمان و مدیران آموزشی نیستند</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* صحت اطلاعات */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">۲. صحت اطلاعات</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    هوش مصنوعی ممکن است در موارد خاص <strong className="text-amber-600">اطلاعات نادرست 
                    یا ناقص</strong> ارائه دهد. مسئولیت بررسی و تأیید نهایی هرگونه خروجی بر عهده کاربر است.
                  </p>
                  <p>
                    هوشاگر هیچ‌گونه تضمینی در خصوص صحت، کامل بودن یا مناسب بودن خروجی‌های هوش مصنوعی 
                    برای اهداف خاص ارائه نمی‌دهد.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* حفظ حریم خصوصی */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">۳. حفظ حریم خصوصی و داده‌ها</h2>
                <ul className="space-y-3 text-gray-700 leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span>
                      اطلاعات شخصی دانش‌آموزان، اولیا و کارکنان مطابق با قوانین 
                      <strong> جمهوری اسلامی ایران</strong> محافظت می‌شود.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span>
                      داده‌ها در <strong>سرورهای امن</strong> ذخیره شده و بدون رضایت صریح، 
                      در اختیار اشخاص ثالث قرار نمی‌گیرند.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span>
                      برخی داده‌های ناشناس‌سازی‌شده ممکن است برای بهبود عملکرد سیستم استفاده شوند.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span>
                      هر مدرسه تنها به داده‌های مربوط به خود دسترسی دارد.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span>
                      برای هر دانش‌آموز <strong>فقط والدین</strong> و یا کسی که حضانت بر عهده ایشان است 
                      اجازه استفاده از برنامه را دارد و این شامل <strong className="text-blue-600">حداکثر ۲ نفر</strong> می‌باشد.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* مسئولیت کاربر */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">۴. مسئولیت کاربر</h2>
                <ul className="space-y-3 text-gray-700 leading-relaxed list-disc list-inside">
                  <li>حفظ محرمانگی اطلاعات ورود بر عهده کاربر است.</li>
                  <li>استفاده از پلتفرم برای اهداف غیرقانونی یا مغایر با شئونات آموزشی ممنوع است.</li>
                  <li>مسئولیت صحت اطلاعات واردشده توسط کاربر، با خود اوست.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* محدودیت مسئولیت */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">۵. محدودیت مسئولیت</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  هوشاگر در قبال خسارات مستقیم یا غیرمستقیم ناشی از موارد زیر مسئولیتی ندارد:
                </p>
                <ul className="space-y-2 text-gray-700 leading-relaxed list-disc list-inside">
                  <li>تصمیم‌گیری بر اساس خروجی‌های هوش مصنوعی</li>
                  <li>قطعی یا اختلال موقت در سرویس</li>
                  <li>از دست رفتن داده‌ها به دلایل خارج از کنترل</li>
                </ul>
              </div>
            </div>
          </div>

          {/* مالکیت معنوی */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">۶. مالکیت معنوی</h2>
                <p className="text-gray-700 leading-relaxed">
                  کلیه حقوق مادی و معنوی پلتفرم هوشاگر محفوظ است. محتوای تولیدشده توسط کاربران، 
                  متعلق به مدرسه مربوطه بوده و هوشاگر حق استفاده تجاری از آن را ندارد.
                </p>
              </div>
            </div>
          </div>

          {/* تغییرات */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">۷. تغییرات</h2>
                <p className="text-gray-700 leading-relaxed">
                  هوشاگر حق تغییر این شرایط را با اطلاع‌رسانی قبلی محفوظ می‌دارد.
                </p>
              </div>
            </div>
          </div>

          {/* قوانین حاکم */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">قوانین حاکم</h3>
              <p className="text-gray-700">
                این توافق‌نامه تابع <strong className="text-blue-600">قوانین جمهوری اسلامی ایران</strong> است.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-12 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <span>متوجه شدم، بازگشت به ورود</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-600">
          <p>© {new Date().getFullYear()} هوشاگر | تمامی حقوق محفوظ است</p>
        </div>
      </footer>
    </div>
  )
}



