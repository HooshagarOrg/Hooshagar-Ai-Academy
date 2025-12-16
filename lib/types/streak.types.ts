// ═══════════════════════════════════════
// تایپ‌های سیستم Streak
// ═══════════════════════════════════════

// فعالیت روزانه
export interface DailyActivity {
  id: string;
  user_id: string;
  activity_date: string;
  stories_created: number;
  problems_solved: number;
  study_buddy_messages: number;
  lessons_completed: number;
  badges_earned: number;
  exams_taken: number;
  shop_purchases: number;
  is_active: boolean;
  is_freeze_used: boolean;
  xp_earned_today: number;
  first_activity_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

// Milestone
export interface StreakMilestone {
  id: string;
  days_required: number;
  name: string;
  name_en: string;
  description: string | null;
  xp_reward: number;
  coins_reward: number;
  freeze_reward: number;
  icon_emoji: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// دستاورد Streak کاربر
export interface UserStreakMilestone {
  id: string;
  user_id: string;
  milestone_id: string;
  achieved_at: string;
  streak_at_time: number;
  reward_claimed: boolean;
  milestone?: StreakMilestone;
}

// تاریخچه Streak
export interface StreakHistory {
  id: string;
  user_id: string;
  streak_length: number;
  started_at: string;
  ended_at: string;
  end_reason: 'broken' | 'ongoing';
  created_at: string;
}

// اطلاعات Streak کاربر
export interface UserStreakInfo {
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  streak_freeze_count: number;
  last_activity_date: string | null;
  is_active_today: boolean;
  next_milestone_days: number;
  next_milestone_name: string | null;
  next_milestone_xp: number;
  days_to_next_milestone: number;
}

// آیتم تقویم
export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isActive: boolean;
  isFreezeUsed: boolean;
  xpEarned: number;
  activitiesCount: number;
}

// نتیجه ثبت فعالیت
export interface RecordActivityResult {
  current_streak: number;
  is_new_day: boolean;
  streak_milestone_reached: boolean;
  milestone_name: string | null;
  milestone_reward_xp: number;
  milestone_reward_coins: number;
  milestone_reward_freeze: number;
}

// نتیجه استفاده از محافظ
export interface UseFreezeResult {
  success: boolean;
  message: string;
  remaining_freezes: number;
}

// نوع فعالیت
export type ActivityType = 
  | 'story'
  | 'problem'
  | 'study_buddy'
  | 'lesson'
  | 'badge'
  | 'exam'
  | 'shop';

// ═══════════════════════════════════════
// تنظیمات و کانفیگ
// ═══════════════════════════════════════

// رنگ‌های Streak
export const STREAK_COLORS = {
  cold: {
    range: [0, 2],
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    label: 'سرد',
  },
  warming: {
    range: [3, 6],
    color: 'text-amber-500',
    bgColor: 'bg-amber-100',
    label: 'گرم شدن',
  },
  hot: {
    range: [7, 14],
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    label: 'داغ',
  },
  fire: {
    range: [15, 29],
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'آتشین',
  },
  blazing: {
    range: [30, 99],
    color: 'text-red-600',
    bgColor: 'bg-red-200',
    label: 'شعله‌ور',
  },
  legendary: {
    range: [100, Infinity],
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-r from-red-200 to-purple-200',
    label: 'افسانه‌ای',
  },
};

// دریافت رنگ Streak
export function getStreakColor(streak: number): typeof STREAK_COLORS[keyof typeof STREAK_COLORS] {
  if (streak >= 100) return STREAK_COLORS.legendary;
  if (streak >= 30) return STREAK_COLORS.blazing;
  if (streak >= 15) return STREAK_COLORS.fire;
  if (streak >= 7) return STREAK_COLORS.hot;
  if (streak >= 3) return STREAK_COLORS.warming;
  return STREAK_COLORS.cold;
}

// لیبل نوع فعالیت
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  story: 'داستان',
  problem: 'حل مسئله',
  study_buddy: 'مطالعه',
  lesson: 'درس',
  badge: 'نشان',
  exam: 'آزمون',
  shop: 'خرید',
};

// ═══════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════

// فرمت Streak با ایموجی
export function formatStreak(streak: number): string {
  if (streak === 0) return '0 روز';
  if (streak === 1) return '1 روز 🔥';
  if (streak < 7) return `${streak} روز 🔥`;
  if (streak < 30) return `${streak} روز 🔥🔥`;
  if (streak < 100) return `${streak} روز 🔥🔥🔥`;
  return `${streak} روز 👑🔥`;
}

// دریافت پیام تشویقی
export function getStreakMessage(streak: number, isActiveToday: boolean): string {
  if (!isActiveToday) {
    if (streak > 0) {
      return `⚠️ امروز فعالیت نداشتی! Streak ${streak} روزه‌ات رو از دست نده!`;
    }
    return '🌟 امروز شروع کن و یک Streak جدید بساز!';
  }
  
  if (streak === 1) return '🌱 شروع عالی! ادامه بده!';
  if (streak === 3) return '💪 سه روز متوالی! داری خوب پیش می‌ری!';
  if (streak === 7) return '🔥 یک هفته آتشین! معرکه‌ای!';
  if (streak === 14) return '⚡ دو هفته! قدرتت رو نشون دادی!';
  if (streak === 30) return '🏆 یک ماه! افسانه‌ای شدی!';
  if (streak === 100) return '👑 صد روز! تو واقعاً اسطوره‌ای!';
  if (streak >= 365) return '🏅 یک سال! هیچکس مثل تو نیست!';
  
  if (streak >= 50) return '✨ عالی! هر روز قوی‌تر می‌شی!';
  if (streak >= 30) return '🔥 آتش بازی! ادامه بده!';
  if (streak >= 7) return '💪 Streak قوی! خسته نباشی!';
  
  return '🔥 ادامه بده! داری عالی پیش می‌ری!';
}

// محاسبه درصد پیشرفت به Milestone بعدی
export function calculateMilestoneProgress(currentStreak: number, nextMilestone: number): number {
  if (nextMilestone <= 0) return 100;
  
  // پیدا کردن milestone قبلی
  const milestones = [0, 3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
  let previousMilestone = 0;
  
  for (const m of milestones) {
    if (m >= nextMilestone) break;
    previousMilestone = m;
  }
  
  const progress = ((currentStreak - previousMilestone) / (nextMilestone - previousMilestone)) * 100;
  return Math.min(100, Math.max(0, progress));
}

// فرمت تاریخ شمسی
export function formatPersianDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// فرمت زمان باقی‌مانده تا پایان روز
export function getTimeUntilMidnight(): { hours: number; minutes: number; formatted: string } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    hours,
    minutes,
    formatted: `${hours} ساعت و ${minutes} دقیقه`,
  };
}

// تولید روزهای تقویم برای یک ماه
export function generateCalendarDays(
  year: number,
  month: number,
  activities: { activity_date: string; is_active: boolean; is_freeze_used: boolean; xp_earned: number; activities_count: number }[]
): CalendarDay[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const days: CalendarDay[] = [];
  
  // روزهای قبل از شروع ماه
  const startDayOfWeek = firstDay.getDay();
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 2, day);
    days.push({
      date: date.toISOString().split('T')[0],
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: false,
      isActive: false,
      isFreezeUsed: false,
      xpEarned: 0,
      activitiesCount: 0,
    });
  }
  
  // روزهای ماه جاری
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];
    const activity = activities.find(a => a.activity_date === dateStr);
    
    days.push({
      date: dateStr,
      dayOfMonth: day,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      isActive: activity?.is_active || false,
      isFreezeUsed: activity?.is_freeze_used || false,
      xpEarned: activity?.xp_earned || 0,
      activitiesCount: activity?.activities_count || 0,
    });
  }
  
  // روزهای بعد از ماه
  const remainingDays = 42 - days.length; // 6 هفته کامل
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month, day);
    days.push({
      date: date.toISOString().split('T')[0],
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: false,
      isActive: false,
      isFreezeUsed: false,
      xpEarned: 0,
      activitiesCount: 0,
    });
  }
  
  return days;
}

// نام روزهای هفته
export const WEEKDAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
export const WEEKDAY_FULL_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

// نام ماه‌های شمسی
export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
];











































