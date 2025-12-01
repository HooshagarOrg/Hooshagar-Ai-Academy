// ═══════════════════════════════════════════════════════════════════════
// تایپ‌های سیستم امتحانات - هوشاگر
// ═══════════════════════════════════════════════════════════════════════

// نوع سوال
export type ExamQuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'matching'
  | 'fill_blank'
  | 'numerical'
  | 'code';

// سطح دشواری
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// وضعیت جلسه امتحان
export type ExamSessionStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'reviewed';

// گزینه چندگزینه‌ای
export interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

// جفت تطبیقی
export interface MatchingPair {
  left: string;
  right: string;
}

// تنظیمات امتحان
export interface ExamConfig {
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_score_immediately: boolean;
  allow_review: boolean;
  negative_marking: boolean;
  negative_score: number;
  passing_score: number;
  time_limit_minutes: number;
  questions_per_page: number;
  calculator_allowed: boolean;
  formula_sheet_url: string | null;
}

// توزیع سطح دشواری
export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

// سوال بانک سوالات
export interface QuestionBankItem {
  id: string;
  school_id: string | null;
  question_text: string;
  question_type: ExamQuestionType;
  subject: string;
  grade_level: number;
  chapter: string | null;
  topic: string | null;
  difficulty: DifficultyLevel;
  options: QuestionOption[] | null;
  correct_answer: string | null;
  correct_answers: string[] | null;
  matching_pairs: MatchingPair[] | null;
  points: number;
  explanation: string | null;
  hint: string | null;
  attachments: Record<string, string> | null;
  image_url: string | null;
  tags: string[];
  usage_count: number;
  correct_rate: number | null;
  avg_time_seconds: number | null;
  is_verified: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// سوال امتحان
export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_bank_id: string | null;
  question_text: string;
  question_type: ExamQuestionType;
  question_order: number;
  options: QuestionOption[] | null;
  correct_answer: string | null;
  correct_answers: string[] | null;
  matching_pairs: MatchingPair[] | null;
  points: number;
  explanation: string | null;
  hint: string | null;
  image_url: string | null;
  difficulty: DifficultyLevel | null;
  created_at: string;
}

// پاسخ دانش‌آموز
export interface ExamAnswer {
  id: string;
  exam_id: string;
  question_id: string;
  student_id: string;
  session_id: string | null;
  answer_text: string | null;
  answer_option: string | null;
  answer_options: string[] | null;
  answer_file_url: string | null;
  answer_matching: Record<string, string> | null;
  points_earned: number | null;
  max_points: number | null;
  is_correct: boolean | null;
  is_partial: boolean;
  graded_by: string | null;
  graded_at: string | null;
  teacher_comment: string | null;
  time_spent_seconds: number | null;
  is_flagged: boolean;
  answered_at: string;
}

// فعالیت مشکوک
export interface SuspiciousActivity {
  tab_switches: number;
  copy_paste: number;
  right_clicks: number;
}

// جلسه امتحان
export interface ExamSession {
  id: string;
  exam_id: string;
  student_id: string;
  status: ExamSessionStatus;
  started_at: string | null;
  submitted_at: string | null;
  time_remaining_seconds: number | null;
  current_question_index: number;
  total_score: number | null;
  max_score: number | null;
  percentage: number | null;
  passed: boolean | null;
  rank: number | null;
  ip_address: string | null;
  user_agent: string | null;
  suspicious_activity: SuspiciousActivity;
  created_at: string;
  updated_at: string;
}

// امتحان
export interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: number;
  total_questions: number;
  duration_minutes: number;
  status: 'draft' | 'active' | 'closed';
  exam_date: string;
  exam_config: ExamConfig;
  auto_grade: boolean;
  difficulty_distribution: DifficultyDistribution | null;
  total_points: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// آمار امتحان
export interface ExamStatistics {
  id: string;
  exam_id: string;
  total_participants: number;
  total_submitted: number;
  average_score: number | null;
  median_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
  std_deviation: number | null;
  pass_rate: number | null;
  score_distribution: Record<string, number> | null;
  hardest_questions: Array<{ question_id: string; correct_rate: number }> | null;
  easiest_questions: Array<{ question_id: string; correct_rate: number }> | null;
  average_time_minutes: number | null;
  last_calculated: string;
}

// ═══════════════════════════════════════════════════════════════════════
// تایپ‌های UI
// ═══════════════════════════════════════════════════════════════════════

// امتحان با سوالات
export interface ExamWithQuestions extends Exam {
  questions: ExamQuestion[];
}

// وضعیت پاسخ‌دهی
export type AnswerStatus = 'answered' | 'unanswered' | 'flagged' | 'current';

// نقشه سوالات
export interface QuestionMap {
  index: number;
  question_id: string;
  status: AnswerStatus;
}

// نتیجه امتحان
export interface ExamResult {
  total_score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  xp_earned: number;
  rank?: number;
  total_participants?: number;
}

// بررسی سوال
export interface QuestionReview {
  question: ExamQuestion;
  answer: ExamAnswer | null;
  is_correct: boolean | null;
  correct_answer: string | null;
  points_earned: number;
  max_points: number;
}

// فیلتر بانک سوالات
export interface QuestionBankFilter {
  subject?: string;
  grade_level?: number;
  chapter?: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  question_type?: ExamQuestionType;
  tags?: string[];
  search?: string;
}

// ایجاد سوال جدید
export interface CreateQuestionInput {
  question_text: string;
  question_type: ExamQuestionType;
  subject: string;
  grade_level: number;
  chapter?: string;
  topic?: string;
  difficulty: DifficultyLevel;
  options?: QuestionOption[];
  correct_answer?: string;
  correct_answers?: string[];
  matching_pairs?: MatchingPair[];
  points: number;
  explanation?: string;
  hint?: string;
  image_url?: string;
  tags?: string[];
}

// ایجاد امتحان جدید
export interface CreateExamInput {
  title: string;
  subject: string;
  grade: number;
  exam_date: string;
  duration_minutes: number;
  exam_config?: Partial<ExamConfig>;
  difficulty_distribution?: DifficultyDistribution;
}

// ═══════════════════════════════════════════════════════════════════════
// ثابت‌ها
// ═══════════════════════════════════════════════════════════════════════

// برچسب‌های نوع سوال
export const QUESTION_TYPE_LABELS: Record<ExamQuestionType, string> = {
  multiple_choice: 'چندگزینه‌ای',
  true_false: 'صحیح/غلط',
  short_answer: 'کوتاه‌پاسخ',
  essay: 'تشریحی',
  matching: 'تطبیقی',
  fill_blank: 'جای خالی',
  numerical: 'عددی',
  code: 'کد نویسی',
};

// برچسب‌های سطح دشواری
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'آسان',
  medium: 'متوسط',
  hard: 'سخت',
};

// رنگ‌های سطح دشواری
export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  hard: 'text-red-600 bg-red-100',
};

// آیکون‌های سطح دشواری
export const DIFFICULTY_ICONS: Record<DifficultyLevel, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
};

// دروس
export const SUBJECTS = [
  'ریاضی',
  'فارسی',
  'علوم',
  'اجتماعی',
  'قرآن',
  'عربی',
  'انگلیسی',
  'هنر',
  'ورزش',
] as const;

// پایه‌های تحصیلی
export const GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

// ═══════════════════════════════════════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════════════════════════════════════

// فرمت زمان باقیمانده
export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// محاسبه درصد پیشرفت
export function calculateProgress(
  answered: number,
  total: number
): number {
  return total > 0 ? Math.round((answered / total) * 100) : 0;
}

// تعیین رنگ نمره
export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-blue-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

// تعیین برچسب نمره
export function getScoreLabel(percentage: number): string {
  if (percentage >= 90) return 'عالی';
  if (percentage >= 80) return 'خیلی خوب';
  if (percentage >= 70) return 'خوب';
  if (percentage >= 60) return 'قابل قبول';
  if (percentage >= 50) return 'قبول';
  return 'نیاز به تلاش بیشتر';
}

// محاسبه XP بر اساس نمره
export function calculateXP(percentage: number): number {
  if (percentage >= 90) return 200;
  if (percentage >= 80) return 150;
  if (percentage >= 70) return 100;
  if (percentage >= 50) return 50;
  return 20;
}

// ترکیب سوال با گزینه‌های تصادفی
export function shuffleOptions(
  options: QuestionOption[]
): QuestionOption[] {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// تبدیل توزیع نمرات به آرایه
export function scoreDistributionToArray(
  distribution: Record<string, number>
): Array<{ range: string; count: number }> {
  const ranges = ['0-20', '20-40', '40-60', '60-80', '80-100'];
  return ranges.map((range) => ({
    range,
    count: distribution[range] || 0,
  }));
}

// محاسبه امتیاز کل امتحان
export function calculateTotalPoints(questions: ExamQuestion[]): number {
  return questions.reduce((sum, q) => sum + q.points, 0);
}
