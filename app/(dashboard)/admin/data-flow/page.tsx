'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertTriangle, CheckCircle, Database, Loader2, RefreshCw, Users, GraduationCap, MessageSquare, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

type Stats = {
  students_total?: number
  students_with_login?: number
  students_with_parent?: number
  parents_total?: number
  teachers_total?: number
  orphan_students?: number
  orphan_parents?: number
  grades_total?: number
  messages_total?: number
  unread_messages?: number
}
type Issue = { severity: 'high' | 'medium' | 'low'; title: string; detail: string; count: number }
type TableCheck = { table: string; ok: boolean; count: number }

export default function AdminDataFlowPage() {
  const [stats, setStats] = useState<Stats>({})
  const [issues, setIssues] = useState<Issue[]>([])
  const [tables, setTables] = useState<TableCheck[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data-flow')
      const data = await res.json()
      setStats(data.stats || {})
      setIssues(data.issues || [])
      setTables(data.tables || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const sevColor: Record<Issue['severity'], string> = {
    high: 'bg-red-500/10 border-red-500/30 text-red-300',
    medium: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    low: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200',
  }

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <Activity className="text-[var(--lux-primary)]" />
          سلامت جریان داده
        </span>
      }
      description="بررسی صحت گردش اطلاعات بین معلم/دانش‌آموز/والد"
      actions={
        <Button onClick={load} variant="outline" className="gap-2">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> بازخوانی
        </Button>
      }
    >
      {loading ? (
        <PageLoading label="در حال بارگذاری سلامت داده..." compact />
      ) : (
        <>
          <DashboardSectionBlock>
            <div className="grid md:grid-cols-4 gap-4">
            <StatCard icon={<Users />} label="دانش‌آموزان" value={stats.students_total || 0} sub={`${stats.students_with_login || 0} با لاگین`} color="blue" />
            <StatCard icon={<Users />} label="والدین" value={stats.parents_total || 0} sub={`${stats.students_with_parent || 0} اتصال`} color="green" />
            <StatCard icon={<Users />} label="معلمان" value={stats.teachers_total || 0} sub="فعال" color="purple" />
            <StatCard icon={<GraduationCap />} label="نمرات ثبت‌شده" value={stats.grades_total || 0} sub="کل سیستم" color="orange" />
            </div>
          </DashboardSectionBlock>

          <DashboardSectionBlock>
            <div className="grid md:grid-cols-2 gap-4">
              <StatCard icon={<MessageSquare />} label="پیام‌های رد و بدل شده" value={stats.messages_total || 0} sub={`${stats.unread_messages || 0} خوانده‌نشده`} color="cyan" />
              <StatCard icon={<FileText />} label="جداول سالم" value={tables.filter(t => t.ok).length} sub={`از ${tables.length} جدول`} color="emerald" />
            </div>
          </DashboardSectionBlock>

          <DashboardSectionBlock>
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-orange-500" />
                مشکلات جریان داده ({issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <div className="text-center py-8 text-emerald-400">
                  <CheckCircle size={48} className="mx-auto mb-2" />
                  هیچ مشکلی در جریان داده شناسایی نشد
                </div>
              ) : (
                <div className="space-y-2">
                  {issues.map((i, idx) => (
                    <div key={idx} className={`p-4 border rounded-lg ${sevColor[i.severity]}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold">{i.title}</p>
                          <p className="text-sm mt-1 opacity-80">{i.detail}</p>
                        </div>
                        <span className="text-2xl font-bold">{i.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            </Card>
          </DashboardSectionBlock>

          <DashboardSectionBlock>
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database /> وضعیت جداول</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                {tables.map(t => (
                  <div key={t.table} className={`p-3 border rounded-lg flex items-center justify-between ${t.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex items-center gap-2">
                      {t.ok ? <CheckCircle className="text-emerald-400" size={18} /> : <AlertTriangle className="text-red-400" size={18} />}
                      <code className="text-sm font-mono">{t.table}</code>
                    </div>
                    <span className="text-xs font-bold text-[var(--lux-text-muted)]">{t.count} رکورد</span>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
          </DashboardSectionBlock>

          <DashboardSectionBlock>
            <Card>
            <CardHeader><CardTitle>نقشه جریان داده</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <FlowItem from="ادمین" to="کاربران" via="ساخت حساب با نقش (معلم/دانش‌آموز/والد)" />
                <FlowItem from="ادمین" to="والد" via="اتصال به فرزندان (children_ids)" />
                <FlowItem from="معلم" to="دانش‌آموز" via="ثبت نمره → نمایش در /student/grades" />
                <FlowItem from="معلم" to="والد" via="ثبت نمره → نمایش در /parent/grades (از طریق parent_id)" />
                <FlowItem from="معلم" to="دانش‌آموز" via="ساخت آزمون → نمایش در /student/exams" />
                <FlowItem from="هر کاربر" to="هر کاربر" via="پیام مستقیم → /messages" />
              </div>
            </CardContent>
            </Card>
          </DashboardSectionBlock>
        </>
      )}
    </DashboardPage>
  )
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number; sub: string; color: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-[var(--lux-secondary)] bg-[var(--lux-secondary)]/10',
    green: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-[var(--lux-primary)] bg-[var(--lux-primary)]/10',
    orange: 'text-amber-400 bg-amber-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
          <div className="flex-1">
            <p className="text-xs text-[var(--lux-text-muted)]">{label}</p>
            <p className="text-2xl font-bold text-[var(--lux-text)]">{value.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-[var(--lux-text-muted)]">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FlowItem({ from, to, via }: { from: string; to: string; via: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
      <span className="px-2 py-1 bg-[var(--lux-secondary)]/15 text-[var(--lux-secondary)] rounded text-xs font-bold">{from}</span>
      <span className="text-[var(--lux-text-muted)]">←</span>
      <span className="flex-1 text-[var(--lux-text)]">{via}</span>
      <span className="text-[var(--lux-text-muted)]">→</span>
      <span className="px-2 py-1 bg-emerald-500/15 text-emerald-400 rounded text-xs font-bold">{to}</span>
    </div>
  )
}
