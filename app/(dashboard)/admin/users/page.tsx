'use client'

import { useState, useEffect } from 'react'
import {
  Users, Plus, Search, Edit, Trash2, MoreVertical, Loader2,
  Shield, GraduationCap, Heart, Briefcase, RefreshCw, X,
  CheckCircle2, XCircle, Phone, Mail, Lock, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PageLoading } from '@/components/ui/page-states'

// ============================================
// تایپ‌ها
// ============================================
interface UserData {
  id: string
  email: string
  full_name: string
  role: string
  username: string | null
  phone: string | null
  is_staff: boolean
  school_id: string | null
  created_at: string
  last_login_at: string | null
  must_change_password: boolean
}

const ROLES = [
  { value: 'platform_admin', label: 'ادمین کل پلتفرم', color: 'bg-red-500/15 text-red-300', icon: Shield },
  { value: 'admin', label: 'مدیر سیستم', color: 'bg-orange-500/15 text-orange-300', icon: Shield },
  { value: 'principal', label: 'مدیر مدرسه', color: 'bg-brand-purple/15 text-brand-purple', icon: Briefcase },
  { value: 'teacher', label: 'معلم', color: 'bg-brand-cyan/15 text-brand-cyan', icon: GraduationCap },
  { value: 'counselor', label: 'مشاور', color: 'bg-teal-500/15 text-teal-300', icon: Heart },
  { value: 'parent', label: 'والد', color: 'bg-brand-green/15 text-brand-green', icon: Users },
  { value: 'student', label: 'دانش‌آموز', color: 'bg-brand-yellow/15 text-brand-yellow', icon: GraduationCap },
  { value: 'health_vp', label: 'معاون بهداشت', color: 'bg-brand-pink/15 text-brand-pink', icon: Heart },
  { value: 'educational_vp', label: 'معاون آموزشی', color: 'bg-indigo-500/15 text-indigo-300', icon: Briefcase },
  { value: 'financial_vp', label: 'معاون مالی', color: 'bg-emerald-500/15 text-emerald-300', icon: Briefcase },
  { value: 'disciplinary_vp', label: 'معاون انضباطی', color: 'bg-red-500/15 text-red-300', icon: Shield },
  { value: 'evaluation_vp', label: 'معاون ارزیابی', color: 'bg-cyan-500/15 text-cyan-300', icon: Briefcase },
  { value: 'art_teacher', label: 'معلم هنر', color: 'bg-fuchsia-500/15 text-fuchsia-300', icon: GraduationCap },
  { value: 'sports_teacher', label: 'معلم ورزش', color: 'bg-lime-500/15 text-lime-300', icon: GraduationCap },
  { value: 'secretary', label: 'منشی', color: 'bg-white/10 text-muted-foreground', icon: Briefcase },
  { value: 'librarian', label: 'کتابدار', color: 'bg-amber-500/15 text-amber-300', icon: Briefcase },
  { value: 'security', label: 'حراست', color: 'bg-stone-500/15 text-stone-300', icon: Shield },
  { value: 'maintenance', label: 'تأسیسات', color: 'bg-zinc-500/15 text-zinc-300', icon: Briefcase },
]

const getRoleConfig = (role: string) =>
  ROLES.find(r => r.value === role) || { label: role, color: 'bg-white/10 text-muted-foreground', icon: Users }

// ============================================
// صفحه اصلی
// ============================================
export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // فرم ساخت کاربر
  const [showCreate, setShowCreate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '', password: '', full_name: '', role: 'teacher',
    username: '', phone: '',
    // برای دانش‌آموز
    student_number: '', pin: '', grade: 1, parent_id: '',
    // برای والد
    children_ids: [] as string[],
  })
  // لیست دانش‌آموزان برای انتخاب توسط والد
  const [studentsList, setStudentsList] = useState<{id: string; full_name: string; student_number: string}[]>([])

  // ویرایش
  const [editUser, setEditUser] = useState<UserData | null>(null)
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (search) params.append('search', search)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(data.users || [])
      setStats(data.stats || {})
    } catch (e: unknown) {
      toast.error('خطا: ' + (e instanceof Error ? e.message : 'خطای نامشخص'))
    } finally {
      setIsLoading(false)
    }
  }

  // بارگذاری لیست دانش‌آموزان برای والد
  const loadStudents = async () => {
    try {
      const res = await fetch('/api/admin/users?role=student&limit=200')
      const data = await res.json()
      setStudentsList((data.users || []).map((u: { id: string; full_name: string; username?: string }) => ({
        id: u.id,
        full_name: u.full_name,
        student_number: u.username || '',
      })))
    } catch {}
  }

  const openCreate = () => {
    setNewUser({
      email: '', password: '', full_name: '', role: 'teacher',
      username: '', phone: '', student_number: '', pin: '', grade: 1,
      parent_id: '', children_ids: [],
    })
    setShowCreate(true)
  }

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast.error('فیلدهای الزامی را پر کنید')
      return
    }
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || 'کاربر ایجاد شد')
      setShowCreate(false)
      fetchUsers()
    } catch (e: unknown) {
      toast.error('خطا: ' + (e instanceof Error ? e.message : 'خطا در ایجاد'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/users?id=${deleteUser.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('کاربر حذف شد')
      setDeleteUser(null)
      fetchUsers()
    } catch {
      toast.error('خطا در حذف کاربر')
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.includes(search) ||
    u.email?.includes(search) ||
    u.username?.includes(search)
  )

  const formatDate = (d: string | null) =>
    d ? new Intl.DateTimeFormat('fa-IR').format(new Date(d)) : '-'

  return (
    <>
    <DashboardPage
      title={
        <span className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-brand-cyan/15 border border-brand-cyan/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-brand-cyan" />
          </span>
          مدیریت کاربران
        </span>
      }
      description={`${users.length} کاربر در سیستم`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button className="bg-brand-cyan hover:opacity-90 text-space gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            کاربر جدید
          </Button>
        </div>
      }
    >
      <DashboardSectionBlock>
      {/* آمار نقش‌ها */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {ROLES.slice(0, 12).map(r => {
          const Icon = r.icon
          return (
            <button
              key={r.value}
              onClick={() => setRoleFilter(r.value)}
              className={cn(
                'p-3 rounded-2xl border text-right transition-all cursor-pointer',
                roleFilter === r.value
                  ? 'border-brand-cyan/40 bg-brand-cyan/10'
                  : 'glass-panel-quiet hover:border-white/[0.12]'
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xl font-bold tabular-nums">{stats[r.value] || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{r.label}</p>
            </button>
          )
        })}
      </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      {/* جستجو */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در نام، ایمیل یا نام کاربری..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers()}
            className="pr-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="نقش" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه نقش‌ها</SelectItem>
            {ROLES.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      {/* لیست کاربران */}
      {isLoading ? (
        <PageLoading label="در حال بارگذاری کاربران..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="کاربری یافت نشد"
          description="با فیلتر فعلی هیچ کاربری وجود ندارد"
        />
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <div className="divide-y divide-white/[0.06]">
            {filtered.map(user => {
              const roleCfg = getRoleConfig(user.role)
              const RoleIcon = roleCfg.icon
              return (
                <div key={user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-cyan/30 to-brand-purple/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-foreground">
                      {user.full_name?.charAt(0) || '?'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-sm">{user.full_name || 'بدون نام'}</p>
                      <Badge className={cn('text-xs gap-1 border-0', roleCfg.color)}>
                        <RoleIcon className="w-3 h-3" />
                        {roleCfg.label}
                      </Badge>
                      {user.must_change_password && (
                        <Badge className="text-xs bg-amber-500/15 text-amber-300 border-0">رمز موقت</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      {user.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />{user.email}
                        </span>
                      )}
                      {user.username && (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />@{user.username}
                        </span>
                      )}
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />{user.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* تاریخ */}
                  <div className="text-xs text-muted-foreground hidden md:block">
                    <p>عضویت: {formatDate(user.created_at)}</p>
                    {user.last_login_at && <p>آخرین ورود: {formatDate(user.last_login_at)}</p>}
                  </div>

                  {/* عملیات */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditUser(user)}>
                        <Edit className="w-4 h-4 ml-2 text-[var(--lux-secondary)]" />
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteUser(user)}
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}
      </DashboardSectionBlock>
    </DashboardPage>

      {/* دیالوگ ساخت کاربر */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>کاربر جدید</DialogTitle>
            <DialogDescription>
              کاربر جدید با ایمیل و رمز موقت ساخته می‌شود
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>نام و نام خانوادگی *</Label>
              <Input value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ایمیل *</Label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} dir="ltr" />
              </div>
              <div>
                <Label>رمز عبور موقت *</Label>
                <Input type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>نام کاربری</Label>
                <Input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} dir="ltr" />
              </div>
              <div>
                <Label>موبایل</Label>
                <Input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} dir="ltr" placeholder="09..." />
              </div>
            </div>
            <div>
              <Label>نقش *</Label>
              <Select
                value={newUser.role}
                onValueChange={v => {
                  setNewUser({...newUser, role: v})
                  if (v === 'parent') loadStudents()
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* فیلدهای ویژه دانش‌آموز */}
            {newUser.role === 'student' && (
              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-bold text-blue-700">اطلاعات دانش‌آموزی</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>کد دانش‌آموزی</Label>
                    <Input
                      value={newUser.student_number}
                      onChange={e => setNewUser({...newUser, student_number: e.target.value})}
                      placeholder="خودکار"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label>PIN</Label>
                    <Input
                      value={newUser.pin}
                      onChange={e => setNewUser({...newUser, pin: e.target.value})}
                      placeholder="خودکار"
                      maxLength={6}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label>پایه</Label>
                    <Select value={String(newUser.grade)} onValueChange={v => setNewUser({...newUser, grade: parseInt(v)})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 12}, (_, i) => i + 1).map(g => (
                          <SelectItem key={g} value={String(g)}>پایه {g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-[var(--lux-text-muted)]">
                  دانش‌آموز با کد دانش‌آموزی و PIN وارد می‌شود. اگر خالی بگذارید، خودکار ساخته می‌شود.
                </p>
              </div>
            )}

            {/* فیلدهای ویژه والد */}
            {newUser.role === 'parent' && (
              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-bold text-green-700">اتصال به فرزندان</p>
                <div className="max-h-40 overflow-y-auto border border-white/[0.06] rounded-lg p-2 space-y-1">
                  {studentsList.length === 0 ? (
                    <p className="text-xs text-[var(--lux-text-muted)] text-center py-2">دانش‌آموزی یافت نشد</p>
                  ) : (
                    studentsList.map(s => (
                      <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--lux-surface)] rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newUser.children_ids.includes(s.id)}
                          onChange={e => {
                            const ids = e.target.checked
                              ? [...newUser.children_ids, s.id]
                              : newUser.children_ids.filter(i => i !== s.id)
                            setNewUser({...newUser, children_ids: ids})
                          }}
                        />
                        <span className="text-sm">{s.full_name}</span>
                        {s.student_number && (
                          <span className="text-xs text-[var(--lux-text-muted)]">({s.student_number})</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-[var(--lux-text-muted)]">
                  والد با شماره موبایل و OTP وارد می‌شود و فقط فرزندان متصل را می‌بیند.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>انصراف</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ایجاد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تایید حذف */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کاربر</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف &quot;{deleteUser?.full_name}&quot; مطمئن هستید؟
              این عملیات قابل بازگشت نیست و تمام داده‌های کاربر حذف خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
