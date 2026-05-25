'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Shuffle, Plus, Play, Trash2, Loader2, ChevronDown, ChevronUp, Users, School } from 'lucide-react'
// Badge intentionally unused — reserved for future status display
import { toast } from 'sonner'

type Period = {
  id: string; title: string; academic_year: string
  for_grade: number; from_grade: number
  start_at: string; end_at: string; status: string
}
type LotteryClass = {
  id: string; class_name: string; teacher_name: string
  capacity: number; enrolled_count: number
}
type LotteryResult = {
  id: string; status: string; assigned_priority: number
  students: { full_name: string; student_number: string }
  lottery_classes: { class_name: string; teacher_name: string }
}

const STATUS_LABEL: { [key: string]: { label: string; color: string } | undefined } = {
  pending: { label: 'در انتظار', color: 'bg-gray-100 text-gray-700' },
  open: { label: 'باز برای ثبت', color: 'bg-blue-100 text-blue-700' },
  closed: { label: 'بسته', color: 'bg-orange-100 text-orange-700' },
  done: { label: 'قرعه‌کشی انجام شد', color: 'bg-green-100 text-green-700' },
}
const DEFAULT_STATUS = { label: 'در انتظار', color: 'bg-gray-100 text-gray-700' }
const RESULT_LABEL: Record<string, { label: string; color: string }> = {
  assigned: { label: 'تخصیص یافت', color: 'text-green-700' },
  waitlisted: { label: 'لیست انتظار', color: 'text-orange-700' },
  not_assigned: { label: 'اختصاص نیافت', color: 'text-red-700' },
}

export default function AdminLotteryPage() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null)
  const [classes, setClasses] = useState<Record<string, LotteryClass[]>>({})
  const [results, setResults] = useState<Record<string, LotteryResult[]>>({})
  const [runningLottery, setRunningLottery] = useState<string | null>(null)

  // دیالوگ ساخت دوره
  const [showPeriod, setShowPeriod] = useState(false)
  const [periodForm, setPeriodForm] = useState({
    title: '', academic_year: '1404-1405',
    for_grade: '4', from_grade: '3',
    start_at: '', end_at: '',
  })

  // دیالوگ افزودن کلاس
  const [showClass, setShowClass] = useState(false)
  const [classPeriodId, setClassPeriodId] = useState('')
  const [classForm, setClassForm] = useState({
    teacher_name: '', class_name: '', grade: '4', capacity: '30',
  })

  const loadPeriods = async () => {
    setLoading(true)
    const res = await fetch('/api/lottery?type=periods')
    const data = await res.json()
    setPeriods(data.periods || [])
    setLoading(false)
  }

  useEffect(() => { loadPeriods() }, [])

  const loadClasses = async (periodId: string) => {
    if (classes[periodId]) return
    const res = await fetch(`/api/lottery?type=classes&period_id=${periodId}`)
    const data = await res.json()
    setClasses(prev => ({ ...prev, [periodId]: data.classes || [] }))
  }

  const loadResults = async (periodId: string) => {
    const res = await fetch(`/api/lottery?type=results&period_id=${periodId}`)
    const data = await res.json()
    setResults(prev => ({ ...prev, [periodId]: data.results || [] }))
  }

  const togglePeriod = (id: string) => {
    if (expandedPeriod === id) { setExpandedPeriod(null); return }
    setExpandedPeriod(id)
    loadClasses(id)
  }

  const createPeriod = async () => {
    if (!periodForm.title || !periodForm.start_at || !periodForm.end_at) {
      toast.error('عنوان، تاریخ شروع و پایان الزامی است')
      return
    }
    const res = await fetch('/api/lottery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_period', ...periodForm,
        for_grade: parseInt(periodForm.for_grade),
        from_grade: parseInt(periodForm.from_grade) }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('دوره ثبت‌نام ساخته شد')
    setShowPeriod(false)
    loadPeriods()
  }

  const addClass = async () => {
    if (!classForm.teacher_name || !classForm.class_name) {
      toast.error('نام معلم و کلاس الزامی است')
      return
    }
    const res = await fetch('/api/lottery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_class', period_id: classPeriodId,
        grade: parseInt(classForm.grade),
        capacity: parseInt(classForm.capacity),
        teacher_name: classForm.teacher_name,
        class_name: classForm.class_name,
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('کلاس اضافه شد')
    setShowClass(false)
    setClasses(prev => ({ ...prev, [classPeriodId]: [...(prev[classPeriodId] || []), data.class] }))
  }

  const setStatus = async (periodId: string, status: string) => {
    const res = await fetch('/api/lottery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_period_status', period_id: periodId, status }),
    })
    if (!res.ok) { toast.error('خطا در تغییر وضعیت'); return }
    toast.success('وضعیت تغییر کرد')
    loadPeriods()
  }

  const runLottery = async (periodId: string) => {
    if (!confirm('قرعه‌کشی اجرا شود؟ این عمل برگشت‌پذیر نیست.')) return
    setRunningLottery(periodId)
    try {
      const res = await fetch('/api/lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_lottery', period_id: periodId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      const r = data.result
      toast.success(`قرعه‌کشی انجام شد — تخصیص: ${r.assigned} | لیست انتظار: ${r.waitlisted}`)
      loadPeriods()
      loadResults(periodId)
    } finally {
      setRunningLottery(null)
    }
  }

  const deletePeriod = async (id: string) => {
    if (!confirm('این دوره و تمام داده‌هایش حذف شود؟')) return
    await fetch(`/api/lottery?type=period&id=${id}`, { method: 'DELETE' })
    toast.success('دوره حذف شد')
    loadPeriods()
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shuffle className="text-purple-600" /> قرعه‌کشی ثبت‌نام کلاس
          </h1>
          <p className="text-sm text-gray-500">مدیریت دوره‌های ثبت‌نام، کلاس‌ها، اولویت‌ها و قرعه‌کشی</p>
        </div>
        <Button onClick={() => setShowPeriod(true)} className="bg-purple-600 gap-2">
          <Plus size={18} /> دوره جدید
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto" size={32} /></div>
      ) : periods.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-400">
          <Shuffle size={48} className="mx-auto mb-3 opacity-30" />
          هنوز دوره ثبت‌نامی تعریف نشده
        </CardContent></Card>
      ) : (
        periods.map(period => {
          const st = STATUS_LABEL[period.status] ?? DEFAULT_STATUS
          const isOpen = expandedPeriod === period.id
          const cls = classes[period.id] || []
          const res = results[period.id] || []
          const assigned = res.filter(r => r.status === 'assigned').length
          const waitlisted = res.filter(r => r.status === 'waitlisted').length

          return (
            <Card key={period.id} className="border-2">
              <CardHeader className="cursor-pointer" onClick={() => togglePeriod(period.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    <div>
                      <p className="font-bold text-lg">{period.title}</p>
                      <p className="text-sm text-gray-500">
                        پایه {period.from_grade} → پایه {period.for_grade} | {period.academic_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <span className={`text-xs px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    {period.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(period.id, 'open')}>
                        باز کردن ثبت
                      </Button>
                    )}
                    {period.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(period.id, 'closed')}>
                        بستن ثبت
                      </Button>
                    )}
                    {period.status === 'closed' && (
                      <Button
                        size="sm"
                        className="bg-purple-600 gap-1"
                        onClick={() => runLottery(period.id)}
                        disabled={runningLottery === period.id}
                      >
                        {runningLottery === period.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Play size={14} />}
                        اجرای قرعه‌کشی
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deletePeriod(period.id)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isOpen && (
                <CardContent className="border-t pt-4 space-y-4">
                  {/* کلاس‌ها */}
                  <div className="flex items-center justify-between">
                    <p className="font-semibold flex items-center gap-2">
                      <School size={18} /> کلاس‌ها ({cls.length})
                    </p>
                    {period.status !== 'done' && (
                      <Button size="sm" variant="outline" onClick={() => {
                        setClassPeriodId(period.id)
                        setClassForm({ teacher_name: '', class_name: '', grade: String(period.for_grade), capacity: '30' })
                        setShowClass(true)
                      }}>
                        <Plus size={14} className="ml-1" /> افزودن کلاس
                      </Button>
                    )}
                  </div>

                  {cls.length === 0 ? (
                    <p className="text-sm text-gray-400 pr-4">هنوز کلاسی اضافه نشده</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {cls.map(c => (
                        <div key={c.id} className="p-3 border rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium">{c.class_name}</p>
                            <p className="text-xs text-gray-500">معلم: {c.teacher_name}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">
                              {c.enrolled_count}/{c.capacity}
                            </p>
                            <p className="text-xs text-gray-400">ظرفیت</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* نتایج */}
                  {period.status === 'done' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold flex items-center gap-2">
                          <Users size={18} /> نتایج قرعه‌کشی
                        </p>
                        {res.length === 0 && (
                          <Button size="sm" variant="outline" onClick={() => loadResults(period.id)}>
                            نمایش نتایج
                          </Button>
                        )}
                      </div>
                      {res.length > 0 && (
                        <>
                          <div className="flex gap-4 mb-3 text-sm">
                            <span className="text-green-700 font-bold">✅ تخصیص: {assigned}</span>
                            <span className="text-orange-700 font-bold">⏳ انتظار: {waitlisted}</span>
                            <span className="text-red-700 font-bold">❌ نیافت: {res.length - assigned - waitlisted}</span>
                          </div>
                          <div className="max-h-60 overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="p-2 text-right">دانش‌آموز</th>
                                  <th className="p-2 text-right">کلاس</th>
                                  <th className="p-2 text-right">اولویت</th>
                                  <th className="p-2 text-right">نتیجه</th>
                                </tr>
                              </thead>
                              <tbody>
                                {res.map(r => {
                                  const rl = RESULT_LABEL[r.status]
                                  return (
                                    <tr key={r.id} className="border-t">
                                      <td className="p-2">{r.students?.full_name}</td>
                                      <td className="p-2 text-xs">{r.lottery_classes?.class_name}</td>
                                      <td className="p-2 text-center">{r.assigned_priority}</td>
                                      <td className={`p-2 font-bold ${rl?.color}`}>{rl?.label}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })
      )}

      {/* دیالوگ ساخت دوره */}
      <Dialog open={showPeriod} onOpenChange={setShowPeriod}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>دوره ثبت‌نام جدید</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>عنوان دوره *</Label>
              <Input value={periodForm.title} onChange={e => setPeriodForm({ ...periodForm, title: e.target.value })}
                placeholder="مثلاً: ثبت‌نام پایه چهارم ۱۴۰۴" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>سال تحصیلی</Label>
                <Input value={periodForm.academic_year} onChange={e => setPeriodForm({ ...periodForm, academic_year: e.target.value })} />
              </div>
              <div>
                <Label>پایه مبدأ</Label>
                <Select value={periodForm.from_grade} onValueChange={v => setPeriodForm({ ...periodForm, from_grade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => i + 1).map(g =>
                      <SelectItem key={g} value={String(g)}>پایه {g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>پایه مقصد</Label>
                <Select value={periodForm.for_grade} onValueChange={v => setPeriodForm({ ...periodForm, for_grade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => i + 2).map(g =>
                      <SelectItem key={g} value={String(g)}>پایه {g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>شروع ثبت اولویت *</Label>
                <Input type="datetime-local" value={periodForm.start_at}
                  onChange={e => setPeriodForm({ ...periodForm, start_at: e.target.value })} />
              </div>
              <div>
                <Label>پایان ثبت اولویت *</Label>
                <Input type="datetime-local" value={periodForm.end_at}
                  onChange={e => setPeriodForm({ ...periodForm, end_at: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriod(false)}>انصراف</Button>
            <Button onClick={createPeriod} className="bg-purple-600">ساخت دوره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ افزودن کلاس */}
      <Dialog open={showClass} onOpenChange={setShowClass}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>افزودن کلاس به دوره</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>نام معلم *</Label>
              <Input value={classForm.teacher_name}
                onChange={e => setClassForm({ ...classForm, teacher_name: e.target.value })}
                placeholder="خانم / آقای ..." />
            </div>
            <div>
              <Label>نام کلاس *</Label>
              <Input value={classForm.class_name}
                onChange={e => setClassForm({ ...classForm, class_name: e.target.value })}
                placeholder="مثلاً: پایه چهارم الف - خانم رضایی" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>پایه</Label>
                <Select value={classForm.grade} onValueChange={v => setClassForm({ ...classForm, grade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(g =>
                      <SelectItem key={g} value={String(g)}>پایه {g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ظرفیت</Label>
                <Input type="number" value={classForm.capacity}
                  onChange={e => setClassForm({ ...classForm, capacity: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClass(false)}>انصراف</Button>
            <Button onClick={addClass} className="bg-purple-600">افزودن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
