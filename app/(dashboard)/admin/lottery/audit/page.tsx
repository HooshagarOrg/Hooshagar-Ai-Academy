'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Loader2 } from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxErrorState } from '@/components/lux/lux-page-states'

type LotteryRow = {
  id: string
  target_grade: number
  academic_year: string
  status: string
  lottery_time?: string
}

type LotteryLog = {
  id: string
  log_type?: string
  message?: string
  created_at?: string
}

export default function LotteryAuditPage() {
  const [lotteries, setLotteries] = useState<LotteryRow[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [logs, setLogs] = useState<LotteryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadList = () => {
    setLoading(true)
    setError('')
    fetch('/api/lottery/admin')
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setError(data.error || 'دریافت قرعه‌کشی‌ها ناموفق بود')
          setLotteries([])
          return
        }
        const list: LotteryRow[] = data.lotteries || []
        setLotteries(list)
        if (list[0]) setSelectedId(list[0].id)
      })
      .catch(() => setError('اتصال برقرار نشد'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadList()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setLogs([])
      return
    }
    fetch(`/api/lottery/admin?id=${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLogs(data.logs || [])
        else setLogs([])
      })
      .catch(() => setLogs([]))
  }, [selectedId])

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-brand-green" />
          ممیزی قرعه‌کشی
        </span>
      }
      description="لاگ واقعی اجرا — بدون دادهٔ نمونه"
      actions={
        <Link href="/admin/lottery" className="lux-btn-ghost min-h-10 px-4 text-sm">
          مدیریت قرعه‌کشی
        </Link>
      }
    >
      {loading ? (
        <DashboardSectionBlock>
          <div className="flex justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--lux-primary)]" />
          </div>
        </DashboardSectionBlock>
      ) : error ? (
        <DashboardSectionBlock>
          <LuxErrorState message={error} onRetry={loadList} variant="lux" />
        </DashboardSectionBlock>
      ) : lotteries.length === 0 ? (
        <DashboardSectionBlock>
          <LuxEmptyState
            title="قرعه‌کشی ثبت نشده"
            description="وقتی قرعه‌کشی اجرا شود، لاگ آن اینجا دیده می‌شود."
          />
        </DashboardSectionBlock>
      ) : (
        <DashboardSectionBlock>
          <div className="mb-4 flex flex-wrap gap-2">
            {lotteries.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={`rounded-xl px-3 py-2 text-sm ${
                  selectedId === row.id
                    ? 'bg-[var(--lux-primary)] text-white'
                    : 'bg-white/5 text-[var(--lux-text)]'
                }`}
              >
                پایه {row.target_grade} — {row.academic_year}
              </button>
            ))}
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-[var(--lux-text-muted)]">لاگی برای این دوره نیست.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--lux-text)]"
                >
                  <span className="text-[var(--lux-text-muted)]">{log.log_type || 'رویداد'}</span>
                  {' — '}
                  {log.message || '—'}
                </li>
              ))}
            </ul>
          )}
        </DashboardSectionBlock>
      )}
    </DashboardPage>
  )
}
