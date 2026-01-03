import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

/**
 * Loading Spinner یکپارچه برای تمام پروژه
 */
export function LoadingSpinner({ 
  size = 'lg', 
  text = 'در حال بارگذاری...', 
  fullScreen = true,
  className = ''
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 sm:gap-4 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-white animate-spin`} />
      {text && (
        <p className="text-white text-sm sm:text-base md:text-lg font-medium">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Loading Skeleton برای محتوا
 */
export function LoadingSkeleton({ 
  count = 3,
  height = 'h-24'
}: { 
  count?: number;
  height?: string;
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-white/5 rounded-xl sm:rounded-2xl animate-pulse`}
        />
      ))}
    </div>
  );
}

/**
 * Loading Overlay برای عملیات در background
 */
export function LoadingOverlay({ 
  isLoading, 
  text = 'در حال پردازش...' 
}: { 
  isLoading: boolean; 
  text?: string;
}) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-white/20">
        <LoadingSpinner size="lg" text={text} fullScreen={false} />
      </div>
    </div>
  );
}

