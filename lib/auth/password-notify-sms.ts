/**
 * پیامک‌های مرتبط با رمز عبور (Lookup کاوه‌نگار + fallback متن آزاد)
 */

import {
  formatPhoneNumber,
  getKavenegarAdminResetTemplate,
  getKavenegarPasswordChangedTemplate,
  KAVENEGAR_LOOKUP_PLACEHOLDER,
  sendOTPWithTokens,
  validatePhoneNumber,
} from '@/lib/kavenegar'
import { logSmsDelivery, sendControlledSms } from '@/lib/sms/controlled-send'
import { supportFirstName } from '@/lib/support/sms-copy'

function formatAdminResetSms(fullName: string | null | undefined): string {
  const who = supportFirstName(fullName)
  return `هوشاگر: ${who} عزیز، رمز شما توسط مدیر بازنشانی شد. با رمز موقت وارد شوید و فوراً آن را عوض کنید.`
}

function formatPasswordChangedSms(fullName: string | null | undefined): string {
  const who = supportFirstName(fullName)
  return `هوشاگر: ${who} عزیز، رمز عبور شما با موفقیت تغییر کرد. اگر این کار را نکرده‌اید با پشتیبانی تماس بگیرید.`
}

async function sendPasswordSms(params: {
  to: string
  text: string
  schoolId: string | null
  userId: string | null
  template?: string
  tokens?: {
    token: string
    token10?: string
  }
}): Promise<boolean> {
  if (params.template && params.tokens) {
    const lookup = await sendOTPWithTokens(params.to, params.tokens, params.template)
    await logSmsDelivery({
      schoolId: params.schoolId,
      userId: params.userId,
      phone: params.to,
      text: params.text,
      smsType: 'other',
      result: {
        success: lookup.success,
        messageId: lookup.messageId,
        cost: lookup.cost,
        error: lookup.error,
        provider: 'kavenegar',
      },
    })
    if (lookup.success) return true
  }

  const plain = await sendControlledSms({
    to: params.to,
    text: params.text,
    schoolId: params.schoolId,
    userId: params.userId,
    smsType: 'other',
    bypassDailyCap: true,
  })
  return plain.success
}

export async function notifyAdminPasswordResetSms(input: {
  phone: string | null | undefined
  fullName: string | null | undefined
  schoolId: string | null
  userId: string
}): Promise<boolean> {
  if (!input.phone) return false
  const formatted = formatPhoneNumber(input.phone)
  if (!validatePhoneNumber(formatted)) return false

  const text = formatAdminResetSms(input.fullName)
  const template = getKavenegarAdminResetTemplate()

  return sendPasswordSms({
    to: formatted,
    text,
    schoolId: input.schoolId,
    userId: input.userId,
    template,
    tokens: template
      ? {
          token: KAVENEGAR_LOOKUP_PLACEHOLDER.adminPasswordReset,
          token10: supportFirstName(input.fullName),
        }
      : undefined,
  })
}

export async function notifyPasswordChangedSms(input: {
  phone: string | null | undefined
  fullName: string | null | undefined
  schoolId: string | null
  userId: string
}): Promise<boolean> {
  if (!input.phone) return false
  const formatted = formatPhoneNumber(input.phone)
  if (!validatePhoneNumber(formatted)) return false

  const text = formatPasswordChangedSms(input.fullName)
  const template = getKavenegarPasswordChangedTemplate()

  return sendPasswordSms({
    to: formatted,
    text,
    schoolId: input.schoolId,
    userId: input.userId,
    template,
    tokens: template
      ? {
          token: KAVENEGAR_LOOKUP_PLACEHOLDER.passwordChanged,
          token10: supportFirstName(input.fullName),
        }
      : undefined,
  })
}
