import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'
import { withAuth } from '@/lib/security/api-guard'
import { getSupabaseServerUrl } from '@/lib/supabase/resolve-url'

function getAdmin() {
  return createAdminClient(
    getSupabaseServerUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const supabase = await createClient()
      const { confirmation } = (await request.json()) as { confirmation?: string }

      if (confirmation !== 'DELETE_MY_DATA') {
        return NextResponse.json(
          { error: 'برای تأیید حذف، عبارت DELETE_MY_DATA را ارسال کنید' },
          { status: 400 }
        )
      }

      const { data: gdprRequest } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: ctx.userId,
          request_type: 'delete',
          status: 'processing',
        })
        .select()
        .single()

      const { error } = await supabase.rpc('delete_user_data', { p_user_id: ctx.userId })
      if (error) throw error

      // حذف حساب Auth (service role)
      const admin = getAdmin()
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(ctx.userId)
      if (authDeleteError) {
        logger.error({ err: authDeleteError.message }, 'GDPR auth user delete failed')
        await supabase
          .from('gdpr_requests')
          .update({
            status: 'failed',
            processed_at: new Date().toISOString(),
            notes: authDeleteError.message,
          })
          .eq('id', gdprRequest?.id)
        return NextResponse.json(
          {
            error:
              'داده‌های اپ حذف شد ولی حذف حساب احراز هویت کامل نشد. با پشتیبانی تماس بگیرید.',
          },
          { status: 500 }
        )
      }

      await supabase
        .from('gdpr_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', gdprRequest?.id)

      await supabase.auth.signOut()

      logger.info({ userId: ctx.userId }, 'GDPR data deletion completed')

      return NextResponse.json({
        success: true,
        message: 'داده‌های حساب و احراز هویت حذف شد',
        requestId: gdprRequest?.id,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error({ error: message }, 'GDPR deletion failed')
      return NextResponse.json({ error: message }, { status: 500 })
    }
  })
}
