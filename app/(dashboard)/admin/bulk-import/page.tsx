'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, Download, CheckCircle, XCircle, Loader2, FileText, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

// ─── تایپ‌ها ───────────────────────────────────────────────
type StudentRow = {
  full_name: string
  student_number: string
  grade: string
  phone?: string
  parent_phone?: string
  email?: string
  _status?: 'pending' | 'success' | 'error' | 'duplicate'
  _error?: string
}

type ColumnMapping = {
  username_col:  string   // نام کاربری (کد دانش‌آموزی)
  fullname_col:  string   // نام
  lastname_col:  string   // نام خانوادگی
  grade_col:     string   // پایه تحصیلی
}

// فیلدهای سیستم
const SYSTEM_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: 'username_col',  label: 'نام کاربری (رمز عبور یکسان خواهد بود)', required: true  },
  { key: 'fullname_col',  label: 'نام',                                    required: true  },
  { key: 'lastname_col',  label: 'نام خانوادگی',                           required: true  },
  { key: 'grade_col',     label: 'پایه تحصیلی (اختیاری)',                  required: false },
]

const EXCEL_TEMPLATE_CSV = `نام_کاربری,نام,نام_خانوادگی,پایه_تحصیلی,تلفن,تلفن_والد
10001,علی,احمدی,پنجم,09121234567,09129876543
10002,زهرا,رضایی,سوم,,09361112222
10003,محمد,کریمی,هفتم,09351234567,`

const GRADE_MAP: Record<string, number> = {
  'اول': 1, 'دوم': 2, 'سوم': 3, 'چهارم': 4, 'پنجم': 5, 'ششم': 6,
  'هفتم': 7, 'هشتم': 8, 'نهم': 9, 'دهم': 10, 'یازدهم': 11, 'دوازدهم': 12,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12,
}

// ─── کامپوننت اصلی ─────────────────────────────────────────
type Step = 'upload' | 'mapping' | 'preview'

export default function BulkImportPage() {
  const [step, setStep]           = useState<Step>('upload')
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [rawData, setRawData]     = useState<Record<string, string>[]>([])
  const [mapping, setMapping]     = useState<Partial<ColumnMapping>>({})
  const [rows, setRows]           = useState<StudentRow[]>([])
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress]   = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // ─── دانلود نمونه ────────────────────────────────────────
  const downloadTemplate = () => {
    const blob = new Blob(['\uFEFF' + EXCEL_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── خواندن فایل (CSV یا Excel) ──────────────────────────
  const handleFile = useCallback(async (file: File) => {
    try {
      let headers: string[] = []
      let data: Record<string, string>[] = []

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Excel با SheetJS
        const { read, utils } = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const wb = read(buffer)
        const sheetName = wb.SheetNames[0]
        if (!sheetName) { toast.error('فایل Excel بدون شیت است'); return }
        const ws = wb.Sheets[sheetName]
        if (!ws) { toast.error('شیت Excel خوانده نشد'); return }
        const json = utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
        if (json.length === 0) { toast.error('فایل خالی است'); return }
        const firstRow = json[0]
        if (!firstRow) { toast.error('فایل خالی است'); return }
        headers = Object.keys(firstRow)
        data = json.map(row => {
          const r: Record<string, string> = {}
          headers.forEach(h => { r[h] = String(row[h] ?? '') })
          return r
        })
      } else {
        // CSV
        const text = await file.text()
        const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
        if (lines.length < 2) { toast.error('فایل خالی یا فرمت نادرست'); return }
        const headerLine = lines[0]
        if (!headerLine) { toast.error('فایل خالی یا فرمت نادرست'); return }
        headers = headerLine.split(',').map(h => h.trim().replace(/^\uFEFF/, ''))
        data = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim())
          const row: Record<string, string> = {}
          headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
          return row
        }).filter(r => Object.values(r).some(v => v))
      }

      setFileHeaders(headers)
      setRawData(data)

      // تشخیص خودکار ستون‌ها
      const autoMap: Partial<ColumnMapping> = {}
      const lower = (s: string) => s.toLowerCase()
      headers.forEach(h => {
        const l = lower(h)
        if (!autoMap.username_col  && (l.includes('کاربری') || l.includes('username') || l.includes('کد')))
          autoMap.username_col = h
        if (!autoMap.fullname_col  && (l.includes('نام') && !l.includes('خانواد') || l === 'name' || l === 'first'))
          autoMap.fullname_col = h
        if (!autoMap.lastname_col  && (l.includes('خانواد') || l.includes('last')))
          autoMap.lastname_col = h
        if (!autoMap.grade_col     && (l.includes('پایه') || l.includes('grade')))
          autoMap.grade_col = h
      })
      setMapping(autoMap)
      setStep('mapping')
      toast.success(`${data.length} ردیف بارگذاری شد — ستون‌ها را تطبیق دهید`)
    } catch (e) {
      console.error(e)
      toast.error('خطا در خواندن فایل')
    }
  }, [])

  // ─── تأیید mapping و رفتن به پیش‌نمایش ──────────────────
  const confirmMapping = () => {
    if (!mapping.username_col || !mapping.fullname_col || !mapping.lastname_col) {
      toast.error('فیلدهای اجباری را تطبیق دهید')
      return
    }

    const usernameCol = mapping.username_col!
    const fullnameCol = mapping.fullname_col!
    const lastnameCol = mapping.lastname_col!
    const gradeCol = mapping.grade_col

    const parsed: StudentRow[] = rawData.map(row => {
      const username  = (row[usernameCol]  || '').trim()
      const firstName = (row[fullnameCol]  || '').trim()
      const lastName  = (row[lastnameCol]  || '').trim()
      const gradeRaw  = gradeCol ? (row[gradeCol] || '').trim() : ''
      const gradeNum  = GRADE_MAP[gradeRaw] || parseInt(gradeRaw) || 0

      let error = ''
      let status: StudentRow['_status'] = 'pending'

      if (!username)  error = 'نام کاربری خالی می‌باشد'
      if (!firstName) error = (error ? error + ' | ' : '') + 'مقدار خالی می‌باشد'
      if (!lastName)  error = (error ? error + ' | ' : '') + 'نام خانوادگی خالی می‌باشد'

      if (error) status = 'error'

      return {
        full_name:      `${firstName} ${lastName}`.trim(),
        student_number: username,
        grade:          gradeNum ? String(gradeNum) : '',
        _status:        status,
        _error:         error || undefined,
      }
    }).filter(r => r.full_name || r.student_number)

    // تشخیص تکراری‌ها
    const seen = new Set<string>()
    parsed.forEach(r => {
      if (r.student_number) {
        if (seen.has(r.student_number)) {
          if (skipDuplicates) {
            r._status = 'duplicate'
            r._error  = 'نام کاربری تکراری می‌باشد'
          }
        } else {
          seen.add(r.student_number)
        }
      }
    })

    setRows(parsed)
    setStep('preview')
  }

  // ─── واردسازی ────────────────────────────────────────────
  const startImport = async () => {
    const toImport = rows.filter(r => r._status === 'pending')
    if (toImport.length === 0) return
    setImporting(true)
    let done = 0

    const updated = [...rows]
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      if (!row || row._status !== 'pending') { done++; continue }
      try {
        const pass = `Hooshagar@${row.student_number}`
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `${row.student_number}@student.hooshagar.ir`,
            password: pass,
            full_name: row.full_name,
            role: 'student',
            student_number: row.student_number,
            grade: parseInt(row.grade) || 1,
          }),
        })
        const data = await res.json()
        updated[i] = res.ok
          ? { ...row, _status: 'success' }
          : { ...row, _status: 'error', _error: data.error }
      } catch {
        updated[i] = { ...row, _status: 'error', _error: 'خطای شبکه' }
      }
      done++
      setProgress(Math.round((done / updated.length) * 100))
      setRows([...updated])
      await new Promise(r => setTimeout(r, 250))
    }

    setImporting(false)
    const ok  = updated.filter(r => r._status === 'success').length
    const err = updated.filter(r => r._status === 'error').length
    toast.success(`واردسازی تمام شد — موفق: ${ok} | خطا: ${err}`)
  }

  const reset = () => {
    setStep('upload'); setRows([]); setRawData([]); setFileHeaders([])
    setMapping({}); setProgress(0)
  }

  // ─── آمار ────────────────────────────────────────────────
  const successCount   = rows.filter(r => r._status === 'success').length
  const errorCount     = rows.filter(r => r._status === 'error').length
  const duplicateCount = rows.filter(r => r._status === 'duplicate').length
  const pendingCount   = rows.filter(r => r._status === 'pending').length

  // ══════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">

      {/* ─ Header ─ */}
            <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="text-blue-600" /> ثبت دانش‌آموزان
              </h1>
        <p className="text-sm text-gray-500 mt-1">آپلود فایل Excel یا CSV برای ثبت چند دانش‌آموز به‌صورت همزمان</p>
        </div>

      {/* ─ نوار مراحل ─ */}
      <div className="flex items-center gap-2 text-sm">
        {(['upload','mapping','preview'] as Step[]).map((s, i) => {
          const labels = ['آپلود فایل', 'تطبیق ستون‌ها', 'بررسی و ثبت']
          const active = step === s
          const done   = (step === 'mapping' && i === 0) || (step === 'preview' && i <= 1)
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {done ? '✓' : i + 1}
                              </div>
              <span className={active ? 'font-semibold text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}>
                {labels[i] ?? ''}
              </span>
              {i < 2 && <ArrowLeft className="text-gray-300 w-4 h-4" />}
                            </div>
          )
        })}
                      </div>

      {/* ══ مرحله ۱: آپلود ══════════════════════════════════ */}
      {step === 'upload' && (
        <>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <FileText className="text-blue-600 mt-0.5 shrink-0" />
                      <div>
                  <p className="font-semibold text-blue-800">دانلود فایل نمونه</p>
                  <p className="text-sm text-blue-700">
                    فایل نمونه را دانلود، پر کنید و آپلود کنید (CSV یا Excel)
                  </p>
                              </div>
                            </div>
              <Button variant="outline" className="border-blue-400 text-blue-700 shrink-0" onClick={downloadTemplate}>
                <Download size={16} className="ml-1" /> دانلود نمونه
                      </Button>
                  </CardContent>
                </Card>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-700 font-medium text-lg">فایل را اینجا بکشید یا کلیک کنید</p>
            <p className="text-sm text-gray-400 mt-2">پشتیبانی از فرمت‌های CSV و Excel (.xlsx)</p>
            <input
              ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />
                </div>
        </>
              )}

      {/* ══ مرحله ۲: تطبیق ستون‌ها ════════════════════════ */}
      {step === 'mapping' && (
                <Card>
                  <CardHeader>
            <CardTitle>ثبت دانش‌آموزان</CardTitle>
                  </CardHeader>
          <CardContent className="space-y-5">
                              <p className="text-sm text-gray-500">
              برای هر فیلد سیستم، ستون متناظر در فایل Excel را انتخاب کنید
            </p>

            {/* جدول تطبیق */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                <span>ستون فایل excel</span>
                <span>ستون الگو</span>
                        </div>
              {SYSTEM_FIELDS.map(field => (
                <div key={field.key} className="grid grid-cols-2 items-center px-4 py-3 border-t hover:bg-gray-50">
                  <span className="text-sm text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                  </span>
                  <Select
                    value={mapping[field.key] || ''}
                    onValueChange={val => setMapping(prev => ({ ...prev, [field.key]: val }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="انتخاب کنید" />
                          </SelectTrigger>
                          <SelectContent>
                      {!field.required && (
                        <SelectItem value="__none__">— انتخاب نشود —</SelectItem>
                      )}
                      {fileHeaders.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                          </SelectContent>
                        </Select>
                </div>
              ))}
                      </div>

            {/* صرف نظر از تکراری‌ها */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="skip-dup"
                checked={skipDuplicates}
                onCheckedChange={v => setSkipDuplicates(Boolean(v))}
              />
              <label htmlFor="skip-dup" className="text-sm text-blue-800 cursor-pointer font-medium">
                صرف نظر از خطای ثبت کاربرهای تکراری (ثبت ردیف‌های بدون خطا)
              </label>
                      </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={reset}>بازگشت</Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={confirmMapping}>
                تایید - ادامه
                          </Button>
                        </div>
                  </CardContent>
                </Card>
              )}

      {/* ══ مرحله ۳: پیش‌نمایش و واردسازی ════════════════ */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle>ثبت دانش‌آموزان — پیش‌نمایش</CardTitle>
              <div className="flex gap-2">
                {!importing && (
                  <Button variant="outline" onClick={reset}>بارگذاری مجدد</Button>
                )}
                    <Button
                  onClick={startImport}
                  disabled={importing || pendingCount === 0}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {importing
                    ? <><Loader2 className="animate-spin ml-2" size={16} /> واردسازی... {progress}%</>
                    : pendingCount === 0
                    ? <><CheckCircle size={16} className="ml-1" /> تکمیل شد</>
                    : `تایید - ادامه (${pendingCount} نفر)`}
                    </Button>
              </div>
            </div>

            {/* نوار پیشرفت */}
            {importing && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}

            {/* آمار */}
            <div className="flex gap-4 text-sm mt-2 flex-wrap">
              <span className="text-green-700 font-bold">✅ موفق: {successCount}</span>
              <span className="text-red-700 font-bold">❌ خطا: {errorCount}</span>
              {duplicateCount > 0 && (
                <span className="text-orange-700 font-bold">⚠️ تکراری: {duplicateCount}</span>
              )}
              <span className="text-gray-500">⏳ در انتظار: {pendingCount}</span>
                </div>
              </CardHeader>

              <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-right font-semibold border-b">نام کاربری</th>
                    <th className="p-3 text-right font-semibold border-b">نام</th>
                    <th className="p-3 text-right font-semibold border-b">نام خانوادگی</th>
                    <th className="p-3 text-center font-semibold border-b">پایه تحصیلی</th>
                    <th className="p-3 text-center font-semibold border-b">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const nameParts = row.full_name.split(' ')
                    const fn = nameParts[0] || ''
                    const ln = nameParts.slice(1).join(' ') || ''
                    const isOk  = row._status === 'success'
                    const isErr = row._status === 'error' || row._status === 'duplicate'
                    return (
                      <tr
                        key={idx}
                        className={`border-b transition-colors ${
                          isOk  ? 'bg-green-50 hover:bg-green-100' :
                          isErr ? 'bg-red-50 hover:bg-red-100' :
                          'hover:bg-gray-50'
                        }`}
                      >
                        <td className={`p-3 font-mono text-xs ${isErr ? 'text-red-700' : ''}`}>
                          {row.student_number || (
                            <span className="text-red-500">مقدار خالی می‌باشد</span>
                          )}
                          {row._error?.includes('تکراری') && (
                            <span className="text-orange-600 text-xs block">نام کاربری تکراری می باشد</span>
                          )}
                        </td>
                        <td className={`p-3 ${isErr && !fn ? 'text-red-500' : ''}`}>
                          {fn || <span className="text-red-500">مقدار خالی می‌باشد</span>}
                        </td>
                        <td className={`p-3 ${isErr && !ln ? 'text-red-500' : ''}`}>
                          {ln || <span className="text-red-500">مقدار خالی می‌باشد</span>}
                        </td>
                        <td className="p-3 text-center">
                          {row.grade ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {Object.entries(GRADE_MAP).find(([k, v]) => v === parseInt(row.grade, 10) && !/^\d+$/.test(k))?.[0] ?? `پایه ${row.grade}`}
                            </Badge>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-center">
                          {row._status === 'success'   && <CheckCircle className="text-green-600 mx-auto" size={20} />}
                          {row._status === 'error'     && <XCircle     className="text-red-500 mx-auto"   size={20} />}
                          {row._status === 'duplicate' && <AlertCircle className="text-orange-500 mx-auto" size={20} />}
                          {row._status === 'pending'   && <AlertCircle className="text-gray-400 mx-auto"   size={20} />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                بازگشت
                            </Button>
                          </div>
              </CardContent>
            </Card>
      )}

      {/* Dialog پیام‌ها */}
    </div>
  )
}
