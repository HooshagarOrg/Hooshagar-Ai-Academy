'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageSkeletonTable } from '@/components/ui/page-states'
import { useToast } from '@/hooks/use-toast'
import { formatBytes } from '@/lib/teacher/textbooks'
import type { ClassMaterialRow } from '@/lib/class-files'
import type { TeacherClassRow } from '@/lib/teacher/class-scope'
import { Download, FileText } from 'lucide-react'

export function ClassMaterialsList() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<ClassMaterialRow[]>([])
  const [classes, setClasses] = useState<TeacherClassRow[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/class-materials')
      const data = (await res.json()) as {
        materials?: ClassMaterialRow[]
        classes?: TeacherClassRow[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'دریافت منابع ناموفق بود')
      setItems(data.materials || [])
      setClasses(data.classes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/class-materials/${id}`)
      const data = (await res.json()) as { signedUrl?: string; error?: string }
      if (!res.ok || !data.signedUrl) throw new Error(data.error || 'دانلود ناموفق بود')
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'دانلود ناموفق بود',
        variant: 'destructive',
      })
    }
  }

  const classNameById = Object.fromEntries(
    classes.map((c) => [c.id, c.name || `پایه ${c.grade ?? ''}`])
  )

  if (loading) return <PageSkeletonTable />
  if (error) return <PageErrorState message={error} onRetry={() => void load()} />
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="منبعی نیست"
        description="وقتی معلم فایل بگذارد اینجا دیده می‌شود."
      />
    )
  }

  return (
    <ul className="space-y-3" dir="rtl">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/30 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {classNameById[item.class_id] || 'کلاس'}
              {item.description ? ` · ${item.description}` : ''}
              {' · '}
              {formatBytes(item.file_size)}
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => void onDownload(item.id)}>
            <Download className="size-4" />
            دانلود
          </Button>
        </li>
      ))}
    </ul>
  )
}
