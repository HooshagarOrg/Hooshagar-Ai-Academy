// =====================================
// 🧠 Counseling System Types
// =====================================
// سیستم مشاوره و گزارشات روان‌شناختی

import { Json } from '@/types/database.types'

// ==========================================
// Base Types
// ==========================================

export type CounselingStatus = 'active' | 'closed' | 'referred'
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent'
export type SessionType = 'individual' | 'group' | 'family' | 'crisis' | 'follow_up'
export type CooperationLevel = 'excellent' | 'good' | 'fair' | 'poor'
export type ContactType = 'phone' | 'in_person' | 'email' | 'message' | 'video_call'
export type BehaviorFrequency = 'rare' | 'occasional' | 'frequent' | 'constant'
export type Severity = 'mild' | 'moderate' | 'severe'

export type TestType = 
  | 'intelligence'      // هوش (IQ)
  | 'personality'       // شخصیت (MBTI, Big Five)
  | 'aptitude'          // استعداد
  | 'interest'          // علاقه‌مندی شغلی
  | 'achievement'       // پیشرفت تحصیلی
  | 'behavioral'        // رفتاری (ADHD, Autism)
  | 'emotional'         // هوش هیجانی (EQ)
  | 'anxiety'           // اضطراب
  | 'depression'        // افسردگی
  | 'career'            // مسیر شغلی

// ==========================================
// Issue Categories
// ==========================================
export const ISSUE_CATEGORIES = [
  'رفتاری',
  'تحصیلی', 
  'خانوادگی',
  'اجتماعی',
  'عاطفی',
  'اضطراب',
  'افسردگی',
] as const

export type IssueCategory = typeof ISSUE_CATEGORIES[number]

// ==========================================
// Session Topics
// ==========================================
export const SESSION_TOPICS = [
  'بررسی وضعیت تحصیلی',
  'مشکلات خانوادگی',
  'روابط با همسالان',
  'اضطراب و استرس',
  'مدیریت خشم',
  'اعتماد به نفس',
  'انگیزش تحصیلی',
  'برنامه‌ریزی درسی',
  'مهارت‌های اجتماعی',
  'مشکلات رفتاری',
] as const

// ==========================================
// Intervention Types
// ==========================================
export const INTERVENTIONS = [
  'گفتگوی انگیزشی',
  'تکنیک آرام‌سازی',
  'درمان شناختی-رفتاری (CBT)',
  'حل مسئله',
  'بازی درمانی',
  'تکنیک‌های تنفس',
  'تصویرسازی ذهنی',
  'مهارت‌آموزی اجتماعی',
  'قصه‌درمانی',
  'هنردرمانی',
] as const

// ==========================================
// Setting Types
// ==========================================
export const OBSERVATION_SETTINGS = [
  'کلاس',
  'ورزشگاه',
  'سلف',
  'حیاط',
  'کتابخانه',
  'آزمایشگاه',
  'نمازخانه',
  'سالن اجتماعات',
] as const

// ==========================================
// Counseling Goal
// ==========================================
export interface CounselingGoal {
  id: string
  goal: string
  target_date: string
  status: 'pending' | 'in_progress' | 'achieved' | 'cancelled'
  progress: number // 0-100
  notes?: string
}

// ==========================================
// Attendee
// ==========================================
export interface SessionAttendee {
  name: string
  relation?: string
  attended: boolean
}

// ==========================================
// Action Item
// ==========================================
export interface ActionItem {
  id: string
  item: string
  responsible: string
  deadline?: string
  completed?: boolean
}

// ==========================================
// Counseling Record
// ==========================================
export interface CounselingRecord {
  id: string
  student_id: string
  school_id: string
  counselor_id: string
  
  opened_date: string
  closed_date: string | null
  status: CounselingStatus
  
  issue_categories: IssueCategory[]
  priority_level: PriorityLevel
  
  summary: string | null
  initial_assessment: string | null
  
  goals: CounselingGoal[] | null
  
  is_referred: boolean
  referred_to: string | null
  referral_reason: string | null
  referral_date: string | null
  referral_outcome: string | null
  
  created_at: string
  updated_at: string
  
  // Relations (populated by joins)
  student?: StudentInfo
  counselor?: UserInfo
  sessions?: CounselingSession[]
  sessions_count?: number
  last_session_date?: string
}

// ==========================================
// Counseling Session
// ==========================================
export interface CounselingSession {
  id: string
  counseling_record_id: string
  student_id: string
  counselor_id: string
  
  session_number: number
  session_date: string
  duration_minutes: number
  
  session_type: SessionType
  attendees: SessionAttendee[] | null
  
  topics_discussed: string[]
  session_notes: string
  student_mood: string | null
  student_cooperation: CooperationLevel | null
  
  interventions_used: string[] | null
  
  homework: string | null
  homework_completed: boolean | null
  
  progress_rating: number | null
  progress_notes: string | null
  
  next_session_planned: boolean
  next_session_date: string | null
  next_session_goals: string | null
  
  created_at: string
  
  // Relations
  student?: StudentInfo
  counselor?: UserInfo
}

// ==========================================
// Psychological Test
// ==========================================
export interface PsychologicalTest {
  id: string
  student_id: string
  counseling_record_id: string | null
  
  test_name: string
  test_type: TestType
  test_date: string
  administered_by: string
  
  raw_scores: Json | null
  standard_scores: Json | null
  percentile_ranks: Json | null
  iq_score: number | null
  
  interpretation: string
  strengths: string | null
  weaknesses: string | null
  recommendations: string | null
  
  report_url: string | null
  
  created_at: string
  
  // Relations
  student?: StudentInfo
  administrator?: UserInfo
}

// ==========================================
// Behavioral Observation
// ==========================================
export interface BehavioralObservation {
  id: string
  student_id: string
  counseling_record_id: string | null
  
  observation_date: string
  observation_time: string | null
  duration_minutes: number | null
  
  setting: string
  observer_id: string
  observer_role: string | null
  
  behaviors_observed: string[]
  behavior_frequency: BehaviorFrequency | null
  
  description: string
  severity: Severity | null
  
  antecedents: string | null
  consequences: string | null
  environmental_factors: string | null
  
  student_response: string | null
  
  intervention_applied: string | null
  intervention_effectiveness: string | null
  
  created_at: string
  
  // Relations
  student?: StudentInfo
  observer?: UserInfo
}

// ==========================================
// Parent Contact
// ==========================================
export interface ParentContact {
  id: string
  student_id: string
  counseling_record_id: string | null
  counselor_id: string
  
  contact_date: string
  contact_type: ContactType
  
  parent_name: string | null
  parent_relation: string | null
  
  purpose: string
  discussion_summary: string
  parent_concerns: string | null
  
  agreements_made: string | null
  action_items: ActionItem[] | null
  
  follow_up_needed: boolean
  follow_up_date: string | null
  follow_up_note: string | null
  
  created_at: string
  
  // Relations
  student?: StudentInfo
  counselor?: UserInfo
}

// ==========================================
// Helper Types
// ==========================================
export interface StudentInfo {
  id: string
  full_name: string
  grade?: number
  class_name?: string
  avatar_url?: string
}

export interface UserInfo {
  id: string
  full_name: string
  role?: string
  avatar_url?: string
}

// ==========================================
// Dashboard Stats
// ==========================================
export interface CounselorDashboardStats {
  active_records: number
  urgent_records: number
  today_sessions: number
  closed_this_month: number
  pending_follow_ups: number
}

// ==========================================
// Form Input Types
// ==========================================
export interface CreateCounselingRecordInput {
  student_id: string
  issue_categories: IssueCategory[]
  priority_level: PriorityLevel
  summary?: string
  initial_assessment?: string
  goals?: CounselingGoal[]
}

export interface CreateSessionInput {
  counseling_record_id: string
  student_id: string
  session_date: string
  duration_minutes: number
  session_type: SessionType
  attendees?: SessionAttendee[]
  topics_discussed: string[]
  session_notes: string
  student_mood?: string
  student_cooperation?: CooperationLevel
  interventions_used?: string[]
  homework?: string
  progress_rating?: number
  progress_notes?: string
  next_session_planned?: boolean
  next_session_date?: string
  next_session_goals?: string
}

export interface CreateTestInput {
  student_id: string
  counseling_record_id?: string
  test_name: string
  test_type: TestType
  test_date: string
  raw_scores?: Json
  standard_scores?: Json
  percentile_ranks?: Json
  iq_score?: number
  interpretation: string
  strengths?: string
  weaknesses?: string
  recommendations?: string
}

export interface CreateObservationInput {
  student_id: string
  counseling_record_id?: string
  observation_date: string
  observation_time?: string
  duration_minutes?: number
  setting: string
  observer_role?: string
  behaviors_observed: string[]
  behavior_frequency?: BehaviorFrequency
  description: string
  severity?: Severity
  antecedents?: string
  consequences?: string
  environmental_factors?: string
  student_response?: string
  intervention_applied?: string
  intervention_effectiveness?: string
}

export interface CreateParentContactInput {
  student_id: string
  counseling_record_id?: string
  contact_date: string
  contact_type: ContactType
  parent_name?: string
  parent_relation?: string
  purpose: string
  discussion_summary: string
  parent_concerns?: string
  agreements_made?: string
  action_items?: ActionItem[]
  follow_up_needed?: boolean
  follow_up_date?: string
  follow_up_note?: string
}

// ==========================================
// Filter Types
// ==========================================
export interface CounselingRecordFilters {
  status?: CounselingStatus
  priority_level?: PriorityLevel
  issue_category?: IssueCategory
  search?: string
}

// ==========================================
// Test Type Labels (Persian)
// ==========================================
export const TEST_TYPE_LABELS: Record<TestType, string> = {
  intelligence: 'هوش (IQ)',
  personality: 'شخصیت',
  aptitude: 'استعداد',
  interest: 'علاقه‌مندی شغلی',
  achievement: 'پیشرفت تحصیلی',
  behavioral: 'رفتاری',
  emotional: 'هوش هیجانی (EQ)',
  anxiety: 'اضطراب',
  depression: 'افسردگی',
  career: 'مسیر شغلی',
}

// ==========================================
// Priority Labels (Persian)
// ==========================================
export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: 'پایین',
  medium: 'متوسط',
  high: 'بالا',
  urgent: 'فوری',
}

// ==========================================
// Session Type Labels (Persian)
// ==========================================
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  individual: 'فردی',
  group: 'گروهی',
  family: 'خانوادگی',
  crisis: 'بحرانی',
  follow_up: 'پیگیری',
}

// ==========================================
// Status Labels (Persian)
// ==========================================
export const STATUS_LABELS: Record<CounselingStatus, string> = {
  active: 'فعال',
  closed: 'بسته شده',
  referred: 'ارجاع شده',
}

// ==========================================
// Contact Type Labels (Persian)
// ==========================================
export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  phone: 'تلفنی',
  in_person: 'حضوری',
  email: 'ایمیل',
  message: 'پیام',
  video_call: 'تماس تصویری',
}

// ==========================================
// Cooperation Labels (Persian)
// ==========================================
export const COOPERATION_LABELS: Record<CooperationLevel, string> = {
  excellent: 'عالی',
  good: 'خوب',
  fair: 'متوسط',
  poor: 'ضعیف',
}

// ==========================================
// Severity Labels (Persian)
// ==========================================
export const SEVERITY_LABELS: Record<Severity, string> = {
  mild: 'خفیف',
  moderate: 'متوسط',
  severe: 'شدید',
}

// ==========================================
// Frequency Labels (Persian)
// ==========================================
export const FREQUENCY_LABELS: Record<BehaviorFrequency, string> = {
  rare: 'نادر',
  occasional: 'گاهی',
  frequent: 'مکرر',
  constant: 'دائم',
}

