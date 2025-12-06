'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, Mail, Printer, BookOpen, Users, Heart, Activity, Sparkles, TrendingUp, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Bar, BarChart, Gauge, GaugeContainer, GaugeValueArc, GaugeReferenceArc, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { AnnualReport } from '@/lib/types/academic.types'

export default function AnnualReportPage({ params }: { params: { yearId: string } }) {
  const [report, setReport] = useState<AnnualReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [params.yearId])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/annual/${params.yearId}`)
      const result = await response.json()

      if (result.success) {
        setReport(result.data)
      } else {
        // اگر گزارش وجود نداشت، می‌توانیم تولید کنیم
        toast.info('گزارش یافت نشد. لطفاً ابتدا گزارش را تولید کنید.')
      }
    } catch (error) {
      console.error('خطا در دریافت گزارش:', error)
      toast.error('خطا در دریافت گزارش')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setGenerating(true)

    try {
      // TODO: باید student_id و academic_year_id را از context یا props دریافت کنیم
      const response = await fetch('/api/reports/annual/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'STUDENT_ID', // باید از session یا props دریافت شود
          academic_year_id: params.yearId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setReport(result.data)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('خطا در تولید گزارش:', error)
      toast.error('خطا در تولید گزارش')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPDF = () => {
    toast.info('قابلیت دانلود PDF به زودی...')
  }

  const handleSendEmail = () => {
    toast.info('قابلیت ارسال ایمیل به زودی...')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">در حال بارگذاری...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>گزارش جامع یافت نشد</CardTitle>
            <CardDescription>برای مشاهده گزارش، ابتدا باید آن را تولید کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateReport} disabled={generating}>
              {generating ? 'در حال تولید...' : '📊 تولید گزارش جامع'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const summary = report.summary
  const ai = report.ai_analysis

  // داده‌های نمرات برای نمودار
  const gradesData = Object.entries(summary.grades || {}).map(([subject, score]) => ({
    subject,
    score,
  }))

  return (
    <div className="container mx-auto p-6 space-y-6 print:p-2">
      {/* Header */}
      <Card className="print:shadow-none">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                📊 گزارش جامع سال تحصیلی
              </CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <p className="text-lg font-medium text-foreground">{summary.student_name}</p>
                <p>پایه {summary.grade}</p>
              </CardDescription>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="ml-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail}>
                <Mail className="ml-2 h-4 w-4" />
                ایمیل
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                چاپ
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{summary.overall_gpa || 0}</p>
              <p className="text-sm text-muted-foreground">معدل کل</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {summary.attendance?.percentage || 0}%
              </p>
              <p className="text-sm text-muted-foreground">حضور</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {summary.behavior?.average_score || 0}
              </p>
              <p className="text-sm text-muted-foreground">رفتار</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full print:hidden">
          <TabsTrigger value="grades">
            <BookOpen className="ml-2 h-4 w-4" />
            نمرات
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Users className="ml-2 h-4 w-4" />
            حضور
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <Heart className="ml-2 h-4 w-4" />
            رفتار
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="ml-2 h-4 w-4" />
            بهداشت
          </TabsTrigger>
          <TabsTrigger value="specialty">
            <Sparkles className="ml-2 h-4 w-4" />
            فعالیت‌ها
          </TabsTrigger>
          <TabsTrigger value="ai">
            <TrendingUp className="ml-2 h-4 w-4" />
            تحلیل AI
          </TabsTrigger>
        </TabsList>

        {/* Tab: عملکرد تحصیلی */}
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نمرات درسی</CardTitle>
              <CardDescription>عملکرد تحصیلی در دروس مختلف</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradesData}>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gradesData.map((item) => (
                  <div key={item.subject} className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{item.subject}</span>
                    <Badge variant={item.score >= 17 ? 'default' : item.score >= 12 ? 'secondary' : 'destructive'}>
                      {item.score}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: حضور و غیاب */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>حضور و غیاب</CardTitle>
              <CardDescription>آمار حضور در کلاس</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="w-48 h-48 relative">
                  {/* TODO: Gauge Chart از Recharts */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-green-600">
                        {summary.attendance?.percentage || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">حضور</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{summary.attendance?.present || 0}</p>
                  <p className="text-sm text-muted-foreground">حاضر</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{summary.attendance?.absent || 0}</p>
                  <p className="text-sm text-muted-foreground">غایب</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{summary.attendance?.late || 0}</p>
                  <p className="text-sm text-muted-foreground">تأخیر</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{summary.attendance?.excused || 0}</p>
                  <p className="text-sm text-muted-foreground">مجاز</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: رفتار */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>رفتار و اخلاق</CardTitle>
              <CardDescription>ارزیابی رفتار دانش‌آموز</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-5xl font-bold text-purple-600">
                  {summary.behavior?.average_score || 0}
                </p>
                <p className="text-muted-foreground mt-2">نمره رفتار (از 100)</p>
              </div>

              {summary.behavior?.notes && (
                <div>
                  <h4 className="font-medium mb-2">یادداشت‌های معلم:</h4>
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    {summary.behavior.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">کل ثبت‌ها</p>
                  <p className="text-2xl font-bold">{summary.behavior?.total_records || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">موارد مثبت</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.behavior?.positive_count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: بهداشت */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>گزارشات بهداشتی</CardTitle>
              <CardDescription>معاینات و پیگیری سلامت</CardDescription>
            </CardHeader>
            <CardContent>
              {report.health_summary ? (
                <pre className="text-sm">{JSON.stringify(report.health_summary, null, 2)}</pre>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  گزارش بهداشتی ثبت نشده است
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: فعالیت‌های ویژه */}
        <TabsContent value="specialty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>فعالیت‌های ویژه</CardTitle>
              <CardDescription>موسیقی، هنر، ورزش، رباتیک</CardDescription>
            </CardHeader>
            <CardContent>
              {report.specialty_reports ? (
                <div className="space-y-4">
                  {Object.entries(report.specialty_reports).map(([key, value]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 capitalize">{key}</h4>
                      <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  گزارش فعالیت‌های ویژه ثبت نشده است
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: تحلیل AI */}
        <TabsContent value="ai" className="space-y-4">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 تحلیل هوش مصنوعی
              </CardTitle>
              <CardDescription>تحلیل جامع با استفاده از هوش مصنوعی</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ai ? (
                <>
                  {/* نقاط قوت */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      نقاط قوت
                    </h4>
                    <ul className="space-y-2">
                      {ai.strengths?.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* نقاط ضعف */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      نقاط قابل بهبود
                    </h4>
                    <ul className="space-y-2">
                      {ai.weaknesses?.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-600">⚠</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* پیشنهادات */}
                  <div>
                    <h4 className="font-medium mb-3">💡 پیشنهادات</h4>
                    <ul className="space-y-2">
                      {ai.recommendations?.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm p-3 bg-muted rounded-lg">
                          <span>{index + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* مسیر شغلی */}
                  <div>
                    <h4 className="font-medium mb-3">🎯 مسیر شغلی پیشنهادی</h4>
                    <div className="flex flex-wrap gap-2">
                      {ai.career_suggestions?.map((career, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {career}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* ویژگی‌های شخصیتی */}
                  {ai.personality_traits && (
                    <div>
                      <h4 className="font-medium mb-3">👤 ویژگی‌های شخصیتی</h4>
                      <div className="flex flex-wrap gap-2">
                        {ai.personality_traits.map((trait, index) => (
                          <Badge key={index} variant="outline">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* سبک یادگیری */}
                  {ai.learning_style && (
                    <div>
                      <h4 className="font-medium mb-2">📚 سبک یادگیری</h4>
                      <Badge className="text-base px-4 py-2">{ai.learning_style}</Badge>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  تحلیل هوش مصنوعی در دسترس نیست
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}





