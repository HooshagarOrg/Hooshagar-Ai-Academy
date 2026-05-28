'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Download, Trash2, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

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
    <div className="container mx-auto max-w-2xl py-8 px-4" dir="rtl">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            حریم خصوصی حساب
          </h1>
          <p className="text-sm text-muted-foreground">صادرات یا حذف داده‌های شخصی (GDPR)</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>صادرات داده (Data Portability)</CardTitle>
          <CardDescription>
            دریافت نسخه JSON از داده‌های مرتبط با حساب شما
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="ml-2 h-4 w-4" />
            )}
            دانلود داده‌های من
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">حذف حساب و داده</CardTitle>
          <CardDescription>
            برای تأیید، عبارت <code className="text-xs">DELETE_MY_DATA</code> را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="confirm">عبارت تأیید</Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE_MY_DATA"
              className="mt-1 font-mono"
            />
          </div>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="ml-2 h-4 w-4" />
            )}
            حذف دائمی حساب
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/privacy" className="underline">
          سیاست حریم خصوصی کامل
        </Link>
      </p>
    </div>
  )
}
