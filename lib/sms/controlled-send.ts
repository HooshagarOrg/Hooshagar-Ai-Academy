/**
 * کنترل ارسال پیامک — سقف روزانه مدرسه + لاگ هزینه
 * OTP از سقف روزانه معاف است (ولی لاگ می‌شود).
 */

import { createServiceClient } from '@/lib/supabase/service'
import {
  createSmsProvider,
  sendSmsWithRetry,
  type SmsProvider,
  type SmsResult,
} from '@/lib/sms/provider'
import { logger } from '@/lib/logger'

export type SmsKind =
  | 'otp'
  | 'lottery'
  | 'weekly'
  | 'parent_invite'
  | 'financial'
  | 'broadcast'
  | 'other'

export interface ControlledSmsInput {
  to: string
  text: string
  schoolId?: string | null
  userId?: string | null
  smsType: SmsKind
  /** فقط برای OTP — سقف روزانه اعمال نمی‌شود */
  bypassDailyCap?: boolean
  relatedQueueId?: string | null
  relatedQueueType?: string | null
  provider?: SmsProvider
}

export interface ControlledSmsResult extends SmsResult {
  blockedByCap?: boolean
  remainingToday?: number
}

const DEFAULT_DAILY_LIMIT = 100

function tehranDayStartIso(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  // تقریبی: نیمه‌شب تهران ≈ 20:30 UTC روز قبل در تابستان؛ برای شمارش روزانه کافی است
  return `${y}-${m}-${d}T00:00:00+03:30`
}

export async function getSchoolDailySmsLimit(schoolId: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = createServiceClient() as any
  const { data } = await client
    .from('school_sms_settings')
    .select('daily_sms_limit')
    .eq('school_id', schoolId)
    .maybeSingle()

  const limit = data?.daily_sms_limit
  if (typeof limit === 'number' && limit > 0) return limit
  return DEFAULT_DAILY_LIMIT
}

export async function countSchoolSmsToday(schoolId: string): Promise<number> {
  const supabase = createServiceClient()
  const since = tehranDayStartIso()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any

  const { count, error } = await client
    .from('sms_delivery_log')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .in('status', ['sent', 'delivered'])
    .gte('created_at', since)

  if (error) {
    const { count: fallbackCount } = await client
      .from('sms_delivery_log')
      .select('id', { count: 'exact', head: true })
      .filter('provider_response->>school_id', 'eq', schoolId)
      .in('status', ['sent', 'delivered'])
      .gte('created_at', since)
    return fallbackCount ?? 0
  }

  return count ?? 0
}

export async function getSchoolSmsRemaining(schoolId: string): Promise<{
  limit: number
  used: number
  remaining: number
}> {
  const limit = await getSchoolDailySmsLimit(schoolId)
  const used = await countSchoolSmsToday(schoolId)
  return { limit, used, remaining: Math.max(0, limit - used) }
}

export async function logSmsDelivery(params: {
  schoolId?: string | null
  userId?: string | null
  phone: string
  text: string
  smsType: SmsKind
  result: SmsResult
  relatedQueueId?: string | null
  relatedQueueType?: string | null
  deliveryTimeMs?: number
}): Promise<void> {
  try {
    const supabase = createServiceClient()
    const status = params.result.success ? 'delivered' : 'failed'
    const row: Record<string, unknown> = {
      related_queue_id: params.relatedQueueId ?? null,
      related_queue_type: params.relatedQueueType ?? params.smsType,
      user_id: params.userId ?? null,
      phone_number: params.phone,
      sms_text: params.text.slice(0, 2000),
      sms_type: params.smsType,
      provider_name: params.result.provider ?? 'kavenegar',
      provider_response: {
        school_id: params.schoolId ?? null,
        messageId: params.result.messageId ?? null,
        error: params.result.error ?? null,
      },
      delivery_time_ms: params.deliveryTimeMs ?? null,
      cost: params.result.cost ?? 0,
      status,
      status_updated_at: new Date().toISOString(),
      error_message: params.result.error ?? null,
    }
    if (params.schoolId) {
      row.school_id = params.schoolId
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('sms_delivery_log').insert(row)
    if (error) {
      logger.warn('sms_delivery_log insert failed', {
        context: 'sms-guard',
        error: error.message,
      })
    }
  } catch (err) {
    logger.warn('sms_delivery_log unexpected error', {
      context: 'sms-guard',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * ارسال یک پیامک با سقف روزانه + لاگ
 */
export async function sendControlledSms(
  input: ControlledSmsInput
): Promise<ControlledSmsResult> {
  const bypass = input.bypassDailyCap === true || input.smsType === 'otp'
  let remainingToday: number | undefined

  if (!bypass && input.schoolId) {
    const { remaining } = await getSchoolSmsRemaining(input.schoolId)
    remainingToday = remaining
    if (remaining <= 0) {
      logger.warn('SMS blocked by daily cap', {
        context: 'sms-guard',
        schoolId: input.schoolId,
        smsType: input.smsType,
      })
      const blocked: ControlledSmsResult = {
        success: false,
        error: 'سقف روزانه پیامک مدرسه به پایان رسیده است',
        blockedByCap: true,
        remainingToday: 0,
        provider: 'guard',
      }
      await logSmsDelivery({
        schoolId: input.schoolId,
        userId: input.userId,
        phone: input.to,
        text: input.text,
        smsType: input.smsType,
        result: blocked,
        relatedQueueId: input.relatedQueueId,
        relatedQueueType: input.relatedQueueType,
      })
      return blocked
    }
  }

  const provider = input.provider ?? createSmsProvider()
  const started = Date.now()
  const result = await sendSmsWithRetry(provider, input.to, input.text)
  const deliveryTimeMs = Date.now() - started

  await logSmsDelivery({
    schoolId: input.schoolId,
    userId: input.userId,
    phone: input.to,
    text: input.text,
    smsType: input.smsType,
    result,
    relatedQueueId: input.relatedQueueId,
    relatedQueueType: input.relatedQueueType,
    deliveryTimeMs,
  })

  return {
    ...result,
    remainingToday:
      remainingToday !== undefined
        ? Math.max(0, remainingToday - (result.success ? 1 : 0))
        : undefined,
  }
}

/**
 * ارسال دسته‌ای با احترام به سقف باقی‌مانده
 */
export async function sendControlledSmsBatch(
  messages: Array<{ to: string; text: string; userId?: string | null }>,
  meta: {
    schoolId?: string | null
    smsType: SmsKind
    delayMs?: number
  }
): Promise<Array<ControlledSmsResult & { to: string }>> {
  const results: Array<ControlledSmsResult & { to: string }> = []
  let remaining = meta.schoolId
    ? (await getSchoolSmsRemaining(meta.schoolId)).remaining
    : messages.length

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (meta.schoolId && remaining <= 0) {
      results.push({
        to: msg.to,
        success: false,
        error: 'سقف روزانه پیامک مدرسه به پایان رسیده است',
        blockedByCap: true,
        remainingToday: 0,
        provider: 'guard',
      })
      continue
    }

    const result = await sendControlledSms({
      to: msg.to,
      text: msg.text,
      userId: msg.userId,
      schoolId: meta.schoolId,
      smsType: meta.smsType,
    })
    results.push({ ...result, to: msg.to })
    if (result.success && meta.schoolId) remaining -= 1

    if (i < messages.length - 1) {
      await new Promise((r) => setTimeout(r, meta.delayMs ?? 1000))
    }
  }

  return results
}
