'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-6" dir="rtl">
      <Card className="max-w-md w-full border-none shadow-2xl bg-white/80 backdrop-blur-lg">
        <CardContent className="p-12 text-center">
          {/* Icon */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-gray-500 to-gray-700 rounded-full p-8">
              <WifiOff className="w-20 h-20 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            اتصال به اینترنت قطع است
          </h1>
          
          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.
          </p>

          {/* Action Button */}
          <Button
            onClick={handleRetry}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full"
          >
            <RefreshCw className="w-5 h-5 ml-2" />
            تلاش مجدد
          </Button>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-700">
              💡 <strong>نکته:</strong> برخی از بخش‌های برنامه در حالت آفلاین در دسترس هستند.
            </p>
          </div>

          {/* Status */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>آفلاین</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

