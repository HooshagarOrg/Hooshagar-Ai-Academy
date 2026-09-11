'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

const PLATFORM_GRADES = Array.from({ length: 12 }, (_, i) => i + 1)

type ListResponse = {
  textbooks: TextbookRow[]
  canManagePlatform?: boolean
  error?: string
}

export default function AdminPlatformTextbooksPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<TextbookRow[]>([])
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState<string>('1')
  const [file, setFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/textbooks?scope=platform')
      const data = (await res.json()) as ListResponse
      if (!res.ok) {
        throw new Error(data.error || 'خطا در دریافت فهرست')
      }
      setItems(data.textbooks || [])
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

  const byGrade = useMemo(() => {
    const map = new Map<number, TextbookRow[]>()
    for (const g of PLATFORM_GRADES) map.set(g, [])
    for (const book of items) {
      const list = map.get(book.grade) ?? []
      list.push(book)
      map.set(book.grade, list)
    }
    return map
  }, [items])

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
      const payload = {
        title: title.trim(),
        subject: subject.trim() || null,
        grade: gradeNum,
        fileName: file.name,
        fileSize: file.size,
        mimeType: 'application/pdf',
        scope: 'platform' as const,
      }

      const presignRes = await fetch('/api/teacher/textbooks/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          title: payload.title,
          subject: payload.subject,
          grade: gradeNum,
          filePath: presign.filePath,
          fileSize: file.size,
          scope: 'platform',
        }),
      })
      const confirm = (await confirmRes.json()) as { error?: string }
      if (!confirmRes.ok) {
        throw new Error(confirm.error || 'ثبت کتاب ناموفق بود')
      }

      toast({
        title: 'موفق',
        description: `کتاب پایه ${gradeNum} در قفسه سراسری ثبت شد؛ معلمان همان پایه دیگر نیازی به آپلود مجدد ندارند.`,
      })
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

  const onDelete = async (book: TextbookRow) => {
    if (
      !window.confirm(
        `«${book.title}» از قفسه سراسری همه مدارس حذف می‌شود. ادامه می‌دهید؟`
      )
    ) {
      return
    }
    try {
      const res = await fetch(`/api/teacher/textbooks/${book.id}`, { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'حذف ناموفق بود')
      toast({ title: 'حذف شد', description: 'کتاب از قفسه سراسری برداشته شد' })
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
      title="کتاب‌های درسی سراسری"
      description="برای هر پایه PDF را یک‌بار آپلود کنید. معلمان همان پایه در همه مدارس همان فایل را می‌بینند و مجبور به آپلود مجدد نیستند."
    >
      <form
        onSubmit={onUpload}
        className="mb-8 space-y-4 rounded-xl border border-border/70 bg-card/40 p-4"
        dir="rtl"
      >
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Upload className="size-4" />
          آپلود کتاب پایه
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="admin-tb-title">عنوان</Label>
            <Input
              id="admin-tb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً ریاضی پایه چهارم"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-tb-subject">درس (اختیاری)</Label>
            <Input
              id="admin-tb-subject"
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
                {PLATFORM_GRADES.map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    پایه {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-tb-file">فایل PDF (حداکثر ۵۰ مگابایت)</Label>
            <Input
              id="admin-tb-file"
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
              آپلود در قفسه سراسری
            </>
          )}
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری…
        </div>
      ) : (
        <div className="space-y-6" dir="rtl">
          {PLATFORM_GRADES.map((g) => {
            const books = byGrade.get(g) ?? []
            return (
              <section key={g} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  پایه {g}
                  {books.length === 0 ? ' — هنوز کتابی نیست' : ` — ${books.length} کتاب`}
                </h3>
                {books.length === 0 ? null : (
                  <ul className="space-y-2">
                    {books.map((book) => (
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
                            {book.subject ? `${book.subject} · ` : ''}
                            {formatBytes(book.file_size)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/teacher/textbooks/${book.id}`}>پیش‌نمایش</Link>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void onDelete(book)}
                            aria-label={`حذف ${book.title}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </DashboardPage>
  )
}
