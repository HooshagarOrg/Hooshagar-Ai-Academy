'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Upload, Download, CheckCircle, XCircle, Loader2,
  FileText, AlertCircle, Users, Briefcase,
} from 'lucide-react'
import { toast } from 'sonner'
import type { StaffImportRow, StudentImportRow } from '@/lib/bulk-import/types'
import { DashboardPage } from '@/components/layout/dashboard-page'

type Step = 'upload' | 'preview' | 'done'

type SheetPreview = {
  sheetName: string
  type: 'students' | 'staff'
  rows: (StudentImportRow | StaffImportRow)[]
}

type School = { id: string; name: string }

export default function BulkImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [schools, setSchools] = useState<School[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [sheets, setSheets] = useState<SheetPreview[]>([])
  const [createParents, setCreateParents] = useState(true)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Array<{ name: string; status: string; message?: string; loginCode?: string; pin?: string }>>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/schools')
      .then((r) => r.json())
      .then((d) => {
        const list: School[] = d.schools || []
        setSchools(list)
        if (list.length === 1 && list[0]) setSchoolId(list[0].id)
      })
      .catch(() => {})
  }, [])

  const downloadTemplate = async (type: 'students' | 'staff') => {
    try {
      const res = await fetch(`/api/admin/bulk-import?type=${type}`)
      if (!res.ok) { toast.error('خطا در دانلود قالب'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bulk-import-${type}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('خطا در دانلود قالب')
    }
  }

  const handleFile = useCallback(async (file: File) => {
    if (!schoolId) {
      toast.error('ابتدا مدرسه را انتخاب کنید')
      return
    }
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('schoolId', schoolId)
      const res = await fetch('/api/admin/bulk-import', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'خطا در خواندن فایل')
        return
      }
      setSheets(data.sheets || [])
      setStep('preview')
      const total = (data.sheets || []).reduce((n: number, s: SheetPreview) => n + s.rows.length, 0)
      toast.success(`${total} ردیف از ${data.sheets?.length || 0} شیت بارگذاری شد`)
    } catch {
      toast.error('خطا در آپلود فایل')
    }
  }, [schoolId])

  const startImport = async () => {
    if (!schoolId) return
    setImporting(true)
    setProgress(0)
    const allResults: typeof results = []
    let done = 0
    const totalSheets = sheets.length

    for (const sheet of sheets) {
      const validRows = sheet.rows.filter((r) => r.status !== 'error')
      if (validRows.length === 0) continue

      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          importType: sheet.type,
          options: {
            schoolId,
            createParentAccounts: createParents,
            skipDuplicates,
          },
          rows: validRows.map((r) => rawFromRow(r, sheet.type)),
        }),
      })
      const data = await res.json()
      if (data.details) allResults.push(...data.details)
      done++
      setProgress(Math.round((done / totalSheets) * 100))
    }

    setResults(allResults)
    setImporting(false)
    setStep('done')
    const ok = allResults.filter((r) => r.status === 'success' || r.status === 'warning').length
    toast.success(`واردسازی تمام شد — موفق: ${ok} | کل: ${allResults.length}`)
  }

  const reset = () => {
    setStep('upload')
    setSheets([])
    setResults([])
    setProgress(0)
  }

  const studentSheets = sheets.filter((s) => s.type === 'students')
  const staffSheets = sheets.filter((s) => s.type === 'staff')
  const allRows = sheets.flatMap((s) => s.rows)
  const validCount = allRows.filter((r) => r.status !== 'error').length
  const errorCount = allRows.filter((r) => r.status === 'error').length

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <Upload className="text-[var(--lux-primary)]" />
          واردسازی گروهی کاربران
        </span>
      }
      description="دانش‌آموز + والد در یک سطر | کارکنان در شیت جدا | ورود با کد ۱۰ رقمی (کد ملی یا موبایل)"
      className="max-w-6xl"
      animatedSections={false}
    >
      {/* انتخاب مدرسه */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium">مدرسه:</span>
          <Select value={schoolId} onValueChange={setSchoolId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="انتخاب مدرسه" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 mr-auto">
            <Button variant="outline" size="sm" onClick={() => downloadTemplate('students')}>
              <Download size={14} className="ml-1" /> قالب دانش‌آموز
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadTemplate('staff')}>
              <Download size={14} className="ml-1" /> قالب کارکنان
            </Button>
          </div>
        </CardContent>
      </Card>

      {step === 'upload' && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-blue-800">شیت دانش‌آموزان</p>
                    <p className="text-sm text-blue-700 mt-1">
                      نام، کد ملی، پایه، کلاس + مشخصات والد در همان سطر
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="text-purple-600 mt-1" />
                  <div>
                    <p className="font-semibold text-purple-800">شیت کارکنان</p>
                    <p className="text-sm text-purple-700 mt-1">
                      نام، کد ملی، نقش، موبایل — کد ورود: کد ملی یا موبایل ۱۰ رقمی
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-700 font-medium text-lg">فایل Excel یا CSV را اینجا بکشید</p>
            <p className="text-sm text-gray-400 mt-2">چند شیت در یک فایل Excel پشتیبانی می‌شود</p>
            <input
              ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />
          </div>
        </>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>پیش‌نمایش و واردسازی</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset}>بارگذاری مجدد</Button>
                <Button
                  onClick={startImport}
                  disabled={importing || validCount === 0}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {importing
                    ? <><Loader2 className="animate-spin ml-2" size={16} /> {progress}%</>
                    : `شروع واردسازی (${validCount} ردیف)`}
                </Button>
              </div>
            </div>
            <div className="flex gap-4 text-sm flex-wrap">
              <span className="text-green-700">✅ معتبر: {validCount}</span>
              <span className="text-red-700">❌ خطا: {errorCount}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={createParents} onCheckedChange={(v) => setCreateParents(Boolean(v))} />
                ایجاد حساب والد در کنار دانش‌آموز
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={skipDuplicates} onCheckedChange={(v) => setSkipDuplicates(Boolean(v))} />
                رد کردن ردیف‌های تکراری
              </label>
            </div>

            <Tabs defaultValue="students">
              <TabsList>
                <TabsTrigger value="students">دانش‌آموزان ({studentSheets.reduce((n, s) => n + s.rows.length, 0)})</TabsTrigger>
                <TabsTrigger value="staff">کارکنان ({staffSheets.reduce((n, s) => n + s.rows.length, 0)})</TabsTrigger>
              </TabsList>

              <TabsContent value="students">
                <PreviewTable sheets={studentSheets} type="students" />
              </TabsContent>
              <TabsContent value="staff">
                <PreviewTable sheets={staffSheets} type="staff" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {step === 'done' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-600" /> نتیجه واردسازی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3 text-right">نام</th>
                    <th className="p-3 text-right">کد ورود</th>
                    <th className="p-3 text-right">رمز/PIN</th>
                    <th className="p-3 text-center">وضعیت</th>
                    <th className="p-3 text-right">پیام</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className={`border-t ${r.status === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
                      <td className="p-3">{r.name}</td>
                      <td className="p-3 font-mono text-xs" dir="ltr">{r.loginCode || '—'}</td>
                      <td className="p-3 font-mono text-xs" dir="ltr">{r.pin || '—'}</td>
                      <td className="p-3 text-center">
                        {r.status === 'success' || r.status === 'warning'
                          ? <CheckCircle className="text-green-600 mx-auto" size={18} />
                          : r.status === 'skipped'
                          ? <AlertCircle className="text-orange-500 mx-auto" size={18} />
                          : <XCircle className="text-red-500 mx-auto" size={18} />}
                      </td>
                      <td className="p-3 text-xs text-gray-600">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={reset}>واردسازی جدید</Button>
              <Button onClick={() => {
                const csv = ['نام,کد_ورود,رمز,وضعیت,پیام', ...results.map((r) =>
                  `"${r.name}","${r.loginCode || ''}","${r.pin || ''}","${r.status}","${r.message || ''}"`
                )].join('\n')
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'import-results.csv'
                a.click()
              }}>
                <Download size={14} className="ml-1" /> دانلود نتایج
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardPage>
  )
}

function PreviewTable({ sheets, type }: { sheets: SheetPreview[]; type: 'students' | 'staff' }) {
  if (sheets.length === 0) {
    return <p className="text-sm text-gray-500 p-4">ردیفی یافت نشد</p>
  }

  return (
    <div className="space-y-4">
      {sheets.map((sheet) => (
        <div key={sheet.sheetName}>
          <p className="text-sm font-medium text-gray-600 mb-2">شیت: {sheet.sheetName}</p>
          <div className="overflow-x-auto rounded-lg border max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 text-right">#</th>
                  <th className="p-2 text-right">نام</th>
                  <th className="p-2 text-right">کد ملی</th>
                  {type === 'students' && <th className="p-2 text-center">پایه</th>}
                  {type === 'students' && <th className="p-2 text-right">والد</th>}
                  {type === 'staff' && <th className="p-2 text-right">نقش</th>}
                  <th className="p-2 text-center">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => {
                  const isStudent = type === 'students'
                  const sRow = row as StudentImportRow
                  const fRow = row as StaffImportRow
                  const name = isStudent
                    ? `${sRow.firstName} ${sRow.lastName}`
                    : `${fRow.firstName} ${fRow.lastName}`
                  const isErr = row.status === 'error'
                  return (
                    <tr key={row.rowNumber} className={`border-t ${isErr ? 'bg-red-50' : ''}`}>
                      <td className="p-2">{row.rowNumber}</td>
                      <td className="p-2">{name}</td>
                      <td className="p-2 font-mono text-xs" dir="ltr">
                        {isStudent ? sRow.nationalCode : fRow.nationalCode}
                      </td>
                      {isStudent && <td className="p-2 text-center">{sRow.grade}</td>}
                      {isStudent && (
                        <td className="p-2 text-xs">
                          {sRow.parentFirstName
                            ? `${sRow.parentFirstName} (${sRow.parentLoginCode || '—'})`
                            : '—'}
                        </td>
                      )}
                      {!isStudent && <td className="p-2">{fRow.role}</td>}
                      <td className="p-2 text-center">
                        {row.status === 'error' && <XCircle className="text-red-500 mx-auto" size={16} />}
                        {row.status === 'warning' && <AlertCircle className="text-orange-500 mx-auto" size={16} />}
                        {(row.status === 'valid' || row.status === 'pending') && <FileText className="text-gray-400 mx-auto" size={16} />}
                        {isErr && <p className="text-xs text-red-600 mt-1">{row.errors.join(' | ')}</p>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function rawFromRow(row: StudentImportRow | StaffImportRow, type: 'students' | 'staff'): Record<string, string> {
  if (type === 'staff') {
    const r = row as StaffImportRow
    return {
      نام: r.firstName,
      نام_خانوادگی: r.lastName,
      کد_ملی: r.nationalCode,
      نقش: r.role,
      موبایل: r.mobile || '',
      کد_ورود: r.loginCode,
    }
  }
  const r = row as StudentImportRow
  return {
    نام: r.firstName,
    نام_خانوادگی: r.lastName,
    کد_ملی: r.nationalCode,
    پایه: String(r.grade),
    کلاس: r.className || '',
    نام_والد: r.parentFirstName || '',
    نام_خانوادگی_والد: r.parentLastName || '',
    کد_ورود_والد: r.parentLoginCode || '',
    موبایل_والد: r.parentMobile || '',
    نسبت_والد: r.parentRelation || 'پدر',
  }
}
