'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Confetti from 'react-confetti'
import {
  Trophy,
  CheckCircle,
  XCircle,
  Minus,
  BarChart3,
  Home,
  ChevronLeft,
  Target,
  TrendingUp,
  Clock,
  Award,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts'

// Types
interface QuestionResult {
  id: string
  questionNumber: number
  text: string
  type: string
  yourAnswer: string | null
  correctAnswer: string
  isCorrect: boolean
  points: number
  earnedPoints: number
  explanation: string
  topic: string
}

interface ExamResult {
  examId: string
  examTitle: string
  subject: string
  totalQuestions: number
  totalScore: number
  maxScore: number
  percentage: number
  passed: boolean
  rank: number
  totalStudents: number
  classAverage: number
  timeSpent: number // minutes
  questions: QuestionResult[]
  topicPerformance: { topic: string; score: number; maxScore: number }[]
}

// داده نمونه
const sampleResult: ExamResult = {
  examId: '1',
  examTitle: 'امتحان میان‌ترم ریاضی',
  subject: 'ریاضی',
  totalQuestions: 20,
  totalScore: 32,
  maxScore: 40,
  percentage: 80,
  passed: true,
  rank: 5,
  totalStudents: 30,
  classAverage: 26,
  timeSpent: 45,
  topicPerformance: [
    { topic: 'جمع و تفریق', score: 8, maxScore: 8 },
    { topic: 'ضرب و تقسیم', score: 6, maxScore: 8 },
    { topic: 'کسرها', score: 7, maxScore: 8 },
    { topic: 'معادلات', score: 5, maxScore: 8 },
    { topic: 'هندسه', score: 6, maxScore: 8 },
  ],
  questions: [
    {
      id: 'q1',
      questionNumber: 1,
      text: 'حاصل 125 + 378 کدام است؟',
      type: 'multiple_choice',
      yourAnswer: 'b',
      correctAnswer: 'b',
      isCorrect: true,
      points: 2,
      earnedPoints: 2,
      explanation: '125 + 378 = 503',
      topic: 'جمع و تفریق',
    },
    {
      id: 'q2',
      questionNumber: 2,
      text: 'کدام عدد زوج است؟',
      type: 'multiple_choice',
      yourAnswer: 'c',
      correctAnswer: 'c',
      isCorrect: true,
      points: 2,
      earnedPoints: 2,
      explanation: '36 یک عدد زوج است زیرا بر 2 بخش‌پذیر است.',
      topic: 'ضرب و تقسیم',
    },
    {
      id: 'q3',
      questionNumber: 3,
      text: 'حاصل تقسیم 100 بر 4 برابر 25 است.',
      type: 'true_false',
      yourAnswer: 'true',
      correctAnswer: 'true',
      isCorrect: true,
      points: 1,
      earnedPoints: 1,
      explanation: '100 ÷ 4 = 25 صحیح است.',
      topic: 'ضرب و تقسیم',
    },
    {
      id: 'q4',
      questionNumber: 4,
      text: 'معادله x + 5 = 12 را حل کنید.',
      type: 'short_answer',
      yourAnswer: '7',
      correctAnswer: '7',
      isCorrect: true,
      points: 2,
      earnedPoints: 2,
      explanation: 'x = 12 - 5 = 7',
      topic: 'معادلات',
    },
    {
      id: 'q5',
      questionNumber: 5,
      text: 'حاصل 15 × 8 کدام است؟',
      type: 'multiple_choice',
      yourAnswer: 'a',
      correctAnswer: 'b',
      isCorrect: false,
      points: 2,
      earnedPoints: 0,
      explanation: '15 × 8 = 120',
      topic: 'ضرب و تقسیم',
    },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `q${i + 6}`,
      questionNumber: i + 6,
      text: `سوال ${i + 6}`,
      type: 'multiple_choice',
      yourAnswer: Math.random() > 0.2 ? 'b' : null,
      correctAnswer: 'b',
      isCorrect: Math.random() > 0.3,
      points: 2,
      earnedPoints: Math.random() > 0.3 ? 2 : 0,
      explanation: 'توضیح سوال',
      topic: ['جمع و تفریق', 'ضرب و تقسیم', 'کسرها', 'معادلات', 'هندسه'][i % 5],
    })),
  ],
}

// Radar chart data
const radarData = sampleResult.topicPerformance.map(t => ({
  topic: t.topic,
  score: (t.score / t.maxScore) * 100,
  fullMark: 100,
}))

// Class comparison data
const comparisonData = [
  { name: 'نمره شما', value: sampleResult.totalScore, fill: '#3b82f6' },
  { name: 'میانگین کلاس', value: sampleResult.classAverage, fill: '#6b7280' },
  { name: 'بالاترین', value: 38, fill: '#22c55e' },
  { name: 'پایین‌ترین', value: 15, fill: '#ef4444' },
]

export default function ExamResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [result] = useState(sampleResult)
  const [showConfetti, setShowConfetti] = useState(result.passed)
  const [activeTab, setActiveTab] = useState('overview')

  const correctCount = result.questions.filter(q => q.isCorrect).length
  const wrongCount = result.questions.filter(q => !q.isCorrect && q.yourAnswer).length
  const unansweredCount = result.questions.filter(q => !q.yourAnswer).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      {showConfetti && result.passed && (
        <Confetti recycle={false} numberOfPieces={200} onConfettiComplete={() => setShowConfetti(false)} />
      )}
      
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          {result.passed ? (
            <>
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Trophy className="w-14 h-14 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-green-600">تبریک! قبول شدید! 🎉</h1>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Award className="w-14 h-14 text-orange-500" />
              </div>
              <h1 className="text-3xl font-bold text-orange-600">تلاش خوبی بود!</h1>
            </>
          )}
          <p className="text-gray-600 dark:text-gray-400 mt-2">{result.examTitle}</p>
        </div>

        {/* Score Card */}
        <Card className="max-w-md mx-auto mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              {/* Circular Progress */}
              <div className="relative w-40 h-40 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={result.percentage >= 50 ? '#22c55e' : '#f97316'}
                    strokeWidth="12"
                    strokeDasharray={`${(result.percentage / 100) * 339} 339`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{result.percentage}%</span>
                  <span className="text-sm text-gray-500">{result.totalScore}/{result.maxScore}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{correctCount}</p>
                  <p className="text-xs text-gray-500">صحیح</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{wrongCount}</p>
                  <p className="text-xs text-gray-500">غلط</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400">{unansweredCount}</p>
                  <p className="text-xs text-gray-500">بدون پاسخ</p>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-6 text-sm">
                <Badge variant="outline" className="gap-1">
                  <Target className="w-3 h-3" />
                  رتبه {result.rank} از {result.totalStudents}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {result.timeSpent} دقیقه
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="analysis">آنالیز عملکرد</TabsTrigger>
            <TabsTrigger value="questions">بررسی سوالات</TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Topic Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    عملکرد در موضوعات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="امتیاز"
                          dataKey="score"
                          stroke="#3b82f6"
                          fill="#3b82f680"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Class Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    مقایسه با کلاس
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, result.maxScore]} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {comparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle>خلاصه آمار</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-sm text-gray-500">میانگین کلاس</p>
                    <p className="text-2xl font-bold text-blue-600">{result.classAverage}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-sm text-gray-500">بالاترین نمره</p>
                    <p className="text-2xl font-bold text-green-600">38</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-sm text-gray-500">پایین‌ترین نمره</p>
                    <p className="text-2xl font-bold text-red-600">15</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <p className="text-sm text-gray-500">صدک شما</p>
                    <p className="text-2xl font-bold text-purple-600">83%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Analysis */}
          <TabsContent value="analysis" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>عملکرد در هر موضوع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.topicPerformance.map(topic => {
                  const percentage = Math.round((topic.score / topic.maxScore) * 100)
                  return (
                    <div key={topic.topic}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{topic.topic}</span>
                        <span className={cn(
                          "text-sm font-bold",
                          percentage >= 75 ? "text-green-600" :
                          percentage >= 50 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {topic.score}/{topic.maxScore} ({percentage}%)
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className={cn(
                          "h-2",
                          percentage >= 75 ? "[&>div]:bg-green-500" :
                          percentage >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                        )}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توصیه‌های یادگیری</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.topicPerformance
                    .filter(t => (t.score / t.maxScore) < 0.75)
                    .map(topic => (
                      <div key={topic.topic} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="font-medium text-yellow-700">
                          💡 موضوع "{topic.topic}" نیاز به تمرین بیشتر دارد
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">
                          پیشنهاد: تمرینات بیشتری در این موضوع انجام دهید.
                        </p>
                      </div>
                    ))}
                  {result.topicPerformance.filter(t => (t.score / t.maxScore) >= 0.75).length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="font-medium text-green-700">
                        🌟 عملکرد عالی در: {result.topicPerformance.filter(t => (t.score / t.maxScore) >= 0.75).map(t => t.topic).join('، ')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Questions Review */}
          <TabsContent value="questions" className="space-y-4 mt-6">
            <Accordion type="single" collapsible className="space-y-2">
              {result.questions.slice(0, 10).map((q, index) => (
                <AccordionItem
                  key={q.id}
                  value={q.id}
                  className={cn(
                    "border rounded-lg",
                    q.isCorrect ? "border-green-200" : q.yourAnswer ? "border-red-200" : "border-gray-200"
                  )}
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        q.isCorrect ? "bg-green-100 text-green-700" :
                        q.yourAnswer ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {q.isCorrect ? <CheckCircle className="w-5 h-5" /> :
                         q.yourAnswer ? <XCircle className="w-5 h-5" /> :
                         <Minus className="w-5 h-5" />}
                      </div>
                      <span className="flex-1 text-right truncate">سوال {q.questionNumber}: {q.text}</span>
                      <Badge variant={q.isCorrect ? 'default' : 'destructive'} className="mr-2">
                        {q.earnedPoints}/{q.points}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 mt-2">
                      <p className="font-medium">{q.text}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          q.isCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
                        )}>
                          <span className="text-sm text-gray-500">پاسخ شما:</span>
                          <p className="font-medium">{q.yourAnswer || 'پاسخ نداده‌اید'}</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <span className="text-sm text-gray-500">پاسخ صحیح:</span>
                          <p className="font-medium">{q.correctAnswer}</p>
                        </div>
                      </div>

                      {q.explanation && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <span className="text-sm text-gray-500">توضیح:</span>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {result.questions.length > 10 && (
              <p className="text-center text-gray-500 py-4">
                و {result.questions.length - 10} سوال دیگر...
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/student/dashboard">
              <Home className="w-4 h-4" />
              بازگشت به داشبورد
            </Link>
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/student/exams">
              <BookOpen className="w-4 h-4" />
              مشاهده سایر امتحانات
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}






































