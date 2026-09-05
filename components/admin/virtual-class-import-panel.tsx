'use client'

import { useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/ui/glass-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  isImportablePreviewRow,
  previewRowToRaw,
  type VirtualClassImportResult,
  type VirtualClassPreviewRow,
} from '@/lib/virtual-class/import-map'

type School = { id: string; name: string }
type Step = 'upload' | 'preview' | 'done'

interface VirtualClassImportPanelProps {
  schools: School[]
  schoolId: string
  onSchoolChange: (id: string) => void
  onImported: () => void
}

export function VirtualClassImportPanel({
  schools,
  schoolId,
  onSchoolChange,
  onImported,
}: VirtualClassImportPanelProps) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [checking, setChecking] = useState(false)
  const [importing, setImporting] = useState(false)
  const [previewRows, setPreviewRows] = useState<VirtualClassPreviewRow[]>([])
  const [results, setResults] = useState<VirtualClassImportResult[]>([])

  const visibleRows = previewRows.filter((r) => r.status !== 'skipped' || r.alreadyLinked)
  const validCount = previewRows.filter(isImportablePreviewRow).length
  const errorCount = previewRows.filter((r) => r.status === 'error').length
  const skipCount = previewRows.filter((r) => r.status === 'skipped').length

  const downloadTemplate = async () => {
    try {
      const res = await fetch('/api/platform-admin/virtual-classes/import')
      if (!res.ok) throw new Error('دانلود قالب ناموفق بود')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'skyroom-virtual-classes.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در دانلود قالب')
    }
  }

  const reset = () => {
    setStep('upload')
    setPreviewRows([])
    setResults([])
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleFile = async (file: File) => {
    if (!schoolId) {
      toast.error('ابتدا مدرسه را انتخاب کنید')
      return
    }
    setChecking(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('schoolId', schoolId)
      const res = await fetch('/api/platform-admin/virtual-classes/import', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خواندن فایل ناموفق بود')
      const rows = (data.rows || []) as VirtualClassPreviewRow[]
      setPreviewRows(rows)
      setStep('preview')
      toast.success(`${rows.length} ردیف بررسی شد`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در بررسی فایل')
    } finally {
      setChecking(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const startImport = async () => {
    const importable = previewRows.filter(isImportablePreviewRow)
    if (importable.length === 0 || !schoolId) return
    setImporting(true)
    try {
      const res = await fetch('/api/platform-admin/virtual-classes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          schoolId,
          rows: importable.map(previewRowToRaw),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'واردسازی ناموفق بود')
      const nextResults = (data.results || []) as VirtualClassImportResult[]
      setResults(nextResults)
      setStep('done')
      const ok = data.inserted_count || 0
      const failed = data.error_count || 0
      if (failed > 0) {
        toast.error(`${ok} وصل شد — ${failed} خطا`)
      } else {
        toast.success(`${ok} کلاس مجازی وصل شد`)
      }
      onImported()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در واردسازی')
    } finally {
      setImporting(false)
    }
  }

  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Label>مدرسه برای واردسازی اکسل</Label>
          <Select
            value={schoolId}
            onValueChange={(id) => {
              onSchoolChange(id)
              reset()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب مدرسه" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => void downloadTemplate()}>
          <Download className="h-4 w-4 ml-1" />
          دانلود نمونه اکسل
        </Button>
        {step === 'upload' ? (
          <Button
            variant="outline"
            size="sm"
            disabled={checking || !schoolId}
            onClick={() => fileRef.current?.click()}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin ml-1" />
            ) : (
              <Upload className="h-4 w-4 ml-1" />
            )}
            {checking ? 'در حال بررسی...' : 'آپلود و بررسی اکسل'}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={reset}>
            بارگذاری مجدد
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        مثل واردسازی کاربران، ابتدا شیت بررسی می‌شود و خطاهای هر ردیف نمایش داده می‌شود.
        فقط ردیف‌های معتبر وارد می‌شوند. ستون «کلاس» باید با نام کلاس واردسازی دانش‌آموزان یکی باشد
        (مثلاً «خانم کرد»، نه «اول خانم کرد»).
      </p>

      {step === 'preview' && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-green-700 dark:text-emerald-300">✅ آماده: {validCount}</span>
              <span className="text-red-700 dark:text-red-300">❌ خطا: {errorCount}</span>
              {skipCount > 0 && (
                <span className="text-amber-700 dark:text-amber-300">⏭ رد شده: {skipCount}</span>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => void startImport()}
              disabled={importing || validCount === 0}
            >
              {importing ? (
                <Loader2 className="ml-1 h-4 w-4 animate-spin" />
              ) : null}
              شروع واردسازی ({validCount} ردیف)
            </Button>
          </div>
          {validCount === 0 && (
            <p className="text-sm text-destructive">
              ردیف معتبری برای واردسازی نیست. خطاها را در جدول ببینید و فایل را اصلاح کنید.
            </p>
          )}
          <PreviewTable rows={visibleRows} />
        </div>
      )}

      {step === 'done' && (
        <div className="mt-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className="h-4 w-4 text-green-600" />
            نتیجه واردسازی
          </p>
          <div className="max-h-96 overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--lux-elevated)]">
                <tr>
                  <th className="p-2 text-right">#</th>
                  <th className="p-2 text-right">عنوان</th>
                  <th className="p-2 text-center">وضعیت</th>
                  <th className="p-2 text-right">پیام</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.rowNumber}
                    className={cn(
                      'border-t',
                      r.status === 'error' && 'bg-red-50 dark:bg-red-950/30',
                      r.status === 'success' && 'bg-emerald-50/70 dark:bg-emerald-950/20'
                    )}
                  >
                    <td className="p-2">{r.rowNumber}</td>
                    <td className="p-2">{r.title}</td>
                    <td className="p-2 text-center">
                      {r.status === 'success' ? (
                        <CheckCircle className="mx-auto size-4 text-green-600" />
                      ) : r.status === 'skipped' ? (
                        <AlertCircle className="mx-auto size-4 text-amber-500" />
                      ) : (
                        <XCircle className="mx-auto size-4 text-red-500" />
                      )}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </GlassCard>
  )
}

function PreviewTable({ rows }: { rows: VirtualClassPreviewRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">ردیفی برای نمایش نیست</p>
  }

  return (
    <div className="max-h-96 overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[var(--lux-elevated)]">
          <tr>
            <th className="p-2 text-right">#</th>
            <th className="p-2 text-center">پایه</th>
            <th className="p-2 text-right">کلاس</th>
            <th className="p-2 text-right">عنوان</th>
            <th className="p-2 text-right">شناسه اتاق</th>
            <th className="p-2 text-right">نام لاتین</th>
            <th className="p-2 text-center">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isErr = row.status === 'error'
            const messages = [...row.errors, ...row.warnings]
            return (
              <tr
                key={row.rowNumber}
                className={cn('border-t', isErr && 'bg-red-50 dark:bg-red-950/30')}
              >
                <td className="p-2">{row.rowNumber}</td>
                <td className="p-2 text-center">{row.grade != null && row.grade > 0 ? row.grade : '—'}</td>
                <td className="p-2">{row.className || '—'}</td>
                <td className="p-2 text-xs">{row.title || '—'}</td>
                <td className="p-2 font-mono text-xs" dir="ltr">
                  {row.roomIdRaw || '—'}
                </td>
                <td className="p-2 font-mono text-xs" dir="ltr">
                  {row.latinName || '—'}
                </td>
                <td className="p-2 text-center">
                  {row.status === 'error' && <XCircle className="mx-auto size-4 text-red-500" />}
                  {row.status === 'warning' && (
                    <AlertCircle className="mx-auto size-4 text-amber-500" />
                  )}
                  {row.status === 'valid' && (
                    <FileText className="mx-auto size-4 text-muted-foreground" />
                  )}
                  {row.status === 'skipped' && (
                    <AlertCircle className="mx-auto size-4 text-amber-500" />
                  )}
                  {messages.length > 0 && (
                    <p
                      className={cn(
                        'mt-1 text-xs leading-relaxed',
                        isErr ? 'text-red-600 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
                      )}
                    >
                      {messages.join(' | ')}
                    </p>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
