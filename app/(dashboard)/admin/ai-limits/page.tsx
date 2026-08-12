'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Search,
  Settings,
  
  Plus,
  Trash2,
  Edit2,
  Copy,
  RotateCcw,
  Users,
  Building2,
  Globe,
  User,
  
  BarChart3,
  Save,
  
  
  Info,
  
  Sparkles,
  
  
  
  
  
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  
  DialogFooter,
  DialogHeader,
  DialogTitle,
  
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { AI_FEATURES } from '@/lib/check-ai-limit'

// ============================================
// تایپ‌ها
// ============================================

interface AILimit {
  id: string
  featureName: string
  featureLabel: string
  featureIcon: string
  scope: 'global' | 'school' | 'role' | 'user'
  scopeId?: string
  dailyLimit: number | null
  weeklyLimit: number | null
  monthlyLimit: number | null
  creditCost: number
  isEnabled: boolean
  expiresAt?: string
  reason?: string
  usageThisMonth: number
  createdAt: string
}

const ROLES = [
  { value: 'student', label: 'دانش‌آموز', icon: '🎓' },
  { value: 'teacher', label: 'معلم', icon: '👨‍🏫' },
  { value: 'parent', label: 'والد', icon: '👪' },
  { value: 'counselor', label: 'مشاور', icon: '💼' },
]

function mergeWithDefaults(
  rows: AILimit[],
  scope: AILimit['scope'],
  scopeId?: string
): AILimit[] {
  const byName = new Map(rows.map((r) => [r.featureName, r]))
  return Object.entries(AI_FEATURES).map(([name, feature]) => {
    const existing = byName.get(name)
    if (existing) {
      return { ...existing, usageThisMonth: existing.usageThisMonth ?? 0 }
    }
    return {
      id: `draft-${scope}-${name}`,
      featureName: name,
      featureLabel: feature.label,
      featureIcon: feature.icon,
      scope,
      scopeId,
      dailyLimit: feature.dailyLimit,
      weeklyLimit: feature.weeklyLimit,
      monthlyLimit: feature.monthlyLimit,
      creditCost: feature.creditCost,
      isEnabled: feature.isEnabled,
      usageThisMonth: 0,
      createdAt: new Date().toISOString(),
    }
  })
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function AILimitsPage() {
  const [limits, setLimits] = useState<AILimit[]>([])
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState('global')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null)
  const [selectedRole, setSelectedRole] = useState('student')
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  
  const [editingLimit, setEditingLimit] = useState<AILimit | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedLimits, setSelectedLimits] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  const currentScope = (activeTab === 'school' ? 'school' : activeTab === 'role' ? 'role' : 'global') as AILimit['scope']
  const currentScopeId =
    currentScope === 'role' ? selectedRole : currentScope === 'school' ? selectedSchool : undefined

  const loadLimits = async (): Promise<void> => {
    if (activeTab === 'special') return
    if (currentScope === 'school' && !selectedSchool) {
      setLimits([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ scope: currentScope })
      if (currentScopeId) params.set('scopeId', currentScopeId)
      const res = await fetch(`/api/admin/ai-limits?${params.toString()}`)
      const data = await res.json()
      const rows: AILimit[] = Array.isArray(data.limits) ? data.limits : []
      setLimits(mergeWithDefaults(rows, currentScope, currentScopeId))
    } catch {
      toast.error('خطا در دریافت محدودیت‌ها')
      setLimits(mergeWithDefaults([], currentScope, currentScopeId))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetch('/api/admin/schools')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.schools)) {
          setSchools(data.schools.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    void loadLimits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedRole, selectedSchool])

  const saveLimitPayload = async (limit: AILimit, extra?: Partial<{ isEnabled: boolean }>): Promise<boolean> => {
    const res = await fetch('/api/admin/ai-limits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        featureName: limit.featureName,
        scope: limit.scope,
        scopeId: limit.scopeId ?? currentScopeId ?? null,
        dailyLimit: limit.dailyLimit,
        weeklyLimit: limit.weeklyLimit,
        monthlyLimit: limit.monthlyLimit,
        creditCost: limit.creditCost,
        isEnabled: extra?.isEnabled ?? limit.isEnabled,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'ذخیره ناموفق بود')
      return false
    }
    return true
  }

  // ============================================
  // فیلتر کردن محدودیت‌ها
  // ============================================

  const filteredLimits = limits.filter(limit => {
    if (searchQuery && !limit.featureLabel.includes(searchQuery)) return false
    if (filterEnabled !== null && limit.isEnabled !== filterEnabled) return false
    return true
  })

  // ============================================
  // ذخیره تغییرات
  // ============================================

  const handleSaveLimit = async () => {
    if (!editingLimit) return
    
    setIsSaving(true)
    try {
      const ok = await saveLimitPayload(editingLimit)
      if (!ok) return
      toast.success('محدودیت ذخیره شد')
      await loadLimits()
      setIsEditDialogOpen(false)
      setEditingLimit(null)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleLimit = async (limitId: string) => {
    const limit = limits.find((l) => l.id === limitId)
    if (!limit) return
    const nextEnabled = !limit.isEnabled
    setLimits((prev) => prev.map((l) => (l.id === limitId ? { ...l, isEnabled: nextEnabled } : l)))
    const ok = await saveLimitPayload(limit, { isEnabled: nextEnabled })
    if (!ok) {
      setLimits((prev) => prev.map((l) => (l.id === limitId ? { ...l, isEnabled: limit.isEnabled } : l)))
    }
  }

  const handleBulkEnable = async () => {
    for (const id of selectedLimits) {
      const limit = limits.find((l) => l.id === id)
      if (limit) await saveLimitPayload(limit, { isEnabled: true })
    }
    setSelectedLimits(new Set())
    await loadLimits()
  }

  const handleBulkDisable = async () => {
    for (const id of selectedLimits) {
      const limit = limits.find((l) => l.id === id)
      if (limit) await saveLimitPayload(limit, { isEnabled: false })
    }
    setSelectedLimits(new Set())
    await loadLimits()
  }

  const handleResetToDefault = () => {
    setLimits(mergeWithDefaults([], currentScope, currentScopeId))
    setSelectedLimits(new Set())
    toast.message('مقادیر پیش‌فرض نمایش داده شد؛ برای اعمال، هر قابلیت را ذخیره کنید')
  }

  // ============================================
  // رندر
  // ============================================

  return (
    <DashboardPage
      className="max-w-7xl mx-auto"
      kicker="هوش مصنوعی"
      title="مدیریت محدودیت‌های هوش مصنوعی"
      description="کنترل و مدیریت استفاده از قابلیت‌های AI"
      actions={
        <Button
          variant="outline"
          className="gap-2 glass-panel-quiet"
          onClick={() => window.location.href = '/admin/ai-usage-dashboard'}
        >
          <BarChart3 className="w-4 h-4" />
          مشاهده داشبورد مصرف
        </Button>
      }
      animatedSections={false}
    >
        <div className="flex gap-6">
          {/* محتوای اصلی */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {isLoading && (
                <p className="text-sm text-[var(--lux-text-muted)] mb-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال بارگذاری محدودیت‌ها...
                </p>
              )}
              <TabsList className="grid grid-cols-4 mb-6 glass-panel-quiet">
                <TabsTrigger value="global" className="gap-2">
                  <Globe className="w-4 h-4" />
                  تنظیمات سراسری
                </TabsTrigger>
                <TabsTrigger value="role" className="gap-2">
                  <Users className="w-4 h-4" />
                  به تفکیک نقش
                </TabsTrigger>
                <TabsTrigger value="special" className="gap-2">
                  <User className="w-4 h-4" />
                  کاربران ویژه
                </TabsTrigger>
                <TabsTrigger value="school" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  مدارس
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: تنظیمات سراسری */}
              <TabsContent value="global">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>محدودیت‌های سراسری</CardTitle>
                        <CardDescription>
                          این تنظیمات برای همه کاربران اعمال می‌شود
                        </CardDescription>
                      </div>
                    </div>

                    {/* فیلترها */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--lux-text-muted)]" />
                        <Input
                          placeholder="جستجوی قابلیت..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                      
                      <Select
                        value={filterEnabled === null ? 'all' : filterEnabled ? 'enabled' : 'disabled'}
                        onValueChange={(val) => setFilterEnabled(val === 'all' ? null : val === 'enabled')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="وضعیت" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">همه</SelectItem>
                          <SelectItem value="enabled">فعال</SelectItem>
                          <SelectItem value="disabled">غیرفعال</SelectItem>
                        </SelectContent>
                      </Select>

                      {selectedLimits.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {selectedLimits.size} انتخاب شده
                          </Badge>
                          <Button size="sm" variant="outline" onClick={handleBulkEnable}>
                            فعال کردن
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleBulkDisable}>
                            غیرفعال کردن
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleResetToDefault}>
                            <RotateCcw className="w-4 h-4 ml-1" />
                            بازنشانی
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[var(--lux-surface)]">
                            <TableHead className="w-10">
                              <Checkbox
                                checked={selectedLimits.size === filteredLimits.length}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedLimits(new Set(filteredLimits.map(l => l.id)))
                                  } else {
                                    setSelectedLimits(new Set())
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead className="w-10">فعال</TableHead>
                            <TableHead>قابلیت AI</TableHead>
                            <TableHead className="text-center">روزانه</TableHead>
                            <TableHead className="text-center">هفتگی</TableHead>
                            <TableHead className="text-center">ماهانه</TableHead>
                            <TableHead className="text-center">Credit</TableHead>
                            <TableHead className="text-center">آمار ماه</TableHead>
                            <TableHead className="w-20">عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLimits.map((limit) => (
                            <TableRow key={limit.id} className={cn(!limit.isEnabled && 'opacity-50')}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedLimits.has(limit.id)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedLimits)
                                    if (checked) {
                                      newSet.add(limit.id)
                                    } else {
                                      newSet.delete(limit.id)
                                    }
                                    setSelectedLimits(newSet)
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={limit.isEnabled}
                                  onCheckedChange={() => toggleLimit(limit.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{limit.featureIcon}</span>
                                  <span className="font-medium">{limit.featureLabel}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {limit.dailyLimit ?? '∞'}
                              </TableCell>
                              <TableCell className="text-center">
                                {limit.weeklyLimit ?? '∞'}
                              </TableCell>
                              <TableCell className="text-center">
                                {limit.monthlyLimit ?? '∞'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{limit.creditCost}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-[var(--lux-text-muted)]">
                                  {limit.usageThisMonth.toLocaleString('fa-IR')}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingLimit(limit)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: به تفکیک نقش */}
              <TabsContent value="role">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>محدودیت‌ها به تفکیک نقش</CardTitle>
                        <CardDescription>
                          تنظیمات اختصاصی برای هر نقش کاربری
                        </CardDescription>
                      </div>
                      
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="انتخاب نقش" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <span className="flex items-center gap-2">
                                <span>{role.icon}</span>
                                <span>{role.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Copy className="w-4 h-4" />
                        کپی از تنظیمات سراسری
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <RotateCcw className="w-4 h-4" />
                        بازگشت به سراسری
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="mb-4 rounded-lg border border-blue-500/25 bg-blue-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-[var(--lux-secondary)] mt-0.5" />
                        <div className="text-sm text-blue-300">
                          <p className="font-medium mb-1">توضیحات:</p>
                          <p>
                            تنظیمات این نقش بر تنظیمات سراسری اولویت دارد. 
                            اگر محدودیتی تنظیم نکنید، از مقادیر سراسری استفاده می‌شود.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* نمایش پیشنهادات */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">پیشنهادات برای {ROLES.find(r => r.value === selectedRole)?.label}:</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {selectedRole === 'student' && (
                          <>
                            <div className="bg-[var(--lux-surface)] rounded-lg p-3 text-sm">
                              <span className="font-medium">📖 تولید داستان:</span>
                              <span className="mr-2">3/روز، 15/هفته، 50/ماه</span>
                            </div>
                            <div className="bg-[var(--lux-surface)] rounded-lg p-3 text-sm">
                              <span className="font-medium">📸 OCR:</span>
                              <span className="mr-2">10/روز</span>
                            </div>
                            <div className="bg-[var(--lux-surface)] rounded-lg p-3 text-sm">
                              <span className="font-medium">💬 دستیار مطالعه:</span>
                              <span className="mr-2">20 پیام/روز</span>
                            </div>
                          </>
                        )}
                        {selectedRole === 'teacher' && (
                          <>
                            <div className="bg-[var(--lux-surface)] rounded-lg p-3 text-sm">
                              <span className="font-medium">👤 تحلیل دانش‌آموز:</span>
                              <span className="mr-2">10/روز</span>
                            </div>
                            <div className="bg-[var(--lux-surface)] rounded-lg p-3 text-sm">
                              <span className="font-medium">✍️ تولید محتوا:</span>
                              <span className="mr-2">5/روز</span>
                            </div>
                            <div className="bg-[var(--lux-surface)] rounded-lg p-3 text-sm">
                              <span className="font-medium">📝 تولید آزمون:</span>
                              <span className="mr-2">3/روز</span>
                            </div>
                          </>
                        )}
                        {selectedRole === 'parent' && (
                          <>
                            <div className="bg-[var(--lux-surface)] rounded-lg p-3 text-sm">
                              <span className="font-medium">📸 OCR:</span>
                              <span className="mr-2">5/روز</span>
                            </div>
                            <div className="bg-[var(--lux-surface)] rounded-lg p-3 text-sm">
                              <span className="font-medium">👤 تحلیل دانش‌آموز:</span>
                              <span className="mr-2">2/روز</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* جدول مشابه Tab 1 */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[var(--lux-surface)]">
                            <TableHead className="w-10">فعال</TableHead>
                            <TableHead>قابلیت AI</TableHead>
                            <TableHead className="text-center">روزانه</TableHead>
                            <TableHead className="text-center">هفتگی</TableHead>
                            <TableHead className="text-center">ماهانه</TableHead>
                            <TableHead className="text-center">Credit</TableHead>
                            <TableHead className="w-20">عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLimits.slice(0, 5).map((limit) => (
                            <TableRow key={limit.id}>
                              <TableCell>
                                <Switch checked={limit.isEnabled} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{limit.featureIcon}</span>
                                  <span className="font-medium">{limit.featureLabel}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  defaultValue={limit.dailyLimit || ''}
                                  className="w-16 text-center mx-auto"
                                  placeholder="∞"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  defaultValue={limit.weeklyLimit || ''}
                                  className="w-16 text-center mx-auto"
                                  placeholder="∞"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  defaultValue={limit.monthlyLimit || ''}
                                  className="w-16 text-center mx-auto"
                                  placeholder="∞"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  defaultValue={limit.creditCost}
                                  className="w-16 text-center mx-auto"
                                />
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon">
                                  <Save className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: کاربران ویژه */}
              <TabsContent value="special">
                <Card>
                  <CardHeader>
                    <CardTitle>کاربران با محدودیت ویژه</CardTitle>
                    <CardDescription>
                      افزایش یا کاهش محدودیت برای کاربران خاص
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-[var(--lux-text-muted)] leading-relaxed">
                      محدودیت کاربر خاص از صفحه «کنترل دسترسی» تنظیم می‌شود. این تب دیگر دادهٔ نمونه نشان نمی‌دهد.
                    </p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => { window.location.href = '/admin/ai-access-control' }}
                    >
                      رفتن به کنترل دسترسی
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: مدارس */}
              <TabsContent value="school">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>محدودیت‌ها به تفکیک مدرسه</CardTitle>
                        <CardDescription>
                          تنظیمات اختصاصی برای هر مدرسه
                        </CardDescription>
                      </div>
                      
                      <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="انتخاب مدرسه" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {!selectedSchool ? (
                      <div className="text-center py-12">
                        <Building2 className="w-12 h-12 text-[var(--lux-text-muted)] mx-auto mb-4" />
                        <p className="text-[var(--lux-text-muted)]">یک مدرسه را انتخاب کنید</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 rounded-lg border border-yellow-500/25 bg-yellow-500/10 p-4">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-yellow-500 mt-0.5" />
                            <div className="text-sm text-yellow-700">
                              <p className="font-medium mb-1">💡 برای مدرسه تیزهوشان:</p>
                              <p>
                                می‌توانید محدودیت‌ها را افزایش دهید تا دانش‌آموزان بیشتر استفاده کنند.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* جدول مشابه Tab 1 */}
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-[var(--lux-surface)]">
                                <TableHead className="w-10">فعال</TableHead>
                                <TableHead>قابلیت AI</TableHead>
                                <TableHead className="text-center">روزانه</TableHead>
                                <TableHead className="text-center">هفتگی</TableHead>
                                <TableHead className="text-center">ماهانه</TableHead>
                                <TableHead className="text-center">Credit</TableHead>
                                <TableHead className="w-20">عملیات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredLimits.slice(0, 5).map((limit) => (
                                <TableRow key={limit.id}>
                                  <TableCell>
                                    <Switch checked={limit.isEnabled} />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{limit.featureIcon}</span>
                                      <span className="font-medium">{limit.featureLabel}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      defaultValue={limit.dailyLimit || ''}
                                      className="w-16 text-center mx-auto"
                                      placeholder="∞"
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      defaultValue={limit.weeklyLimit || ''}
                                      className="w-16 text-center mx-auto"
                                      placeholder="∞"
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      defaultValue={limit.monthlyLimit || ''}
                                      className="w-16 text-center mx-auto"
                                      placeholder="∞"
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      defaultValue={limit.creditCost}
                                      className="w-16 text-center mx-auto"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon">
                                      <Save className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar آمار */}
          <div className="w-72 flex-shrink-0 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  آمار مصرف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--lux-text-muted)] leading-relaxed">
                  آمار واقعی مصرف در داشبورد مصرف AI است؛ این صفحه فقط سقف‌ها را ذخیره می‌کند.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { window.location.href = '/admin/ai-usage-dashboard' }}
                >
                  مشاهده داشبورد مصرف
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog ویرایش محدودیت */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xl">{editingLimit?.featureIcon}</span>
                ویرایش محدودیت: {editingLimit?.featureLabel}
              </DialogTitle>
            </DialogHeader>

            {editingLimit && (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <Label>وضعیت</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingLimit.isEnabled}
                      onCheckedChange={(checked) => 
                        setEditingLimit({ ...editingLimit, isEnabled: checked })
                      }
                    />
                    <span className="text-sm text-[var(--lux-text-muted)]">
                      {editingLimit.isEnabled ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label>محدودیت روزانه</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={editingLimit.dailyLimit || ''}
                        onChange={(e) => setEditingLimit({
                          ...editingLimit,
                          dailyLimit: e.target.value ? parseInt(e.target.value) : null
                        })}
                        className="flex-1"
                        placeholder="بدون محدودیت"
                      />
                      <span className="text-sm text-[var(--lux-text-muted)]">بار در روز</span>
                    </div>
                  </div>

                  <div>
                    <Label>محدودیت هفتگی</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={editingLimit.weeklyLimit || ''}
                        onChange={(e) => setEditingLimit({
                          ...editingLimit,
                          weeklyLimit: e.target.value ? parseInt(e.target.value) : null
                        })}
                        className="flex-1"
                        placeholder="بدون محدودیت"
                      />
                      <span className="text-sm text-[var(--lux-text-muted)]">بار در هفته</span>
                    </div>
                  </div>

                  <div>
                    <Label>محدودیت ماهانه</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={editingLimit.monthlyLimit || ''}
                        onChange={(e) => setEditingLimit({
                          ...editingLimit,
                          monthlyLimit: e.target.value ? parseInt(e.target.value) : null
                        })}
                        className="flex-1"
                        placeholder="بدون محدودیت"
                      />
                      <span className="text-sm text-[var(--lux-text-muted)]">بار در ماه</span>
                    </div>
                  </div>

                  <div>
                    <Label>هزینه اعتبار</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={editingLimit.creditCost}
                        onChange={(e) => setEditingLimit({
                          ...editingLimit,
                          creditCost: parseInt(e.target.value) || 0
                        })}
                        className="flex-1"
                      />
                      <span className="text-sm text-[var(--lux-text-muted)]">credit</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--lux-surface)] rounded-lg p-3 text-sm">
                  <p className="font-medium mb-2">پیش‌نمایش:</p>
                  <ul className="space-y-1 text-[var(--lux-text-muted)]">
                    <li>• حداکثر {editingLimit.dailyLimit || '∞'} بار در روز</li>
                    <li>• حداکثر {editingLimit.weeklyLimit || '∞'} بار در هفته</li>
                    <li>• حداکثر {editingLimit.monthlyLimit || '∞'} بار در ماه</li>
                    <li>• هر بار {editingLimit.creditCost} credit کم می‌شود</li>
                  </ul>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                انصراف
              </Button>
              <Button onClick={handleSaveLimit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                ذخیره تغییرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </DashboardPage>
  )
}














































