import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { withAuth } from '@/lib/security/api-guard'

const CONTACT_ROLES = [
  'teacher',
  'art_teacher',
  'sports_teacher',
  'parent',
  'admin',
  'principal',
  'counselor',
  'educational_vp',
  'disciplinary_vp',
  'health_vp',
  'financial_vp',
  'evaluation_vp',
  'secretary',
] as const

/**
 * GET /api/messages/contacts?q=...
 * مخاطبین قابل پیام در همان مدرسه
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId) {
        return NextResponse.json(
          { contacts: [], error: 'مدرسه برای حساب شما مشخص نیست' },
          { status: 400 }
        )
      }

      const { searchParams } = new URL(request.url)
      const q = (searchParams.get('q') || '').trim().slice(0, 80)
      const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100)

      const admin = createServiceClient()
      let query = admin
        .from('profiles')
        .select('id, full_name, role')
        .eq('school_id', ctx.schoolId)
        .neq('id', ctx.userId)
        .in('role', [...CONTACT_ROLES])
        .order('full_name', { ascending: true })
        .limit(limit)

      if (q) {
        const escaped = q.replace(/[%_,]/g, '')
        if (escaped) {
          query = query.ilike('full_name', `%${escaped}%`)
        }
      }

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ contacts: [], error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        contacts: (data || []).map((p) => ({
          id: p.id,
          name: p.full_name || 'بدون نام',
          role: p.role,
        })),
      })
    },
    { rateLimit: 'api_default' }
  )
}
