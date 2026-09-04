'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SENTRY_ISSUES_URL =
  'https://hooshagar-ai-school-platform.sentry.io/issues/'

type HealthPayload = {
  status?: string
  timestamp?: string
  db?: string
  version?: string
  services?: { database?: string; api?: string }
  responseTime?: string
  error?: string
}

function isHealthOk(httpOk: boolean, data: HealthPayload): boolean {
  const statusOk = data.status === 'ok' || data.status === 'healthy'
  const dbOk = data.db === 'ok' || data.services?.database === 'up'
  return httpOk && statusOk && dbOk
}

export default function AdminSystemHealthPage() {
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<HealthPayload | null>(null)
  const [httpOk, setHttpOk] = useState(false)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      const data = (await res.json()) as HealthPayload
      setHealth(data)
      setHttpOk(isHealthOk(res.ok, data))
      setCheckedAt(new Date().toLocaleString('fa-IR'))
    } catch {
      setHealth({
        status: 'unhealthy',
        error: 'اتصال به سرویس سلامت برقرار نشد',
      })
      setHttpOk(false)
      setCheckedAt(new Date().toLocaleString('fa-IR'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const healthy = httpOk

  return (
    <DashboardPage
      title="سلامت سیستم"
      description="دید عملیاتی برای ادمین کل — جزئیات خطاها در Sentry است، نه در این صفحه"
      actions={
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          بررسی مجدد
        </Button>
      }
    >
      <DashboardSectionBlock>
        <div
          className={cn(
            'rounded-xl border p-5',
            healthy
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-red-500/30 bg-red-500/10'
          )}
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <Activity className={cn('size-6', healthy ? 'text-emerald-400' : 'text-red-400')} />
            <div>
              <p className="text-lg font-semibold">
                {loading ? 'در حال بررسی…' : healthy ? 'سبز — سرویس‌ها پاسخ می‌دهند' : 'قرمز — سلامت ناقص است'}
              </p>
              {checkedAt && (
                <p className="mt-1 text-xs text-muted-foreground">آخرین بررسی: {checkedAt}</p>
              )}
            </div>
          </div>
          {health?.responseTime && (
            <p className="mt-3 text-sm text-muted-foreground">زمان پاسخ: {health.responseTime}</p>
          )}
          {health?.services && (
            <p className="mt-1 text-sm text-muted-foreground">
              پایگاه داده: {health.services.database === 'up' ? 'فعال' : 'قطع'}
              {' · '}
              API: {health.services.api === 'up' ? 'فعال' : 'قطع'}
            </p>
          )}
          {health?.error && !healthy && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              اتصال پایگاه داده یا API سلامت برقرار نشد. جزئیات فنی را در Sentry ببینید.
            </p>
          )}
        </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        <a
          href={SENTRY_ISSUES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-role-accent hover:underline"
        >
          باز کردن خطاهای Sentry
          <ExternalLink className="size-4" />
        </a>
        <p className="mt-2 text-xs text-muted-foreground">
          گزارش‌های باگ با برچسب user_report در Sentry دیده می‌شوند. ورود و راهنما در صندوق پشتیبانی داخل برنامه است.
        </p>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
