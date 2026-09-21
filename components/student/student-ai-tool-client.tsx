'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Send, Sparkles } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
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
import { useAILimit } from '@/hooks/use-ai-limit'
import { createClient } from '@/lib/supabase/client'
import { gradeLabelFa } from '@/lib/ai/elementary-prompts'

const ELEMENTARY_SUBJECTS = [
  { id: 'farsi', label: 'فارسی' },
  { id: 'math', label: 'ریاضی' },
  { id: 'science', label: 'علوم' },
  { id: 'quran', label: 'قرآن' },
  { id: 'art', label: 'هنر' },
]

type StudentAiToolClientProps = {
  featureName: string
  title: string
  kicker?: string
  description: string
  placeholder: string
  quickPrompts: string[]
  buildPrompt: (userText: string, grade: number, subject: string) => string
  showSubjectPicker?: boolean
}

export function StudentAiToolClient({
  featureName,
  title,
  kicker = 'دانش‌آموز',
  description,
  placeholder,
  quickPrompts,
  buildPrompt,
  showSubjectPicker = false,
}: StudentAiToolClientProps) {
  const [userId, setUserId] = useState('')
  const [grade, setGrade] = useState(1)
  const [subject, setSubject] = useState('math')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const { limit, canUse, feature } = useAILimit({
    featureName,
    userId,
    autoCheck: userId.length > 0,
  })

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) setUserId(data.user.id)
    })
    void fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => r.json() as Promise<{ student?: { grade?: number } }>)
      .then((payload) => {
        const g = payload.student?.grade
        if (typeof g === 'number' && g >= 1 && g <= 12) setGrade(g)
      })
      .catch(() => undefined)
  }, [])

  const runAi = async () => {
    const text = input.trim()
    if (!text) {
      toast.error('متن سؤال را بنویسید')
      return
    }
    if (!canUse) {
      toast.error(limit?.reason || 'محدودیت استفاده از AI')
      return
    }
    setLoading(true)
    setAnswer('')
    try {
      const prompt = buildPrompt(text, grade, subject)
      const res = await fetch('/api/ai/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: featureName, prompt }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'پاسخ AI دریافت نشد')
        return
      }
      setAnswer(json.content || '')
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <DashboardPage kicker={kicker} title={title}>
        <div className="flex justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage kicker={kicker} title={title}>
      <p className="text-sm text-[var(--lux-text-muted)] leading-loose mb-6 max-w-2xl">
        {description} · پایهٔ {gradeLabelFa(grade)}
      </p>

      {feature && limit ? (
        <p className="text-xs text-[var(--lux-text-muted)] mb-4">
          {feature.icon} {feature.label} · امروز {limit.dailyUsed}/{limit.dailyLimit ?? '∞'}
        </p>
      ) : null}

      <div className="grid gap-4 max-w-2xl">
          {showSubjectPicker ? (
            <div className="space-y-2">
              <Label>درس</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ELEMENTARY_SUBJECTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((q) => (
              <Button
                key={q}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInput(q)}
              >
                {q}
              </Button>
            ))}
          </div>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            rows={4}
          />

          <Button type="button" onClick={() => void runAi()} disabled={loading || !canUse}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                در حال پردازش
              </>
            ) : (
              <>
                <Send className="h-4 w-4 ml-2" />
                بپرس
              </>
            )}
          </Button>

          {answer ? (
            <GlassCard className="p-5">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-purple" />
                پاسخ
              </p>
              <p className="text-sm leading-loose whitespace-pre-wrap">{answer}</p>
            </GlassCard>
          ) : null}
        </div>
    </DashboardPage>
  )
}
