'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Save,
  CheckCircle,
  AlertTriangle,
  Grid3X3,
  Calculator,
  X,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Types
interface ExamQuestion {
  id: string
  questionNumber: number
  text: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  options?: { id: string; text: string }[]
  points: number
  imageUrl?: string
}

interface Exam {
  id: string
  title: string
  subject: string
  totalQuestions: number
  totalTime: number // minutes
  questions: ExamQuestion[]
}

// داده نمونه
const sampleExam: Exam = {
  id: '1',
  title: 'امتحان میان‌ترم ریاضی',
  subject: 'ریاضی',
  totalQuestions: 20,
  totalTime: 60,
  questions: [
    {
      id: 'q1',
      questionNumber: 1,
      text: 'حاصل عبارت زیر چند است؟\n\n125 + 378 = ؟',
      type: 'multiple_choice',
      options: [
        { id: 'a', text: '403' },
        { id: 'b', text: '503' },
        { id: 'c', text: '603' },
        { id: 'd', text: '703' },
      ],
      points: 2,
    },
    {
      id: 'q2',
      questionNumber: 2,
      text: 'کدام عدد زوج است؟',
      type: 'multiple_choice',
      options: [
        { id: 'a', text: '13' },
        { id: 'b', text: '27' },
        { id: 'c', text: '36' },
        { id: 'd', text: '49' },
      ],
      points: 2,
    },
    {
      id: 'q3',
      questionNumber: 3,
      text: 'حاصل تقسیم 100 بر 4 برابر 25 است.',
      type: 'true_false',
      points: 1,
    },
    {
      id: 'q4',
      questionNumber: 4,
      text: 'معادله x + 5 = 12 را حل کنید. x برابر چند است؟',
      type: 'short_answer',
      points: 2,
    },
    {
      id: 'q5',
      questionNumber: 5,
      text: 'مفهوم کسر را توضیح دهید و یک مثال بزنید.',
      type: 'essay',
      points: 4,
    },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `q${i + 6}`,
      questionNumber: i + 6,
      text: `سوال ${i + 6}: حاصل ${(i + 1) * 5} × ${i + 2} کدام است؟`,
      type: 'multiple_choice' as const,
      options: [
        { id: 'a', text: String((i + 1) * 5 * (i + 2) - 10) },
        { id: 'b', text: String((i + 1) * 5 * (i + 2)) },
        { id: 'c', text: String((i + 1) * 5 * (i + 2) + 10) },
        { id: 'd', text: String((i + 1) * 5 * (i + 2) + 20) },
      ],
      points: 2,
    })),
  ],
}

export default function TakeExamPage() {
  const params = useParams()
  const router = useRouter()
  const [exam] = useState(sampleExam)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([])
  const [timeRemaining, setTimeRemaining] = useState(exam.totalTime * 60) // seconds
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const currentQuestion = exam.questions[currentQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / exam.totalQuestions) * 100

  // Timer
  useEffect(() => {
    if (isSubmitted) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isSubmitted])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handlers
  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleFlag = () => {
    const qId = currentQuestion.id
    setFlaggedQuestions(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    )
  }

  const handleGoToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
    setIsMapOpen(false)
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
    // Navigate to results
    router.push(`/student/exams/${exam.id}/results`)
  }

  // Get question status
  const getQuestionStatus = (questionId: string) => {
    if (answers[questionId]) return 'answered'
    if (flaggedQuestions.includes(questionId)) return 'flagged'
    return 'unanswered'
  }

  // Render question based on type
  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option, index) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center space-x-2 space-x-reverse p-4 rounded-lg border-2 transition-all cursor-pointer",
                  answers[currentQuestion.id] === option.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => handleAnswer(currentQuestion.id, option.id)}
              >
                <RadioGroupItem value={option.id} id={`${currentQuestion.id}-${option.id}`} />
                <Label htmlFor={`${currentQuestion.id}-${option.id}`} className="flex-1 cursor-pointer text-lg">
                  {index + 1}) {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'true_false':
        return (
          <div className="flex justify-center gap-6">
            <Button
              size="lg"
              variant={answers[currentQuestion.id] === 'true' ? 'default' : 'outline'}
              onClick={() => handleAnswer(currentQuestion.id, 'true')}
              className="w-40 h-20 text-xl"
            >
              ✓ صحیح
            </Button>
            <Button
              size="lg"
              variant={answers[currentQuestion.id] === 'false' ? 'default' : 'outline'}
              onClick={() => handleAnswer(currentQuestion.id, 'false')}
              className="w-40 h-20 text-xl"
            >
              ✗ غلط
            </Button>
          </div>
        )

      case 'short_answer':
        return (
          <Input
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            placeholder="پاسخ خود را بنویسید..."
            className="text-lg p-4 h-14"
          />
        )

      case 'essay':
        return (
          <Textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            placeholder="پاسخ خود را بنویسید..."
            rows={8}
            className="text-lg"
          />
        )

      default:
        return null
    }
  }

  if (isSubmitted) {
    return null // Will redirect to results
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg">{exam.title}</h1>
              <p className="text-sm text-gray-500">{exam.subject}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl",
                timeRemaining < 300
                  ? "bg-red-100 text-red-700 animate-pulse"
                  : timeRemaining < 600
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              )}>
                <Clock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </div>

              {/* Progress */}
              <div className="hidden md:flex items-center gap-2">
                <Progress value={progress} className="w-32 h-3" />
                <span className="text-sm font-medium">{answeredCount}/{exam.totalQuestions}</span>
              </div>
            </div>
          </div>

          {/* Question indicator */}
          <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
            <span>سوال {currentQuestionIndex + 1} از {exam.totalQuestions}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentQuestion.points} نمره</Badge>
              {currentQuestion.type === 'multiple_choice' && <Badge variant="secondary">تستی</Badge>}
              {currentQuestion.type === 'true_false' && <Badge variant="secondary">صحیح/غلط</Badge>}
              {currentQuestion.type === 'short_answer' && <Badge variant="secondary">کوتاه‌پاسخ</Badge>}
              {currentQuestion.type === 'essay' && <Badge variant="secondary">تشریحی</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-32 pb-24">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            {/* Question Text */}
            <div className="mb-8">
              <p className="text-xl leading-relaxed whitespace-pre-wrap">
                {currentQuestion.text}
              </p>
              {currentQuestion.imageUrl && (
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question"
                  className="mt-4 max-w-full h-auto rounded-lg"
                />
              )}
            </div>

            {/* Answer Section */}
            {renderQuestion()}

            {/* Flag Button */}
            <div className="mt-6 flex justify-end">
              <Button
                variant="ghost"
                onClick={handleFlag}
                className={cn(
                  "gap-2",
                  flaggedQuestions.includes(currentQuestion.id) && "text-yellow-600"
                )}
              >
                <Flag className={cn(
                  "w-4 h-4",
                  flaggedQuestions.includes(currentQuestion.id) && "fill-yellow-400"
                )} />
                {flaggedQuestions.includes(currentQuestion.id) ? 'علامت‌گذاری شده' : 'علامت‌گذاری برای بعد'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentQuestionIndex === exam.questions.length - 1}
                className="gap-2"
              >
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsMapOpen(true)} className="gap-2">
                <Grid3X3 className="w-4 h-4" />
                نقشه سوالات
              </Button>
              <Button variant="outline" className="gap-2">
                <Save className="w-4 h-4" />
                ذخیره موقت
              </Button>
              <Button
                onClick={() => setIsConfirmSubmitOpen(true)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4" />
                اتمام امتحان
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Map Dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>نقشه سوالات</DialogTitle>
            <DialogDescription>
              روی هر سوال کلیک کنید تا به آن بروید
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-5 gap-2 py-4">
            {exam.questions.map((q, index) => {
              const status = getQuestionStatus(q.id)
              return (
                <button
                  key={q.id}
                  onClick={() => handleGoToQuestion(index)}
                  className={cn(
                    "w-12 h-12 rounded-lg font-bold transition-all flex items-center justify-center",
                    index === currentQuestionIndex && "ring-2 ring-blue-500",
                    status === 'answered' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                    status === 'flagged' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                    status === 'unanswered' && "bg-gray-100 text-gray-500 dark:bg-gray-800"
                  )}
                >
                  {status === 'flagged' && <Flag className="w-3 h-3 absolute -top-1 -right-1 fill-yellow-400 text-yellow-400" />}
                  {index + 1}
                </button>
              )
            })}
          </div>

          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900" />
              <span>پاسخ داده</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900" />
              <span>علامت‌گذاری</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800" />
              <span>پاسخ نداده</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Submit Dialog */}
      <Dialog open={isConfirmSubmitOpen} onOpenChange={setIsConfirmSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              تأیید اتمام امتحان
            </DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید امتحان را به اتمام برسانید؟
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span>سوالات پاسخ داده شده:</span>
              <span className="font-bold text-green-600">{answeredCount} از {exam.totalQuestions}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span>سوالات بدون پاسخ:</span>
              <span className="font-bold text-red-600">{exam.totalQuestions - answeredCount}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span>سوالات علامت‌گذاری شده:</span>
              <span className="font-bold text-yellow-600">{flaggedQuestions.length}</span>
            </div>
          </div>

          <p className="text-sm text-red-600 text-center">
            پس از اتمام نمی‌توانید پاسخ‌ها را تغییر دهید!
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmSubmitOpen(false)}>
              بازگشت
            </Button>
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 ml-2" />
              اتمام قطعی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


