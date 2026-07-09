'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, FileText, Image, Loader2, CheckCircle2, XCircle,
  ChevronRight, Sparkles, Eye, Trash2, Plus, AlertCircle,
  BookOpen, Clock, Edit3, Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GlassCard } from '@/components/ui/glass-card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

// ============================================
// تایپ‌ها
// ============================================
interface ExtractedQuestion {
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'descriptive'
  text: string
  options?: string[]
  correct_answer?: string
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  editing?: boolean
}

const QUESTION_TYPE_LABELS = {
  multiple_choice: 'چندگزینه‌ای',
  true_false: 'صحیح/غلط',
  short_answer: 'جواب کوتاه',
  descriptive: 'تشریحی',
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'آسان', color: 'bg-brand-green/15 text-brand-green' },
  medium: { label: 'متوسط', color: 'bg-brand-yellow/15 text-brand-yellow' },
  hard: { label: 'سخت', color: 'bg-destructive/15 text-destructive' },
}

const SUBJECTS = [
  'ریاضی', 'فارسی', 'علوم', 'اجتماعی', 'عربی', 'دینی',
  'فیزیک', 'شیمی', 'زیست‌شناسی', 'تاریخ', 'جغرافی', 'انگلیسی',
]

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1)

// ============================================
// صفحه اصلی
// ============================================
export default function ExamUploadPage() {
  const router = useRouter()
  const { toast } = useToast()

  // مرحله
  const [step, setStep] = useState<'upload' | 'review' | 'save'>('upload')

  // آپلود
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState('ریاضی')
  const [grade, setGrade] = useState('7')
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)

  // سوالات استخراج‌شده
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([])
  const [estimatedTime, setEstimatedTime] = useState(30)

  // اطلاعات آزمون نهایی
  const [examTitle, setExamTitle] = useState('')
  const [examDate, setExamDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // آپلود فایل
  // ============================================
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) validateAndSetFile(droppedFile)
  }, [])

  const validateAndSetFile = (f: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(f.type)) {
      toast.error('فرمت فایل پشتیبانی نمی‌شود. لطفاً PDF، JPEG یا PNG آپلود کنید')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از ۱۰ مگابایت باشد')
      return
    }
    setFile(f)
  }

  const handleExtract = async () => {
    if (!file) return
    setIsExtracting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subject', subject)
      formData.append('grade', grade)

      const res = await fetch('/api/exams/ocr-import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setQuestions(data.questions.map((q: ExtractedQuestion) => ({ ...q, editing: false })))
      setEstimatedTime(data.estimated_time || 30)
      setExamTitle(`آزمون ${subject} - پایه ${grade}`)
      setStep('review')

      toast.success(`${data.questions.length} سوال با موفقیت استخراج شد`)
    } catch (e: unknown) {
      toast.error('خطا در استخراج: ' + (e instanceof Error ? e.message : 'لطفاً دوباره تلاش کنید'))
    } finally {
      setIsExtracting(false)
    }
  }

  // ============================================
  // ویرایش سوال
  // ============================================
  const updateQuestion = (index: number, updates: Partial<ExtractedQuestion>) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...updates } : q))
  }

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const addBlankQuestion = () => {
    setQuestions(prev => [...prev, {
      type: 'multiple_choice',
      text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 2,
      difficulty: 'medium',
      editing: true,
    }])
  }

  // ============================================
  // ذخیره آزمون
  // ============================================
  const handleSave = async () => {
    if (!examTitle.trim()) {
      toast.error('لطفاً عنوان آزمون را وارد کنید')
      return
    }
    if (!examDate) {
      toast.error('لطفاً تاریخ آزمون را انتخاب کنید')
      return
    }
    if (questions.length === 0) {
      toast.error('حداقل یک سوال نیاز است')
      return
    }

    setIsSaving(true)
    try {
      // ایجاد آزمون
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examTitle,
          subject,
          grade: parseInt(grade),
          exam_date: examDate,
          duration_minutes: estimatedTime,
          questions: questions.map(q => ({
            question_text: q.text,
            question_type: q.type,
            options: q.options ? JSON.stringify(q.options) : null,
            correct_answer: q.correct_answer || null,
            points: q.points,
            difficulty: q.difficulty,
          })),
          exam_config: { source: 'ocr_import', passing_score: 50 },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('آزمون با موفقیت ذخیره شد')
      router.push('/teacher/exams')
    } catch (e: unknown) {
      toast.error('خطا در ذخیره: ' + (e instanceof Error ? e.message : 'لطفاً دوباره تلاش کنید'))
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // رندر
  // ============================================
  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <Upload className="h-8 w-8 text-[var(--lux-primary)]" />
          آپلود آزمون از PDF/عکس
        </span>
      }
      description="سوالات را از برگه آزمون استخراج کنید"
      actions={
        step !== 'upload' ? (
          <Button variant="outline" onClick={() => setStep('upload')}>
            <ChevronRight className="w-4 h-4 ml-1" />
            بازگشت
          </Button>
        ) : undefined
      }
    >

      {/* نوار پیشرفت */}
      <DashboardSectionBlock>
      <div className="flex items-center gap-3">
        {[
          { key: 'upload', label: 'آپلود فایل', num: 1 },
          { key: 'review', label: 'بررسی سوالات', num: 2 },
          { key: 'save', label: 'ذخیره آزمون', num: 3 },
        ].map((s, i, arr) => (
          <div key={s.key} className="flex items-center gap-3 flex-1">
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-1',
              step === s.key ? 'bg-brand-purple text-white' : 'glass-panel-quiet text-muted-foreground'
            )}>
              <span className={cn(
                'w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold',
                step === s.key ? 'bg-white text-brand-purple' : 'bg-white/10 text-muted-foreground'
              )}>{s.num}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < arr.length - 1 && (
              <div className="w-6 h-0.5 bg-white/10 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
      </DashboardSectionBlock>

      {/* ===== مرحله ۱: آپلود ===== */}
      {step === 'upload' && (
        <DashboardSectionBlock>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* تنظیمات */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-4">اطلاعات آزمون</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>درس</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>پایه تحصیلی</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map(g => (
                      <SelectItem key={g} value={String(g)}>پایه {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>

          {/* ناحیه آپلود */}
          <div
            className={cn(
              'border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer',
              isDragging ? 'border-brand-purple/50 bg-brand-purple/10' : 'border-white/15 hover:border-brand-purple/40 hover:bg-brand-purple/5',
              file ? 'border-brand-green/40 bg-brand-green/10' : ''
            )}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={e => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
            />

            {file ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-bold text-brand-green">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={e => { e.stopPropagation(); setFile(null) }}
                >
                  <XCircle className="w-4 h-4 ml-1" />
                  حذف فایل
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center gap-3">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                  <Image className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">فایل را اینجا رها کنید</p>
                <p className="text-sm text-muted-foreground">یا کلیک کنید تا فایل انتخاب کنید</p>
                <div className="flex justify-center gap-2">
                  {['PDF', 'JPEG', 'PNG', 'WebP'].map(f => (
                    <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">حداکثر ۱۰ مگابایت</p>
              </div>
            )}
          </div>

          {/* دکمه استخراج */}
          <Button
            onClick={handleExtract}
            disabled={!file || isExtracting}
            className="w-full bg-brand-purple hover:opacity-90 text-space gap-2 py-6 text-base"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال استخراج سوالات با هوش مصنوعی...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                استخراج سوالات با AI
              </>
            )}
          </Button>

          {isExtracting && (
            <GlassCard quiet className="p-4 text-center border-brand-purple/25">
              <p className="text-brand-purple text-sm font-medium">هوش مصنوعی در حال پردازش تصویر...</p>
              <p className="text-muted-foreground text-xs mt-1">این عملیات ممکن است ۱۰ تا ۳۰ ثانیه طول بکشد</p>
            </GlassCard>
          )}
        </div>
        </DashboardSectionBlock>
      )}

      {/* ===== مرحله ۲: بررسی سوالات ===== */}
      {step === 'review' && (
        <DashboardSectionBlock>
        <div className="space-y-4">
          {/* خلاصه */}
          <GlassCard className="p-4 flex flex-wrap items-center gap-4 border-brand-purple/25">
            <Sparkles className="w-5 h-5 text-brand-purple flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">{questions.length} سوال استخراج شد</p>
              <p className="text-muted-foreground text-sm">زمان تخمینی: {estimatedTime} دقیقه</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addBlankQuestion} className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                اضافه کردن
              </Button>
              <Button
                size="sm"
                className="bg-brand-purple hover:opacity-90 text-space gap-1"
                onClick={() => setStep('save')}
              >
                ادامه
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </GlassCard>

          {/* لیست سوالات */}
          {questions.map((q, idx) => (
            <GlassCard key={idx} className="p-5">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-brand-purple/15 text-brand-purple flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  {/* متادیتا */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {QUESTION_TYPE_LABELS[q.type]}
                    </Badge>
                    <Badge className={cn('text-xs', DIFFICULTY_CONFIG[q.difficulty].color)}>
                      {DIFFICULTY_CONFIG[q.difficulty].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{q.points} نمره</span>
                  </div>

                  {q.editing ? (
                    // حالت ویرایش
                    <div className="space-y-3">
                      <Textarea
                        value={q.text}
                        onChange={e => updateQuestion(idx, { text: e.target.value })}
                        placeholder="متن سوال..."
                        className="text-sm"
                        rows={3}
                      />
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <Input
                              key={oIdx}
                              value={opt}
                              onChange={e => {
                                const newOpts = [...q.options!]
                                newOpts[oIdx] = e.target.value
                                updateQuestion(idx, { options: newOpts })
                              }}
                              placeholder={`گزینه ${oIdx + 1}`}
                              className="text-sm"
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          value={q.correct_answer || ''}
                          onChange={e => updateQuestion(idx, { correct_answer: e.target.value })}
                          placeholder="پاسخ صحیح"
                          className="text-sm flex-1"
                        />
                        <Input
                          type="number"
                          value={q.points}
                          onChange={e => updateQuestion(idx, { points: parseInt(e.target.value) || 1 })}
                          className="text-sm w-20"
                          min={1}
                          max={20}
                        />
                        <Button size="sm" onClick={() => updateQuestion(idx, { editing: false })}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // حالت نمایش
                    <div>
                      <p className="text-sm leading-relaxed">{q.text}</p>
                      {q.options && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={cn(
                              'flex items-center gap-2 text-xs px-2 py-1 rounded',
                              opt === q.correct_answer ? 'bg-brand-green/15 text-brand-green' : 'text-muted-foreground'
                            )}>
                              <span className="font-medium">{['الف', 'ب', 'ج', 'د'][oIdx]})</span>
                              <span>{opt}</span>
                              {opt === q.correct_answer && <CheckCircle2 className="w-3 h-3 mr-auto" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.correct_answer && q.type !== 'multiple_choice' && (
                        <p className="mt-1 text-xs text-brand-green">پاسخ: {q.correct_answer}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* دکمه‌های عملیات */}
                {!q.editing && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="w-7 h-7 p-0" onClick={() => updateQuestion(idx, { editing: true })}>
                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-7 h-7 p-0" onClick={() => removeQuestion(idx)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
        </DashboardSectionBlock>
      )}

      {/* ===== مرحله ۳: ذخیره ===== */}
      {step === 'save' && (
        <DashboardSectionBlock>
        <div className="max-w-lg mx-auto space-y-5">
          <GlassCard className="p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-purple" />
              اطلاعات نهایی آزمون
            </h3>

            <div>
              <Label>عنوان آزمون</Label>
              <Input
                value={examTitle}
                onChange={e => setExamTitle(e.target.value)}
                placeholder="مثال: آزمون فصل سوم ریاضی"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>درس</Label>
                <Input value={subject} readOnly className="mt-1 opacity-80" />
              </div>
              <div>
                <Label>پایه</Label>
                <Input value={`پایه ${grade}`} readOnly className="mt-1 opacity-80" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاریخ و ساعت آزمون</Label>
                <Input
                  type="datetime-local"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>مدت زمان (دقیقه)</Label>
                <Input
                  type="number"
                  value={estimatedTime}
                  onChange={e => setEstimatedTime(parseInt(e.target.value) || 30)}
                  className="mt-1"
                  min={10}
                  max={180}
                />
              </div>
            </div>

            {/* خلاصه */}
            <div className="glass-panel-quiet rounded-xl p-3 text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>تعداد سوالات:</span>
                <span className="font-bold">{questions.length} سوال</span>
              </div>
              <div className="flex justify-between">
                <span>مجموع نمرات:</span>
                <span className="font-bold">{questions.reduce((s, q) => s + q.points, 0)}</span>
              </div>
            </div>
          </GlassCard>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('review')} className="flex-1">
              بازگشت به بررسی
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-brand-purple hover:opacity-90 text-space gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              ذخیره آزمون
            </Button>
          </div>
        </div>
        </DashboardSectionBlock>
      )}
    </DashboardPage>
  )
}
