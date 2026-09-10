'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageSkeletonTable } from '@/components/ui/page-states'
import { useToast } from '@/hooks/use-toast'
import { CLASS_FILE_ACCEPT, CLASS_FILE_LIMITS_SHORT, presignAndPut } from '@/lib/class-files-upload'
import { ClassFileLimitsHint } from '@/components/class-files/class-file-limits-hint'
import type { TeacherClassRow } from '@/lib/teacher/class-scope'
import type { ClassAssignmentRow, AssignmentSubmissionRow } from '@/lib/class-files'
import { ClipboardList, Loader2, Trash2 } from 'lucide-react'

const SUBJECTS = [
  'ریاضی',
  'فارسی',
  'علوم',
  'مطالعات اجتماعی',
  'هدیه‌های آسمان',
  'قرآن',
  'انگلیسی',
  'هنر',
  'ورزش',
]

type ListResponse = {
  assignments: ClassAssignmentRow[]
  submissions: AssignmentSubmissionRow[]
  classes: TeacherClassRow[]
  error?: string
}

export default function TeacherAssignmentsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [assignments, setAssignments] = useState<ClassAssignmentRow[]>([])
  const [submissions, setSubmissions] = useState<AssignmentSubmissionRow[]>([])
  const [classes, setClasses] = useState<TeacherClassRow[]>([])
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('ریاضی')
  const [dueAt, setDueAt] = useState('')
  const [maxScore, setMaxScore] = useState('20')
  const [promptFile, setPromptFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/class-assignments')
      const data = (await res.json()) as ListResponse
      if (!res.ok) throw new Error(data.error || 'دریافت تکالیف ناموفق بود')
      setAssignments(data.assignments || [])
      setSubmissions(data.submissions || [])
      setClasses(data.classes || [])
      setClassId((prev) => {
        if (prev) return prev
        if (data.classes?.length === 1) return data.classes[0].id
        return prev
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId || !title.trim()) {
      toast({ title: 'اطلاعات ناقص', description: 'کلاس و عنوان الزامی است', variant: 'destructive' })
      return
    }
    const score = Number.parseFloat(maxScore)
    if (!Number.isFinite(score) || score <= 0) {
      toast({ title: 'سقف نمره نامعتبر است', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      let prompt: {
        promptFilePath?: string
        promptFileSize?: number
        promptMimeType?: string
        promptOriginalName?: string
      } = {}
      if (promptFile) {
        const uploaded = await presignAndPut({ kind: 'prompts', classId, file: promptFile })
        prompt = {
          promptFilePath: uploaded.filePath,
          promptFileSize: uploaded.fileSize,
          promptMimeType: uploaded.mimeType,
          promptOriginalName: uploaded.originalName,
        }
      }
      const res = await fetch('/api/class-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          title: title.trim(),
          description: description.trim() || null,
          subject,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          maxScore: score,
          ...prompt,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'ثبت تکلیف ناموفق بود')
      toast({ title: 'تکلیف ساخته شد' })
      setTitle('')
      setDescription('')
      setDueAt('')
      setPromptFile(null)
      await load()
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'ثبت ناموفق بود',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('تکلیف و همه تحویل‌ها حذف می‌شوند. ادامه می‌دهید؟')) return
    try {
      const res = await fetch(`/api/class-assignments/${id}`, { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'حذف ناموفق بود')
      toast({ title: 'حذف شد' })
      await load()
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'حذف ناموفق بود',
        variant: 'destructive',
      })
    }
  }

  const countByAssignment = (assignmentId: string) =>
    submissions.filter((s) => s.assignment_id === assignmentId).length

  const classNameById = Object.fromEntries(
    classes.map((c) => [c.id, c.name || `پایه ${c.grade ?? ''}`])
  )

  return (
    <DashboardPage
      title="تکالیف کلاس"
      description={`صورت‌مسئله، تحویل فایل، نمره و بازخورد — نمره در کارنامه هم ثبت می‌شود. فایل پیوست: ${CLASS_FILE_LIMITS_SHORT}.`}
    >
      {classes.length > 0 && (
        <form
          onSubmit={(e) => void onCreate(e)}
          className="mb-8 space-y-4 rounded-xl border border-border/70 bg-card/40 p-4"
          dir="rtl"
        >
          <h2 className="text-base font-semibold">تکلیف جدید</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>کلاس</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger aria-label="انتخاب کلاس">
                  <SelectValue placeholder="انتخاب کلاس" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name || `پایه ${c.grade ?? ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>درس</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger aria-label="انتخاب درس">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="as-title">عنوان</Label>
              <Input id="as-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="as-desc">توضیح</Label>
              <Textarea
                id="as-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="as-due">مهلت (اختیاری)</Label>
              <Input
                id="as-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="as-max">سقف نمره</Label>
              <Input
                id="as-max"
                type="number"
                min={1}
                step="0.25"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="as-prompt">فایل صورت‌مسئله (اختیاری)</Label>
              <Input
                id="as-prompt"
                type="file"
                accept={CLASS_FILE_ACCEPT}
                onChange={(e) => setPromptFile(e.target.files?.[0] ?? null)}
              />
              <ClassFileLimitsHint />
            </div>
          </div>
          <Button type="submit" disabled={saving || !classId}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'ثبت تکلیف'}
          </Button>
        </form>
      )}

      {loading ? (
        <PageSkeletonTable />
      ) : error ? (
        <PageErrorState message={error} onRetry={() => void load()} />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="تکلیفی نیست"
          description="برای کلاس خود یک تکلیف با سقف نمره بسازید."
        />
      ) : (
        <ul className="space-y-3" dir="rtl">
          {assignments.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/30 px-4 py-3"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {classNameById[item.class_id] || 'کلاس'} · {item.subject} · سقف{' '}
                  {item.max_score} · {countByAssignment(item.id)} تحویل
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm">
                  <Link href={`/teacher/assignments/${item.id}`}>تحویل‌ها و نمره</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onDelete(item.id)}
                  aria-label={`حذف ${item.title}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPage>
  )
}
