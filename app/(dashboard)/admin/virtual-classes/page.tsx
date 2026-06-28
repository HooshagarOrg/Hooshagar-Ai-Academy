'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Video, Plus, Edit, Trash2, Loader2, RefreshCw, Calendar,
  Play, MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageLoading } from '@/components/ui/page-states'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import type {
  VirtualClassSession,
  VirtualClassWithRelations,
} from '@/lib/types/virtual-class.types'

interface School {
  id: string
  name: string
}

interface ClassOption {
  id: string
  name: string
  grade: number
  teacher_id: string | null
  has_virtual_class: boolean
}

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminVirtualClassesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<VirtualClassWithRelations[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])
  const [sessions, setSessions] = useState<VirtualClassSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [editing, setEditing] = useState<VirtualClassWithRelations | null>(null)
  const [sessionTarget, setSessionTarget] = useState<VirtualClassWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VirtualClassWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    school_id: '',
    class_id: '',
    title: '',
    skyroom_room_id: '',
    skyroom_room_name: '',
    status: 'active' as 'active' | 'inactive',
  })

  const [sessionForm, setSessionForm] = useState({
    starts_at: '',
    ends_at: '',
    join_buffer_minutes: '5',
  })

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/platform-admin/virtual-classes')
      if (res.status === 403) {
        setForbidden(true)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems(data.virtual_classes || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در دریافت لیست')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchItems()
    fetch('/api/admin/schools')
      .then((r) => r.json())
      .then((d) => setSchools(d.schools || []))
      .catch(() => {})
  }, [fetchItems])

  const loadClasses = async (schoolId: string) => {
    if (!schoolId) {
      setClassOptions([])
      return
    }
    const res = await fetch(
      `/api/platform-admin/virtual-classes/lookup?school_id=${schoolId}`
    )
    const data = await res.json()
    setClassOptions(data.classes || [])
  }

  const openCreate = () => {
    setEditing(null)
    setForm({
      school_id: '',
      class_id: '',
      title: '',
      skyroom_room_id: '',
      skyroom_room_name: '',
      status: 'active',
    })
    setClassOptions([])
    setShowForm(true)
  }

  const openEdit = (item: VirtualClassWithRelations) => {
    setEditing(item)
    setForm({
      school_id: item.school_id,
      class_id: item.class_id,
      title: item.title,
      skyroom_room_id: String(item.skyroom_room_id),
      skyroom_room_name: item.skyroom_room_name,
      status: item.status,
    })
    loadClasses(item.school_id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.class_id || !form.title || !form.skyroom_room_id || !form.skyroom_room_name) {
      toast.error('فیلدهای الزامی را پر کنید')
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        class_id: form.class_id,
        title: form.title,
        skyroom_room_id: Number(form.skyroom_room_id),
        skyroom_room_name: form.skyroom_room_name,
        status: form.status,
      }
      const res = editing
        ? await fetch('/api/platform-admin/virtual-classes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editing.id, ...payload }),
          })
        : await fetch('/api/platform-admin/virtual-classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editing ? 'به‌روزرسانی شد' : 'کلاس مجازی ایجاد شد')
      setShowForm(false)
      fetchItems()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(
        `/api/platform-admin/virtual-classes?id=${deleteTarget.id}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('حذف شد')
      setDeleteTarget(null)
      fetchItems()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در حذف')
    }
  }

  const openSessions = async (item: VirtualClassWithRelations) => {
    setSessionTarget(item)
    setShowSessions(true)
    const res = await fetch(
      `/api/platform-admin/virtual-class-sessions?virtual_class_id=${item.id}`
    )
    const data = await res.json()
    setSessions(data.sessions || [])
  }

  const openSessionCreate = () => {
    const now = new Date()
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    setSessionForm({
      starts_at: toLocalDatetimeValue(now.toISOString()),
      ends_at: toLocalDatetimeValue(end.toISOString()),
      join_buffer_minutes: '5',
    })
    setShowSessionForm(true)
  }

  const handleSessionSubmit = async () => {
    if (!sessionTarget || !sessionForm.starts_at || !sessionForm.ends_at) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/platform-admin/virtual-class-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          virtual_class_id: sessionTarget.id,
          starts_at: new Date(sessionForm.starts_at).toISOString(),
          ends_at: new Date(sessionForm.ends_at).toISOString(),
          join_buffer_minutes: Number(sessionForm.join_buffer_minutes),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('جلسه ثبت شد')
      setShowSessionForm(false)
      openSessions(sessionTarget)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestJoin = async (item: VirtualClassWithRelations) => {
    try {
      const res = await fetch(`/api/virtual-classes/${item.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip_time_check: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ورود تست')
    }
  }

  const pageActions = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={fetchItems}>
        <RefreshCw className="h-4 w-4 ml-1" />
        بروزرسانی
      </Button>
      <Button size="sm" onClick={openCreate} disabled={forbidden}>
        <Plus className="h-4 w-4 ml-1" />
        کلاس مجازی جدید
      </Button>
    </div>
  )

  if (forbidden) {
    return (
      <DashboardPage
        title="کلاس‌های مجازی (اسکای‌روم)"
        description="اتصال کلاس درسی به اتاق اسکای‌روم و زمان‌بندی جلسات"
      >
        <EmptyState
          icon={Video}
          title="دسترسی محدود"
          description="فقط ادمین کل پلتفرم می‌تواند کلاس‌های مجازی را مدیریت کند."
        />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      title="کلاس‌های مجازی (اسکای‌روم)"
      description="اتصال کلاس درسی به اتاق اسکای‌روم و زمان‌بندی جلسات"
      actions={pageActions}
    >

      {isLoading ? (
        <PageLoading label="در حال بارگذاری کلاس‌های مجازی..." compact />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Video}
          title="کلاس مجازی تعریف نشده"
          description="اتاق‌های اسکای‌روم موجود را به کلاس‌های درسی وصل کنید."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 ml-1" />
              افزودن
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <GlassCard key={item.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                      {item.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.school_name} — {item.class_name}
                    {item.teacher_name ? ` — ${item.teacher_name}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono" dir="ltr">
                    room_id: {item.skyroom_room_id} / {item.skyroom_room_name}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openSessions(item)}>
                      <Calendar className="h-4 w-4 ml-2" />
                      جلسات
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTestJoin(item)}>
                      <Play className="h-4 w-4 ml-2" />
                      تست ورود
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(item)}>
                      <Edit className="h-4 w-4 ml-2" />
                      ویرایش
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش کلاس مجازی' : 'کلاس مجازی جدید'}</DialogTitle>
            <DialogDescription>
              اتاق موجود اسکای‌روم را به کلاس درسی وصل کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editing && (
              <>
                <div>
                  <Label>مدرسه</Label>
                  <Select
                    value={form.school_id}
                    onValueChange={(v) => {
                      setForm((f) => ({ ...f, school_id: v, class_id: '' }))
                      loadClasses(v)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب مدرسه" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>کلاس درسی</Label>
                  <Select
                    value={form.class_id}
                    onValueChange={(v) => {
                      const c = classOptions.find((x) => x.id === v)
                      setForm((f) => ({
                        ...f,
                        class_id: v,
                        title: c ? `کلاس مجازی ${c.name}` : f.title,
                      }))
                    }}
                    disabled={!form.school_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کلاس" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions
                        .filter((c) => !c.has_virtual_class)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            پایه {c.grade} — {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label>عنوان</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>شناسه اتاق اسکای‌روم (room_id)</Label>
              <Input
                type="number"
                dir="ltr"
                value={form.skyroom_room_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, skyroom_room_id: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>نام لاتین اتاق</Label>
              <Input
                dir="ltr"
                value={form.skyroom_room_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, skyroom_room_name: e.target.value }))
                }
                placeholder="math-class-5a"
              />
            </div>
            <div>
              <Label>وضعیت</Label>
              <Select
                value={form.status}
                onValueChange={(v: 'active' | 'inactive') =>
                  setForm((f) => ({ ...f, status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              انصراف
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSessions} onOpenChange={setShowSessions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>جلسات — {sessionTarget?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">جلسه‌ای ثبت نشده</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="text-sm border rounded-lg p-3">
                  <div>{new Date(s.starts_at).toLocaleString('fa-IR')}</div>
                  <div className="text-muted-foreground">
                    تا {new Date(s.ends_at).toLocaleString('fa-IR')}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {s.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={openSessionCreate}>
              <Plus className="h-4 w-4 ml-1" />
              جلسه جدید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSessionForm} onOpenChange={setShowSessionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>جلسه جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>شروع</Label>
              <Input
                type="datetime-local"
                value={sessionForm.starts_at}
                onChange={(e) =>
                  setSessionForm((f) => ({ ...f, starts_at: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>پایان</Label>
              <Input
                type="datetime-local"
                value={sessionForm.ends_at}
                onChange={(e) =>
                  setSessionForm((f) => ({ ...f, ends_at: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>حاشیه ورود (دقیقه)</Label>
              <Input
                type="number"
                value={sessionForm.join_buffer_minutes}
                onChange={(e) =>
                  setSessionForm((f) => ({
                    ...f,
                    join_buffer_minutes: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSessionSubmit} disabled={isSubmitting}>
              ثبت جلسه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کلاس مجازی؟</AlertDialogTitle>
            <AlertDialogDescription>
              اتاق اسکای‌روم حذف نمی‌شود؛ فقط نگاشت از هوشاگر برداشته می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPage>
  )
}
