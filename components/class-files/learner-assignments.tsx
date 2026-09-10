'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { CLASS_FILE_ACCEPT, presignAndPut } from '@/lib/class-files-upload'
import { ClassFileLimitsHint } from '@/components/class-files/class-file-limits-hint'
import type {
  AssignmentSubmissionRow,
  ClassAssignmentRow,
} from '@/lib/class-files'
import type { TeacherClassRow } from '@/lib/teacher/class-scope'
import { ClipboardList, Download, Loader2, Upload } from 'lucide-react'

type StudentOpt = { id: string; full_name: string | null; class_id: string | null }

const STATUS_LABEL: Record<string, string> = {
  submitted: 'تحویل‌شده',
  late: 'دیر',
  graded: 'نمره‌داده‌شده',
}

export function LearnerAssignments({ role }: { role: 'student' | 'parent' }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignments, setAssignments] = useState<ClassAssignmentRow[]>([])
  const [submissions, setSubmissions] = useState<AssignmentSubmissionRow[]>([])
  const [classes, setClasses] = useState<TeacherClassRow[]>([])
  const [students, setStudents] = useState<StudentOpt[]>([])
  const [studentId, setStudentId] = useState('')
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [fileByAssignment, setFileByAssignment] = useState<Record<string, File | null>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/class-assignments')
      const data = (await res.json()) as {
        assignments?: ClassAssignmentRow[]
        submissions?: AssignmentSubmissionRow[]
        classes?: TeacherClassRow[]
        students?: StudentOpt[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'دریافت تکالیف ناموفق بود')
      setAssignments(data.assignments || [])
      setSubmissions(data.submissions || [])
      setClasses(data.classes || [])
      const kids = data.students || []
      setStudents(kids)
      setStudentId((prev) => {
        if (prev && kids.some((s) => s.id === prev)) return prev
        return kids[0]?.id || ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const submissionFor = (assignmentId: string, sid: string) =>
    submissions.find((s) => s.assignment_id === assignmentId && s.student_id === sid)

  const onDownloadPrompt = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/class-assignments/${assignmentId}`)
      const data = (await res.json()) as { promptSignedUrl?: string | null; error?: string }
      if (!res.ok) throw new Error(data.error || 'دانلود ناموفق بود')
      if (!data.promptSignedUrl) {
        toast({ title: 'صورت‌مسئله فایلی ندارد' })
        return
      }
      window.open(data.promptSignedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'دانلود ناموفق بود',
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (assignment: ClassAssignmentRow) => {
    const sid = studentId
    if (!sid) {
      toast({ title: 'دانش‌آموز انتخاب نشده', variant: 'destructive' })
      return
    }
    const file = fileByAssignment[assignment.id]
    if (!file) {
      toast({ title: 'فایل انتخاب کنید', variant: 'destructive' })
      return
    }
    setUploadingId(assignment.id)
    try {
      const uploaded = await presignAndPut({
        kind: 'submissions',
        classId: assignment.class_id,
        assignmentId: assignment.id,
        studentId: sid,
        file,
      })
      const res = await fetch(`/api/class-assignments/${assignment.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: sid,
          filePath: uploaded.filePath,
          fileSize: uploaded.fileSize,
          mimeType: uploaded.mimeType,
          originalName: uploaded.originalName,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'ثبت تحویل ناموفق بود')
      toast({ title: 'تحویل ثبت شد' })
      setFileByAssignment((prev) => ({ ...prev, [assignment.id]: null }))
      await load()
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'آپلود ناموفق بود',
        variant: 'destructive',
      })
    } finally {
      setUploadingId(null)
    }
  }

  const classNameById = Object.fromEntries(
    classes.map((c) => [c.id, c.name || `پایه ${c.grade ?? ''}`])
  )

  const visibleAssignments = assignments.filter((a) => {
    if (role === 'student') return true
    const kid = students.find((s) => s.id === studentId)
    return !kid || kid.class_id === a.class_id
  })

  if (loading) return <PageSkeletonTable />
  if (error) return <PageErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-6" dir="rtl">
      {role === 'parent' && students.length > 1 && (
        <div className="max-w-sm space-y-2">
          <Label>فرزند</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger aria-label="انتخاب فرزند">
              <SelectValue placeholder="انتخاب فرزند" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name || 'دانش‌آموز'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {visibleAssignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="تکلیفی نیست"
          description="وقتی معلم تکلیف بگذارد اینجا می‌آید."
        />
      ) : (
        <ul className="space-y-4">
          {visibleAssignments.map((item) => {
            const sub = studentId ? submissionFor(item.id, studentId) : undefined
            const graded = sub?.status === 'graded'
            return (
              <li key={item.id} className="space-y-3 rounded-xl border border-border/60 bg-card/30 p-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {classNameById[item.class_id] || 'کلاس'} · {item.subject} · سقف {item.max_score}
                    {item.due_at
                      ? ` · مهلت ${new Date(item.due_at).toLocaleString('fa-IR')}`
                      : ''}
                  </p>
                  {item.description ? (
                    <p className="mt-2 text-sm leading-loose text-right">{item.description}</p>
                  ) : null}
                </div>
                {item.prompt_file_path ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onDownloadPrompt(item.id)}
                  >
                    <Download className="size-4" />
                    دانلود صورت‌مسئله
                  </Button>
                ) : null}
                {graded ? (
                  <p className="text-sm">
                    نمره: <strong>{sub?.score}</strong> از {item.max_score}
                    {sub?.feedback ? ` — ${sub.feedback}` : ''}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sub ? (
                      <p className="text-xs text-muted-foreground">
                        وضعیت: {STATUS_LABEL[sub.status] || sub.status} ({sub.original_name})
                      </p>
                    ) : null}
                    <div className="space-y-1">
                      <Label className="text-xs">فایل تحویل</Label>
                      <Input
                        type="file"
                        accept={CLASS_FILE_ACCEPT}
                        onChange={(e) =>
                          setFileByAssignment((prev) => ({
                            ...prev,
                            [item.id]: e.target.files?.[0] ?? null,
                          }))
                        }
                      />
                      <ClassFileLimitsHint />
                    </div>
                    <Button
                      type="button"
                      disabled={uploadingId === item.id || !studentId}
                      onClick={() => void onSubmit(item)}
                    >
                      {uploadingId === item.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      {sub ? 'جایگزینی فایل' : 'ارسال تحویل'}
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
