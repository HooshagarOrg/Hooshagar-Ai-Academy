import { AlertTriangle, RefreshCw, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  fullScreen?: boolean;
  type?: 'error' | 'warning' | 'info';
}

const typeStyles = {
  error: {
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    buttonColor: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
  },
  info: {
    icon: AlertTriangle,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    buttonColor: 'bg-blue-500 hover:bg-blue-600',
  },
};

/**
 * Error Display یکپارچه با پیام‌های فارسی
 */
export function ErrorDisplay({
  title = 'خطا در بارگذاری',
  message,
  onRetry,
  showHomeButton = false,
  fullScreen = true,
  type = 'error',
}: ErrorDisplayProps) {
  const style = typeStyles[type];
  const Icon = style.icon;

  const content = (
    <div className={`text-center ${style.bgColor} backdrop-blur-lg rounded-xl sm:rounded-2xl p-6 sm:p-8 border ${style.borderColor} max-w-md mx-auto`}>
      <Icon className={`w-12 h-12 sm:w-16 sm:h-16 ${style.iconColor} mx-auto mb-3 sm:mb-4`} />
      <h2 className="text-white text-lg sm:text-xl font-bold mb-2">{title}</h2>
      <p className="text-white/70 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className={`${style.buttonColor} text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base font-medium`}
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            تلاش مجدد
          </button>
        )}
        {showHomeButton && (
          <Link
            href="/dashboard"
            className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base border border-white/20"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            بازگشت به داشبورد
          </Link>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        {content}
      </div>
    );
  }

  return <div dir="rtl">{content}</div>;
}

/**
 * Empty State - برای وقتی داده‌ای نیست
 */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-8 sm:py-12 px-4" dir="rtl">
      <div className="bg-white/5 backdrop-blur-lg rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-white/10 max-w-md mx-auto">
        {icon ? (
          <div className="mx-auto mb-3 sm:mb-4">{icon}</div>
        ) : (
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" />
          </div>
        )}
        <h3 className="text-white text-base sm:text-lg font-bold mb-2">{title}</h3>
        {message && (
          <p className="text-white/60 text-xs sm:text-sm mb-4">{message}</p>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all text-sm sm:text-base font-medium inline-flex items-center gap-2"
          >
            {actionLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Toast Notification - برای پیام‌های کوتاه
 */
export function Toast({
  message,
  type = 'info',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}) {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 ${colors[type]} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg z-50 max-w-sm animate-slide-up`}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm sm:text-base font-medium">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

