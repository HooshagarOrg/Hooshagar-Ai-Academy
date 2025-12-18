'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // چک کردن اینکه آیا قبلاً نصب شده
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      return;
    }

    // گوش دادن به beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // چک کردن اینکه آیا قبلاً رد شده
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const now = Date.now();
      
      // نمایش prompt اگر بیش از 7 روز از رد شدن گذشته باشد
      if (!dismissed || now - dismissedTime > 7 * 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000); // 3 ثانیه بعد از لود صفحه
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // گوش دادن به appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      console.log('PWA installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // نمایش prompt نصب
    await deferredPrompt.prompt();

    // منتظر جواب کاربر
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      // ذخیره زمان رد شدن
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    }

    // پاک کردن prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // نمایش نداده شود اگر نصب شده یا prompt موجود نیست
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up" dir="rtl">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">نصب هوشاگر</h3>
                <p className="text-blue-100 text-sm">دسترسی سریع‌تر و آفلاین</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 -mt-2 -ml-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-white/90 text-sm mb-4 leading-relaxed">
            هوشاگر را روی دستگاه خود نصب کنید تا دسترسی سریع‌تر و تجربه بهتری داشته باشید.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-bold"
            >
              <Download className="w-4 h-4 ml-2" />
              نصب برنامه
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              بعداً
            </Button>
          </div>

          {/* Features */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-white/90 text-xs">سریع</div>
              </div>
              <div>
                <div className="text-2xl mb-1">📴</div>
                <div className="text-white/90 text-xs">آفلاین</div>
              </div>
              <div>
                <div className="text-2xl mb-1">🔔</div>
                <div className="text-white/90 text-xs">اعلانات</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

