'use client'

import { useCallback, useEffect, useState } from 'react'
import { Inbox, Loader2, RefreshCw } from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUSES,
  type ReportCategory,
  type SupportTicketRow,
  type TicketStatus,
} from '@/lib/support/report-problem'

export default function AdminSupportPage() {
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [tickets, setTickets] = useState<SupportTicketRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('open')
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/support/tickets?${params.toString()}`, { cache: 'no-store' })
      const data = (await res.json()) as { tickets?: SupportTicketRow[]; error?: string }
      if (!res.ok) {
        throw new Error(data.error || 'دریافت درخواست‌ها ناموفق بود')
      }
      setTickets(data.tickets || [])
    } catch (err) {
      setTickets([])
      setError(err instanceof Error ? err.message : 'خطا در دریافت')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter])

  useEffect(() => {
    void load()
  }, [load])

  const updateStatus = async (id: string, status: TicketStatus) => {
    setSavingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notifyReporter: status === 'resolved',
        }),
      })
      const data = (await res.json()) as {
        error?: string
        reporterSmsSent?: boolean
        reporterNotifiedInApp?: boolean
      }
      if (!res.ok) {
        throw new Error(data.error || 'به‌روزرسانی ناموفق بود')
      }
      if (status === 'resolved') {
        const parts: string[] = []
        if (data.reporterNotifiedInApp) parts.push('اعلان داخل برنامه')
        if (data.reporterSmsSent) parts.push('پیامک')
        setInfo(
          parts.length > 0
            ? `کاربر با ${parts.join(' و ')} خبر شد.`
            : 'وضعیت حل شد؛ پیامک ارسال نشد (شماره موبایل کاربر را بررسی کنید).'
        )
        setError(null)
      } else {
        setInfo(null)
      }
      await load()
    } catch (err) {
      setInfo(null)
      setError(err instanceof Error ? err.message : 'به‌روزرسانی ناموفق بود')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <DashboardPage
      title="صندوق پشتیبانی"
      description="گزارش ورود و راهنما اینجا ثبت می‌شود. زنگ به اپراتور با پیامک است. با زدن «حل شد» کاربر با اعلان داخل برنامه و پیامک خبر می‌شود. باگ نرم‌افزار در Sentry است."
      actions={
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          نوسازی
        </Button>
      }
    >
      <DashboardSectionBlock>
        <div className="flex flex-wrap gap-2" dir="rtl">
          {(['all', ...TICKET_STATUSES] as const).map((id) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={statusFilter === id ? 'default' : 'outline'}
              onClick={() => setStatusFilter(id)}
            >
              {id === 'all' ? 'همه وضعیت‌ها' : TICKET_STATUS_LABELS[id]}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" dir="rtl">
          {(['all', ...REPORT_CATEGORIES] as const).map((id) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={categoryFilter === id ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(id)}
            >
              {id === 'all' ? 'همه نوع‌ها' : REPORT_CATEGORY_LABELS[id]}
            </Button>
          ))}
        </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        {info && (
          <p className="mb-3 text-sm text-emerald-600" role="status">
            {info}
          </p>
        )}
        {error && (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            در حال بارگذاری…
          </p>
        ) : tickets.length === 0 ? (
          <div className="flex items-start gap-3 text-sm text-muted-foreground" dir="rtl">
            <Inbox className="mt-0.5 size-5 shrink-0" />
            <p>درخواستی با این فیلتر نیست.</p>
          </div>
        ) : (
          <ul className="space-y-3" dir="rtl">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{REPORT_CATEGORY_LABELS[ticket.category]}</Badge>
                  <Badge
                    className={cn(
                      ticket.status === 'resolved' && 'border-emerald-500/40 bg-emerald-500/15',
                      ticket.status === 'in_progress' && 'border-amber-500/40 bg-amber-500/15'
                    )}
                    variant="secondary"
                  >
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </Badge>
                  {ticket.operator_sms_sent_at && (
                    <span className="text-xs text-muted-foreground">پیامک به اپراتور</span>
                  )}
                  {ticket.reporter_resolved_sms_sent_at && (
                    <span className="text-xs text-muted-foreground">پیامک رفع به کاربر</span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{ticket.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {ticket.reporter_name || 'بدون نام'} · {ticket.role} · {ticket.school_name || 'مدرسه نامشخص'}
                  {' · '}
                  {new Date(ticket.created_at).toLocaleString('fa-IR')}
                  {ticket.path ? ` · ${ticket.path}` : ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TICKET_STATUSES.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      variant={ticket.status === status ? 'default' : 'outline'}
                      disabled={savingId === ticket.id || ticket.status === status}
                      onClick={() => void updateStatus(ticket.id, status)}
                    >
                      {savingId === ticket.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      {TICKET_STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
