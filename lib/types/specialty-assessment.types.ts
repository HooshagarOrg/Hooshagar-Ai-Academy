// =====================================
// 🎨 Specialty Assessment Types
// =====================================
// سیستم گزارشات معلمان تخصصی
// موسیقی، هنر، ورزش، STEM

import { Json } from '@/types/database.types'

// ==========================================
// Base Types
// ==========================================
export type AssessmentType = 'music' | 'art' | 'sports' | 'stem'
export type STEMSubject = 'robotics' | 'coding' | 'electronics' | 'engineering'
export type FinalGrade = 'excellent' | 'very_good' | 'good' | 'satisfactory' | 'needs_improvement'

export const FINAL_GRADE_LABELS: Record<FinalGrade, string> = {
  excellent: 'عالی',
  very_good: 'خیلی خوب',
  good: 'خوب',
  satisfactory: 'قابل قبول',
  needs_improvement: 'نیاز به تلاش',
}

export const STEM_SUBJECT_LABELS: Record<STEMSubject, string> = {
  robotics: 'رباتیک',
  coding: 'برنامه‌نویسی',
  electronics: 'الکترونیک',
  engineering: 'مهندسی',
}

// ==========================================
// Art Techniques
// ==========================================
export const ART_TECHNIQUES = [
  'نقاشی',
  'خطاطی',
  'مجسمه‌سازی',
  'کاردستی',
  'کولاژ',
  'طراحی',
  'سفالگری',
  'چاپ',
  'اوریگامی',
] as const

export type ArtTechnique = typeof ART_TECHNIQUES[number]

// ==========================================
// Sports
// ==========================================
export const SPECIALIZED_SPORTS = [
  'فوتبال',
  'والیبال',
  'بسکتبال',
  'شنا',
  'ژیمناستیک',
  'دو و میدانی',
  'بدمینتون',
  'تنیس روی میز',
  'کاراته',
  'تکواندو',
  'شطرنج',
] as const

export type SpecializedSport = typeof SPECIALIZED_SPORTS[number]

// ==========================================
// Programming Languages
// ==========================================
export const PROGRAMMING_LANGUAGES = [
  'Scratch',
  'Python',
  'Arduino',
  'C++',
  'JavaScript',
  'HTML/CSS',
  'App Inventor',
] as const

export type ProgrammingLanguage = typeof PROGRAMMING_LANGUAGES[number]

// ==========================================
// STEM Concepts
// ==========================================
export const STEM_CONCEPTS = [
  'حلقه‌ها',
  'شرط‌ها',
  'توابع',
  'آرایه‌ها',
  'متغیرها',
  'سنسورها',
  'موتورها',
  'مدارها',
  'الگوریتم',
] as const

export type STEMConcept = typeof STEM_CONCEPTS[number]

// ==========================================
// Music Assessment
// ==========================================
export interface MusicAssessment {
  id: string
  student_id: string
  teacher_id: string
  school_id: string
  
  assessment_date: string
  semester: string
  academic_year: string
  
  // Basic Skills (1-5)
  rhythm_sense: number | null
  pitch_accuracy: number | null
  music_reading: number | null
  listening_skills: number | null
  
  // Performance
  vocal_performance: number | null
  
  // Instrument
  instrument: string | null
  instrument_proficiency: number | null
  
  // Creativity
  creativity: number | null
  expression: number | null
  
  // Participation
  participation_score: number | null
  behavior_score: number | null
  
  // Notes
  teacher_notes: string | null
  achievements: string | null
  areas_for_improvement: string | null
  songs_learned: string[] | null
  
  final_grade: string | null
  
  created_at: string
  updated_at: string
  
  // Relations
  student?: StudentInfo
  teacher?: TeacherInfo
}

// ==========================================
// Art Assessment
// ==========================================
export interface ArtProject {
  title: string
  date: string
  score: number
  description?: string
  image_url?: string
}

export interface ArtAssessment {
  id: string
  student_id: string
  teacher_id: string
  school_id: string
  
  assessment_date: string
  semester: string
  academic_year: string
  
  // Art Skills (1-5)
  creativity: number | null
  originality: number | null
  technical_skills: number | null
  use_of_color: number | null
  composition: number | null
  attention_to_detail: number | null
  
  // Techniques
  mastered_techniques: string[] | null
  
  // Projects
  notable_projects: ArtProject[] | null
  
  // Participation
  participation_score: number | null
  cleanup_responsibility: number | null
  respect_for_materials: number | null
  
  // Notes
  teacher_notes: string | null
  strengths: string | null
  areas_for_growth: string | null
  
  // Awards
  exhibitions: string[] | null
  awards: string | null
  
  final_grade: string | null
  
  created_at: string
  updated_at: string
  
  // Relations
  student?: StudentInfo
  teacher?: TeacherInfo
}

// ==========================================
// Sports Assessment
// ==========================================
export interface FitnessTestResults {
  sprint_50m?: string
  long_jump?: string
  sit_and_reach?: string
  push_ups?: string
  sit_ups?: string
  shuttle_run?: string
  [key: string]: string | undefined
}

export interface SportsAssessment {
  id: string
  student_id: string
  teacher_id: string
  school_id: string
  
  assessment_date: string
  semester: string
  academic_year: string
  
  // Physical Fitness (1-5)
  cardiovascular_endurance: number | null
  muscular_strength: number | null
  muscular_endurance: number | null
  flexibility: number | null
  body_composition: number | null
  coordination: number | null
  agility: number | null
  balance: number | null
  
  // Sports Skills (1-5)
  team_sports_skills: number | null
  individual_sports_skills: number | null
  game_understanding: number | null
  
  // Sportsmanship (1-5)
  sportsmanship: number | null
  teamwork: number | null
  leadership: number | null
  effort: number | null
  following_rules: number | null
  
  // Specialized
  specialized_sports: string[] | null
  sport_achievements: string | null
  
  // Fitness Test
  fitness_test_results: FitnessTestResults | null
  
  // Notes
  teacher_notes: string | null
  strengths: string | null
  areas_for_improvement: string | null
  
  // Competitions
  competitions_participated: string[] | null
  medals_awards: string | null
  
  final_grade: string | null
  
  created_at: string
  updated_at: string
  
  // Relations
  student?: StudentInfo
  teacher?: TeacherInfo
}

// ==========================================
// STEM Assessment
// ==========================================
export interface STEMProject {
  name: string
  complexity?: 'easy' | 'medium' | 'hard'
  score: number
  date: string
  language?: string
  description?: string
}

export interface STEMAssessment {
  id: string
  student_id: string
  teacher_id: string
  school_id: string
  
  assessment_date: string
  semester: string
  academic_year: string
  subject: STEMSubject
  
  // Technical Skills (1-5)
  problem_solving: number | null
  logical_thinking: number | null
  computational_thinking: number | null
  debugging_skills: number | null
  technical_skills: number | null
  
  // Creativity (1-5)
  creativity: number | null
  innovation: number | null
  
  // Teamwork (1-5)
  collaboration: number | null
  communication: number | null
  
  // Projects
  completed_projects: STEMProject[] | null
  
  // Skills
  programming_languages: string[] | null
  concepts_mastered: string[] | null
  
  // Competitions
  competitions_participated: string[] | null
  rankings: string | null
  awards: string | null
  
  // Notes
  teacher_notes: string | null
  strengths: string | null
  next_steps: string | null
  
  final_grade: string | null
  
  created_at: string
  updated_at: string
  
  // Relations
  student?: StudentInfo
  teacher?: TeacherInfo
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

export interface TeacherInfo {
  id: string
  full_name: string
  avatar_url?: string
}

// ==========================================
// Input Types
// ==========================================
export interface CreateMusicAssessmentInput {
  student_id: string
  assessment_date: string
  semester: string
  academic_year: string
  rhythm_sense?: number
  pitch_accuracy?: number
  music_reading?: number
  listening_skills?: number
  vocal_performance?: number
  instrument?: string
  instrument_proficiency?: number
  creativity?: number
  expression?: number
  participation_score?: number
  behavior_score?: number
  teacher_notes?: string
  achievements?: string
  areas_for_improvement?: string
  songs_learned?: string[]
  final_grade?: string
}

export interface CreateArtAssessmentInput {
  student_id: string
  assessment_date: string
  semester: string
  academic_year: string
  creativity?: number
  originality?: number
  technical_skills?: number
  use_of_color?: number
  composition?: number
  attention_to_detail?: number
  mastered_techniques?: string[]
  notable_projects?: ArtProject[]
  participation_score?: number
  cleanup_responsibility?: number
  respect_for_materials?: number
  teacher_notes?: string
  strengths?: string
  areas_for_growth?: string
  exhibitions?: string[]
  awards?: string
  final_grade?: string
}

export interface CreateSportsAssessmentInput {
  student_id: string
  assessment_date: string
  semester: string
  academic_year: string
  cardiovascular_endurance?: number
  muscular_strength?: number
  muscular_endurance?: number
  flexibility?: number
  body_composition?: number
  coordination?: number
  agility?: number
  balance?: number
  team_sports_skills?: number
  individual_sports_skills?: number
  game_understanding?: number
  sportsmanship?: number
  teamwork?: number
  leadership?: number
  effort?: number
  following_rules?: number
  specialized_sports?: string[]
  sport_achievements?: string
  fitness_test_results?: FitnessTestResults
  teacher_notes?: string
  strengths?: string
  areas_for_improvement?: string
  competitions_participated?: string[]
  medals_awards?: string
  final_grade?: string
}

export interface CreateSTEMAssessmentInput {
  student_id: string
  assessment_date: string
  semester: string
  academic_year: string
  subject: STEMSubject
  problem_solving?: number
  logical_thinking?: number
  computational_thinking?: number
  debugging_skills?: number
  technical_skills?: number
  creativity?: number
  innovation?: number
  collaboration?: number
  communication?: number
  completed_projects?: STEMProject[]
  programming_languages?: string[]
  concepts_mastered?: string[]
  competitions_participated?: string[]
  rankings?: string
  awards?: string
  teacher_notes?: string
  strengths?: string
  next_steps?: string
  final_grade?: string
}

// ==========================================
// Skill Labels (Persian)
// ==========================================
export const MUSIC_SKILL_LABELS: Record<string, string> = {
  rhythm_sense: 'حس ریتم',
  pitch_accuracy: 'دقت آهنگ',
  music_reading: 'خواندن نت',
  listening_skills: 'مهارت گوش دادن',
  vocal_performance: 'اجرای آوازی',
  instrument_proficiency: 'مهارت ساز',
  creativity: 'خلاقیت',
  expression: 'ابراز احساس',
  participation_score: 'مشارکت',
  behavior_score: 'رفتار',
}

export const ART_SKILL_LABELS: Record<string, string> = {
  creativity: 'خلاقیت',
  originality: 'اصالت',
  technical_skills: 'مهارت فنی',
  use_of_color: 'استفاده از رنگ',
  composition: 'ترکیب‌بندی',
  attention_to_detail: 'دقت در جزئیات',
  participation_score: 'مشارکت',
  cleanup_responsibility: 'مسئولیت نظافت',
  respect_for_materials: 'احترام به مواد',
}

export const SPORTS_FITNESS_LABELS: Record<string, string> = {
  cardiovascular_endurance: 'استقامت قلبی',
  muscular_strength: 'قدرت عضلانی',
  muscular_endurance: 'استقامت عضلانی',
  flexibility: 'انعطاف‌پذیری',
  body_composition: 'ترکیب بدنی',
  coordination: 'هماهنگی',
  agility: 'چابکی',
  balance: 'تعادل',
}

export const SPORTS_SKILL_LABELS: Record<string, string> = {
  team_sports_skills: 'ورزش تیمی',
  individual_sports_skills: 'ورزش فردی',
  game_understanding: 'درک بازی',
  sportsmanship: 'روحیه ورزشکاری',
  teamwork: 'کار تیمی',
  leadership: 'رهبری',
  effort: 'تلاش',
  following_rules: 'رعایت قوانین',
}

export const STEM_SKILL_LABELS: Record<string, string> = {
  problem_solving: 'حل مسئله',
  logical_thinking: 'تفکر منطقی',
  computational_thinking: 'تفکر محاسباتی',
  debugging_skills: 'رفع خطا',
  technical_skills: 'مهارت فنی',
  creativity: 'خلاقیت',
  innovation: 'نوآوری',
  collaboration: 'همکاری',
  communication: 'ارتباطات',
}

// ==========================================
// Fitness Test Labels
// ==========================================
export const FITNESS_TEST_LABELS: Record<string, { label: string; unit: string }> = {
  sprint_50m: { label: 'دو ۵۰ متر', unit: 'ثانیه' },
  long_jump: { label: 'پرش طول', unit: 'متر' },
  sit_and_reach: { label: 'انعطاف نشسته', unit: 'سانتی‌متر' },
  push_ups: { label: 'شنا رفتن', unit: 'تعداد' },
  sit_ups: { label: 'دراز نشست', unit: 'تعداد' },
  shuttle_run: { label: 'دو رفت و برگشت', unit: 'ثانیه' },
}

// ==========================================
// Calculate Average Score
// ==========================================
export function calculateAverageScore(scores: (number | null | undefined)[]): number {
  const validScores = scores.filter((s): s is number => s !== null && s !== undefined)
  if (validScores.length === 0) return 0
  return Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
}

