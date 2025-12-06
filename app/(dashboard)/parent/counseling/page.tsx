'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Brain,
  Calendar,
  MessageSquare,
  Target,
  Clock,
  Bell,
  Heart,
  TrendingUp,
  ChevronLeft,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type PriorityLevel,
  type CounselingStatus,
} from '@/lib/types/counseling.types'

// ==========================================
// Types
// ==========================================
interface ParentCounselingView {
  id: string
  student_name: string
  status: CounselingStatus
  sessions_count: number
  last_session_date: string
  next_session_date: string | null
  next_session_type: string | null
  overall_progress: number
  issue_categories: string[]
  counselor_name: string
  counselor_message: string | null
  goals: {
    id: string
    goal: string
    progress: number
    status: string
  }[]
  recent_notes: string[]
}

// ==========================================
// Mock Data
// ==========================================
const mockCounselingData: ParentCounselingView = {
  id: '1',
  student_name: 'علی رضایی',
  status: 'active',
  sessions_count: 8,
  last_session_date: '۵ روز پیش',
  next_session_date: '1403/09/25',
  next_session_type: 'جلسه خانوادگی',
  overall_progress: 65,
  issue_categories: ['تحصیلی', 'رفتاری'],
  counselor_name: 'خانم رحیمی',
  counselor_message: 'پیشرفت خوبی در جلسات اخیر مشاهده شده است. لطفاً در پیگیری تکالیف مشاوره‌ای فرزندتان در منزل همکاری کنید. مهم‌ترین نکته این است که زمان با کیفیت بیشتری را با فرزندتان بگذرانید.',
  goals: [
    { id: '1', goal: 'بهبود رفتار در کلاس', progress: 70, status: 'in_progress' },
    { id: '2', goal: 'افزایش تمرکز در درس', progress: 55, status: 'in_progress' },
    { id: '3', goal: 'مهارت‌های اجتماعی', progress: 45, status: 'in_progress' },
  ],
  recent_notes: [
    'جلسه خانوادگی با والدین برگزار شد - توافقاتی برای بهبود فضای خانه انجام شد',
    'تکنیک‌های مدیریت استرس به دانش‌آموز آموزش داده شد',
    'پیشرفت در همکاری با همکلاسی‌ها مشاهده شده',
  ],
}

// ==========================================
// Helper Components
// ==========================================
const ProgressCircle = ({ value, size = 120 }: { value: number; size?: number }) => {
  const radius = (size - 16) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-white/10"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-purple-500 transition-all duration-1000"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-2xl font-bold">{value}%</span>
      </div>
    </div>
  )
}

const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
      style={{ width: `${value}%` }}
    />
  </div>
)

const getStatusColor = (status: CounselingStatus): string => {
  const colors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    referred: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }
  return colors[status]
}

// ==========================================
// Main Component
// ==========================================
export default function ParentCounselingPage() {
  const [data, setData] = useState<ParentCounselingView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // TODO: Replace with API call
    setTimeout(() => {
      setData(mockCounselingData)
      setIsLoading(false)
    }, 500)
  }, [])

  const handleSendMessage = () => {
    // TODO: Implement message sending
    alert('پیام شما ارسال شد')
    setMessage('')
    setShowMessageDialog(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full bg-white/10" />
          <Skeleton className="h-64 w-full bg-white/10" />
          <Skeleton className="h-48 w-full bg-white/10" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Brain className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">اطلاعات مشاوره در دسترس نیست</p>
          <p className="text-white/40 text-sm mt-2">فرزند شما پرونده مشاوره فعالی ندارد</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ==================== Header Card ==================== */}
        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold text-white">مشاوره فرزند من</h1>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                    {data.student_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{data.student_name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(data.status)}`}>
                        {STATUS_LABELS[data.status]}
                      </span>
                      <span className="text-white/50 text-sm">•</span>
                      <span className="text-white/50 text-sm">{data.sessions_count} جلسه</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {data.issue_categories.map((cat, idx) => (
                    <span key={idx} className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <p className="text-white/50 text-sm mb-2">پیشرفت کلی</p>
                <ProgressCircle value={data.overall_progress} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== Counselor Message ==================== */}
        {data.counselor_message && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/20 p-3 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">پیام مشاور</h3>
                    <span className="text-white/40 text-xs">{data.counselor_name}</span>
                  </div>
                  <p className="text-white/80 leading-relaxed">{data.counselor_message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== Next Session Alert ==================== */}
        {data.next_session_date && (
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500/20 p-3 rounded-xl">
                    <Calendar className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">جلسه بعدی</h3>
                    <p className="text-white/60 text-sm">
                      {data.next_session_date} - {data.next_session_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 text-sm">یادآوری فعال</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== Goals Progress ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              پیشرفت اهداف مشاوره
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {data.goals.map((goal) => (
              <div key={goal.id}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {goal.progress >= 70 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : goal.progress >= 40 ? (
                      <TrendingUp className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                    )}
                    <span className="text-white/80">{goal.goal}</span>
                  </div>
                  <span className="text-white/60 text-sm">{goal.progress}%</span>
                </div>
                <ProgressBar value={goal.progress} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ==================== Recent Activity ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recent_notes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                  <p className="text-white/70 text-sm leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ==================== Quick Stats ==================== */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-500/20 p-3 rounded-xl">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white/50 text-xs">تعداد جلسات</p>
                <p className="text-white text-xl font-bold">{data.sessions_count}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-500/20 p-3 rounded-xl">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white/50 text-xs">آخرین جلسه</p>
                <p className="text-white text-xl font-bold">{data.last_session_date}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==================== Action Buttons ==================== */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white gap-2 py-6">
                <Send className="w-5 h-5" />
                پیام به مشاور
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">ارسال پیام به مشاور</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <User className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">{data.counselor_name}</p>
                    <p className="text-white/50 text-xs">مشاور مدرسه</p>
                  </div>
                </div>
                <Textarea
                  placeholder="پیام خود را بنویسید..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-32"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                >
                  ارسال پیام
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2 py-6">
            <FileText className="w-5 h-5" />
            مشاهده گزارش کامل
          </Button>
        </div>

        {/* ==================== Info Note ==================== */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white/80 text-sm leading-relaxed">
                  همکاری شما در فرآیند مشاوره بسیار ارزشمند است. لطفاً تکالیف مشاوره‌ای را در منزل پیگیری کنید
                  و در صورت مشاهده هرگونه تغییر در رفتار فرزندتان، با مشاور در تماس باشید.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/30 text-sm py-4">
          <p>سیستم مشاوره هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}







