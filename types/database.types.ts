// =====================================
// 🗄️ Database Types
// =====================================
// این فایل بعد از ایجاد schema در Supabase
// با دستور generate-types بروزرسانی می‌شود:
// npm run generate-types

// فعلاً type‌های پایه را به صورت دستی تعریف می‌کنیم

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'teacher' | 'parent' | 'student' | 'admin'
          school_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: 'teacher' | 'parent' | 'student' | 'admin'
          school_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'teacher' | 'parent' | 'student' | 'admin'
          school_id?: string | null
          created_at?: string
        }
      }
      schools: {
        Row: {
          id: string
          name: string
          address: string | null
          subscription_status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          subscription_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          subscription_status?: string
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string
          school_id: string
          class_id: string
          grade: number
          parent_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id: string
          class_id: string
          grade: number
          parent_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string
          class_id?: string
          grade?: number
          parent_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          school_id: string
          name: string
          teacher_id: string
          academic_year: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          teacher_id: string
          academic_year?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          teacher_id?: string
          academic_year?: string | null
          created_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          student_id: string
          subject: string
          score: number
          exam_type: string | null
          exam_date: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          subject: string
          score: number
          exam_type?: string | null
          exam_date: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          subject?: string
          score?: number
          exam_type?: string | null
          exam_date?: string
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          date?: string
          status?: 'present' | 'absent' | 'late' | 'excused'
          created_at?: string
        }
      }
      ai_analyses: {
        Row: {
          id: string
          student_id: string
          analysis_type: string
          prompt_used: string | null
          ai_response: Json
          model_used: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          analysis_type: string
          prompt_used?: string | null
          ai_response: Json
          model_used?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          analysis_type?: string
          prompt_used?: string | null
          ai_response?: Json
          model_used?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

