// ═══════════════════════════════════════
// تایپ‌های سیستم ثبت‌نام کلاس با قرعه‌کشی
// ═══════════════════════════════════════

// وضعیت قرعه‌کشی
export type LotteryStatus = 'pending' | 'open' | 'closed' | 'running' | 'completed' | 'cancelled';

// وضعیت ثبت‌نام
export type RegistrationStatus = 'pending' | 'assigned' | 'failed' | 'cancelled';

// نوع تخصیص مدیر
export type AssignmentType = 'quota' | 'transfer' | 'special_needs' | 'sibling' | 'other';

// وضعیت تخصیص
export type AssignmentStatus = 'pending' | 'approved' | 'rejected';

// نوع لاگ
export type LotteryLogType = 'started' | 'processing' | 'assigned' | 'failed' | 'completed' | 'error';

// کلاس درسی
export interface Class {
  id: string;
  school_id: string;
  name: string;
  grade: number;
  section: string | null;
  teacher_id: string | null;
  teacher_name: string;
  total_capacity: number;
  admin_reserved: number;
  available_capacity: number;
  current_count: number;
  academic_year: string;
  is_active: boolean;
  description: string | null;
  room_number: string | null;
  created_at: string;
  updated_at: string;
}

// تنظیمات قرعه‌کشی
export interface LotterySetting {
  id: string;
  school_id: string;
  is_enabled: boolean;
  registration_start: string;
  registration_end: string;
  lottery_time: string;
  target_grade: number;
  academic_year: string;
  max_choices: number;
  allow_edit_until_end: boolean;
  notify_parents_result: boolean;
  status: LotteryStatus;
  total_registrations: number;
  successful_assignments: number;
  failed_assignments: number;
  executed_at: string | null;
  executed_by: string | null;
  created_at: string;
  updated_at: string;
}

// ثبت‌نام کلاس
export interface ClassRegistration {
  id: string;
  student_id: string;
  lottery_setting_id: string;
  choice_1_class_id: string | null;
  choice_2_class_id: string | null;
  choice_3_class_id: string | null;
  choice_4_class_id: string | null;
  result_class_id: string | null;
  assigned_choice: number | null;
  status: RegistrationStatus;
  registered_by: string | null;
  registered_at: string;
  last_modified_at: string | null;
  assigned_at: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  // با join
  student?: {
    id: string;
    full_name: string;
    grade: number;
  };
  result_class?: Class;
  choice_1_class?: Class;
  choice_2_class?: Class;
  choice_3_class?: Class;
  choice_4_class?: Class;
}

// تخصیص مدیر
export interface AdminAssignment {
  id: string;
  class_id: string;
  student_id: string;
  lottery_setting_id: string | null;
  assigned_by: string;
  reason: string;
  priority: number;
  assignment_type: AssignmentType;
  status: AssignmentStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  // با join
  class?: Class;
  student?: {
    id: string;
    full_name: string;
    grade: number;
  };
  assigned_by_user?: {
    id: string;
    full_name: string;
  };
}

// لاگ قرعه‌کشی
export interface LotteryLog {
  id: string;
  lottery_setting_id: string;
  log_type: LotteryLogType;
  student_id: string | null;
  class_id: string | null;
  choice_number: number | null;
  message: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// آمار قرعه‌کشی
export interface LotteryStats {
  total_registrations: number;
  pending_count: number;
  assigned_count: number;
  failed_count: number;
  class_stats: ClassStat[];
}

export interface ClassStat {
  class_id: string;
  teacher_name: string;
  total_capacity: number;
  registered_count: number;
  assigned_count: number;
}

// نتیجه بررسی امکان ثبت‌نام
export interface CanRegisterResult {
  can_register: boolean;
  reason: string;
  existing_registration_id: string | null;
}

// نتیجه اجرای قرعه‌کشی
export interface RunLotteryResult {
  success: boolean;
  message: string;
  total_registrations: number;
  successful: number;
  failed: number;
}

// فرم ثبت‌نام
export interface RegistrationFormData {
  student_id: string;
  lottery_setting_id: string;
  choice_1_class_id: string;
  choice_2_class_id?: string;
  choice_3_class_id?: string;
  choice_4_class_id?: string;
}

// فرم تنظیمات قرعه‌کشی
export interface LotterySettingFormData {
  school_id: string;
  target_grade: number;
  academic_year: string;
  registration_start: string;
  registration_end: string;
  lottery_time: string;
  max_choices?: number;
  allow_edit_until_end?: boolean;
  notify_parents_result?: boolean;
}

// فرم تخصیص مدیر
export interface AdminAssignmentFormData {
  class_id: string;
  student_id: string;
  lottery_setting_id?: string;
  reason: string;
  assignment_type: AssignmentType;
  priority?: number;
}

// ═══════════════════════════════════════
// تنظیمات و کانفیگ
// ═══════════════════════════════════════

// لیبل‌های وضعیت قرعه‌کشی
export const LOTTERY_STATUS_CONFIG: Record<LotteryStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  pending: {
    label: 'در انتظار',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '⏳',
  },
  open: {
    label: 'باز',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '✅',
  },
  closed: {
    label: 'بسته',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: '🔒',
  },
  running: {
    label: 'در حال اجرا',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '🔄',
  },
  completed: {
    label: 'انجام شده',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '🎉',
  },
  cancelled: {
    label: 'لغو شده',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '❌',
  },
};

// لیبل‌های وضعیت ثبت‌نام
export const REGISTRATION_STATUS_CONFIG: Record<RegistrationStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  pending: {
    label: 'در انتظار',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: '⏳',
  },
  assigned: {
    label: 'تخصیص یافته',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '✅',
  },
  failed: {
    label: 'ناموفق',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '❌',
  },
  cancelled: {
    label: 'لغو شده',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '🚫',
  },
};

// لیبل‌های نوع تخصیص
export const ASSIGNMENT_TYPE_CONFIG: Record<AssignmentType, {
  label: string;
  description: string;
}> = {
  quota: {
    label: 'سهمیه مدیر',
    description: 'تخصیص از سهمیه اختصاصی مدیر',
  },
  transfer: {
    label: 'انتقالی',
    description: 'دانش‌آموز انتقالی از مدرسه دیگر',
  },
  special_needs: {
    label: 'نیازهای ویژه',
    description: 'دانش‌آموز دارای نیازهای خاص',
  },
  sibling: {
    label: 'خواهر/برادر',
    description: 'قرار گرفتن در کنار خواهر یا برادر',
  },
  other: {
    label: 'سایر',
    description: 'سایر دلایل',
  },
};

// ═══════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════

// فرمت تاریخ به شمسی
export function formatLotteryDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// فرمت تاریخ کوتاه
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR');
}

// بررسی باز بودن ثبت‌نام
export function isRegistrationOpen(setting: LotterySetting): boolean {
  if (!setting.is_enabled || setting.status !== 'open') return false;
  
  const now = new Date();
  const start = new Date(setting.registration_start);
  const end = new Date(setting.registration_end);
  
  return now >= start && now <= end;
}

// محاسبه زمان باقی‌مانده
export function getTimeRemaining(endDate: string): {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
} {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, expired: false };
}

// فرمت زمان باقی‌مانده
export function formatTimeRemaining(endDate: string): string {
  const { days, hours, minutes, expired } = getTimeRemaining(endDate);
  
  if (expired) return 'تمام شده';
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} روز`);
  if (hours > 0) parts.push(`${hours} ساعت`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} دقیقه`);
  
  return parts.join(' و ') || 'کمتر از یک دقیقه';
}

// تبدیل پایه به متن
export function gradeToText(grade: number): string {
  const grades: Record<number, string> = {
    1: 'اول',
    2: 'دوم',
    3: 'سوم',
    4: 'چهارم',
    5: 'پنجم',
    6: 'ششم',
    7: 'هفتم',
    8: 'هشتم',
    9: 'نهم',
    10: 'دهم',
    11: 'یازدهم',
    12: 'دوازدهم',
  };
  return grades[grade] || `پایه ${grade}`;
}
















