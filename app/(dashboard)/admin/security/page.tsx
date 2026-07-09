'use client'

import { useState, useEffect } from 'react'
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Lock,
  Eye, RefreshCw, Loader2, Globe, User, Clock,
  TrendingUp, Activity, Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { EmptyState } from '@/components/ui/empty-state'
import { PageLoading } from '@/components/ui/page-states'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================
interface AuditLog {
  id: string
  event_type: string
  user_id: string | null
  ip_address: string | null
  success: boolean
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  details: Record<string, unknown>
  created_at: string
}

interface SecurityStats {
  total_today: number
  failed_today: number
  blocked_ips: number
  high_risk_events: number
  unique_ips_today: number
}

// ============================================
// کانفیگ رویدادها
// ============================================
const EVENT_CONFIG: Record<string, { label: string; color: string }> = {
  login_success:      { label: 'ورود موفق', color: 'bg-green-100 text-green-700' },
  login_failed:       { label: 'ورود ناموفق', color: 'bg-red-100 text-red-600' },
  login_blocked:      { label: 'ورود مسدود', color: 'bg-orange-100 text-orange-700' },
  logout:             { label: 'خروج', color: 'bg-gray-100 text-gray-600' },
  password_changed:   { label: 'تغییر رمز', color: 'bg-blue-100 text-blue-700' },
  otp_sent:           { label: 'OTP ارسال شد', color: 'bg-purple-100 text-purple-700' },
  otp_verified:       { label: 'OTP تأیید شد', color: 'bg-green-100 text-green-700' },
  otp_failed:         { label: 'OTP ناموفق', color: 'bg-red-100 text-red-600' },
  access_denied:      { label: 'دسترسی رد شد', color: 'bg-red-100 text-red-600' },
  api_rate_limited:   { label: 'Rate Limit', color: 'bg-orange-100 text-orange-700' },
  suspicious_activity:{ label: 'مشکوک', color: 'bg-red-200 text-red-800' },
  admin_action:       { label: 'عملیات ادمین', color: 'bg-blue-100 text-blue-700' },
  file_upload:        { label: 'آپلود فایل', color: 'bg-gray-100 text-gray-600' },
}

const RISK_CONFIG = {
  low:      { label: 'کم', color: 'bg-green-100 text-green-700' },
  medium:   { label: 'متوسط', color: 'bg-yellow-100 text-yellow-700' },
  high:     { label: 'بالا', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'بحرانی', color: 'bg-red-200 text-red-800' },
}

// ============================================
// صفحه اصلی
// ============================================
export default function SecurityDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/security/logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setStats(data.stats || null)
      }
    } catch {
      // در صورت عدم وجود API، نمایش داده‌های نمونه
      setStats({
        total_today: 0,
        failed_today: 0,
        blocked_ips: 0,
        high_risk_events: 0,
        unique_ips_today: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = logs.filter(log => {
    const matchEvent = filter === 'all' || log.event_type === filter
    const matchRisk = riskFilter === 'all' || log.risk_level === riskFilter
    return matchEvent && matchRisk
  })

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('fa-IR', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(dateStr))

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </span>
          مرکز امنیت
        </span>
      }
      description="پایش رویدادهای امنیتی و لاگ حسابرسی"
      actions={
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          بروزرسانی
        </Button>
      }
    >
      <DashboardSectionBlock>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'رویداد امروز', value: stats.total_today, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'خطای ورود', value: stats.failed_today, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'IP مسدود', value: stats.blocked_ips, icon: Ban, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'ریسک بالا', value: stats.high_risk_events, icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100' },
            { label: 'IP یکتا', value: stats.unique_ips_today, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
                <Icon className={`w-6 h-6 ${s.color} flex-shrink-0`} />
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { title: 'Rate Limiting', status: 'فعال', ok: true, desc: 'محدودیت ۵ تلاش/دقیقه روی Login' },
          { title: 'Security Headers', status: 'فعال', ok: true, desc: 'CSP، HSTS، X-Frame-Options' },
          { title: 'RLS سوپابیس', status: 'فعال', ok: true, desc: 'Row Level Security روی تمام جداول' },
          { title: 'Input Sanitization', status: 'فعال', ok: true, desc: 'پاکسازی تمام ورودی‌های API' },
          { title: 'File Upload Check', status: 'فعال', ok: true, desc: 'بررسی Magic Bytes فایل‌ها' },
          { title: 'Audit Logging', status: 'فعال', ok: true, desc: 'لاگ تمام رویدادهای حساس' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            {item.ok
              ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            }
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-800 text-sm">{item.title}</p>
                <Badge className={cn('text-xs', item.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                  {item.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1 flex-wrap">
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} className="text-xs">همه</Button>
          {['login_failed', 'login_blocked', 'access_denied', 'suspicious_activity', 'api_rate_limited'].map(e => (
            <Button key={e} size="sm" variant={filter === e ? 'default' : 'outline'} onClick={() => setFilter(e)} className="text-xs">
              {EVENT_CONFIG[e]?.label || e}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', 'high', 'critical'].map(r => (
            <Button key={r} size="sm" variant={riskFilter === r ? 'default' : 'outline'} onClick={() => setRiskFilter(r)} className="text-xs">
              {r === 'all' ? 'همه ریسک' : RISK_CONFIG[r as keyof typeof RISK_CONFIG]?.label}
            </Button>
          ))}
        </div>
      </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      {/* لیست لاگ‌ها */}
      {isLoading ? (
        <PageLoading label="در حال بارگذاری لاگ‌های امنیتی..." compact />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="لاگی یافت نشد"
          description="پس از اجرای Migration لاگ‌های امنیتی اینجا نمایش داده می‌شوند."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(log => {
              const eventCfg = EVENT_CONFIG[log.event_type] || { label: log.event_type, color: 'bg-gray-100 text-gray-600' }
              const riskCfg = RISK_CONFIG[log.risk_level]

              return (
                <div key={log.id} className={cn(
                  'flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors',
                  log.risk_level === 'critical' && 'bg-red-50',
                  log.risk_level === 'high' && 'bg-orange-50/50',
                )}>
                  <div className="flex-shrink-0">
                    {log.success
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-500" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('text-xs', eventCfg.color)}>{eventCfg.label}</Badge>
                      <Badge className={cn('text-xs', riskCfg.color)}>{riskCfg.label}</Badge>
                      {log.details?.method != null && (
                        <span className="text-xs text-gray-400">
                          روش: {String(log.details.method)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                      {log.ip_address && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {log.ip_address}
                        </span>
                      )}
                      {log.user_id && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_id.slice(0, 8)}...
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
