// Attendance System Types

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'sick'

export interface AttendanceRecord {
  id: string
  student_id: string
  class_id: string
  school_id: string
  date: string // ISO date format
  status: AttendanceStatus
  absence_reason?: string
  absence_note?: string
  medical_certificate_url?: string
  parent_notification_sent: boolean
  parent_notification_date?: string
  recorded_by: string
  recorded_at: string
  followed_up: boolean
  followed_up_by?: string
  followed_up_at?: string
  follow_up_note?: string
  follow_up_result?: string
  notify_counselor: boolean
  add_to_disciplinary_record: boolean
  updated_at: string
  // Relations
  student?: {
    id: string
    full_name: string
    student_code: string
    avatar_url?: string
  }
  class?: {
    id: string
    name: string
  }
}

export interface AttendanceMonthlyStats {
  id: string
  student_id: string
  school_id: string
  class_id: string
  month: string // First day of month
  total_days: number
  present_days: number
  absent_days: number
  late_days: number
  excused_days: number
  sick_days: number
  attendance_percentage: number
  created_at: string
  updated_at: string
}

export interface AttendanceInputRecord {
  student_id: string
  class_id: string
  date: string
  status: AttendanceStatus
  absence_reason?: string
  absence_note?: string
  medical_certificate_url?: string
  notify_parent?: boolean
  notify_vp?: boolean
}

export interface FollowupInput {
  id: string
  followed_up: boolean
  follow_up_note: string
  follow_up_result: string
  absence_reason?: string
  notify_counselor: boolean
  add_to_disciplinary_record: boolean
}

export interface DailyClassStats {
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
  sick_count: number
  attendance_rate: number
}

export interface SchoolStats {
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  attendance_rate: number
  pending_followups: number
}

export interface HighAbsenceStudent {
  student_id: string
  student_name: string
  class_name: string
  absent_days: number
  total_days: number
  attendance_percentage: number
  trend: 'up' | 'down' | 'same'
}

export interface PendingFollowup {
  attendance_id: string
  student_id: string
  student_name: string
  class_name: string
  date: string
  status: AttendanceStatus
  absence_reason?: string
  parent_phone?: string
}

export interface SchoolComparison {
  school_id: string
  school_name: string
  total_students: number
  avg_attendance_rate: number
  total_absences: number
}

// Status configuration
export const ATTENDANCE_STATUS_CONFIG = {
  present: {
    label: 'حاضر',
    labelEn: 'Present',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
  },
  absent: {
    label: 'غایب',
    labelEn: 'Absent',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
  },
  late: {
    label: 'تأخیر',
    labelEn: 'Late',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
  },
  excused: {
    label: 'با اجازه',
    labelEn: 'Excused',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
  },
  sick: {
    label: 'بیمار',
    labelEn: 'Sick',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
  },
} as const

// Absence reasons
export const ABSENCE_REASONS = [
  { value: 'sickness', label: 'مریضی', isExcused: true, requiresDocument: true },
  { value: 'parent_permission', label: 'مرخصی با اجازه والدین', isExcused: true, requiresDocument: false },
  { value: 'family_event', label: 'مراسم خانوادگی', isExcused: true, requiresDocument: false },
  { value: 'travel', label: 'مسافرت', isExcused: true, requiresDocument: false },
  { value: 'medical_appointment', label: 'ویزیت پزشک', isExcused: true, requiresDocument: true },
  { value: 'family_issue', label: 'مشکل خانوادگی', isExcused: true, requiresDocument: false },
  { value: 'without_permission', label: 'بدون اجازه', isExcused: false, requiresDocument: false },
  { value: 'unknown', label: 'نامشخص', isExcused: false, requiresDocument: false },
  { value: 'other', label: 'سایر', isExcused: false, requiresDocument: false },
] as const

// Call results for followup
export const CALL_RESULTS = [
  { value: 'answered_resolved', label: 'پاسخ داد - علت مشخص شد' },
  { value: 'no_answer', label: 'پاسخ نداد' },
  { value: 'wrong_number', label: 'شماره اشتباه' },
  { value: 'needs_followup', label: 'نیاز به پیگیری بیشتر' },
] as const

export type AbsenceReasonValue = typeof ABSENCE_REASONS[number]['value']
export type CallResultValue = typeof CALL_RESULTS[number]['value']




















