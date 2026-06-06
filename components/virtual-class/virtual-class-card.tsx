'use client'

import { useState, useEffect, useCallback } from 'react'
import { Video, Loader2, ExternalLink, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import type { VirtualClassMineItem } from '@/lib/types/virtual-class.types'

export function VirtualClassCard() {
  const [items, setItems] = useState<VirtualClassMineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchMine = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/virtual-classes/mine')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت')
      setItems(data.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMine()
  }, [fetchMine])

  const handleJoin = async (item: VirtualClassMineItem) => {
    if (!item.can_join) return
    setJoiningId(item.id)
    try {
      const res = await fetch(`/api/virtual-classes/${item.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطا در ورود')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در ورود')
      setJoiningId(null)
    }
  }

  if (loading) {
    return (
      <GlassCard className="p-4 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        بارگذاری کلاس مجازی...
      </GlassCard>
    )
  }

  if (items.length === 0 && !error) {
    return null
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {items.map((item) => (
        <GlassCard key={item.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan/15">
                <Video className="h-5 w-5 text-brand-cyan" />
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.class_name}
                  {item.teacher_name ? ` — ${item.teacher_name}` : ''}
                </p>
                {item.next_session && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.next_session.starts_at).toLocaleString('fa-IR')}
                    {' تا '}
                    {new Date(item.next_session.ends_at).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                {!item.can_join && item.join_reason && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {item.join_reason}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={() => handleJoin(item)}
              disabled={!item.can_join || joiningId === item.id}
            >
              {joiningId === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : (
                <ExternalLink className="h-4 w-4 ml-1" />
              )}
              ورود به کلاس مجازی
            </Button>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}
