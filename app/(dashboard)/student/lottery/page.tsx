'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, GripVertical, CheckCircle, Clock, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

type Period = {
  id: string; title: string; academic_year: string
  for_grade: number; from_grade: number; end_at: string; status: string
}
type LotteryClass = {
  id: string; class_name: string; teacher_name: string; capacity: number; enrolled_count: number
}
type Result = {
  id: string; status: string; assigned_priority: number
  registration_periods: { title: string }
  lottery_classes: { class_name: string; teacher_name: string }
}

export default function StudentLotteryPage() {
  const [openPeriods, setOpenPeriods] = useState<Period[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [classes, setClasses] = useState<LotteryClass[]>([])
  const [orderedClasses, setOrderedClasses] = useState<LotteryClass[]>([])
  const [pastResults, setPastResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [pRes, rRes] = await Promise.all([
        fetch('/api/lottery?type=periods'),
        fetch('/api/lottery?type=my_result'),
      ])
      const pData = await pRes.json()
      const rData = await rRes.json()
      const open = (pData.periods || []).filter((p: Period) => p.status === 'open')
      setOpenPeriods(open)
      setPastResults(rData.results || [])
      setLoading(false)
    }
    load()
  }, [])

  const selectPeriod = async (p: Period) => {
    setSelectedPeriod(p)
    const [cRes, prefRes] = await Promise.all([
      fetch(`/api/lottery?type=classes&period_id=${p.id}`),
      fetch(`/api/lottery?type=my_preferences&period_id=${p.id}`),
    ])
    const cData = await cRes.json()
    const prefData = await prefRes.json()
    const allClasses: LotteryClass[] = cData.classes || []
    // اگر اولویت قبلی داشت، بر اساس آن مرتب کن
    const prefs: { class_id: string }[] = (prefData.preferences || [])
      .map((pr: { lottery_classes: LotteryClass; class_id?: string }) => ({
        ...pr,
        class_id: pr.class_id || pr.lottery_classes?.id
      }))
    if (prefs.length > 0) {
      const ordered = prefs
        .map((pr) => allClasses.find(c => c.id === pr.class_id))
        .filter(Boolean) as LotteryClass[]
      const rest = allClasses.filter(c => !prefs.find(pr => pr.class_id === c.id))
      setOrderedClasses([...ordered, ...rest])
    } else {
      setOrderedClasses(allClasses)
    }
    setClasses(allClasses)
  }

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const newOrder = [...orderedClasses]
    const [removed] = newOrder.splice(dragIdx, 1)
    newOrder.splice(idx, 0, removed)
    setOrderedClasses(newOrder)
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  const savePreferences = async () => {
    if (!selectedPeriod) return
    setSaving(true)
    const preferences = orderedClasses.map((c, i) => ({ class_id: c.id, priority: i + 1 }))
    const res = await fetch('/api/lottery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit_preferences', period_id: selectedPeriod.id, preferences }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error); return }
    toast.success(data.message || 'اولویت‌ها ثبت شدند')
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} /></div>

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="text-purple-600" /> ثبت‌نام کلاس
        </h1>
        <p className="text-sm text-gray-500">اولویت‌های خود را برای انتخاب کلاس تعیین کنید</p>
      </div>

      {/* دوره‌های باز */}
      {openPeriods.length > 0 && (
        <div className="space-y-3">
          {openPeriods.map(p => (
            <Card key={p.id} className={`cursor-pointer border-2 transition-colors ${selectedPeriod?.id === p.id ? 'border-purple-500' : 'border-transparent hover:border-purple-200'}`}
              onClick={() => selectPeriod(p)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold">{p.title}</p>
                  <p className="text-sm text-gray-500">
                    پایه {p.from_grade} → {p.for_grade} | مهلت: {new Date(p.end_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-700">باز</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ثبت اولویت */}
      {selectedPeriod && classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>اولویت‌بندی کلاس‌ها</span>
              <span className="text-xs text-gray-400">با کشیدن جابه‌جا کنید</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orderedClasses.map((c, idx) => (
              <div
                key={c.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-grab active:cursor-grabbing transition-colors ${dragIdx === idx ? 'bg-purple-50 border-purple-300' : 'bg-white hover:bg-gray-50'}`}
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-sm shrink-0">
                  {idx + 1}
                </span>
                <GripVertical size={16} className="text-gray-300 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{c.class_name}</p>
                  <p className="text-xs text-gray-500">معلم: {c.teacher_name} | ظرفیت: {c.capacity}</p>
                </div>
              </div>
            ))}
            <Button onClick={savePreferences} disabled={saving} className="w-full mt-3 bg-purple-600 gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              ثبت اولویت‌ها
            </Button>
            <p className="text-xs text-center text-gray-400">می‌توانید قبل از پایان مهلت تغییر دهید</p>
          </CardContent>
        </Card>
      )}

      {openPeriods.length === 0 && (
        <Card><CardContent className="text-center py-12 text-gray-400">
          <Clock size={40} className="mx-auto mb-3 opacity-40" />
          در حال حاضر دوره ثبت‌نامی باز نیست
        </CardContent></Card>
      )}

      {/* نتایج قبلی */}
      {pastResults.length > 0 && (
        <Card>
          <CardHeader><CardTitle>نتایج قرعه‌کشی</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pastResults.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{r.lottery_classes?.class_name}</p>
                  <p className="text-xs text-gray-500">{r.registration_periods?.title} | اولویت: {r.assigned_priority}</p>
                </div>
                <Badge className={
                  r.status === 'assigned' ? 'bg-green-100 text-green-700' :
                  r.status === 'waitlisted' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }>
                  {r.status === 'assigned' ? <><CheckCircle size={12} className="inline ml-1" />ثبت‌نام شدید</> :
                   r.status === 'waitlisted' ? 'لیست انتظار' : 'تخصیص نیافت'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
