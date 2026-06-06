import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePlatformAdmin } from '@/lib/virtual-class/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

const createSchema = z.object({
  virtual_class_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  status: z.enum(['scheduled', 'live', 'ended', 'cancelled']).optional(),
  join_buffer_minutes: z.number().int().min(0).max(60).optional(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'live', 'ended', 'cancelled']).optional(),
  join_buffer_minutes: z.number().int().min(0).max(60).optional(),
})

export async function GET(request: NextRequest) {
  const { user } = await requirePlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

  const virtualClassId = new URL(request.url).searchParams.get('virtual_class_id')
  const service = createServiceClient()

  let query = service
    .from('virtual_class_sessions')
    .select('*')
    .order('starts_at', { ascending: false })

  if (virtualClassId) {
    query = query.eq('virtual_class_id', virtualClassId)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessions: data || [] })
}

export async function POST(request: NextRequest) {
  const { user } = await requirePlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'داده نامعتبر', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('virtual_class_sessions')
    .insert({
      virtual_class_id: parsed.data.virtual_class_id,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      status: parsed.data.status ?? 'scheduled',
      join_buffer_minutes: parsed.data.join_buffer_minutes ?? 5,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, session: data })
}

export async function PATCH(request: NextRequest) {
  const { user } = await requirePlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'داده نامعتبر', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { id, ...updates } = parsed.data
  const service = createServiceClient()

  const { data, error } = await service
    .from('virtual_class_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, session: data })
}

export async function DELETE(request: NextRequest) {
  const { user } = await requirePlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('virtual_class_sessions')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
