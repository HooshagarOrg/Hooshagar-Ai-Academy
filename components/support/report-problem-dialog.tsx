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
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type ReportProblemDialogProps = {
  /** دکمهٔ کوچک هدر */
  compact?: boolean
  className?: string
  errorName?: string | null
  digest?: string | null
}

export function ReportProblemDialog({
  compact = false,
  className,
  errorName,
  digest,
}: ReportProblemDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
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
          message: trimmed,
          path:
            typeof window !== 'undefined'
              ? `${window.location.pathname}${window.location.search}`
              : '',
          errorName: errorName || null,
          digest: digest || null,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error || 'ارسال گزارش ناموفق بود')
      }
      toast({
        title: 'گزارش ثبت شد',
        description: 'تیم فنی آن را در Sentry می‌بیند. متشکریم.',
      })
      setMessage('')
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
            بگویید چه کار می‌کردید و چه دیدید. مسیر صفحه و نقش شما به‌صورت خودکار ثبت می‌شود.
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" onClick={() => void submit()} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال ارسال…
              </>
            ) : (
              'ارسال گزارش'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
