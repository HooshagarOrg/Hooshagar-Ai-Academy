import type { AICapability } from '@/lib/ai-provider'

export type EvalCapability = Extract<
  AICapability,
  | 'student_analyzer'
  | 'story_wizard'
  | 'study_buddy'
  | 'content_creator'
  | 'homework_evaluator'
  | 'summarizer'
>

export interface StudentEvalFixture {
  fullName: string
  grade: number
  grades: Array<{ subject: string; score: number; examType: string; examDate: string }>
  attendance: { absencesThisMonth: number; lateArrivals: number }
  behavior: { positives: string[]; improvements: string[]; notes: string }
}

export interface AnalysisResult {
  analysis: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  risk_level: 'low' | 'medium' | 'high'
}

export interface EvalJudgeResult {
  pass: boolean
  reasons: string[]
}

export interface RegressionCase {
  id: string
  capability: EvalCapability
  prompt: string
}

export interface RegressionSnapshotRow {
  id: string
  capability: EvalCapability
  googleModel: string
  output: string
  qualityScore: number
}
