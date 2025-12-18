'use client';

import { useSearchParams } from 'next/navigation';
import { Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function ComingSoonPage() {
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'این ویژگی';

  const features = [
    { icon: '🔔', title: 'Push Notifications', description: 'اعلانات فوری و بلادرنگ' },
    { icon: '📱', title: 'PWA پیشرفته', description: 'نصب به عنوان اپلیکیشن موبایل' },
    { icon: '💬', title: 'چت زنده', description: 'گفتگوی آنلاین با معلم' },
    { icon: '📊', title: 'تحلیل‌های پیشرفته', description: 'نمودارهای تعاملی و هوش مصنوعی' },
    { icon: '🎮', title: 'بازی‌های آموزشی', description: 'یادگیری با سرگرمی' },
    { icon: '📹', title: 'کلاس آنلاین', description: 'آموزش مجازی زنده' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-4xl w-full">
        {/* Main Card */}
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-lg">
          <CardContent className="p-12 text-center">
            {/* Icon */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-8">
                <Clock className="w-20 h-20 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              به زودی...
            </h1>
            
            {/* Description */}
            <p className="text-xl text-gray-700 mb-2">
              <span className="font-semibold text-purple-600">{decodeURIComponent(feature)}</span>
            </p>
            <p className="text-lg text-gray-600 mb-8">
              در حال توسعه است و به زودی در دسترس شما خواهد بود!
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {features.map((feat, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all hover:scale-105"
                >
                  <div className="text-4xl mb-2">{feat.icon}</div>
                  <h3 className="font-semibold text-gray-800 mb-1">{feat.title}</h3>
                  <p className="text-sm text-gray-600">{feat.description}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <ArrowRight className="w-5 h-5 ml-2" />
                  بازگشت به داشبورد
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                <Sparkles className="w-5 h-5 ml-2" />
                اطلاع به من
              </Button>
            </div>

            {/* Footer */}
            <p className="text-sm text-gray-500 mt-8">
              تیم توسعه هوشاگر روزانه در حال کار بر روی ویژگی‌های جدید است 🚀
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

