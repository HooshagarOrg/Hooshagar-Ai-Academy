'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Book = { id: string; title: string }
type Loan = {
  id: string
  book_id: string
  borrower_name: string | null
  borrowed_at: string
  due_at: string | null
  returned_at: string | null
}

export default function LibrarianLendingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [bookId, setBookId] = useState('')
  const [borrowerName, setBorrowerName] = useState('')
  const [dueAt, setDueAt] = useState('')

  const load = async () => {
    try {
      const [booksRes, loansRes] = await Promise.all([
        fetch('/api/library/books'),
        fetch('/api/library/loans'),
      ])
      const booksJson = await booksRes.json()
      const loansJson = await loansRes.json()
      if (!booksRes.ok || !loansRes.ok) {
        setError(booksJson.error || loansJson.error || 'دریافت امانت ناموفق بود')
        return
      }
      setBooks(booksJson.books || [])
      setLoans(loansJson.loans || [])
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
      const res = await fetch('/api/library/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          borrower_name: borrowerName,
          borrowed_at: new Date().toISOString().slice(0, 10),
          due_at: dueAt || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت امانت ناموفق بود')
        return
      }
      toast.success('امانت ثبت شد')
      setBorrowerName('')
      setLoans((c) => [json.loan, ...c])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const markReturned = async (id: string) => {
    try {
      const res = await fetch('/api/library/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'بازگشت ناموفق بود')
        return
      }
      toast.success('کتاب برگشت خورد')
      setLoans((c) =>
        c.map((loan) => (loan.id === id ? { ...loan, returned_at: json.loan?.returned_at } : loan))
      )
    } catch {
      toast.error('خطای اتصال به سرور')
    }
  }

  const bookTitle = (id: string) => books.find((b) => b.id === id)?.title || 'کتاب'

  return (
    <DashboardPage kicker="کتابدار" title="امانت کتاب">
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>کتاب</Label>
          <Select value={bookId} onValueChange={setBookId}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب کتاب" />
            </SelectTrigger>
            <SelectContent>
              {books.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>نام امانت‌گیرنده</Label>
          <Input value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>مهلت بازگشت</Label>
          <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
        <Button type="submit" disabled={saving || !bookId}>
          {saving ? 'در حال ثبت...' : 'ثبت امانت'}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={BookOpen} title="امانت در دسترس نیست" description={error} />
      ) : loans.length === 0 ? (
        <EmptyState icon={BookOpen} title="امانتی ثبت نشده" description="اولین امانت را از فرم بالا ثبت کنید." />
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => (
            <GlassCard key={loan.id} className="p-4 flex justify-between gap-3">
              <div>
                <p className="font-semibold">{bookTitle(loan.book_id)}</p>
                <p className="text-sm text-[var(--lux-text-muted)]">
                  {loan.borrower_name} · از {loan.borrowed_at}
                  {loan.returned_at ? ` · برگشت ${loan.returned_at}` : ''}
                </p>
              </div>
              {!loan.returned_at ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void markReturned(loan.id)}>
                  بازگشت
                </Button>
              ) : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
