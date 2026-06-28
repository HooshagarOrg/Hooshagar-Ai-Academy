'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shuffle, GripVertical, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { LuxFadeUp } from '@/components/lux/lux-motion'
import { PageLoading } from '@/components/ui/page-states'

type LotteryClass = {
  id: string; class_name: string; teacher_name: string
  capacity: number; enrolled_count: number
}
type Period = {
  id: string; title: string; academic_year: string
  for_grade: number; from_grade: number
  start_at: string; end_at: string; status: string
}
type LotteryResult = {
  id: string; status: string; assigned_priority: number
  lottery_classes: { class_name: string; teacher_name: string }
  registration_periods: { title: string }
}

export default function StudentClassRegistrationPage() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [classes, setClasses] = useState<LotteryClass[]>([])
  const [priorities, setPriorities] = useState<LotteryClass[]>([]) // ترتیب اولویت کاربر
  const [myResults, setMyResults] = useState<LotteryResult[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const [pRes, rRes] = await Promise.all([
        fetch('/api/lottery?type=periods'),
        fetch('/api/lottery?type=my_result'),
      ])
      const pData = await pRes.json()
      const rData = await rRes.json()
      const open = (pData.periods || []).filter((p: Period) => p.status === 'open')
      setPeriods(open)
      setMyResults(rData.results || [])
      setLoading(false)
    }
    load()
  }, [])

  const openPeriod = async (period: Period) => {
    setSelectedPeriod(period)
    const [cRes, prefRes] = await Promise.all([
      fetch(`/api/lottery?type=classes&period_id=${period.id}`),
      fetch(`/api/lottery?type=my_preferences&period_id=${period.id}`),
    ])
    const cData = await cRes.json()
    const prefData = await prefRes.json()
    const allClasses: LotteryClass[] = cData.classes || []
    const savedPrefs = prefData.preferences || []

    if (savedPrefs.length > 0) {
      // ترتیب ذخیره‌شده
      const ordered = savedPrefs
        .sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority)
        .map((p: { class_id: string }) => allClasses.find(c => c.id === p.class_id))
        .filter(Boolean) as LotteryClass[]
      const rest = allClasses.filter(c => !ordered.find(o => o.id === c.id))
      setPriorities([...ordered, ...rest])
    } else {
      setPriorities(allClasses)
    }
    setClasses(allClasses)
  }

  // drag & drop ساده با دکمه‌های بالا/پایین
  const moveUp = (idx: number) => {
    if (idx === 0) return
    const arr = [...priorities]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    setPriorities(arr)
  }
  const moveDown = (idx: number) => {
    if (idx === priorities.length - 1) return
    const arr = [...priorities]
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    setPriorities(arr)
  }

  const savePreferences = async () => {
    if (!selectedPeriod) return
    setSaving(true)
    try {
      const prefs = priorities.map((c, i) => ({ class_id: c.id, priority: i + 1 }))
      const res = await fetch('/api/lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_preferences',
          period_id: selectedPeriod.id,
          preferences: prefs,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || 'اولویت‌ها ثبت شدند')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت اولویت‌ها')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6" dir="rtl">
        <PageLoading label="در حال بارگذاری ثبت‌نام کلاس..." compact />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <LuxFadeUp className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shuffle className="text-purple-600" /> ثبت‌نام کلاس
        </h1>
        <p className="text-sm text-gray-500">اولویت‌های خود را برای کلاس سال آینده مشخص کنید</p>
      </div>

      {/* نتایج قرعه‌کشی قبلی */}
      {myResults.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader><CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle /> نتیجه قرعه‌کشی
          </CardTitle></CardHeader>
          <CardContent>
            {myResults.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-bold">{r.lottery_classes?.class_name}</p>
                  <p className="text-sm text-gray-500">معلم: {r.lottery_classes?.teacher_name}</p>
                  <p className="text-xs text-gray-400">{r.registration_periods?.title}</p>
                </div>
                <div className="text-center">
                  {r.status === 'assigned' && (
                    <Badge className="bg-green-600">اختصاص یافتید ✅</Badge>
                  )}
                  {r.status === 'waitlisted' && (
                    <Badge className="bg-orange-500">لیست انتظار ⏳</Badge>
                  )}
                  {r.status === 'not_assigned' && (
                    <Badge variant="destructive">اختصاص نیافت ❌</Badge>
                  )}
                  {r.assigned_priority && (
                    <p className="text-xs text-gray-400 mt-1">اولویت {r.assigned_priority}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* دوره‌های باز */}
      {periods.length === 0 && myResults.length === 0 && (
        <Card><CardContent className="p-12 text-center text-gray-400">
          <Clock size={48} className="mx-auto mb-3 opacity-30" />
          در حال حاضر دوره ثبت‌نام فعالی وجود ندارد
        </CardContent></Card>
      )}

      {periods.map(period => (
        <Card key={period.id} className={selectedPeriod?.id === period.id ? 'border-purple-400 border-2' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{period.title}</CardTitle>
                <p className="text-sm text-gray-500">
                  پایه {period.from_grade} → پایه {period.for_grade} |
                  تا {new Date(period.end_at).toLocaleDateString('fa-IR')}
                </p>
              </div>
              <Button onClick={() => openPeriod(period)} variant={selectedPeriod?.id === period.id ? 'default' : 'outline'}>
                {selectedPeriod?.id === period.id ? 'در حال ویرایش' : 'ثبت اولویت'}
              </Button>
            </div>
          </CardHeader>

          {selectedPeriod?.id === period.id && (
            <CardContent className="border-t pt-4 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="text-blue-600 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-blue-800">
                  کلاس‌ها را به ترتیب اولویت مرتب کنید. اولویت ۱ = بیشترین ترجیح.
                  در صورت پر شدن ظرفیت کلاس انتخابی، اولویت بعدی بررسی می‌شود.
                </p>
              </div>

              <div className="space-y-2">
                {priorities.map((cls, idx) => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50">
                    <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full font-bold text-sm shrink-0">
                      {idx + 1}
                    </span>
                    <GripVertical className="text-gray-300 shrink-0" size={18} />
                    <div className="flex-1">
                      <p className="font-medium">{cls.class_name}</p>
                      <p className="text-xs text-gray-500">معلم: {cls.teacher_name}</p>
                    </div>
                    <div className="text-center ml-2">
                      <p className="text-sm font-bold text-blue-600">{cls.enrolled_count}/{cls.capacity}</p>
                      <p className="text-xs text-gray-400">ظرفیت</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100 disabled:opacity-30">▲</button>
                      <button onClick={() => moveDown(idx)} disabled={idx === priorities.length - 1}
                        className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100 disabled:opacity-30">▼</button>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={savePreferences} disabled={saving} className="w-full bg-purple-600">
                {saving ? <Loader2 className="animate-spin ml-2" size={18} /> : null}
                ثبت اولویت‌ها
              </Button>
            </CardContent>
          )}
        </Card>
      ))}
      </LuxFadeUp>
    </div>
  )
}
