'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PdfTeachViewer } from '@/components/teacher/pdf-teach-viewer'
import { Button } from '@/components/ui/button'
import type { TextbookRow } from '@/lib/teacher/textbooks'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function TeacherTextbookTeachPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [textbook, setTextbook] = useState<TextbookRow | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/teacher/textbooks/${id}`)
        const data = (await res.json()) as {
          textbook?: TextbookRow
          signedUrl?: string
          error?: string
        }
        if (!res.ok) throw new Error(data.error || 'بارگذاری کتاب ناموفق بود')
        if (cancelled) return
        setTextbook(data.textbook || null)
        setSignedUrl(data.signedUrl || null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'خطای ناشناخته')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <DashboardPage
      title={textbook?.title || 'تدریس با کتاب'}
      description={
        textbook
          ? `پایه ${textbook.grade}${textbook.subject ? ` · ${textbook.subject}` : ''} — یادداشت‌ها موقت‌اند و ذخیره نمی‌شوند`
          : 'باز کردن PDF برای تدریس روی تخته'
      }
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/teacher/textbooks">
            <ArrowRight className="size-4" />
            بازگشت به فهرست
          </Link>
        </Button>
      }
    >
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری کتاب…
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && textbook && signedUrl && (
        <PdfTeachViewer signedUrl={signedUrl} title={textbook.title} />
      )}
    </DashboardPage>
  )
}
