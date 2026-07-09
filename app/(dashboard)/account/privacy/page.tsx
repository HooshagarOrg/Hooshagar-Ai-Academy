'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Download, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LuxCard } from '@/components/lux/lux-card'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

export default function AccountPrivacyPage() {
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/gdpr/export', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      const blob = new Blob([JSON.stringify(json.data ?? json, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hooshagar-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('فایل داده‌های شما دانلود شد')
    } catch {
      toast.error('خطا در صادرات داده')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (confirmText !== 'DELETE_MY_DATA') {
      toast.error('عبارت تأیید را دقیقاً وارد کنید: DELETE_MY_DATA')
      return
    }
    if (!confirm('این عمل غیرقابل بازگشت است. آیا مطمئن هستید؟')) return

    setDeleting(true)
    try {
      const res = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE_MY_DATA' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('درخواست حذف ثبت شد. به‌زودی از سیستم خارج می‌شوید.')
      window.location.href = '/login'
    } catch {
      toast.error('خطا در ثبت درخواست حذف')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DashboardPage
      className="mx-auto max-w-2xl pb-10"
      title="حریم خصوصی حساب"
      description="صادرات یا حذف داده‌های شخصی (GDPR)"
      actions={
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/settings">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      }
    >
        <DashboardSectionBlock>
          <LuxCard>
            <div className="mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-[var(--lux-primary)]" />
              <h2 className="text-lg font-bold text-[var(--lux-text)]">صادرات داده (Data Portability)</h2>
            </div>
            <p className="mb-4 text-sm leading-7 text-[var(--lux-text-muted)]">
              دریافت نسخه JSON از داده‌های مرتبط با حساب شما
            </p>
            <Button onClick={handleExport} disabled={exporting} className="min-h-10">
              {exporting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="ml-2 h-4 w-4" />
              )}
              دانلود داده‌های من
            </Button>
          </LuxCard>
        </DashboardSectionBlock>

        <DashboardSectionBlock>
          <LuxCard className="border-red-500/30">
            <div className="mb-4 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-bold text-red-400">حذف حساب و داده</h2>
            </div>
            <p className="mb-4 text-sm leading-7 text-[var(--lux-text-muted)]">
              برای تأیید، عبارت <code className="rounded bg-white/10 px-1 text-xs">DELETE_MY_DATA</code> را وارد کنید.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="confirm" className="text-[var(--lux-text)]">عبارت تأیید</Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE_MY_DATA"
                  className="mt-1 font-mono"
                />
              </div>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="min-h-10">
                {deleting ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="ml-2 h-4 w-4" />
                )}
                حذف دائمی حساب
              </Button>
            </div>
          </LuxCard>
        </DashboardSectionBlock>

        <DashboardSectionBlock>
          <p className="text-center text-sm text-[var(--lux-text-muted)]">
            <Link href="/privacy" className="text-[var(--lux-primary)] underline-offset-4 hover:underline">
              سیاست حریم خصوصی کامل
            </Link>
          </p>
        </DashboardSectionBlock>
    </DashboardPage>
  )
}
