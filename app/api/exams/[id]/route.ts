import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { AI_USER_ROLES, EXAM_MANAGE_ROLES } from '@/lib/security/sensitive-api-roles'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const supabase = await createClient()

        const { data: exam, error: examError } = await supabase
          .from('exams')
          .select(`
            *,
            exam_questions (
              id,
              question_text,
              question_type,
              options,
              points,
              question_order,
              attachments
            )
          `)
          .eq('id', params.id)
          .single()

        if (examError) {
          if (examError.code === 'PGRST116') {
            return NextResponse.json({ error: 'امتحان یافت نشد' }, { status: 404 })
          }
          console.error('خطای دریافت امتحان:', examError)
          return NextResponse.json({ error: 'خطا در دریافت امتحان' }, { status: 500 })
        }

        if (ctx.role === 'student') {
          if (exam.exam_questions) {
            exam.exam_questions = exam.exam_questions.map(
              (q: { options?: { is_correct?: boolean }[] }) => {
                if (q.options) {
                  q.options = q.options.map((opt: { is_correct?: boolean }) => {
                    const { is_correct, ...rest } = opt
                    return rest
                  })
                }
                return q
              }
            )
          }
        }

        if (exam.exam_questions) {
          exam.exam_questions.sort(
            (a: { question_order: number }, b: { question_order: number }) =>
              a.question_order - b.question_order
          )
        }

        return NextResponse.json({ exam })
      } catch (error) {
        console.error('خطای سرور:', error)
        return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
      }
    },
    { roles: AI_USER_ROLES }
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient()
        const body = await request.json()

        const { data, error } = await supabase
          .from('exams')
          .update({
            ...body,
            updated_at: new Date().toISOString(),
          })
          .eq('id', params.id)
          .select()
          .single()

        if (error) {
          console.error('خطای بروزرسانی امتحان:', error)
          return NextResponse.json({ error: 'خطا در بروزرسانی امتحان' }, { status: 500 })
        }

        return NextResponse.json({
          message: 'امتحان بروزرسانی شد',
          exam: data,
        })
      } catch (error) {
        console.error('خطای سرور:', error)
        return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
      }
    },
    { roles: EXAM_MANAGE_ROLES }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient()

        const { error } = await supabase.from('exams').delete().eq('id', params.id)

        if (error) {
          console.error('خطای حذف امتحان:', error)
          return NextResponse.json({ error: 'خطا در حذف امتحان' }, { status: 500 })
        }

        return NextResponse.json({ message: 'امتحان حذف شد' })
      } catch (error) {
        console.error('خطای سرور:', error)
        return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
      }
    },
    { roles: EXAM_MANAGE_ROLES }
  )
}
