'use client'

import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  type ReportCategory,
} from '@/lib/support/report-problem'

type ReportProblemDialogProps = {
  compact?: boolean
  className?: string
  errorName?: string | null
  digest?: string | null
  /** صفحهٔ خطا از قبل کرش است */
  defaultCategory?: ReportCategory
}

export function ReportProblemDialog({
  compact = false,
  className,
  errorName,
  digest,
  defaultCategory,
}: ReportProblemDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<ReportCategory | ''>(defaultCategory ?? '')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!category) {
      toast({
        title: 'نوع گزارش را انتخاب کنید',
        description: 'باگ برنامه به Sentry می‌رود؛ ورود و سؤال به راهنما.',
        variant: 'destructive',
      })
      return
    }

    const trimmed = message.trim()
    if (trimmed.length < 10) {
      toast({
        title: 'توضیح کوتاه است',
        description: 'حداقل ۱۰ کاراکتر بنویسید تا بتوانیم پیگیری کنیم.',
        variant: 'destructive',
      })
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/support/report-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: trimmed,
          path:
            typeof window !== 'undefined'
              ? `${window.location.pathname}${window.location.search}`
              : '',
          errorName: errorName || null,
          digest: digest || null,
        }),
      })
      const data = (await res.json()) as { error?: string; notice?: string }
      if (!res.ok) {
        throw new Error(data.error || 'ارسال گزارش ناموفق بود')
      }
      toast({
        title: category === 'bug' ? 'گزارش باگ ثبت شد' : 'راهنما',
        description: data.notice || 'ثبت شد.',
      })
      setMessage('')
      setCategory(defaultCategory ?? '')
      setOpen(false)
    } catch (err) {
      toast({
        title: 'خطا در ارسال',
        description: err instanceof Error ? err.message : 'لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn('min-h-9 gap-1.5 px-2', className)}
            aria-label="گزارش مشکل"
          >
            <Flag className="size-4" />
            <span className="hidden sm:inline">گزارش مشکل</span>
          </Button>
        ) : (
          <Button type="button" variant="outline" className={cn('gap-2', className)}>
            <Flag className="size-4" />
            گزارش مشکل
          </Button>
        )}
      </DialogTrigger>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>گزارش مشکل</DialogTitle>
          <DialogDescription>
            فقط خرابی برنامه برای تیم فنی به Sentry می‌رود. ورود، رمز و سؤال در صندوق پشتیبانی مدرسه ثبت می‌شود. رمز عبور ننویسید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>نوع گزارش</Label>
            <RadioGroup
              value={category}
              onValueChange={(value) => setCategory(value as ReportCategory)}
              className="gap-2"
            >
              {REPORT_CATEGORIES.map((id) => (
                <div key={id} className="flex items-start gap-2">
                  <RadioGroupItem value={id} id={`report-cat-${id}`} className="mt-1" />
                  <Label htmlFor={`report-cat-${id}`} className="font-normal leading-6 cursor-pointer">
                    {REPORT_CATEGORY_LABELS[id]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-problem-message">توضیح</Label>
            <Textarea
              id="report-problem-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="مثلاً: روی باز کردن کتاب فارسی کلیک کردم و صفحه سفید ماند."
            />
            <p className="text-xs text-muted-foreground">{message.trim().length} / ۱۰۰۰</p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" onClick={() => void submit()} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال ارسال…
              </>
            ) : (
              'ارسال'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
