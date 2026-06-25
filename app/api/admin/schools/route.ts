import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const SCHOOL_VIEW_ROLES: AllowedRole[] = [...ADMIN_ROLES, 'principal']

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const supabase = await createClient()
      const { data, error, count } = await supabase
        .from('schools')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ schools: [], total: 0, error: error.message })
      }

      return NextResponse.json({ schools: data || [], total: count || 0 })
    },
    { roles: SCHOOL_VIEW_ROLES, rateLimit: 'admin_action' }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const body = await request.json()
      const { name, code, address, phone, education_stage, type } = body

      if (!name) return NextResponse.json({ error: 'نام مدرسه الزامی است' }, { status: 400 })

      const supabase = await createClient()
      const { data, error } = await supabase
        .from('schools')
        .insert({ name, code, address, phone, education_stage, type })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, school: data })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}

export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const body = await request.json()
      const { id, ...updates } = body
      if (!id) return NextResponse.json({ error: 'شناسه مدرسه الزامی' }, { status: 400 })

      const supabase = await createClient()
      const { error } = await supabase.from('schools').update(updates).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}

export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (!id) return NextResponse.json({ error: 'شناسه مدرسه الزامی' }, { status: 400 })

      const supabase = await createClient()
      const { error } = await supabase.from('schools').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}
