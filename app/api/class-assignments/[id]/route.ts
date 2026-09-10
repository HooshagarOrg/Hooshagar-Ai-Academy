import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AuthContext } from '@/lib/security/api-guard'
import { deleteFromArvan, getSignedDownloadUrl } from '@/lib/arvan-storage'
import {
  CLASS_FILES_ROLES,
  CLASS_ASSIGNMENT_SELECT,
  getScopedClassIds,
  type ClassAssignmentRow,
} from '@/lib/class-files'

export const maxDuration = 30

const idSchema = z.string().uuid()

async function loadAssignment(ctx: AuthContext, id: string): Promise<ClassAssignmentRow | null> {
  const classIds = await getScopedClassIds(ctx.supabase, {
    userId: ctx.userId,
    role: ctx.role,
    schoolId: ctx.schoolId,
  })
  const { data } = await ctx.supabase
    .from('class_assignments')
    .select(CLASS_ASSIGNMENT_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  const row = data as ClassAssignmentRow
  if (!classIds.includes(row.class_id)) return null
  return row
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    request,
    async (ctx) => {
      const { id } = await params
      if (!idSchema.safeParse(id).success) {
        return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 })
      }

      const assignment = await loadAssignment(ctx, id)
      if (!assignment) {
        return NextResponse.json({ error: 'تکلیف یافت نشد' }, { status: 404 })
      }

      let promptSignedUrl: string | null = null
      if (assignment.prompt_file_path) {
        promptSignedUrl = await getSignedDownloadUrl(assignment.prompt_file_path, 900)
      }

      return NextResponse.json({ assignment, promptSignedUrl, expiresIn: 900 })
    },
    { roles: CLASS_FILES_ROLES, rateLimit: 'api_default' }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    request,
    async (ctx) => {
      const { id } = await params
      if (!idSchema.safeParse(id).success) {
        return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 })
      }

      const assignment = await loadAssignment(ctx, id)
      if (!assignment) {
        return NextResponse.json({ error: 'تکلیف یافت نشد' }, { status: 404 })
      }

      const canDelete =
        assignment.created_by === ctx.userId ||
        ctx.role === 'principal' ||
        ctx.role === 'admin' ||
        ctx.role === 'platform_admin'

      if (!canDelete) {
        return NextResponse.json({ error: 'اجازه حذف ندارید' }, { status: 403 })
      }

      const { data: subs } = await ctx.supabase
        .from('assignment_submissions')
        .select('file_path')
        .eq('assignment_id', id)

      const { error } = await ctx.supabase.from('class_assignments').delete().eq('id', id)
      if (error) {
        console.error('class_assignments delete error:', error)
        return NextResponse.json({ error: 'حذف ناموفق بود' }, { status: 500 })
      }

      if (assignment.prompt_file_path) {
        await deleteFromArvan(assignment.prompt_file_path)
      }
      for (const row of subs || []) {
        if (row.file_path) await deleteFromArvan(row.file_path)
      }

      return NextResponse.json({ success: true })
    },
    { roles: CLASS_FILES_ROLES, rateLimit: 'api_default' }
  )
}
