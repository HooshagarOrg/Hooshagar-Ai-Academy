/**
 * =====================================================
 * تایپ‌های سیستم ارتقای خودکار و انتقال پرونده
 * =====================================================
 */

// ============================================
// Academic Year (سال تحصیلی)
// ============================================

export interface AcademicYear {
  id: string
  year_name: string
  start_date: string
  end_date: string
  is_current: boolean
  auto_promotion_enabled: boolean
  auto_promotion_date: string | null
  created_at: string
  updated_at: string
}

export interface CreateAcademicYearInput {
  year_name: string
  start_date: string
  end_date: string
  auto_promotion_enabled?: boolean
  auto_promotion_date?: string
}

// ============================================
// Student Academic History (تاریخچه تحصیلی)
// ============================================

export type AcademicStatus = 'active' | 'completed' | 'transferred' | 'dropped'
export type FinalResult = 'promoted' | 'retained' | 'transferred' | 'graduated'

export interface StudentAcademicHistory {
  id: string
  student_id: string
  academic_year_id: string
  academic_year_name: string
  grade: number
  school_id: string
  school_name: string
  class_id: string | null
  class_name: string | null
  teacher_id: string | null
  teacher_name: string | null
  status: AcademicStatus
  final_result: FinalResult | null
  final_gpa: number | null
  enrollment_date: string | null
  completion_date: string | null
  created_at: string
  updated_at: string
}

// ============================================
// Transfer Request (درخواست انتقال)
// ============================================

export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export interface TransferRequest {
  id: string
  student_id: string
  from_school_id: string
  from_grade: number
  to_school_id: string
  to_grade: number
  status: TransferStatus
  requested_by: string
  request_reason: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  transfer_all_data: boolean
  data_transferred: boolean
  transferred_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateTransferRequestInput {
  student_id: string
  from_school_id: string
  from_grade: number
  to_school_id: string
  to_grade: number
  request_reason?: string
  transfer_all_data?: boolean
}

export interface ApproveTransferInput {
  transfer_id: string
  approved: boolean
  rejection_reason?: string
}

// ============================================
// Annual Report (گزارش جامع سالانه)
// ============================================

export interface AnnualReportSummary {
  student_name: string
  grade: number
  grades: Record<string, number>
  overall_gpa: number
  attendance: {
    present: number
    absent: number
    late: number
    excused: number
    percentage: number
  }
  behavior: {
    average_score: number
    total_records: number
    positive_count: number
    notes: string | null
  }
  achievements: Array<{
    title: string
    description: string
    date: string
  }>
}

export interface AIAnalysis {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  career_suggestions: string[]
  personality_traits: string[]
  learning_style: string
  risk_level?: 'low' | 'medium' | 'high'
}

export interface AnnualReport {
  id: string
  student_id: string
  academic_year_id: string
  summary: AnnualReportSummary
  ai_analysis: AIAnalysis | null
  health_summary: any | null
  counseling_summary: any | null
  specialty_reports: any | null
  pdf_url: string | null
  generated_at: string
  sent_to_parents: boolean
  sent_at: string | null
  created_at: string
}

export interface GenerateReportInput {
  student_id: string
  academic_year_id: string
}

// ============================================
// Promotion Result (نتیجه ارتقا)
// ============================================

export interface PromotionResult {
  promoted_count: number
  failed_count: number
  details: Array<{
    student_id: string
    name: string
    result: 'promoted' | 'retained'
    gpa: number
    old_grade?: number
    new_grade?: number
    grade?: number
  }>
}

// ============================================
// Dashboard Stats (آمار داشبورد)
// ============================================

export interface AcademicYearStats {
  total_students: number
  by_grade: Record<number, number>
  average_gpa: number
  attendance_rate: number
  promotion_rate: number
  transfer_count: number
  reports_generated: number
}

// ============================================
// Helper Types
// ============================================

export interface StudentWithHistory {
  id: string
  first_name: string
  last_name: string
  grade: number
  school_name: string
  class_name: string | null
  current_gpa: number | null
  attendance_rate: number | null
  history: StudentAcademicHistory[]
}

export interface TransferWithDetails extends TransferRequest {
  student_name: string
  from_school_name: string
  to_school_name: string
  requested_by_name: string
  approved_by_name: string | null
}





