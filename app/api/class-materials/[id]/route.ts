import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AuthContext } from '@/lib/security/api-guard'
import { deleteFromArvan, getSignedDownloadUrl } from '@/lib/arvan-storage'
import {
  CLASS_FILES_ROLES,
  CLASS_MATERIAL_SELECT,
  getScopedClassIds,
  type ClassMaterialRow,
} from '@/lib/class-files'

export const maxDuration = 30

const idSchema = z.string().uuid()

async function loadVisibleMaterial(
  ctx: AuthContext,
  id: string
): Promise<ClassMaterialRow | null> {
  const classIds = await getScopedClassIds(ctx.supabase, {
    userId: ctx.userId,
    role: ctx.role,
    schoolId: ctx.schoolId,
  })
  const { data } = await ctx.supabase
    .from('class_materials')
    .select(CLASS_MATERIAL_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (!data) return null
  const row = data as ClassMaterialRow
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

      const material = await loadVisibleMaterial(ctx, id)
      if (!material) {
        return NextResponse.json({ error: 'منبع یافت نشد' }, { status: 404 })
      }

      const signedUrl = await getSignedDownloadUrl(material.file_path, 900)
      if (!signedUrl) {
        return NextResponse.json({ error: 'تولید لینک دانلود ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({ material, signedUrl, expiresIn: 900 })
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

      const material = await loadVisibleMaterial(ctx, id)
      if (!material) {
        return NextResponse.json({ error: 'منبع یافت نشد' }, { status: 404 })
      }

      const canDelete =
        material.uploaded_by === ctx.userId ||
        ctx.role === 'principal' ||
        ctx.role === 'admin' ||
        ctx.role === 'platform_admin'

      if (!canDelete) {
        return NextResponse.json({ error: 'اجازه حذف ندارید' }, { status: 403 })
      }

      const { error } = await ctx.supabase.from('class_materials').delete().eq('id', id)
      if (error) {
        console.error('class_materials delete error:', error)
        return NextResponse.json({ error: 'حذف ناموفق بود' }, { status: 500 })
      }

      await deleteFromArvan(material.file_path)
      return NextResponse.json({ success: true })
    },
    { roles: CLASS_FILES_ROLES, rateLimit: 'api_default' }
  )
}
