'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Calendar, CheckCircle, Plus, Rocket, BarChart3, Edit, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { AcademicYear, PromotionResult } from '@/lib/types/academic.types'

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null)
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState(false)
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [showNewYearDialog, setShowNewYearDialog] = useState(false)
  const [promotionResult, setPromotionResult] = useState<PromotionResult | null>(null)

  const [formData, setFormData] = useState({
    year_name: '',
    start_date: '',
    end_date: '',
    auto_promotion_enabled: true,
    auto_promotion_date: '',
  })

  useEffect(() => {
    fetchYears()
  }, [])

  const fetchYears = async () => {
    try {
      const response = await fetch('/api/academic-years')
      const result = await response.json()

      if (result.success) {
        setYears(result.data)
        setCurrentYear(result.data.find((y: AcademicYear) => y.is_current) || null)
      }
    } catch (error) {
      console.error('خطا در دریافت سال‌های تحصیلی:', error)
      toast.error('خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setShowNewYearDialog(false)
        fetchYears()
        setFormData({
          year_name: '',
          start_date: '',
          end_date: '',
          auto_promotion_enabled: true,
          auto_promotion_date: '',
        })
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('خطا در ایجاد سال تحصیلی:', error)
      toast.error('خطا در ایجاد سال تحصیلی')
    }
  }

  const handlePromote = async () => {
    if (!currentYear) {
      toast.error('سال تحصیلی فعلی یافت نشد')
      return
    }

    setPromoting(true)

    try {
      const response = await fetch('/api/academic-years/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academic_year_id: currentYear.id }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setPromotionResult(result.data)
        setShowPromoteDialog(false)
        fetchYears()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('خطا در ارتقای خودکار:', error)
      toast.error('خطا در ارتقای دانش‌آموزان')
    } finally {
      setPromoting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">در حال بارگذاری...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مدیریت سال‌های تحصیلی</h1>
          <p className="text-muted-foreground">مدیریت سال تحصیلی و ارتقای خودکار دانش‌آموزان</p>
        </div>
        <Dialog open={showNewYearDialog} onOpenChange={setShowNewYearDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              سال جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateYear}>
              <DialogHeader>
                <DialogTitle>ایجاد سال تحصیلی جدید</DialogTitle>
                <DialogDescription>
                  اطلاعات سال تحصیلی جدید را وارد کنید
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="year_name">نام سال (مثال: 1404-1405)</Label>
                  <Input
                    id="year_name"
                    value={formData.year_name}
                    onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                    placeholder="1404-1405"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">تاریخ شروع</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">تاریخ پایان</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="auto_promotion"
                    checked={formData.auto_promotion_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_promotion_enabled: checked as boolean })
                    }
                  />
                  <Label htmlFor="auto_promotion" className="cursor-pointer">
                    فعال کردن ارتقای خودکار
                  </Label>
                </div>

                {formData.auto_promotion_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="auto_promotion_date">تاریخ ارتقای خودکار</Label>
                    <Input
                      id="auto_promotion_date"
                      type="date"
                      value={formData.auto_promotion_date}
                      onChange={(e) => setFormData({ ...formData, auto_promotion_date: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowNewYearDialog(false)}>
                  انصراف
                </Button>
                <Button type="submit">💾 ذخیره</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* کارت سال فعلی */}
      {currentYear && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              سال تحصیلی فعلی: {currentYear.year_name}
            </CardTitle>
            <CardDescription>سال تحصیلی جاری و تنظیمات آن</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">تاریخ شروع</p>
                <p className="font-medium">{formatDate(currentYear.start_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاریخ پایان</p>
                <p className="font-medium">{formatDate(currentYear.end_date)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">ارتقای خودکار</p>
              <Badge variant={currentYear.auto_promotion_enabled ? 'default' : 'secondary'}>
                {currentYear.auto_promotion_enabled ? '✅ فعال' : '❌ غیرفعال'}
              </Badge>
              {currentYear.auto_promotion_date && (
                <p className="text-sm mt-1">
                  تاریخ ارتقا: {formatDate(currentYear.auto_promotion_date)}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline">
              <Edit className="ml-2 h-4 w-4" />
              ویرایش
            </Button>
            <Button onClick={() => setShowPromoteDialog(true)}>
              <Rocket className="ml-2 h-4 w-4" />
              اجرای ارتقای دستی
            </Button>
            <Button variant="outline">
              <BarChart3 className="ml-2 h-4 w-4" />
              گزارش جامع
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* نتیجه ارتقا */}
      {promotionResult && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              ارتقا با موفقیت انجام شد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-bold text-green-600">{promotionResult.promoted_count} نفر</p>
                <p className="text-sm text-muted-foreground">ارتقا یافته</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-600">{promotionResult.failed_count} نفر</p>
                <p className="text-sm text-muted-foreground">مردود</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* لیست سال‌های قبل */}
      <Card>
        <CardHeader>
          <CardTitle>سال‌های تحصیلی قبل</CardTitle>
          <CardDescription>تاریخچه سال‌های تحصیلی</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>سال</TableHead>
                <TableHead>تاریخ شروع</TableHead>
                <TableHead>تاریخ پایان</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.filter(y => !y.is_current).map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">{year.year_name}</TableCell>
                  <TableCell>{formatDate(year.start_date)}</TableCell>
                  <TableCell>{formatDate(year.end_date)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">بسته شده</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog تأیید ارتقا */}
      <AlertDialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ تأیید ارتقای دانش‌آموزان</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>این عملیات:</p>
              <ul className="list-disc mr-5 space-y-1">
                <li>همه دانش‌آموزان را به پایه بعد ارتقا می‌دهد</li>
                <li>گزارش پایان سال تولید می‌کند</li>
                <li><strong className="text-red-600">قابل بازگشت نیست!</strong></li>
              </ul>
              <p className="font-medium mt-4">آیا مطمئن هستید؟</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>← انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} disabled={promoting}>
              {promoting ? 'در حال اجرا...' : '✅ اجرای ارتقا'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}





