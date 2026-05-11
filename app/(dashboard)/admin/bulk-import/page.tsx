'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, CheckCircle, XCircle, Loader2, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type StudentRow = {
  full_name: string
  student_number: string
  grade: string
  phone?: string
  parent_phone?: string
  email?: string
  _status?: 'pending' | 'success' | 'error'
  _error?: string
}

const CSV_TEMPLATE = `full_name,student_number,grade,phone,parent_phone,email
علی احمدی,10001,5,09121234567,09129876543,
زهرا رضایی,10002,3,,09361112222,
محمد کریمی,10003,7,09351234567,,`

export default function BulkImportPage() {
  const [rows, setRows] = useState<StudentRow[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const blob = new Blob(['\uFEFF' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string): StudentRow[] => {
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = vals[i] || '' })
      return {
        full_name: row['full_name'] || row['نام'] || '',
        student_number: row['student_number'] || row['کد_دانش‌آموزی'] || '',
        grade: row['grade'] || row['پایه'] || '',
        phone: row['phone'] || row['تلفن'] || '',
        parent_phone: row['parent_phone'] || row['تلفن_والد'] || '',
        email: row['email'] || '',
        _status: 'pending',
      } as StudentRow
    }).filter(r => r.full_name)
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        toast.error('فایل خالی یا فرمت نادرست است')
        return
      }
      setRows(parsed)
      setProgress(0)
      toast.success(`${parsed.length} دانش‌آموز بارگذاری شد — بررسی کنید و واردسازی را شروع کنید`)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const startImport = async () => {
    if (rows.length === 0) return
    setImporting(true)
    let done = 0

    const updated = [...rows]
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      if (row._status === 'success') { done++; continue }
      try {
        const pass = `Hooshagar@${row.student_number || Math.random().toString(36).slice(-6)}`
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: row.email || `${row.student_number}@student.hooshagar.ir`,
            password: pass,
            full_name: row.full_name,
            role: 'student',
            phone: row.phone || '',
            student_number: row.student_number,
            grade: parseInt(row.grade) || 1,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          updated[i] = { ...row, _status: 'error', _error: data.error }
        } else {
          updated[i] = { ...row, _status: 'success' }
        }
      } catch {
        updated[i] = { ...row, _status: 'error', _error: 'خطای شبکه' }
      }
      done++
      setProgress(Math.round((done / updated.length) * 100))
      setRows([...updated])
      // تاخیر کوتاه برای جلوگیری از over-rate-limit
      await new Promise(r => setTimeout(r, 300))
    }

    setImporting(false)
    const ok = updated.filter(r => r._status === 'success').length
    const err = updated.filter(r => r._status === 'error').length
    toast.success(`واردسازی تمام شد — موفق: ${ok} | خطا: ${err}`)
  }

  const successCount = rows.filter(r => r._status === 'success').length
  const errorCount = rows.filter(r => r._status === 'error').length

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="text-blue-600" /> واردسازی گروهی دانش‌آموزان
        </h1>
        <p className="text-sm text-gray-500">آپلود فایل CSV برای ثبت چند دانش‌آموز به‌صورت همزمان</p>
      </div>

      {/* دانلود template */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <FileText className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-blue-800">فایل نمونه CSV</p>
              <p className="text-sm text-blue-700">
                ستون‌های مورد نیاز: <code>full_name, student_number, grade</code> (اجباری) |{' '}
                <code>phone, parent_phone, email</code> (اختیاری)
              </p>
            </div>
          </div>
          <Button variant="outline" className="border-blue-400 text-blue-700 shrink-0" onClick={downloadTemplate}>
            <Download size={16} className="ml-1" /> دانلود نمونه
          </Button>
        </CardContent>
      </Card>

      {/* آپلود */}
      {rows.length === 0 && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mx-auto mb-3 text-gray-400" size={48} />
          <p className="text-gray-600 font-medium">فایل CSV را اینجا بکشید یا کلیک کنید</p>
          <p className="text-sm text-gray-400 mt-1">پشتیبانی از فرمت CSV (کدگذاری UTF-8)</p>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
        </div>
      )}

      {/* پیش‌نمایش و واردسازی */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>پیش‌نمایش ({rows.length} دانش‌آموز)</CardTitle>
              <div className="flex gap-2">
                {!importing && (
                  <Button variant="outline" onClick={() => { setRows([]); setProgress(0) }}>
                    بارگذاری مجدد
                  </Button>
                )}
                <Button
                  onClick={startImport}
                  disabled={importing || successCount === rows.length}
                  className="bg-blue-600"
                >
                  {importing
                    ? <><Loader2 className="animate-spin ml-2" size={16} /> واردسازی... {progress}%</>
                    : successCount === rows.length
                    ? <><CheckCircle size={16} className="ml-1" /> تکمیل شد</>
                    : `شروع واردسازی (${rows.length - successCount} نفر)`}
                </Button>
              </div>
            </div>
            {importing && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            {(successCount > 0 || errorCount > 0) && (
              <div className="flex gap-4 text-sm mt-1">
                <span className="text-green-700 font-bold">✅ موفق: {successCount}</span>
                <span className="text-red-700 font-bold">❌ خطا: {errorCount}</span>
                <span className="text-gray-500">⏳ در انتظار: {rows.length - successCount - errorCount}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-right">نام</th>
                    <th className="p-2 text-right">کد دانش‌آموزی</th>
                    <th className="p-2 text-center">پایه</th>
                    <th className="p-2 text-right">تلفن</th>
                    <th className="p-2 text-right">والد</th>
                    <th className="p-2 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={`border-t ${row._status === 'error' ? 'bg-red-50' : row._status === 'success' ? 'bg-green-50' : ''}`}>
                      <td className="p-2 font-medium">{row.full_name}</td>
                      <td className="p-2 font-mono text-xs">{row.student_number || '—'}</td>
                      <td className="p-2 text-center">{row.grade}</td>
                      <td className="p-2 text-xs">{row.phone || '—'}</td>
                      <td className="p-2 text-xs">{row.parent_phone || '—'}</td>
                      <td className="p-2 text-center">
                        {row._status === 'success' && <CheckCircle className="text-green-600 mx-auto" size={18} />}
                        {row._status === 'error' && (
                          <div className="flex items-center gap-1 justify-center">
                            <XCircle className="text-red-500" size={18} />
                            <span className="text-xs text-red-600">{row._error}</span>
                          </div>
                        )}
                        {row._status === 'pending' && <AlertCircle className="text-gray-400 mx-auto" size={18} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
