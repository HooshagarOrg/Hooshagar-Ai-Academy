import { z } from 'zod'

export const SUPPORT_CONTACT_EMAIL = 'contact@hooshagar.ir'

export const REPORT_CATEGORIES = ['bug', 'account', 'help'] as const
export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const reportProblemSchema = z.object({
  category: z.enum(REPORT_CATEGORIES, {
    errorMap: () => ({ message: 'نوع گزارش را انتخاب کنید' }),
  }),
  message: z
    .string()
    .trim()
    .min(10, 'توضیح باید حداقل ۱۰ کاراکتر باشد')
    .max(1000, 'توضیح نباید بیشتر از ۱۰۰۰ کاراکتر باشد'),
  path: z.string().max(500).optional(),
  errorName: z.string().max(200).optional().nullable(),
  digest: z.string().max(120).optional().nullable(),
})

export type ReportProblemInput = z.infer<typeof reportProblemSchema>

export const updateTicketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES, {
    errorMap: () => ({ message: 'وضعیت نامعتبر است' }),
  }),
})

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  bug: 'برنامه خراب است (صفحه سفید، دکمه کار نمی‌کند)',
  account: 'ورود، رمز یا حساب کاربری',
  help: 'سؤال یا راهنمای استفاده',
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'باز',
  in_progress: 'در حال بررسی',
  resolved: 'حل شد',
}

export function shouldEmailSupportInbox(category: ReportCategory): boolean {
  return category === 'account' || category === 'help'
}

export function supportSavedNotice(
  category: ReportCategory,
  emailSent: boolean
): string {
  if (category === 'bug') {
    return 'گزارش باگ ثبت شد. تیم فنی آن را در Sentry و صندوق پشتیبانی می‌بیند.'
  }
  if (emailSent) {
    return `گزارش ثبت شد. مدرسه در صندوق پشتیبانی می‌بیند و یک نسخه به ${SUPPORT_CONTACT_EMAIL} ارسال شد.`
  }
  return 'گزارش ثبت شد. مدرسه و اپراتور آن را در صندوق پشتیبانی داخل برنامه می‌بینند.'
}

export type SupportTicketRow = {
  id: string
  user_id: string
  school_id: string | null
  role: string
  category: ReportCategory
  status: TicketStatus
  message: string
  path: string | null
  error_name: string | null
  digest: string | null
  reporter_name: string | null
  reporter_email: string | null
  school_name: string | null
  email_sent_at: string | null
  created_at: string
  updated_at: string
}
