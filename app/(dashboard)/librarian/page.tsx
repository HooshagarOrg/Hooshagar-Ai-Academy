'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Book = { id: string; title: string; author: string | null; copies: number }

export default function LibrarianPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [copies, setCopies] = useState('1')
  const [q, setQ] = useState('')

  const load = async (query = '') => {
    try {
      const res = await fetch(`/api/library/books${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'دریافت کتاب‌ها ناموفق بود')
        return
      }
      setBooks(json.books || [])
      setError('')
    } catch {
      setError('خطای اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/library/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author: author || null,
          copies: Number.parseInt(copies, 10) || 1,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت کتاب ناموفق بود')
        return
      }
      toast.success('کتاب ثبت شد')
      setTitle('')
      setAuthor('')
      setCopies('1')
      setBooks((c) => [json.book, ...c])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage
      kicker="کتابدار"
      title="کتابخانه"
      actions={
        <Button asChild variant="outline">
          <Link href="/librarian/lending">امانت</Link>
        </Button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setLoading(true)
          void load(q)
        }}
        className="flex gap-2 mb-4 max-w-xl"
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی عنوان یا نویسنده"
        />
        <Button type="submit" variant="outline">
          جستجو
        </Button>
      </form>

      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>عنوان کتاب</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>نویسنده</Label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>تعداد نسخه</Label>
          <Input value={copies} onChange={(e) => setCopies(e.target.value)} inputMode="numeric" />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ثبت...' : 'ثبت کتاب'}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={BookOpen} title="کتابخانه در دسترس نیست" description={error} />
      ) : books.length === 0 ? (
        <EmptyState icon={BookOpen} title="کتابی ثبت نشده" description="اولین کتاب را از فرم بالا اضافه کنید." />
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <GlassCard key={book.id} className="p-4">
              <p className="font-semibold">{book.title}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">
                {book.author || 'بدون نویسنده'} · {book.copies} نسخه
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
