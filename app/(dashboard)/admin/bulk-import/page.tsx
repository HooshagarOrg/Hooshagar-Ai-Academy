'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  GraduationCap,
  Briefcase,
  Clock,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Send,
  Mail,
  Shield,
  Building,
  FileUp,
  CheckCircle2,
  XCircle,
  Info,
  ArrowLeft,
  Home,
  Plus,
  Settings,
  Database,
  UserPlus,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

type UserType = 'student' | 'teacher' | 'staff'
type RowStatus = 'valid' | 'warning' | 'error'
type ImportStatus = 'idle' | 'uploading' | 'validating' | 'importing' | 'completed' | 'error'

interface ParsedRow {
  rowNumber: number
  status: RowStatus
  data: Record<string, string>
  errors: string[]
  warnings: string[]
  warningActions?: Record<string, 'update' | 'skip' | 'fix'>
}

interface ImportResult {
  total: number
  successful: number
  warnings: number
  errors: number
  smsCount: number
  parentAccounts: number
  details: {
    name: string
    status: 'success' | 'warning' | 'error'
    message?: string
  }[]
}

interface ImportHistory {
  id: string
  date: string
  time: string
  type: UserType
  operator: string
  total: number
  successful: number
  failed: number
  fileName: string
}

// ============================================
// داده‌های نمونه
// ============================================

const STUDENT_COLUMNS = {
  required: [
    { key: 'firstName', label: 'نام', example: 'علی' },
    { key: 'lastName', label: 'نام خانوادگی', example: 'رضایی' },
    { key: 'nationalCode', label: 'کد ملی', example: '1234567890', description: '10 رقم یکتا' },
    { key: 'className', label: 'کلاس', example: 'پنجم الف' },
    { key: 'grade', label: 'پایه', example: 'پنجم', description: 'اول تا ششم' },
  ],
  optional: [
    { key: 'birthDate', label: 'تاریخ تولد', example: '1395-01-01', description: 'YYYY-MM-DD' },
    { key: 'gender', label: 'جنسیت', example: 'پسر', description: 'پسر/دختر' },
    { key: 'fatherName', label: 'نام پدر', example: 'محمد' },
    { key: 'fatherPhone', label: 'شماره موبایل پدر', example: '09121234567', description: '09xxxxxxxxx' },
    { key: 'motherName', label: 'نام مادر', example: 'فاطمه' },
    { key: 'motherPhone', label: 'شماره موبایل مادر', example: '09129876543' },
    { key: 'address', label: 'آدرس', example: 'تهران، خیابان ولیعصر' },
    { key: 'postalCode', label: 'کد پستی', example: '1234567890' },
    { key: 'notes', label: 'توضیحات', example: 'بیماری خاص' },
  ],
}

const TEACHER_COLUMNS = {
  required: [
    { key: 'firstName', label: 'نام', example: 'سارا' },
    { key: 'lastName', label: 'نام خانوادگی', example: 'احمدی' },
    { key: 'nationalCode', label: 'کد ملی', example: '9876543210' },
    { key: 'phone', label: 'شماره موبایل', example: '09121234567' },
    { key: 'subject', label: 'درس تخصصی', example: 'ریاضی' },
    { key: 'grades', label: 'پایه‌های تدریس', example: 'چهارم،پنجم،ششم', description: 'با کاما جدا شود' },
  ],
  optional: [
    { key: 'email', label: 'ایمیل', example: 'sara@example.com' },
    { key: 'experience', label: 'سابقه تدریس', example: '5', description: 'سال' },
    { key: 'degree', label: 'مدرک تحصیلی', example: 'کارشناسی', description: 'کارشناسی/ارشد/دکتری' },
    { key: 'startDate', label: 'تاریخ شروع کار', example: '1398-07-01' },
  ],
}

const STAFF_COLUMNS = {
  required: [
    { key: 'firstName', label: 'نام', example: 'حسین' },
    { key: 'lastName', label: 'نام خانوادگی', example: 'نوری' },
    { key: 'nationalCode', label: 'کد ملی', example: '5555555555' },
    { key: 'role', label: 'نقش', example: 'counselor', description: 'principal, counselor, health_vp, ...' },
    { key: 'phone', label: 'شماره موبایل', example: '09123456789' },
  ],
  optional: [
    { key: 'email', label: 'ایمیل', example: 'hossein@example.com' },
    { key: 'startDate', label: 'تاریخ شروع کار', example: '1400-01-01' },
    { key: 'notes', label: 'توضیحات', example: 'معاون آموزشی' },
  ],
}

const SAMPLE_PARSED_DATA: ParsedRow[] = [
  {
    rowNumber: 1,
    status: 'valid',
    data: { firstName: 'علی', lastName: 'رضایی', nationalCode: '1234567890', className: 'پنجم الف', grade: 'پنجم', fatherPhone: '09121234567' },
    errors: [],
    warnings: [],
  },
  {
    rowNumber: 2,
    status: 'valid',
    data: { firstName: 'سارا', lastName: 'احمدی', nationalCode: '9876543210', className: 'پنجم ب', grade: 'پنجم', fatherPhone: '09129876543' },
    errors: [],
    warnings: [],
  },
  {
    rowNumber: 3,
    status: 'warning',
    data: { firstName: 'محمد', lastName: 'کریمی', nationalCode: '1111111111', className: 'پنجم الف', grade: 'پنجم' },
    errors: [],
    warnings: ['کد ملی تکراری - از قبل در سیستم ثبت شده'],
    warningActions: { duplicate: 'update' },
  },
  {
    rowNumber: 4,
    status: 'error',
    data: { firstName: 'فاطمه', lastName: '', nationalCode: '1234567', className: 'ششم الف', grade: 'ششم' },
    errors: ['نام خانوادگی خالی است', 'کد ملی نامعتبر (7 رقم به جای 10 رقم)'],
    warnings: [],
  },
  {
    rowNumber: 5,
    status: 'valid',
    data: { firstName: 'حسین', lastName: 'محمدی', nationalCode: '2222222222', className: 'چهارم الف', grade: 'چهارم', fatherPhone: '09123333333' },
    errors: [],
    warnings: [],
  },
  {
    rowNumber: 6,
    status: 'valid',
    data: { firstName: 'زهرا', lastName: 'حسینی', nationalCode: '3333333333', className: 'سوم الف', grade: 'سوم', fatherPhone: '09124444444' },
    errors: [],
    warnings: [],
  },
  {
    rowNumber: 7,
    status: 'warning',
    data: { firstName: 'امیر', lastName: 'عباسی', nationalCode: '4444444444', className: 'دوم ب', grade: 'دوم', fatherPhone: '091234' },
    errors: [],
    warnings: ['شماره موبایل نامعتبر (طول کمتر از 11)'],
    warningActions: { phone: 'skip' },
  },
  {
    rowNumber: 8,
    status: 'warning',
    data: { firstName: 'مریم', lastName: 'قاسمی', nationalCode: '5555555555', className: 'اول الف', grade: 'اول', birthDate: '2030-01-01' },
    errors: [],
    warnings: ['تاریخ تولد غیرمنطقی (تاریخ آینده)'],
    warningActions: { date: 'fix' },
  },
]

const SAMPLE_HISTORY: ImportHistory[] = [
  { id: 'h1', date: '1403/08/15', time: '14:30', type: 'student', operator: 'علی رضایی', total: 50, successful: 45, failed: 5, fileName: 'students_1403.xlsx' },
  { id: 'h2', date: '1403/08/10', time: '10:15', type: 'teacher', operator: 'مدیر سیستم', total: 12, successful: 12, failed: 0, fileName: 'teachers.csv' },
  { id: 'h3', date: '1403/07/25', time: '16:45', type: 'staff', operator: 'مدیر سیستم', total: 8, successful: 7, failed: 1, fileName: 'staff_new.xlsx' },
  { id: 'h4', date: '1403/07/01', time: '09:00', type: 'student', operator: 'سارا احمدی', total: 120, successful: 118, failed: 2, fileName: 'grade5_students.xlsx' },
]

// ============================================
// کامپوننت‌ها
// ============================================

function StepIndicator({ 
  currentStep, 
  steps 
}: { 
  currentStep: number
  steps: { label: string; icon: React.ReactNode }[] 
}) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
              index < currentStep
                ? 'bg-green-500 border-green-500 text-white'
                : index === currentStep
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-gray-100 border-gray-300 text-gray-400'
            )}
          >
            {index < currentStep ? <Check className="w-5 h-5" /> : step.icon}
          </div>
          <span
            className={cn(
              'mx-2 text-sm font-medium',
              index <= currentStep ? 'text-gray-800' : 'text-gray-400'
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-2',
                index < currentStep ? 'bg-green-500' : 'bg-gray-300'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function FileDropZone({
  onFileSelect,
  selectedFile,
  onRemove,
  isProcessing,
  progress,
}: {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onRemove: () => void
  isProcessing: boolean
  progress: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileSelect(file)
    },
    [onFileSelect]
  )

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleChange}
            />
            <FileUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              فایل Excel یا CSV را اینجا بکشید
            </p>
            <p className="text-sm text-gray-500 mb-4">یا کلیک کنید</p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4" />
                .xlsx, .xls
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                .csv
              </span>
              <span>حداکثر 5MB</span>
            </div>
          </div>

          <div className="text-center">
            <span className="text-gray-400">یا</span>
          </div>

          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            انتخاب فایل از کامپیوتر
          </Button>
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {!isProcessing && (
              <Button variant="ghost" size="icon" onClick={onRemove}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">در حال پردازش...</span>
                <span className="text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ValidationSummary({
  data,
}: {
  data: ParsedRow[]
}) {
  const summary = useMemo(() => {
    const valid = data.filter((r) => r.status === 'valid').length
    const warning = data.filter((r) => r.status === 'warning').length
    const error = data.filter((r) => r.status === 'error').length
    const total = data.length
    const successRate = total > 0 ? Math.round((valid / total) * 100) : 0

    return { total, valid, warning, error, successRate }
  }, [data])

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          خلاصه فایل آپلود شده
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
            <p className="text-sm text-gray-500">کل</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{summary.valid}</p>
            <p className="text-sm text-gray-500">معتبر</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{summary.warning}</p>
            <p className="text-sm text-gray-500">هشدار</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{summary.error}</p>
            <p className="text-sm text-gray-500">خطا</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">نرخ موفقیت</span>
            <span className="font-medium">{summary.successRate}%</span>
          </div>
          <Progress
            value={summary.successRate}
            className={cn(
              'h-3',
              summary.successRate >= 80
                ? '[&>div]:bg-green-500'
                : summary.successRate >= 50
                ? '[&>div]:bg-yellow-500'
                : '[&>div]:bg-red-500'
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function DataPreviewTable({
  data,
  filter,
  onFilterChange,
}: {
  data: ParsedRow[]
  filter: 'all' | 'valid' | 'warning' | 'error'
  onFilterChange: (filter: 'all' | 'valid' | 'warning' | 'error') => void
}) {
  const filteredData = useMemo(() => {
    if (filter === 'all') return data
    return data.filter((r) => r.status === filter)
  }, [data, filter])

  const getStatusIcon = (status: RowStatus) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">پیش‌نمایش داده‌ها</CardTitle>
          <div className="flex gap-2">
            {(['all', 'valid', 'warning', 'error'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange(f)}
              >
                {f === 'all' && 'همه'}
                {f === 'valid' && '✅ معتبر'}
                {f === 'warning' && '⚠️ هشدار'}
                {f === 'error' && '❌ خطا'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">وضعیت</TableHead>
                <TableHead className="w-[60px]">ردیف</TableHead>
                <TableHead>نام</TableHead>
                <TableHead>نام خانوادگی</TableHead>
                <TableHead>کد ملی</TableHead>
                <TableHead>کلاس</TableHead>
                <TableHead>پایه</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow
                  key={row.rowNumber}
                  className={cn(
                    row.status === 'error' && 'bg-red-50',
                    row.status === 'warning' && 'bg-yellow-50'
                  )}
                >
                  <TableCell>{getStatusIcon(row.status)}</TableCell>
                  <TableCell className="font-mono">{row.rowNumber}</TableCell>
                  <TableCell>{row.data.firstName}</TableCell>
                  <TableCell>{row.data.lastName || <span className="text-red-500">—</span>}</TableCell>
                  <TableCell className="font-mono">{row.data.nationalCode}</TableCell>
                  <TableCell>{row.data.className}</TableCell>
                  <TableCell>{row.data.grade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="mt-4 text-sm text-gray-500 text-center">
          نمایش {filteredData.length} از {data.length} ردیف
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorsAccordion({
  data,
}: {
  data: ParsedRow[]
}) {
  const errors = data.filter((r) => r.status === 'error')
  const warnings = data.filter((r) => r.status === 'warning')

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="w-5 h-5 text-orange-600" />
          جزئیات خطاها و هشدارها
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['errors', 'warnings']}>
          {errors.length > 0 && (
            <AccordionItem value="errors">
              <AccordionTrigger className="text-red-600">
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  خطاها ({errors.length} مورد) - رد می‌شوند
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {errors.map((row) => (
                    <div key={row.rowNumber} className="bg-red-50 p-3 rounded-lg">
                      <p className="font-medium text-gray-800 mb-1">
                        ردیف {row.rowNumber}: {row.data.firstName} {row.data.lastName}
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-600">
                        {row.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {warnings.length > 0 && (
            <AccordionItem value="warnings">
              <AccordionTrigger className="text-yellow-600">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  هشدارها ({warnings.length} مورد) - نیاز به تأیید
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {warnings.map((row) => (
                    <div key={row.rowNumber} className="bg-yellow-50 p-3 rounded-lg">
                      <p className="font-medium text-gray-800 mb-1">
                        ردیف {row.rowNumber}: {row.data.firstName} {row.data.lastName}
                      </p>
                      {row.warnings.map((warn, i) => (
                        <div key={i} className="mt-2">
                          <p className="text-sm text-yellow-700">⚠️ {warn}</p>
                          <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="radio" name={`warn-${row.rowNumber}-${i}`} defaultChecked />
                              <span>به‌روزرسانی اطلاعات</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="radio" name={`warn-${row.rowNumber}-${i}`} />
                              <span>رد کردن این ردیف</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {errors.length === 0 && warnings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>همه ردیف‌ها معتبر هستند!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function BulkImportPage() {
  // State اصلی
  const [activeTab, setActiveTab] = useState<UserType | 'history'>('student')
  const [currentStep, setCurrentStep] = useState(0)

  // State فایل
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'warning' | 'error'>('all')

  // State تنظیمات
  const [createParentAccounts, setCreateParentAccounts] = useState(true)
  const [sendSMS, setSendSMS] = useState(true)
  const [sendEmail, setSendEmail] = useState(false)
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'new'>('skip')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [defaultPassword, setDefaultPassword] = useState('Aa123456')

  // State ورود
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const steps = [
    { label: 'دانلود نمونه', icon: <Download className="w-4 h-4" /> },
    { label: 'آپلود فایل', icon: <Upload className="w-4 h-4" /> },
    { label: 'بررسی', icon: <Search className="w-4 h-4" /> },
    { label: 'تنظیمات', icon: <Settings className="w-4 h-4" /> },
    { label: 'نتیجه', icon: <Check className="w-4 h-4" /> },
  ]

  const getColumnsForType = (type: UserType) => {
    switch (type) {
      case 'student':
        return STUDENT_COLUMNS
      case 'teacher':
        return TEACHER_COLUMNS
      case 'staff':
        return STAFF_COLUMNS
    }
  }

  const columns = getColumnsForType(activeTab as UserType)

  // ============================================
  // Handlers
  // ============================================

  const handleFileSelect = async (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast.error('فرمت فایل نامعتبر است. فقط CSV و Excel پشتیبانی می‌شود.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم فایل بیشتر از 5MB است')
      return
    }

    setSelectedFile(file)
    setIsProcessing(true)
    setUploadProgress(0)

    // Simulate processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 100))
      setUploadProgress(i)
    }

    setParsedData(SAMPLE_PARSED_DATA)
    setIsProcessing(false)
    setCurrentStep(2)
    toast.success('فایل با موفقیت پردازش شد')
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setParsedData([])
    setUploadProgress(0)
  }

  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    toast.success(`فایل نمونه ${format.toUpperCase()} در حال دانلود...`)
    // در عمل، API call برای دانلود فایل
  }

  const handleStartImport = async () => {
    setImportStatus('importing')
    setImportProgress(0)

    const validRows = parsedData.filter((r) => r.status !== 'error')

    // Simulate import
    for (let i = 0; i <= validRows.length; i++) {
      await new Promise((r) => setTimeout(r, 100))
      setImportProgress(Math.round((i / validRows.length) * 100))
    }

    setImportResult({
      total: parsedData.length,
      successful: validRows.length - parsedData.filter((r) => r.status === 'warning').length,
      warnings: parsedData.filter((r) => r.status === 'warning').length,
      errors: parsedData.filter((r) => r.status === 'error').length,
      smsCount: sendSMS ? validRows.length * 2 : 0,
      parentAccounts: createParentAccounts ? validRows.length : 0,
      details: validRows.map((r) => ({
        name: `${r.data.firstName} ${r.data.lastName}`,
        status: r.status === 'warning' ? 'warning' : 'success',
        message: r.warnings[0],
      })),
    })

    setImportStatus('completed')
    setCurrentStep(4)
    toast.success('ورود اطلاعات با موفقیت انجام شد')
  }

  const handleReset = () => {
    setCurrentStep(0)
    setSelectedFile(null)
    setParsedData([])
    setImportStatus('idle')
    setImportProgress(0)
    setImportResult(null)
  }

  const smsCount = useMemo(() => {
    const validRows = parsedData.filter((r) => r.status !== 'error').length
    return validRows * 2 // پدر و مادر
  }, [parsedData])

  const smsCost = smsCount * 200 // 200 تومان هر پیامک

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <UserPlus className="w-8 h-8 text-purple-600" />
                </div>
                ورود گروهی کاربران
              </h1>
              <p className="text-gray-500 mt-2 mr-14">
                وارد کردن دسته‌جمعی دانش‌آموزان، معلمان و کارکنان از فایل
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                پشتیبانی از CSV و Excel
              </Badge>
              <Button variant="outline" onClick={() => setExportDialogOpen(true)} className="gap-2">
                <Download className="w-4 h-4" />
                صادرات کاربران فعلی
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); handleReset(); }}>
          <TabsList className="grid grid-cols-4 w-[500px] mb-6">
            <TabsTrigger value="student" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              دانش‌آموزان
            </TabsTrigger>
            <TabsTrigger value="teacher" className="gap-2">
              <Users className="w-4 h-4" />
              معلمان
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <Briefcase className="w-4 h-4" />
              کارکنان
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              تاریخچه
            </TabsTrigger>
          </TabsList>

          {/* Tab های ورود */}
          {(['student', 'teacher', 'staff'] as const).map((type) => (
            <TabsContent key={type} value={type}>
              {/* Step Indicator */}
              <StepIndicator currentStep={currentStep} steps={steps} />

              {/* Step 0: دانلود نمونه */}
              {currentStep === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-blue-600" />
                      دانلود فایل نمونه
                    </CardTitle>
                    <CardDescription>
                      فایل Excel/CSV نمونه شامل تمام ستون‌های مورد نیاز با نمونه داده
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ستون‌های ضروری */}
                      <div>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          ستون‌های ضروری
                        </h3>
                        <div className="space-y-2">
                          {columns.required.map((col) => (
                            <div
                              key={col.key}
                              className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                            >
                              <div>
                                <span className="font-medium">{col.label} *</span>
                                {col.description && (
                                  <p className="text-xs text-gray-500">{col.description}</p>
                                )}
                              </div>
                              <code className="text-xs bg-white px-2 py-1 rounded">
                                {col.example}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ستون‌های اختیاری */}
                      <div>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-500" />
                          ستون‌های اختیاری
                        </h3>
                        <div className="space-y-2">
                          {columns.optional.map((col) => (
                            <div
                              key={col.key}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <span className="font-medium">{col.label}</span>
                                {col.description && (
                                  <p className="text-xs text-gray-500">{col.description}</p>
                                )}
                              </div>
                              <code className="text-xs bg-white px-2 py-1 rounded">
                                {col.example}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={() => handleDownloadTemplate('xlsx')}
                        className="gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        دانلود نمونه Excel (.xlsx)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadTemplate('csv')}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        دانلود نمونه CSV (.csv)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 1: آپلود فایل */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      آپلود فایل کاربران
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileDropZone
                      onFileSelect={handleFileSelect}
                      selectedFile={selectedFile}
                      onRemove={handleRemoveFile}
                      isProcessing={isProcessing}
                      progress={uploadProgress}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Step 2: پیش‌نمایش و بررسی */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <ValidationSummary data={parsedData} />
                  <DataPreviewTable
                    data={parsedData}
                    filter={previewFilter}
                    onFilterChange={setPreviewFilter}
                  />
                  <ErrorsAccordion data={parsedData} />
                </div>
              )}

              {/* Step 3: تنظیمات نهایی */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      تنظیمات ورود
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {type === 'student' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="createParent"
                            checked={createParentAccounts}
                            onCheckedChange={(c) => setCreateParentAccounts(c as boolean)}
                          />
                          <Label htmlFor="createParent" className="cursor-pointer">
                            ایجاد حساب کاربری برای والدین
                            <span className="text-gray-500 text-sm mr-2">
                              (با شماره موبایل و کد ملی)
                            </span>
                          </Label>
                        </div>

                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="sendSMS"
                            checked={sendSMS}
                            onCheckedChange={(c) => setSendSMS(c as boolean)}
                          />
                          <div>
                            <Label htmlFor="sendSMS" className="cursor-pointer">
                              ارسال پیامک با اطلاعات ورود
                            </Label>
                            {sendSMS && (
                              <p className="text-sm text-gray-500">
                                هزینه تقریبی: {smsCount} پیامک × 200 تومان ={' '}
                                {smsCost.toLocaleString()} تومان
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="sendEmail"
                            checked={sendEmail}
                            onCheckedChange={(c) => setSendEmail(c as boolean)}
                          />
                          <Label htmlFor="sendEmail" className="cursor-pointer">
                            ارسال ایمیل (اگر موجود باشد)
                          </Label>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-4">
                      <Label>در صورت تکراری بودن کد ملی:</Label>
                      <RadioGroup
                        value={duplicateAction}
                        onValueChange={(v) => setDuplicateAction(v as typeof duplicateAction)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="skip" id="skip" />
                          <Label htmlFor="skip" className="cursor-pointer">
                            رد کردن (پیش‌فرض)
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="update" id="update" />
                          <Label htmlFor="update" className="cursor-pointer">
                            به‌روزرسانی اطلاعات موجود
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="new" id="new" />
                          <Label htmlFor="new" className="cursor-pointer">
                            ایجاد با شماره دانش‌آموزی جدید
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>مدرسه مقصد *</Label>
                        <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب مدرسه..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="school1">دبستان تلاش</SelectItem>
                            <SelectItem value="school2">دبستان امید</SelectItem>
                            <SelectItem value="school3">دبستان نور</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>رمز عبور پیش‌فرض</Label>
                        <Input
                          value={defaultPassword}
                          onChange={(e) => setDefaultPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          کاربران می‌توانند بعداً تغییر دهند
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: نتیجه */}
              {currentStep === 4 && importResult && (
                <Card>
                  <CardContent className="py-8">
                    {importStatus === 'importing' ? (
                      <div className="text-center">
                        <Loader2 className="w-16 h-16 mx-auto animate-spin text-blue-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          در حال ورود اطلاعات...
                        </h3>
                        <div className="max-w-md mx-auto mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>پیشرفت</span>
                            <span>{importProgress}%</span>
                          </div>
                          <Progress value={importProgress} className="h-3" />
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>• ایجاد حساب کاربری...</p>
                          <p>• ذخیره اطلاعات...</p>
                          {createParentAccounts && <p>• ایجاد حساب والدین...</p>}
                          {sendSMS && <p>• ارسال پیامک...</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <CheckCircle2 className="w-20 h-20 mx-auto text-green-500 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">
                          ورود اطلاعات تکمیل شد
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
                          <div className="p-4 bg-green-50 rounded-xl">
                            <p className="text-3xl font-bold text-green-600">
                              {importResult.successful}
                            </p>
                            <p className="text-sm text-gray-600">✅ موفق</p>
                          </div>
                          <div className="p-4 bg-yellow-50 rounded-xl">
                            <p className="text-3xl font-bold text-yellow-600">
                              {importResult.warnings}
                            </p>
                            <p className="text-sm text-gray-600">⚠️ هشدار</p>
                          </div>
                          <div className="p-4 bg-red-50 rounded-xl">
                            <p className="text-3xl font-bold text-red-600">
                              {importResult.errors}
                            </p>
                            <p className="text-sm text-gray-600">❌ رد شده</p>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-xl">
                            <p className="text-3xl font-bold text-blue-600">
                              {importResult.smsCount}
                            </p>
                            <p className="text-sm text-gray-600">📧 پیامک</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 max-w-lg mx-auto mb-8 text-right">
                          <p className="text-sm text-gray-600">
                            • {importResult.successful} کاربر با موفقیت ثبت شدند
                          </p>
                          {importResult.parentAccounts > 0 && (
                            <p className="text-sm text-gray-600">
                              • {importResult.parentAccounts} حساب کاربری والدین ایجاد شد
                            </p>
                          )}
                          {importResult.smsCount > 0 && (
                            <p className="text-sm text-gray-600">
                              • {importResult.smsCount} پیامک ارسال شد
                            </p>
                          )}
                          {importResult.errors > 0 && (
                            <p className="text-sm text-red-600">
                              • {importResult.errors + importResult.warnings} مورد رد شد
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center">
                          <Button className="gap-2">
                            <Download className="w-4 h-4" />
                            دانلود گزارش کامل (Excel)
                          </Button>
                          <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            دانلود موارد رد شده
                          </Button>
                          <Button variant="outline" className="gap-2">
                            <Eye className="w-4 h-4" />
                            مشاهده لیست
                          </Button>
                          <Button variant="outline" onClick={handleReset} className="gap-2">
                            <Plus className="w-4 h-4" />
                            ورود فایل جدید
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Navigation Buttons */}
              {currentStep < 4 && (
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className="gap-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                    قبلی
                  </Button>

                  {currentStep === 0 && (
                    <Button onClick={() => setCurrentStep(1)} className="gap-2">
                      بعدی
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}

                  {currentStep === 2 && (
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={parsedData.filter((r) => r.status !== 'error').length === 0}
                      className="gap-2"
                    >
                      بعدی
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}

                  {currentStep === 3 && (
                    <Button
                      onClick={handleStartImport}
                      disabled={!selectedSchool}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Upload className="w-4 h-4" />
                      شروع ورود اطلاعات
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          ))}

          {/* Tab تاریخچه */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      تاریخچه ورود گروهی
                    </CardTitle>
                    <CardDescription>لیست تمام عملیات ورود گروهی قبلی</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="نوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        <SelectItem value="student">دانش‌آموز</SelectItem>
                        <SelectItem value="teacher">معلم</SelectItem>
                        <SelectItem value="staff">کارکنان</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاریخ و ساعت</TableHead>
                      <TableHead>نوع</TableHead>
                      <TableHead>انجام‌دهنده</TableHead>
                      <TableHead>تعداد کل</TableHead>
                      <TableHead>موفق</TableHead>
                      <TableHead>ناموفق</TableHead>
                      <TableHead>فایل</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_HISTORY.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.date} - {item.time}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.type === 'student'
                                ? 'default'
                                : item.type === 'teacher'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {item.type === 'student' && 'دانش‌آموز'}
                            {item.type === 'teacher' && 'معلم'}
                            {item.type === 'staff' && 'کارکنان'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.operator}</TableCell>
                        <TableCell>{item.total}</TableCell>
                        <TableCell className="text-green-600">{item.successful}</TableCell>
                        <TableCell className="text-red-600">{item.failed}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="gap-1 h-8">
                            <Download className="w-3 h-3" />
                            {item.fileName}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                صادرات کاربران فعلی
              </DialogTitle>
              <DialogDescription>
                دانلود اطلاعات کاربران موجود در قالب فایل Excel
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>نوع کاربر *</Label>
                <RadioGroup defaultValue="student">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="student" id="exp-student" />
                    <Label htmlFor="exp-student">دانش‌آموزان</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="teacher" id="exp-teacher" />
                    <Label htmlFor="exp-teacher">معلمان</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="staff" id="exp-staff" />
                    <Label htmlFor="exp-staff">کارکنان</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>مدرسه</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="همه مدارس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه مدارس</SelectItem>
                    <SelectItem value="school1">دبستان تلاش</SelectItem>
                    <SelectItem value="school2">دبستان امید</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ستون‌های خروجی</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="all-fields" defaultChecked />
                    <Label htmlFor="all-fields">همه فیلدها</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="required-only" />
                    <Label htmlFor="required-only">فقط فیلدهای ضروری</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                انصراف
              </Button>
              <Button className="gap-2">
                <Download className="w-4 h-4" />
                دانلود Excel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


























