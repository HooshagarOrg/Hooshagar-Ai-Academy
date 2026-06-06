import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/virtual-class/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const { user } = await requirePlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

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
}
