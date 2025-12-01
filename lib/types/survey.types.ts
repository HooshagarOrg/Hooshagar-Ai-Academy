// ═══════════════════════════════════════════════════════════════════════
// تایپ‌های سیستم نظرسنجی - هوشاگر
// ═══════════════════════════════════════════════════════════════════════

// نوع نظرسنجی
export type SurveyType =
  | 'teacher_performance'
  | 'parent_satisfaction'
  | 'school_services'
  | 'student_feedback'
  | 'staff_evaluation'
  | 'course_feedback'
  | 'facility_quality'
  | 'custom';

// وضعیت نظرسنجی
export type SurveyStatus = 'draft' | 'active' | 'closed' | 'archived';

// نوع سوال
export type QuestionType =
  | 'rating_scale'
  | 'multiple_choice'
  | 'yes_no'
  | 'text'
  | 'rating_stars'
  | 'emoji_rating'
  | 'slider'
  | 'matrix'
  | 'ranking';

// نقش پاسخ‌دهنده
export type RespondentRole = 'parent' | 'student' | 'teacher' | 'staff' | 'admin';

// نظرسنجی
export interface Survey {
  id: string;
  school_id: string | null;
  title: string;
  description: string | null;
  survey_type: SurveyType;
  target_audience: RespondentRole[];
  start_date: string;
  end_date: string;
  status: SurveyStatus;
  is_anonymous: boolean;
  allow_multiple_responses: boolean;
  show_results_to_respondents: boolean;
  total_responses: number;
  target_response_count: number | null;
  cover_image_url: string | null;
  thank_you_message: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// سوال نظرسنجی
export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_order: number;
  question_type: QuestionType;
  options: string[] | null;
  matrix_rows: string[] | null;
  matrix_columns: string[] | null;
  is_required: boolean;
  min_value: number | null;
  max_value: number | null;
  hint_text: string | null;
  created_at: string;
}

// پاسخ نظرسنجی
export interface SurveyResponse {
  id: string;
  survey_id: string;
  question_id: string;
  respondent_id: string | null;
  respondent_role: RespondentRole | null;
  session_id: string;
  answer_value: string | null;
  answer_rating: number | null;
  answer_options: string[] | null;
  answer_ranking: string[] | null;
  answer_matrix: Record<string, number> | null;
  response_time_seconds: number | null;
  created_at: string;
}

// آمار نظرسنجی
export interface SurveyStatistics {
  id: string;
  survey_id: string;
  question_id: string;
  total_responses: number;
  average_rating: number | null;
  median_rating: number | null;
  std_deviation: number | null;
  distribution: Record<string, number> | null;
  common_keywords: string[] | null;
  sentiment_score: number | null;
  last_calculated: string;
}

// ثبت نظرسنجی
export interface SurveySubmission {
  id: string;
  survey_id: string;
  respondent_id: string | null;
  session_id: string;
  status: 'draft' | 'completed';
  started_at: string | null;
  completed_at: string;
  total_time_seconds: number | null;
  xp_earned: number;
}

// ═══════════════════════════════════════════════════════════════════════
// تایپ‌های UI
// ═══════════════════════════════════════════════════════════════════════

// نظرسنجی با سوالات
export interface SurveyWithQuestions extends Survey {
  questions: SurveyQuestion[];
}

// نتایج سوال
export interface QuestionResult {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  question_order: number;
  total_responses: number;
  average_rating: number | null;
  median_rating: number | null;
  distribution: Record<string, number> | null;
}

// نتایج کامل نظرسنجی
export interface SurveyResults {
  survey: Survey;
  questions: QuestionResult[];
  total_responses: number;
  response_rate: number;
  responses_by_role: Record<RespondentRole, number>;
  daily_responses: Array<{ date: string; count: number }>;
  text_responses: Array<{
    question_id: string;
    responses: Array<{
      text: string;
      sentiment: 'positive' | 'neutral' | 'negative';
      created_at: string;
    }>;
  }>;
}

// داده‌های نمودار
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }>;
}

// ایموجی‌های رتبه‌بندی
export const EMOJI_RATINGS = ['😞', '😐', '🙂', '😊', '😍'] as const;
export type EmojiRating = (typeof EMOJI_RATINGS)[number];

// برچسب‌های نوع نظرسنجی
export const SURVEY_TYPE_LABELS: Record<SurveyType, string> = {
  teacher_performance: 'عملکرد معلم',
  parent_satisfaction: 'رضایت والدین',
  school_services: 'خدمات مدرسه',
  student_feedback: 'بازخورد دانش‌آموز',
  staff_evaluation: 'ارزیابی کارکنان',
  course_feedback: 'بازخورد درس',
  facility_quality: 'کیفیت امکانات',
  custom: 'سفارشی',
};

// برچسب‌های نوع سوال
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  rating_scale: 'مقیاس امتیاز',
  multiple_choice: 'چندگزینه‌ای',
  yes_no: 'بله/خیر',
  text: 'متنی',
  rating_stars: 'ستاره‌ای',
  emoji_rating: 'ایموجی',
  slider: 'اسلایدر',
  matrix: 'ماتریسی',
  ranking: 'رتبه‌بندی',
};

// ═══════════════════════════════════════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════════════════════════════════════

// محاسبه روزهای باقیمانده
export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// تبدیل امتیاز به درصد
export function ratingToPercentage(rating: number, max: number = 5): number {
  return Math.round((rating / max) * 100);
}

// تشخیص احساس از متن
export function detectSentiment(
  text: string
): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'عالی',
    'خوب',
    'ممنون',
    'مهربان',
    'دلسوز',
    'باتجربه',
    'حرفه‌ای',
    'صبور',
  ];
  const negativeWords = [
    'بد',
    'ضعیف',
    'نامناسب',
    'کند',
    'بی‌توجه',
    'سخت‌گیر',
  ];

  const lowerText = text.toLowerCase();
  let score = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) score += 1;
  });

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) score -= 1;
  });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// تبدیل توزیع به آرایه برای نمودار
export function distributionToChartData(
  distribution: Record<string, number>,
  labels?: string[]
): ChartData {
  const keys = labels || Object.keys(distribution).sort();
  return {
    labels: keys,
    datasets: [
      {
        label: 'تعداد',
        data: keys.map((k) => distribution[k] || 0),
        backgroundColor: [
          '#ef4444',
          '#f97316',
          '#eab308',
          '#22c55e',
          '#10b981',
        ],
      },
    ],
  };
}

// محاسبه میانگین وزنی
export function calculateWeightedAverage(
  distribution: Record<string, number>
): number {
  let totalWeight = 0;
  let totalValue = 0;

  Object.entries(distribution).forEach(([key, count]) => {
    const value = parseInt(key);
    if (!isNaN(value)) {
      totalWeight += count;
      totalValue += value * count;
    }
  });

  return totalWeight > 0 ? totalValue / totalWeight : 0;
}
