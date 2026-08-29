import { formatPhoneNumber, sendOTPWithTokens, validatePhoneNumber } from '@/lib/kavenegar'
import {
  logSmsDelivery,
  sendControlledSms,
} from '@/lib/sms/controlled-send'
import {
  SUPPORT_SMS_CATEGORY_TOKEN,
  formatSupportOperatorSms,
  formatSupportResolvedSms,
  parseOperatorPhones,
  supportFirstName,
} from '@/lib/support/sms-copy'
import type { ReportCategory } from '@/lib/support/report-problem'

async function sendSupportSms(params: {
  to: string
  text: string
  schoolId: string | null
  userId: string | null
  template?: string
  tokens?: {
    token: string
    token2?: string
    token3?: string
    token10?: string
    token20?: string
  }
}): Promise<boolean> {
  if (params.template && params.tokens) {
    const lookup = await sendOTPWithTokens(params.to, params.tokens, params.template)
    await logSmsDelivery({
      schoolId: params.schoolId,
      userId: params.userId,
      phone: params.to,
      text: params.text,
      smsType: 'support',
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
    smsType: 'support',
    bypassDailyCap: true,
  })
  return plain.success
}

export async function notifyOperatorsNewTicket(input: {
  category: ReportCategory
  reporterName: string | null
  schoolName: string | null
  schoolId: string | null
}): Promise<boolean> {
  const phones = parseOperatorPhones(process.env.SUPPORT_OPERATOR_PHONE)
  if (phones.length === 0) return false

  const text = formatSupportOperatorSms(input)
  const template = process.env.KAVENEGAR_TEMPLATE_SUPPORT_NEW
  let anySent = false

  for (const phone of phones) {
    const ok = await sendSupportSms({
      to: phone,
      text,
      schoolId: input.schoolId,
      userId: null,
      template,
      tokens: template
        ? {
            token: SUPPORT_SMS_CATEGORY_TOKEN[input.category],
            token10: supportFirstName(input.reporterName),
            token20: (input.schoolName || 'نامشخص').slice(0, 20),
          }
        : undefined,
    })
    if (ok) anySent = true
  }

  return anySent
}

export async function notifyReporterTicketResolved(input: {
  phone: string | null
  reporterName: string | null
  schoolId: string | null
  userId: string
}): Promise<boolean> {
  if (!input.phone) return false
  const formatted = formatPhoneNumber(input.phone)
  if (!validatePhoneNumber(formatted)) return false

  const text = formatSupportResolvedSms(input.reporterName)
  const template = process.env.KAVENEGAR_TEMPLATE_SUPPORT_RESOLVED

  return sendSupportSms({
    to: formatted,
    text,
    schoolId: input.schoolId,
    userId: input.userId,
    template,
    tokens: template
      ? {
          token: 'ok',
          token10: supportFirstName(input.reporterName),
        }
      : undefined,
  })
}
