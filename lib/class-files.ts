import type { SupabaseClient } from '@supabase/supabase-js'
import type { AllowedRole } from '@/lib/security/api-guard'
import { getTeacherClassIds, getTeacherClasses, type TeacherClassRow } from '@/lib/teacher/class-scope'

export const CLASS_FILES_ROLES: AllowedRole[] = [
  'teacher',
  'principal',
  'admin',
  'platform_admin',
  'student',
  'parent',
]

export const CLASS_FILES_TEACHER_ROLES: AllowedRole[] = [
  'teacher',
  'principal',
  'admin',
  'platform_admin',
]

export const MAX_DOC_BYTES = 20 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export const CLASS_FILE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
] as const

export type ClassFileMime = (typeof CLASS_FILE_MIME)[number]

export type ClassFileKind = 'materials' | 'prompts' | 'submissions'

export const CLASS_MATERIAL_SELECT =
  'id, school_id, class_id, title, description, file_path, file_size, mime_type, original_name, uploaded_by, created_at'

export const CLASS_ASSIGNMENT_SELECT =
  'id, school_id, class_id, title, description, subject, due_at, max_score, prompt_file_path, prompt_file_size, prompt_mime_type, prompt_original_name, created_by, created_at'

export const ASSIGNMENT_SUBMISSION_SELECT =
  'id, assignment_id, student_id, file_path, file_size, mime_type, original_name, submitted_by, submitted_at, status, score, feedback, graded_at, graded_by, grade_id, created_at'

export type ClassMaterialRow = {
  id: string
  school_id: string
  class_id: string
  title: string
  description: string | null
  file_path: string
  file_size: number
  mime_type: string
  original_name: string
  uploaded_by: string | null
  created_at: string
}

export type ClassAssignmentRow = {
  id: string
  school_id: string
  class_id: string
  title: string
  description: string | null
  subject: string
  due_at: string | null
  max_score: number
  prompt_file_path: string | null
  prompt_file_size: number | null
  prompt_mime_type: string | null
  prompt_original_name: string | null
  created_by: string | null
  created_at: string
}

export type AssignmentSubmissionRow = {
  id: string
  assignment_id: string
  student_id: string
  file_path: string
  file_size: number
  mime_type: string
  original_name: string
  submitted_by: string | null
  submitted_at: string
  status: 'submitted' | 'late' | 'graded'
  score: number | null
  feedback: string | null
  graded_at: string | null
  graded_by: string | null
  grade_id: string | null
  created_at: string
}

export function isClassFileMime(mime: string): mime is ClassFileMime {
  return (CLASS_FILE_MIME as readonly string[]).includes(mime)
}

export function isVideoMime(mime: string): boolean {
  return mime === 'video/mp4' || mime === 'video/webm'
}

export function maxBytesForMime(mime: string): number {
  return isVideoMime(mime) ? MAX_VIDEO_BYTES : MAX_DOC_BYTES
}

export function isTeacherClassRole(role: AllowedRole): boolean {
  return CLASS_FILES_TEACHER_ROLES.includes(role)
}

export function classFilePathPrefix(schoolId: string, classId: string, kind: ClassFileKind): string {
  return `class-files/${schoolId}/${classId}/${kind}/`
}

export async function assertTeacherOwnsClass(
  supabase: SupabaseClient,
  params: { userId: string; role: AllowedRole; schoolId: string | null; classId: string }
): Promise<boolean> {
  const { data: cls } = await supabase
    .from('classes')
    .select('id, school_id, teacher_id')
    .eq('id', params.classId)
    .maybeSingle()

  if (!cls) return false

  if (params.role === 'platform_admin' || params.role === 'admin') {
    return !params.schoolId || cls.school_id === params.schoolId || params.role === 'platform_admin'
  }

  if (params.role === 'principal') {
    return Boolean(params.schoolId && cls.school_id === params.schoolId)
  }

  return cls.teacher_id === params.userId
}

export async function getScopedClassIds(
  supabase: SupabaseClient,
  params: { userId: string; role: AllowedRole; schoolId: string | null }
): Promise<string[]> {
  if (params.role === 'student') {
    const { data } = await supabase
      .from('students')
      .select('class_id')
      .eq('user_id', params.userId)
      .maybeSingle()
    return data?.class_id ? [data.class_id] : []
  }

  if (params.role === 'parent') {
    const { data } = await supabase
      .from('students')
      .select('class_id')
      .or(
        `parent_id.eq.${params.userId},father_user_id.eq.${params.userId},mother_user_id.eq.${params.userId}`
      )
    const ids = (data || [])
      .map((row) => row.class_id)
      .filter((id): id is string => typeof id === 'string')
    return [...new Set(ids)]
  }

  if (params.role === 'principal' && params.schoolId) {
    const { data } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', params.schoolId)
      .limit(50)
    return (data || []).map((row) => row.id)
  }

  if (params.role === 'admin' || params.role === 'platform_admin') {
    if (params.schoolId) {
      const { data } = await supabase
        .from('classes')
        .select('id')
        .eq('school_id', params.schoolId)
        .limit(50)
      return (data || []).map((row) => row.id)
    }
    return []
  }

  return getTeacherClassIds(supabase, params.userId)
}

export async function getScopedClasses(
  supabase: SupabaseClient,
  params: { userId: string; role: AllowedRole; schoolId: string | null }
): Promise<TeacherClassRow[]> {
  if (params.role === 'teacher') {
    return getTeacherClasses(supabase, params.userId)
  }

  const ids = await getScopedClassIds(supabase, params)
  if (ids.length === 0) return []

  const { data } = await supabase.from('classes').select('id, name, grade').in('id', ids).limit(50)
  return (data || []).map((row) => ({
    id: row.id,
    name: row.name ?? null,
    grade: typeof row.grade === 'number' ? row.grade : null,
  }))
}

export async function getLinkedStudentsForUser(
  supabase: SupabaseClient,
  params: { userId: string; role: AllowedRole }
): Promise<Array<{ id: string; full_name: string | null; class_id: string | null }>> {
  if (params.role === 'student') {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, class_id')
      .eq('user_id', params.userId)
      .maybeSingle()
    return data ? [data] : []
  }

  if (params.role === 'parent') {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, class_id')
      .or(
        `parent_id.eq.${params.userId},father_user_id.eq.${params.userId},mother_user_id.eq.${params.userId}`
      )
    return data || []
  }

  return []
}

export function submissionStatus(dueAt: string | null, submittedAt: Date): 'submitted' | 'late' {
  if (!dueAt) return 'submitted'
  return submittedAt.getTime() > new Date(dueAt).getTime() ? 'late' : 'submitted'
}
