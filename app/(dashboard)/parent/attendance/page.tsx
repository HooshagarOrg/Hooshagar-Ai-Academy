'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, Users, Calendar, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageLoading } from '@/components/ui/page-states'

interface AttendanceRecord {
  id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  student_name?: string
}

interface Child {
  id: string
  full_name: string
  grade: number
  attendance: AttendanceRecord[]
  stats: { total: number; present: number; absent: number; late: number }
}

const statusLabel: Record<string, string> = {
  present: 'حاضر',
  absent: 'غایب',
  late: 'تأخیر',
  excused: 'موجه',
}

const statusColor: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  excused: 'bg-blue-100 text-blue-800',
}

const statusIcon: Record<string, React.ReactNode> = {
  present: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  absent: <XCircle className="w-4 h-4 text-red-600" />,
  late: <Clock className="w-4 h-4 text-yellow-600" />,
  excused: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
}

export default function ParentAttendancePage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    loadAttendance()
  }, [])

  async function loadAttendance() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/parent/attendance')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      if (data.children) {
        setChildren(data.children)
        if (data.children.length > 0) setSelected(data.children[0].id)
      }
    } catch {
      setError('دریافت اطلاعات حضور و غیاب ناموفق بود. لطفاً دوباره تلاش کنید.')
      setChildren([])
    } finally {
      setLoading(false)
    }
  }

  const activeChild = children.find(c => c.id === selected)

  const attendancePercent = (child: Child) => {
    if (!child.stats.total) return 0
    return Math.round((child.stats.present / child.stats.total) * 100)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="rounded-xl bg-blue-100 p-3 w-fit">
          <Calendar className="h-6 w-6 text-blue-600" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">حضور و غیاب فرزندان</h1>
          <p className="text-sm leading-7 text-gray-500">وضعیت حضور و غیاب فرزندتان را مشاهده کنید</p>
        </div>
      </div>

      {loading ? (
        <PageLoading label="در حال بارگذاری حضور و غیاب..." compact />
      ) : error ? (
        <PageErrorState message={error} onRetry={loadAttendance} />
      ) : children.length === 0 ? (
        <EmptyState
          icon={Users}
          title="اطلاعاتی یافت نشد"
          description="فرزندی به حساب شما متصل نیست یا اطلاعات حضور ثبت نشده است."
        />
      ) : (
        <>
          {/* انتخاب فرزند */}
          {children.length > 1 && (
            <div className="flex gap-3 flex-wrap">
              {children.map(child => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelected(child.id)}
                  className={`lux-focus-ring min-h-10 rounded-xl px-4 py-2 font-medium transition-all ${
                    selected === child.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'border bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {child.full_name}
                  <span className="mr-2 text-sm opacity-70">پایه {child.grade}</span>
                </button>
              ))}
            </div>
          )}

          {activeChild && (
            <>
              {/* آمار کلی */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-green-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{activeChild.stats.present}</p>
                    <p className="text-sm text-green-600">روز حاضر</p>
          </CardContent>
        </Card>
                <Card className="border-0 shadow-sm bg-red-50">
                  <CardContent className="p-4 text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-700">{activeChild.stats.absent}</p>
                    <p className="text-sm text-red-600">روز غیبت</p>
          </CardContent>
        </Card>
                <Card className="border-0 shadow-sm bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-700">{activeChild.stats.late}</p>
                    <p className="text-sm text-yellow-600">بار تأخیر</p>
          </CardContent>
        </Card>
                <Card className="border-0 shadow-sm bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700">{attendancePercent(activeChild)}%</p>
                    <p className="text-sm text-blue-600">درصد حضور</p>
          </CardContent>
        </Card>
      </div>

              {/* نوار پیشرفت */}
          <Card>
            <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    نرخ حضور {activeChild.full_name}
                  </CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          attendancePercent(activeChild) >= 80 ? 'bg-green-500' :
                          attendancePercent(activeChild) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${attendancePercent(activeChild)}%` }}
                      />
              </div>
                    <span className="font-bold text-gray-700 w-12">{attendancePercent(activeChild)}%</span>
        </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {activeChild.stats.present} از {activeChild.stats.total} روز تحصیلی
                  </p>
            </CardContent>
          </Card>

              {/* جدول تاریخچه */}
          <Card>
            <CardHeader>
                  <CardTitle className="text-base">تاریخچه حضور و غیاب</CardTitle>
            </CardHeader>
            <CardContent>
                  {activeChild.attendance.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">هنوز اطلاعاتی ثبت نشده</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {activeChild.attendance.map(record => (
                        <div
                          key={record.id}
                          className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {statusIcon[record.status]}
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {new Date(record.date).toLocaleDateString('fa-IR', {
                                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}
                              </p>
                              {record.notes && (
                                <p className="text-xs text-gray-500">{record.notes}</p>
                              )}
                            </div>
                          </div>
                          <Badge className={`${statusColor[record.status]} border-0`}>
                            {statusLabel[record.status]}
                          </Badge>
                        </div>
                      ))}
              </div>
                  )}
            </CardContent>
          </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
