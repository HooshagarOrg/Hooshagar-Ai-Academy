import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ساخت client با timeout افزایش یافته
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(60000), // 60 ثانیه
      });
    },
  },
})

const studentSchema = z.object({
  full_name: z.string().min(2),
  grade: z.number().int().min(1).max(12),
  parent_email: z.string().email().optional(),
})

export async function GET() {
  try {
    console.log('🔍 GET /api/students - Fetching...');
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('📊 Result:', { count: data?.length, error });

    if (error) throw error

    return NextResponse.json({ students: data || [] })
  } catch (error: any) {
    console.error('❌ GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📥 POST Body:', body)
    
    const validated = studentSchema.parse(body)
    console.log('✅ Validated:', validated)

    // چک تکراری
    const { data: duplicates, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('full_name', validated.full_name)
      .eq('grade', validated.grade)

    if (checkError) {
      console.error('❌ Check error:', checkError)
    }

    if (duplicates && duplicates.length > 0) {
      console.log('⚠️ Duplicate found')
      return NextResponse.json(
        { error: 'دانش‌آموز تکراری است' },
        { status: 400 }
      )
    }

    console.log('✅ Inserting...')

    const { data, error } = await supabase
      .from('students')
      .insert([validated])
      .select()
      .single()

    console.log('📊 Insert result:', { data, error })

    if (error) throw error

    return NextResponse.json({ student: data })
  } catch (error: any) {
    console.error('❌ POST error:', error.message)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
