'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardPage } from '@/components/layout/dashboard-page'
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
import { useToast } from '@/hooks/use-toast'
import { formatBytes, MAX_TEXTBOOK_BYTES, type TextbookRow } from '@/lib/teacher/textbooks'
import { BookOpen, Loader2, Trash2, Upload } from 'lucide-react'

type ListResponse = {
  textbooks: TextbookRow[]
  grades: number[]
  canUpload: boolean
  error?: string
}

export default function TeacherTextbooksPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<TextbookRow[]>([])
  const [grades, setGrades] = useState<number[]>([])
  const [canUpload, setCanUpload] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/textbooks')
      const data = (await res.json()) as ListResponse
      if (!res.ok) {
        throw new Error(data.error || 'خطا در دریافت فهرست')
      }
      setItems(data.textbooks || [])
      setGrades(data.grades || [])
      setCanUpload(Boolean(data.canUpload))
      setGrade((prev) => {
        if (prev) return prev
        if (data.grades?.length === 1) return String(data.grades[0])
        return prev
      })
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'دریافت فهرست ناموفق بود',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title.trim() || !grade) {
      toast({
        title: 'اطلاعات ناقص',
        description: 'عنوان، پایه و فایل PDF را وارد کنید',
        variant: 'destructive',
      })
      return
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: 'فرمت نامعتبر',
        description: 'فقط فایل PDF مجاز است',
        variant: 'destructive',
      })
      return
    }

    if (file.size > MAX_TEXTBOOK_BYTES) {
      toast({
        title: 'حجم زیاد',
        description: 'حداکثر حجم ۵۰ مگابایت است',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      const gradeNum = Number.parseInt(grade, 10)
      const presignRes = await fetch('/api/teacher/textbooks/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim() || null,
          grade: gradeNum,
          fileName: file.name,
          fileSize: file.size,
          mimeType: 'application/pdf',
        }),
      })
      const presign = (await presignRes.json()) as {
        uploadUrl?: string
        filePath?: string
        error?: string
      }
      if (!presignRes.ok || !presign.uploadUrl || !presign.filePath) {
        throw new Error(presign.error || 'آماده‌سازی آپلود ناموفق بود')
      }

      const putRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'application/pdf' },
      })
      if (!putRes.ok) {
        throw new Error(
          'آپلود به فضای ذخیره‌سازی ناموفق بود. اگر خطا تکرار شد، CORS باکت آروان را بررسی کنید.'
        )
      }

      const confirmRes = await fetch('/api/teacher/textbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim() || null,
          grade: gradeNum,
          filePath: presign.filePath,
          fileSize: file.size,
        }),
      })
      const confirm = (await confirmRes.json()) as { error?: string }
      if (!confirmRes.ok) {
        throw new Error(confirm.error || 'ثبت کتاب ناموفق بود')
      }

      toast({ title: 'موفق', description: 'کتاب با موفقیت آپلود شد' })
      setTitle('')
      setSubject('')
      setFile(null)
      await load()
    } catch (err) {
      toast({
        title: 'خطا در آپلود',
        description: err instanceof Error ? err.message : 'آپلود ناموفق بود',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('این کتاب برای همه معلمان همان پایه حذف می‌شود. ادامه می‌دهید؟')) {
      return
    }
    try {
      const res = await fetch(`/api/teacher/textbooks/${id}`, { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'حذف ناموفق بود')
      toast({ title: 'حذف شد', description: 'کتاب از فهرست مدرسه حذف شد' })
      await load()
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'حذف ناموفق بود',
        variant: 'destructive',
      })
    }
  }

  return (
    <DashboardPage
      title="کتاب‌های درسی"
      description="PDF کتاب‌های پایه کلاس شما — مشترک بین معلمان همان پایه؛ یادداشت روی کتاب ذخیره نمی‌شود"
    >
      {canUpload && grades.length > 0 && (
        <form
          onSubmit={onUpload}
          className="mb-8 space-y-4 rounded-xl border border-border/70 bg-card/40 p-4"
          dir="rtl"
        >
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Upload className="size-4" />
            آپلود کتاب جدید
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tb-title">عنوان</Label>
              <Input
                id="tb-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً ریاضی پایه چهارم"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tb-subject">درس (اختیاری)</Label>
              <Input
                id="tb-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ریاضی، فارسی، …"
              />
            </div>
            <div className="space-y-2">
              <Label>پایه</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger aria-label="انتخاب پایه">
                  <SelectValue placeholder="انتخاب پایه" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      پایه {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tb-file">فایل PDF (حداکثر ۵۰ مگابایت)</Label>
              <Input
                id="tb-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button type="submit" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال آپلود…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                آپلود
              </>
            )}
          </Button>
        </form>
      )}

      {!canUpload && !loading && (
        <p className="mb-6 text-sm text-muted-foreground">
          برای آپلود، باید حداقل یک کلاس با نقش معلم به شما وصل باشد.
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری…
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">هنوز کتابی برای پایه‌های شما ثبت نشده است.</p>
      ) : (
        <ul className="space-y-3" dir="rtl">
          {items.map((book) => (
            <li
              key={book.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/30 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  <BookOpen className="size-4 shrink-0 text-role-accent" />
                  <span className="truncate">{book.title}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  پایه {book.grade}
                  {book.subject ? ` · ${book.subject}` : ''}
                  {' · '}
                  {formatBytes(book.file_size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm">
                  <Link href={`/teacher/textbooks/${book.id}`}>باز کردن برای تدریس</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onDelete(book.id)}
                  aria-label={`حذف ${book.title}`}
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
