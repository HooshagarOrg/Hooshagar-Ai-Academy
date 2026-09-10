'use client'

import { useCallback, useEffect, useState } from 'react'
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
import { formatBytes } from '@/lib/teacher/textbooks'
import type { TeacherClassRow } from '@/lib/teacher/class-scope'
import type { ClassMaterialRow } from '@/lib/class-files'
import { FileText, Loader2, Trash2, Upload, Download } from 'lucide-react'

type ListResponse = {
  materials: ClassMaterialRow[]
  classes: TeacherClassRow[]
  canUpload?: boolean
  error?: string
}

export default function TeacherClassMaterialsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<ClassMaterialRow[]>([])
  const [classes, setClasses] = useState<TeacherClassRow[]>([])
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/class-materials')
      const data = (await res.json()) as ListResponse
      if (!res.ok) throw new Error(data.error || 'دریافت منابع ناموفق بود')
      setItems(data.materials || [])
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

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title.trim() || !classId) {
      toast({
        title: 'اطلاعات ناقص',
        description: 'کلاس، عنوان و فایل را وارد کنید',
        variant: 'destructive',
      })
      return
    }
    setUploading(true)
    try {
      const uploaded = await presignAndPut({ kind: 'materials', classId, file })
      const confirmRes = await fetch('/api/class-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          title: title.trim(),
          description: description.trim() || null,
          filePath: uploaded.filePath,
          fileSize: uploaded.fileSize,
          mimeType: uploaded.mimeType,
          originalName: uploaded.originalName,
        }),
      })
      const confirm = (await confirmRes.json()) as { error?: string }
      if (!confirmRes.ok) throw new Error(confirm.error || 'ثبت منبع ناموفق بود')
      toast({ title: 'موفق', description: 'منبع برای کلاس ثبت شد' })
      setTitle('')
      setDescription('')
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

  const onDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/class-materials/${id}`)
      const data = (await res.json()) as { signedUrl?: string; error?: string }
      if (!res.ok || !data.signedUrl) throw new Error(data.error || 'دانلود ناموفق بود')
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'دانلود ناموفق بود',
        variant: 'destructive',
      })
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('این منبع از کلاس حذف می‌شود. ادامه می‌دهید؟')) return
    try {
      const res = await fetch(`/api/class-materials/${id}`, { method: 'DELETE' })
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

  const classNameById = Object.fromEntries(
    classes.map((c) => [c.id, c.name || `پایه ${c.grade ?? ''}`])
  )

  return (
    <DashboardPage
      title="منابع کلاس"
      description={`فایل و کلیپ کوتاه برای کل کلاس — بدون نمره. دانش‌آموزان و والدین دانلود می‌کنند. ${CLASS_FILE_LIMITS_SHORT}.`}
    >
      {classes.length === 0 && !loading ? (
        <p className="mb-6 text-sm text-muted-foreground">
          کلاسی به حساب شما وصل نیست. مدیر باید کلاس هوم‌روم را در مدیریت کاربران تنظیم کند.
        </p>
      ) : (
        <form
          onSubmit={(e) => void onUpload(e)}
          className="mb-8 space-y-4 rounded-xl border border-border/70 bg-card/40 p-4"
          dir="rtl"
        >
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Upload className="size-4" />
            آپلود منبع
          </h2>
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
              <Label htmlFor="mat-title">عنوان</Label>
              <Input
                id="mat-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mat-desc">توضیح (اختیاری)</Label>
              <Textarea
                id="mat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mat-file">فایل</Label>
              <Input
                id="mat-file"
                type="file"
                accept={CLASS_FILE_ACCEPT}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <ClassFileLimitsHint />
            </div>
          </div>
          <Button type="submit" disabled={uploading || !classId}>
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال آپلود…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                ثبت برای کلاس
              </>
            )}
          </Button>
        </form>
      )}

      {loading ? (
        <PageSkeletonTable />
      ) : error ? (
        <PageErrorState message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="منبعی ثبت نشده" description="اولین فایل کلاس را آپلود کنید." />
      ) : (
        <ul className="space-y-3" dir="rtl">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/30 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {classNameById[item.class_id] || 'کلاس'}
                  {' · '}
                  {item.original_name}
                  {' · '}
                  {formatBytes(item.file_size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={() => void onDownload(item.id)}>
                  <Download className="size-4" />
                  دانلود
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
