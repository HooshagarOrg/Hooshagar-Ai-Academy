import { NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase-server'
import { AI_FEATURES } from '@/lib/check-ai-limit'

/**
 * GET /api/admin/ai-usage-stats
 * دریافت آمار استفاده از AI
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const schoolId = searchParams.get('schoolId')

    // در محیط واقعی:
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // // بررسی دسترسی ادمین
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user?.id)
    //   .single()
    // 
    // if (!profile || !['admin', 'principal'].includes(profile.role)) {
    //   return NextResponse.json(
    //     { error: 'دسترسی غیرمجاز' },
    //     { status: 403 }
    //   )
    // }
    // 
    // const { data: stats, error } = await supabase.rpc('get_ai_usage_stats', {
    //   p_start_date: startDate,
    //   p_end_date: endDate,
    //   p_school_id: schoolId
    // })

    // داده نمونه
    const summary = {
      today: { usage: 1234, change: 12 },
      week: { usage: 8567, change: 8 },
      month: { usage: 32456, change: -3 },
      costToday: { value: 15.50, change: 5 },
      avgDaily: { value: 1234, change: 0 },
      blocked: { count: 234, change: -15 },
    }

    // روند استفاده
    const trend = Array.from({ length: 30 }, (_, i) => ({
      date: `${i + 1}`,
      usage: Math.floor(Math.random() * 2000) + 1000,
      credits: Math.floor(Math.random() * 10000) + 5000,
    }))

    // آمار به تفکیک قابلیت
    const featureStats = Object.entries(AI_FEATURES).map(([name, feature]) => ({
      featureName: name,
      featureLabel: feature.label,
      featureIcon: feature.icon,
      totalUsage: Math.floor(Math.random() * 5000),
      successfulUsage: Math.floor(Math.random() * 4500),
      blockedUsage: Math.floor(Math.random() * 500),
      totalCredits: Math.floor(Math.random() * 20000),
      uniqueUsers: Math.floor(Math.random() * 500),
    })).sort((a, b) => b.totalUsage - a.totalUsage)

    // آمار به تفکیک نقش
    const roleStats = [
      { role: 'student', label: 'دانش‌آموز', percentage: 65, count: 21000, color: '#3b82f6' },
      { role: 'teacher', label: 'معلم', percentage: 20, count: 6500, color: '#10b981' },
      { role: 'parent', label: 'والد', percentage: 10, count: 3200, color: '#f59e0b' },
      { role: 'other', label: 'سایر', percentage: 5, count: 1756, color: '#6b7280' },
    ]

    // پرمصرف‌ترین کاربران
    const topUsers = [
      { rank: 1, userId: 'user-1', name: 'علی رضایی', role: 'دانش‌آموز', roleIcon: '🎓', today: 15, week: 89, month: 345 },
      { rank: 2, userId: 'user-2', name: 'سارا احمدی', role: 'معلم', roleIcon: '👨‍🏫', today: 12, week: 76, month: 298 },
      { rank: 3, userId: 'user-3', name: 'محمد کریمی', role: 'دانش‌آموز', roleIcon: '🎓', today: 18, week: 67, month: 267 },
      { rank: 4, userId: 'user-4', name: 'فاطمه محمدی', role: 'دانش‌آموز', roleIcon: '🎓', today: 10, week: 56, month: 234 },
      { rank: 5, userId: 'user-5', name: 'امیر حسینی', role: 'معلم', roleIcon: '👨‍🏫', today: 8, week: 45, month: 198 },
    ]

    // موارد مسدود شده
    const blockedRequests = [
      { time: '۱۴:۳۰', userId: 'user-1', userName: 'علی', feature: 'تولید داستان', reason: 'روزانه', remaining: '۵ ساعت' },
      { time: '۱۲:۱۵', userId: 'user-2', userName: 'سارا', feature: 'OCR', reason: 'اعتبار', remaining: '۱۲ روز' },
      { time: '۱۱:۴۵', userId: 'user-3', userName: 'محمد', feature: 'دستیار مطالعه', reason: 'هفتگی', remaining: '۲ روز' },
      { time: '۱۰:۲۰', userId: 'user-4', userName: 'فاطمه', feature: 'تحلیل', reason: 'ماهانه', remaining: '۸ روز' },
    ]

    return NextResponse.json({
      summary,
      trend,
      featureStats,
      roleStats,
      topUsers,
      blockedRequests,
      dateRange: { startDate, endDate },
    })
  } catch (error) {
    console.error('Error fetching AI usage stats:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت آمار' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/ai-usage-stats/export
 * دانلود گزارش
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { format, startDate, endDate, schoolId } = body

    if (!format || !['excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'فرمت نامعتبر است' },
        { status: 400 }
      )
    }

    // در محیط واقعی:
    // - تولید فایل Excel یا PDF
    // - آپلود به storage
    // - برگرداندن لینک دانلود

    console.log('[Export Request]', { format, startDate, endDate, schoolId })

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/admin/ai-usage-stats/download?format=${format}&token=temp-token`,
      message: 'گزارش آماده دانلود است',
    })
  } catch (error) {
    console.error('Error exporting AI usage stats:', error)
    return NextResponse.json(
      { error: 'خطا در تولید گزارش' },
      { status: 500 }
    )
  }
}


