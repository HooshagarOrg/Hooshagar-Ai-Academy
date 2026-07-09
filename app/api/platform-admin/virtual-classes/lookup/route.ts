import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { withAuth } from '@/lib/security/api-guard'
import { PLATFORM_ADMIN_ROLES } from '@/lib/security/sensitive-api-roles'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const schoolId = new URL(request.url).searchParams.get('school_id')
      if (!schoolId) {
        return NextResponse.json({ error: 'school_id الزامی است' }, { status: 400 })
      }

      const service = createServiceClient()
      const { data: classes, error } = await service
        .from('classes')
        .select('id, name, grade, teacher_id, academic_year')
        .eq('school_id', schoolId)
        .order('grade')
        .order('name')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const classIds = (classes || []).map((c) => c.id)
      const { data: existing } = classIds.length
        ? await service
            .from('virtual_classes')
            .select('class_id')
            .in('class_id', classIds)
        : { data: [] }

      const usedClassIds = new Set((existing || []).map((e) => e.class_id))

      return NextResponse.json({
        classes: (classes || []).map((c) => ({
          ...c,
          has_virtual_class: usedClassIds.has(c.id),
        })),
      })
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}
