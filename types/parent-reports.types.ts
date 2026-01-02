// ============================================
// Parent Reports System Types
// ============================================

export interface ParentReport {
  id: string;
  parent_id: string;
  student_id: string;
  report_type: 'weekly' | 'monthly' | 'term' | 'custom';
  period_start: string;
  period_end: string;
  
  // محتوای گزارش
  summary?: string;
  ai_insights?: string;
  
  // آمار
  stats: ReportStats;
  
  // نمودارها
  charts: ReportCharts;
  
  // پیشرفت
  progress: ReportProgress;
  
  // توصیه‌ها
  recommendations: Recommendation[];
  
  // وضعیت
  report_status: 'draft' | 'published' | 'archived';
  
  // متادیتا
  generated_at: string;
  published_at?: string;
  viewed_at?: string;
  view_count: number;
  
  created_at: string;
  updated_at: string;
  
  // Relations (optional)
  student?: {
    id: string;
    full_name: string;
    grade?: string;
    class_name?: string;
  };
}

export interface ReportStats {
  average_grade: number; // میانگین نمرات (0-100)
  attendance_rate: number; // درصد حضور (0-100)
  homework_completion: number; // درصد انجام تکالیف (0-100)
  behavior_score: number; // امتیاز رفتاری (-10 to 10)
  total_score: number; // نمره کل (0-100)
  
  // جزئیات بیشتر
  grades_by_subject?: { [subject: string]: number };
  total_absences?: number;
  total_late?: number;
  homework_submitted?: number;
  homework_total?: number;
  positive_behaviors?: number;
  negative_behaviors?: number;
}

export interface ReportCharts {
  grades_trend?: ChartData[]; // روند نمرات در طول زمان
  attendance_trend?: ChartData[]; // روند حضور در طول زمان
  subject_comparison?: ChartData[]; // مقایسه نمرات دروس مختلف
  behavior_timeline?: ChartData[]; // خط زمانی رفتارها
}

export interface ChartData {
  label: string;
  value: number;
  date?: string;
  metadata?: any;
}

export interface ReportProgress {
  grade_change: number; // تغییر نسبت به دوره قبل
  attendance_change: number;
  homework_change: number;
  behavior_change: number;
  
  previous_period?: {
    average_grade: number;
    attendance_rate: number;
    homework_completion: number;
    behavior_score: number;
  };
}

export interface Recommendation {
  type: 'strength' | 'improvement' | 'concern' | 'achievement';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action?: string; // اقدام پیشنهادی
}

// ============================================
// Related Types
// ============================================

export interface HomeworkSubmission {
  id: string;
  student_id: string;
  subject: string;
  title: string;
  description?: string;
  
  assigned_date: string;
  due_date: string;
  submitted_at?: string;
  
  total_score?: number;
  received_score?: number;
  
  submission_status: 'pending' | 'submitted' | 'graded' | 'late';
  
  files: FileInfo[];
  
  teacher_feedback?: string;
  teacher_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface StudentAttendance {
  id: string;
  student_id: string;
  attendance_date: string;
  
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  
  arrival_time?: string;
  departure_time?: string;
  notes?: string;
  
  recorded_by?: string;
  
  created_at: string;
  updated_at: string;
}

export interface StudentGrade {
  id: string;
  student_id: string;
  subject: string;
  
  exam_type: 'quiz' | 'midterm' | 'final' | 'homework' | 'project';
  title: string;
  score: number;
  max_score: number;
  percentage: number;
  
  exam_date: string;
  
  notes?: string;
  teacher_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface StudentBehavior {
  id: string;
  student_id: string;
  behavior_date: string;
  
  behavior_type: 'positive' | 'negative' | 'neutral';
  
  title: string;
  description?: string;
  severity: number; // 0-10
  
  behavior_points: number; // مثبت یا منفی
  
  reported_by?: string;
  action_taken?: string;
  
  created_at: string;
  updated_at: string;
}

export interface FileInfo {
  name: string;
  url: string;
  size: number;
  type: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface GenerateReportRequest {
  student_id: string;
  report_type: 'weekly' | 'monthly' | 'term' | 'custom';
  period_start: string;
  period_end: string;
}

export interface GenerateReportResponse {
  success: boolean;
  report_id?: string;
  report?: ParentReport;
  error?: string;
}

export interface GetReportsRequest {
  student_id?: string;
  parent_id?: string;
  report_type?: string;
  report_status?: string;
  limit?: number;
  offset?: number;
}

export interface GetReportsResponse {
  success: boolean;
  reports: ParentReport[];
  total: number;
  error?: string;
}

export interface AIInsightsRequest {
  report_id: string;
  student_id: string;
  period_start: string;
  period_end: string;
}

export interface AIInsightsResponse {
  success: boolean;
  insights?: string;
  recommendations?: Recommendation[];
  risk_level?: 'low' | 'medium' | 'high';
  error?: string;
}

