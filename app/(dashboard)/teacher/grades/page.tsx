'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { GraduationCap, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Student = { id: string; full_name: string; grade?: number; student_number?: string }
type Grade = {
  id: string
  student_id: string
  subject: string
  score: number
  max_score: number
  exam_type: string
  comments?: string
  exam_date: string
  created_at: string
  students?: { full_name: string; grade: number }
}

const SUBJECTS = ['ریاضی', 'فارسی', 'علوم', 'مطالعات اجتماعی', 'هدیه‌های آسمان', 'قرآن', 'انگلیسی', 'هنر', 'ورزش']
const EXAM_TYPES = [
  { value: 'general', label: 'کلی' },
  { value: 'midterm', label: 'میان‌ترم' },
  { value: 'final', label: 'پایان‌ترم' },
  { value: 'quiz', label: 'پرسش کلاسی' },
  { value: 'homework', label: 'تکلیف' },
  { value: 'project', label: 'پروژه' },
  { value: 'oral', label: 'شفاهی' },
  { value: 'practical', label: 'عملی' },
]

export default function TeacherGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    student_id: '', subject: 'ریاضی', score: '', max_score: '20',
    exam_type: 'general', comments: '', exam_date: new Date().toISOString().slice(0, 10),
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [gRes, sRes] = await Promise.all([
        fetch('/api/grades'),
        fetch('/api/admin/users?role=student&limit=200'),
      ])
      const gData = await gRes.json()
      const sData = await sRes.json()
      setGrades(gData.grades || [])
      setStudents((sData.users || []).map((u: { id: string; full_name: string; username?: string }) => ({
        id: u.id, full_name: u.full_name, student_number: u.username,
      })))
    } catch {
      toast.error('خطا در بارگذاری داده‌ها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async () => {
    if (!form.student_id || !form.score) {
      toast.error('دانش‌آموز و نمره الزامی است')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: form.student_id,
          subject: form.subject,
          score: parseFloat(form.score),
          max_score: parseFloat(form.max_score),
          exam_type: form.exam_type,
          comments: form.comments,
          exam_date: form.exam_date,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('نمره ثبت شد')
      setShowAdd(false)
      setForm({ ...form, score: '', comments: '' })
      loadData()
    } catch (e: unknown) {
      toast.error('خطا: ' + (e instanceof Error ? e.message : 'ثبت نمره'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('حذف این نمره؟')) return
    try {
      const res = await fetch(`/api/grades?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('حذف شد')
      loadData()
    } catch {
      toast.error('خطا در حذف')
    }
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="text-blue-600" />
            ثبت و مدیریت نمرات
          </h1>
          <p className="text-sm text-gray-500">نمره‌ها بلافاصله برای دانش‌آموز و والدین قابل مشاهده می‌شود.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-blue-600">
          <Plus size={18} /> ثبت نمره جدید
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>لیست نمرات ثبت‌شده ({grades.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" /></div>
          ) : grades.length === 0 ? (
            <p className="text-center py-12 text-gray-400">هنوز نمره‌ای ثبت نکرده‌اید</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-right">دانش‌آموز</th>
                    <th className="p-3 text-right">درس</th>
                    <th className="p-3 text-right">نمره</th>
                    <th className="p-3 text-right">نوع</th>
                    <th className="p-3 text-right">تاریخ</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map(g => (
                    <tr key={g.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{g.students?.full_name || '-'}</td>
                      <td className="p-3">{g.subject}</td>
                      <td className="p-3">
                        <span className={`font-bold ${g.score >= g.max_score * 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                          {g.score} / {g.max_score}
                        </span>
                      </td>
                      <td className="p-3">{EXAM_TYPES.find(t => t.value === g.exam_type)?.label || g.exam_type}</td>
                      <td className="p-3 text-gray-500">{new Date(g.exam_date).toLocaleDateString('fa-IR')}</td>
                      <td className="p-3">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(g.id)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>ثبت نمره جدید</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>دانش‌آموز *</Label>
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} {s.student_number && `(${s.student_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>درس</Label>
                <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع آزمون</Label>
                <Select value={form.exam_type} onValueChange={v => setForm({ ...form, exam_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>نمره *</Label>
                <Input type="number" step="0.25" value={form.score}
                  onChange={e => setForm({ ...form, score: e.target.value })} />
              </div>
              <div>
                <Label>از</Label>
                <Input type="number" value={form.max_score}
                  onChange={e => setForm({ ...form, max_score: e.target.value })} />
              </div>
              <div>
                <Label>تاریخ</Label>
                <Input type="date" value={form.exam_date}
                  onChange={e => setForm({ ...form, exam_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>توضیحات (اختیاری)</Label>
              <Input value={form.comments}
                onChange={e => setForm({ ...form, comments: e.target.value })}
                placeholder="مثلاً: تلاش بسیار خوب" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600">
              {saving ? <Loader2 className="animate-spin" /> : 'ثبت نمره'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
