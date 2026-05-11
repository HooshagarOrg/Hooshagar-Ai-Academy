'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type Sub = {
  id: string; status: string; expires_at: string | null
  plan_name: string; plan_display_name: string; price_monthly: number
  schools?: { name: string }
  school_id: string
}
type Plan = { id: string; name: string; display_name: string; price_monthly: number }

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: 'فعال',      color: 'text-green-700 bg-green-50',  icon: <CheckCircle size={14}/> },
  trial:     { label: 'آزمایشی',   color: 'text-blue-700 bg-blue-50',    icon: <Clock size={14}/> },
  expired:   { label: 'منقضی',     color: 'text-red-700 bg-red-50',      icon: <AlertCircle size={14}/> },
  cancelled: { label: 'لغوشده',    color: 'text-gray-700 bg-gray-100',   icon: <AlertCircle size={14}/> },
  suspended: { label: 'معلق',      color: 'text-orange-700 bg-orange-50',icon: <AlertCircle size={14}/> },
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const [sRes, pRes] = await Promise.all([
      fetch('/api/subscription?type=all'),
      fetch('/api/subscription?type=plans'),
    ])
    const sData = await sRes.json()
    const pData = await pRes.json()
    setSubs(sData.subscriptions || [])
    setPlans(pData.plans || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const changePlan = async (schoolId: string, planName: string) => {
    setChanging(schoolId)
    const res = await fetch('/api/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId, plan_name: planName }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else { toast.success(data.message); load() }
    setChanging(null)
  }

  const totalRevenue = subs
    .filter(s => s.status === 'active' && s.price_monthly > 0)
    .reduce((sum, s) => sum + s.price_monthly, 0)

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="text-indigo-600" /> مدیریت اشتراک‌ها
        </h1>
        <p className="text-sm text-gray-500">مدیریت پلن‌های مدارس — فعلاً همه روی پلن رایگان</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard label="کل اشتراک‌ها" value={subs.length} color="blue" />
        <StatCard label="پلن رایگان" value={subs.filter(s => s.plan_name === 'free').length} color="gray" />
        <StatCard label="پلن پولی" value={subs.filter(s => s.plan_name !== 'free').length} color="green" />
        <StatCard label="درآمد ماهانه (تومان)" value={totalRevenue} color="purple" />
      </div>

      <Card>
        <CardHeader><CardTitle>لیست اشتراک‌ها</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" /></div>
          ) : subs.length === 0 ? (
            <p className="text-center py-12 text-gray-400">هیچ اشتراکی یافت نشد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-right">مدرسه</th>
                    <th className="p-3 text-right">پلن فعلی</th>
                    <th className="p-3 text-right">وضعیت</th>
                    <th className="p-3 text-right">انقضا</th>
                    <th className="p-3 text-right">تغییر پلن</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map(sub => {
                    const st = STATUS_MAP[sub.status] || STATUS_MAP.active
                    return (
                      <tr key={sub.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{sub.schools?.name || '—'}</td>
                        <td className="p-3">{sub.plan_display_name || sub.plan_name}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>
                            {st.icon}{st.label}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {sub.expires_at
                            ? new Date(sub.expires_at).toLocaleDateString('fa-IR')
                            : '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Select
                              defaultValue={sub.plan_name}
                              onValueChange={v => changePlan(sub.school_id, v)}
                              disabled={changing === sub.school_id}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {plans.map(p => (
                                  <SelectItem key={p.id} value={p.name}>
                                    {p.display_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {changing === sub.school_id && (
                              <Loader2 size={14} className="animate-spin text-gray-400" />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 font-medium">
            💡 برای فعال‌سازی درگاه پرداخت زرین‌پال، کلید <code>ZARINPAL_MERCHANT_ID</code> را در <code>.env.local</code> تنظیم کنید.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600', gray: 'text-gray-500', green: 'text-green-600', purple: 'text-purple-600'
  }
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value.toLocaleString('fa-IR')}</p>
    </CardContent></Card>
  )
}
