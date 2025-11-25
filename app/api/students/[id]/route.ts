import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ساخت client با timeout بیشتر
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // افزایش timeout
        signal: AbortSignal.timeout(30000), // 30 ثانیه
      });
    },
  },
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 GET /api/students/[id] -', params.id);

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', params.id)
      .single()

    console.log('📊 Result:', { found: !!data, error });

    if (error) throw error

    return NextResponse.json({ student: data })
  } catch (error: any) {
    console.error('❌ GET [id] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ DELETE /api/students/[id] -', params.id);

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', params.id)

    console.log('📊 Delete result:', { error });

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ DELETE error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
