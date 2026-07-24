'use client'

import { useState, useEffect } from 'react'
import {
  Building, Plus, Edit, Trash2, MoreVertical, Loader2, RefreshCw,
  MapPin, Phone, GraduationCap, Hash, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { PageSkeletonCards } from '@/components/ui/page-states'

interface School {
  id: string
  name: string
  code?: string
  address?: string
  phone?: string
  education_stage?: string
  type?: string
  created_at: string
}

const STAGES = [
  { value: 'preschool', label: 'پیش‌دبستانی' },
  { value: 'elementary', label: 'دبستان' },
  { value: 'middle_school', label: 'متوسطه اول' },
  { value: 'high_school', label: 'متوسطه دوم' },
  { value: 'vocational', label: 'فنی و حرفه‌ای' },
  { value: 'technical', label: 'کاردانش' },
]

const TYPES = [
  { value: 'public', label: 'دولتی' },
  { value: 'private', label: 'غیردولتی' },
  { value: 'sample', label: 'نمونه دولتی' },
  { value: 'islamic', label: 'هیئت امنایی' },
]

export default function AdminSchoolsPage() {
  const { toast } = useToast()
  const [schools, setSchools] = useState<School[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<School | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '', code: '', address: '', phone: '',
    education_stage: 'elementary', type: 'public',
  })

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/schools')
      const data = await res.json()
      setSchools(data.schools || [])
    } catch {
      toast.error('خطا در دریافت لیست مدارس')
    } finally {
      setIsLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', code: '', address: '', phone: '', education_stage: 'elementary', type: 'public' })
    setShowForm(true)
  }

  const openEdit = (s: School) => {
    setEditing(s)
    setForm({
      name: s.name,
      code: s.code || '',
      address: s.address || '',
      phone: s.phone || '',
      education_stage: s.education_stage || 'elementary',
      type: s.type || 'public',
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name) { toast.error('نام مدرسه الزامی است'); return }
    setIsSubmitting(true)
    try {
      const res = editing
        ? await fetch('/api/admin/schools', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editing.id, ...form }),
          })
        : await fetch('/api/admin/schools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editing ? 'مدرسه ویرایش شد' : 'مدرسه ایجاد شد')
      setShowForm(false)
      fetchSchools()
    } catch (e: unknown) {
      toast.error('خطا: ' + (e instanceof Error ? e.message : 'خطای نامشخص'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/admin/schools?id=${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'حذف ناموفق بود')
      toast.success('مدرسه حذف شد')
      setDeleteTarget(null)
      fetchSchools()
    } catch (e: unknown) {
      toast.error('خطا در حذف: ' + (e instanceof Error ? e.message : 'خطای نامشخص'))
    }
  }

  const filtered = schools.filter(s =>
    !search || s.name.includes(search) || (s.code || '').includes(search)
  )

  return (
    <>
    <DashboardPage
      title={
        <span className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-brand-purple/15 border border-brand-purple/20 flex items-center justify-center">
            <Building className="w-6 h-6 text-brand-purple" />
          </span>
          مدیریت مدارس
        </span>
      }
      description={`${schools.length} مدرسه ثبت شده`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSchools}><RefreshCw className="w-4 h-4" /></Button>
          <Button className="bg-brand-purple hover:opacity-90 text-space gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            مدرسه جدید
          </Button>
        </div>
      }
    >
      <DashboardSectionBlock>
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="جستجو در نام یا کد مدرسه..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      {isLoading ? (
        <PageSkeletonCards count={6} className="md:grid-cols-2 lg:grid-cols-3" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building}
          title="مدرسه‌ای ثبت نشده"
          description="اولین مدرسه را ایجاد کنید"
          action={
            <Button className="bg-brand-purple hover:opacity-90 text-space gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              ایجاد مدرسه
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(school => (
            <GlassCard key={school.id} hover className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-brand-purple/15 border border-brand-purple/20 flex items-center justify-center">
                  <Building className="w-6 h-6 text-brand-purple" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(school)}>
                      <Edit className="w-4 h-4 ml-2 text-blue-500" />
                      ویرایش
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(school)}>
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-bold mb-2">{school.name}</h3>

              <div className="space-y-1.5 text-sm text-muted-foreground">
                {school.code && (
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" />
                    <span>{school.code}</span>
                  </div>
                )}
                {school.education_stage && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{STAGES.find(s => s.value === school.education_stage)?.label}</span>
                  </div>
                )}
                {school.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{school.address}</span>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span dir="ltr">{school.phone}</span>
                  </div>
                )}
              </div>

              {school.type && (
                <Badge className="mt-3 text-xs bg-brand-purple/15 text-brand-purple border-0">
                  {TYPES.find(t => t.value === school.type)?.label}
                </Badge>
              )}
            </GlassCard>
          ))}
        </div>
      )}
      </DashboardSectionBlock>
    </DashboardPage>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش مدرسه' : 'مدرسه جدید'}</DialogTitle>
            <DialogDescription>اطلاعات مدرسه را وارد کنید</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>نام مدرسه *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>کد مدرسه</Label>
                <Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
              </div>
              <div>
                <Label>تلفن</Label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>مقطع</Label>
                <Select value={form.education_stage} onValueChange={v => setForm({...form, education_stage: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>آدرس</Label>
              <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>انصراف</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'ذخیره' : 'ایجاد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مدرسه</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف &quot;{deleteTarget?.name}&quot; مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
