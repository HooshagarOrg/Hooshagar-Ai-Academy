// ═══════════════════════════════════════
// تایپ‌های سیستم نشان‌های دستاوردی
// ═══════════════════════════════════════

// دسته‌بندی نشان
export type BadgeCategory = 'academic' | 'behavior' | 'attendance' | 'social' | 'special' | 'achievement';

// نادری نشان
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

// نحوه اعطا
export type AwardedBy = 'auto' | 'teacher' | 'admin' | 'system';

// شرط اعطای خودکار
export interface AwardCondition {
  type: 
    | 'xp_total' 
    | 'level' 
    | 'streak_days' 
    | 'coins'
    | 'stories_created' 
    | 'perfect_attendance_days'
    | 'exams_passed'
    | 'shop_purchases'
    | 'login_days'
    | 'quiz_score_avg';
  value: number;
}

// تعریف نشان
export interface Badge {
  id: string;
  name: string;
  name_en: string;
  description: string;
  icon_url: string;
  icon_locked_url: string | null;
  icon_emoji: string | null;
  category: BadgeCategory;
  rarity: BadgeRarity;
  auto_award: boolean;
  award_condition: AwardCondition | null;
  xp_reward: number;
  is_active: boolean;
  is_secret: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// نشان کاربر
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_by: AwardedBy;
  awarded_by_user_id: string | null;
  award_reason: string | null;
  is_displayed: boolean;
  display_order: number;
  is_seen: boolean;
  awarded_at: string;
  // با جوین
  badge?: Badge;
  awarded_by_user?: {
    id: string;
    full_name: string;
  };
}

// پیشرفت نشان
export interface BadgeProgress {
  id: string;
  user_id: string;
  badge_id: string;
  current_value: number;
  target_value: number;
  last_updated: string;
  // محاسبه‌شده
  percentage?: number;
}

// نشان با اطلاعات کامل
export interface BadgeWithStatus extends Badge {
  is_owned: boolean;
  user_badge?: UserBadge;
  progress?: BadgeProgress;
  owners_count?: number;
}

// آمار نشان‌های کاربر
export interface UserBadgeStats {
  total_badges: number;
  total_available: number;
  by_rarity: Record<BadgeRarity, { owned: number; total: number }>;
  by_category: Record<BadgeCategory, { owned: number; total: number }>;
  unseen_count: number;
  displayed_badges: {
    id: string;
    name: string;
    icon_emoji: string;
    rarity: BadgeRarity;
  }[];
}

// نتیجه اعطای نشان
export interface AwardBadgeResult {
  success: boolean;
  message: string;
  xp_awarded?: number;
}

// تنظیمات دسته‌بندی
export const BADGE_CATEGORY_CONFIG: Record<BadgeCategory, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  academic: {
    label: 'تحصیلی',
    icon: '📚',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  behavior: {
    label: 'رفتاری',
    icon: '💝',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  attendance: {
    label: 'حضور و غیاب',
    icon: '📅',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  social: {
    label: 'اجتماعی',
    icon: '👥',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  special: {
    label: 'ویژه',
    icon: '⭐',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  achievement: {
    label: 'دستاورد',
    icon: '🏆',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

// تنظیمات نادری
export const BADGE_RARITY_CONFIG: Record<BadgeRarity, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowClass: string;
}> = {
  common: {
    label: 'معمولی',
    icon: '⚪',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    glowClass: '',
  },
  rare: {
    label: 'نادر',
    icon: '🔵',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-400 dark:border-blue-600',
    glowClass: 'shadow-blue-200 dark:shadow-blue-800',
  },
  epic: {
    label: 'حماسی',
    icon: '🟣',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-400 dark:border-purple-600',
    glowClass: 'shadow-purple-200 dark:shadow-purple-800',
  },
  legendary: {
    label: 'افسانه‌ای',
    icon: '🟠',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30',
    borderColor: 'border-amber-400 dark:border-amber-500',
    glowClass: 'shadow-amber-200 dark:shadow-amber-800 animate-pulse',
  },
};

// تنظیمات شرایط
export const AWARD_CONDITION_LABELS: Record<string, string> = {
  xp_total: 'کسب امتیاز XP',
  level: 'رسیدن به سطح',
  streak_days: 'حفظ Streak',
  coins: 'جمع‌آوری سکه',
  stories_created: 'ساخت داستان',
  perfect_attendance_days: 'حضور کامل',
  exams_passed: 'قبولی در آزمون',
  shop_purchases: 'خرید از فروشگاه',
  login_days: 'روز ورود',
  quiz_score_avg: 'میانگین نمره',
};

// فرمت شرط
export function formatAwardCondition(condition: AwardCondition): string {
  const label = AWARD_CONDITION_LABELS[condition.type] || condition.type;
  
  switch (condition.type) {
    case 'xp_total':
      return `${label}: ${condition.value.toLocaleString('fa-IR')} امتیاز`;
    case 'level':
      return `${label} ${condition.value}`;
    case 'streak_days':
    case 'perfect_attendance_days':
    case 'login_days':
      return `${label}: ${condition.value} روز`;
    case 'coins':
      return `${label}: ${condition.value.toLocaleString('fa-IR')} سکه`;
    case 'stories_created':
    case 'exams_passed':
    case 'shop_purchases':
      return `${label}: ${condition.value} عدد`;
    case 'quiz_score_avg':
      return `${label}: ${condition.value}%`;
    default:
      return `${label}: ${condition.value}`;
  }
}

// فرمت تاریخ
export function formatBadgeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 7) return `${days} روز پیش`;
  if (days < 30) return `${Math.floor(days / 7)} هفته پیش`;
  if (days < 365) return `${Math.floor(days / 30)} ماه پیش`;
  
  return date.toLocaleDateString('fa-IR');
}

// محاسبه درصد پیشرفت
export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}











