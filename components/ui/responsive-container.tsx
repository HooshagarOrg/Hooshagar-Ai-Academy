import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
}

/**
 * Container با padding و margin responsive
 * برای استفاده در تمام صفحات dashboard
 */
export function ResponsiveContainer({ children }: ResponsiveContainerProps) {
  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * Card برای stats با responsive padding
 */
export function StatCard({
  icon,
  label,
  value,
  subtext,
  color = 'bg-blue-500',
  trend,
  badge,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  trend?: string;
  badge?: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-all hover:scale-[1.02] group">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`${color} p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg text-white group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
        {badge && (
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
            {badge}
          </span>
        )}
      </div>
      <p className="text-white/60 text-xs sm:text-sm mb-1">{label}</p>
      <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold break-all">
        {value}
      </p>
      {subtext && (
        <p className="text-white/40 text-xs mt-1">{subtext}</p>
      )}
    </div>
  );
}

/**
 * Header responsive برای dashboard
 */
export function DashboardHeader({
  name,
  role,
  roleLabel,
  subtitle,
  notificationCount = 0,
}: {
  name: string;
  role: string;
  roleLabel: string;
  subtitle?: string;
  notificationCount?: number;
}) {
  return (
    <header className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 truncate">
            سلام، {name} 👋
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-white/70 text-sm">
            <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
              {roleLabel}
            </span>
            {subtitle && (
              <span className="bg-blue-500/30 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="relative p-2 sm:p-3 bg-white/10 rounded-lg sm:rounded-xl hover:bg-white/20 transition-all">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-bold">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

