'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Sparkles, CheckCircle2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

interface Capability {
  capability_key: string
  capability_name: string
  capability_description?: string
}

interface TestResult {
  content: string
  model_used: string
  tier_used: number
  tokens: number
  response_time_ms: number
}

export default function AITestPage() {
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [selectedCapability, setSelectedCapability] = useState<string>('')
  const [prompt, setPrompt] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  // دریافت لیست قابلیت‌ها
  useEffect(() => {
    fetch('/api/ai/test')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCapabilities(data.capabilities)
        }
      })
      .catch(err => {
        console.error('Error loading capabilities:', err)
        // Mock data برای تست (وقتی Supabase در دسترس نیست)
        setCapabilities([
          { capability_key: 'study_buddy', capability_name: 'دستیار مطالعه', capability_description: 'چت‌بات کمک درسی' },
          { capability_key: 'problem_solver_ocr', capability_name: 'حل مسئله با OCR', capability_description: 'حل مسائل از روی تصویر' },
          { capability_key: 'story_wizard', capability_name: 'جادوگر داستان', capability_description: 'تولید داستان آموزشی' },
        ])
      })
  }, [])

  // تست AI
  const handleTest = async () => {
    if (!selectedCapability || !prompt.trim()) {
      toast.error('لطفاً قابلیت و پرامپت را وارد کنید')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capability: selectedCapability,
          prompt: prompt.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult(data.data)
        toast.success('✅ تست موفق بود!')
      } else {
        toast.error(data.error || 'خطا در تست AI')
      }
    } catch (error) {
      console.error('Test error:', error)
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  // پرامپت‌های نمونه
  const samplePrompts: Record<string, string> = {
    student_analyzer: 'این دانش‌آموز در ۳ ماه گذشته ۸۵% حضور داشته، میانگین نمرات 17.5 است، و در ریاضی قوی‌تر از فارسی عمل می‌کند. تحلیلی ارائه کن.',
    problem_solver_ocr: 'معادله x² + 5x + 6 = 0 را حل کن و مراحل را توضیح بده.',
    study_buddy: 'فتوسنتز چیست و چگونه انجام می‌شود؟ به زبان ساده توضیح بده.',
    story_wizard: 'یک داستان کوتاه درباره اهمیت صداقت برای کودکان 8 ساله بنویس.',
    field_selector: 'دانش‌آموزی در ریاضی و فیزیک قوی است، اما به ادبیات علاقه دارد. چه رشته‌ای پیشنهاد می‌کنی؟',
    konkur_predictor: 'دانش‌آموز تیزهوشان با رتبه 500 در آزمون تجربی آذر، چه رتبه‌ای در کنکور انتظار می‌رود؟',
    konkur_roadmap: 'برای یک داوطلب رشته تجربی با 6 ماه مانده تا کنکور، یک برنامه هفتگی پیشنهاد بده.',
    content_creator: 'یک متن آموزشی درباره قانون دوم نیوتن برای دانش‌آموزان دهم بنویس.',
    exam_generator: '5 سوال تستی درباره جنگ جهانی دوم برای کلاس نهم تولید کن.',
    homework_evaluator: 'این پاسخ دانش‌آموز را ارزیابی کن: "فتوسنتز یعنی گیاه نور خورشید را به غذا تبدیل می‌کند."',
    talent_analyzer: 'دانش‌آموزی خلاق، کنجکاو، و در حل مسائل منطقی قوی است. استعدادهای او چیست؟',
    summarizer: 'خلاصه‌ای از داستان شاهنامه در 5 خط بنویس.',
  }

  return (
    <DashboardPage
      className="max-w-6xl mx-auto"
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          تست سیستم AI
        </span>
      }
      description="آزمایش قابلیت‌های هوش مصنوعی با استراتژی 3-Tier Fallback"
    >
      <DashboardSectionBlock>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>درخواست تست</CardTitle>
            <CardDescription>
              یک قابلیت و پرامپت تستی وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select Capability */}
            <div className="space-y-2">
              <Label>قابلیت AI</Label>
              <Select value={selectedCapability} onValueChange={setSelectedCapability}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید..." />
                </SelectTrigger>
                <SelectContent>
                  {capabilities.map((cap) => (
                    <SelectItem key={cap.capability_key} value={cap.capability_key}>
                      {cap.capability_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCapability && (
                <p className="text-xs text-muted-foreground">
                  {capabilities.find(c => c.capability_key === selectedCapability)?.capability_description || 'توضیحی موجود نیست'}
                </p>
              )}
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label>پرامپت (سؤال یا درخواست)</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="پرامپت خود را وارد کنید..."
                rows={8}
                disabled={isLoading}
              />
            </div>

            {/* Sample Prompt Button */}
            {selectedCapability && samplePrompts[selectedCapability] && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt(samplePrompts[selectedCapability] || '')}
                disabled={isLoading}
              >
                استفاده از پرامپت نمونه
              </Button>
            )}

            {/* Test Button */}
            <Button
              onClick={handleTest}
              disabled={isLoading || !selectedCapability || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال تست...
                </>
              ) : (
                <>
                  <Zap className="ml-2 h-4 w-4" />
                  تست AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card>
          <CardHeader>
            <CardTitle>نتیجه تست</CardTitle>
            <CardDescription>
              پاسخ AI و اطلاعات تکنیکال
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>نتیجه تست اینجا نمایش داده می‌شود</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">در حال پردازش با AI...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Success Badge */}
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    تست موفق
                  </span>
                </div>

                {/* AI Response */}
                <div className="space-y-2">
                  <Label>پاسخ AI:</Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {result.content}
                    </p>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">مدل استفاده شده:</p>
                    <p className="text-sm font-medium truncate" title={result.model_used}>
                      {result.model_used.split('/')[1] || result.model_used}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">لایه (Tier):</p>
                    <p className="text-sm font-medium">
                      Tier {result.tier_used}
                      {result.tier_used === 1 && ' 🥇'}
                      {result.tier_used === 2 && ' 🥈'}
                      {result.tier_used === 3 && ' 🥉'}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">تعداد Token:</p>
                    <p className="text-sm font-medium">{result.tokens.toLocaleString()}</p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">زمان پاسخ:</p>
                    <p className="text-sm font-medium">
                      {(result.response_time_ms / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              🥇 Tier 1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              قدرتمندترین مدل‌ها (400B+) - اولین انتخاب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              🥈 Tier 2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              مدل‌های متعادل (70-250B) - fallback اول
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              🥉 Tier 3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              مدل‌های سریع (12-32B) - fallback نهایی
            </p>
          </CardContent>
        </Card>
      </div>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}


