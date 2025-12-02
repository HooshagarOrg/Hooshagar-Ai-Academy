'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Settings,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Copy,
  RotateCcw,
  Users,
  Building2,
  Globe,
  User,
  Calendar,
  BarChart3,
  Save,
  X,
  Check,
  Info,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Clock,
  Filter,
  MoreHorizontal,
  Eye,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { AI_FEATURES, type FeatureInfo } from '@/lib/check-ai-limit'

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

interface SpecialUser {
  id: string
  userId: string
  userName: string
  userRole: string
  userClass?: string
  feature: string
  featureLabel: string
  normalLimit: number
  specialLimit: number
  expiresAt?: string
  reason: string
}

interface UsageStats {
  totalUsage: number
  totalCredits: number
  topFeatures: { name: string; label: string; count: number }[]
  bottomFeatures: { name: string; label: string; count: number }[]
}

// ============================================
// داده‌های نمونه
// ============================================

const SAMPLE_LIMITS: AILimit[] = Object.entries(AI_FEATURES).map(([name, feature]) => ({
  id: `limit-${name}`,
  featureName: name,
  featureLabel: feature.label,
  featureIcon: feature.icon,
  scope: 'global',
  dailyLimit: feature.dailyLimit,
  weeklyLimit: feature.weeklyLimit,
  monthlyLimit: feature.monthlyLimit,
  creditCost: feature.creditCost,
  isEnabled: feature.isEnabled,
  usageThisMonth: Math.floor(Math.random() * 5000),
  createdAt: '1403/09/01',
}))

const SAMPLE_SPECIAL_USERS: SpecialUser[] = [
  {
    id: 'sp-1',
    userId: 'user-1',
    userName: 'علی رضایی',
    userRole: 'دانش‌آموز',
    userClass: 'ششم الف',
    feature: 'story_wizard',
    featureLabel: 'تولید داستان',
    normalLimit: 3,
    specialLimit: 10,
    expiresAt: '1403/12/29',
    reason: 'برنده مسابقه داستان‌نویسی مدرسه',
  },
  {
    id: 'sp-2',
    userId: 'user-2',
    userName: 'سارا احمدی',
    userRole: 'دانش‌آموز',
    userClass: 'پنجم ب',
    feature: 'ocr_solver',
    featureLabel: 'حل مسئله با OCR',
    normalLimit: 10,
    specialLimit: 30,
    expiresAt: '1403/11/15',
    reason: 'شرکت‌کننده المپیاد ریاضی',
  },
  {
    id: 'sp-3',
    userId: 'user-3',
    userName: 'محمد کریمی',
    userRole: 'معلم',
    feature: 'exam_generator',
    featureLabel: 'تولید آزمون',
    normalLimit: 3,
    specialLimit: 20,
    reason: 'آماده‌سازی آزمون‌های جامع',
  },
]

const SAMPLE_STATS: UsageStats = {
  totalUsage: 12456,
  totalCredits: 45678,
  topFeatures: [
    { name: 'ocr_solver', label: 'حل مسئله با OCR', count: 4567 },
    { name: 'story_wizard', label: 'تولید داستان', count: 3234 },
    { name: 'study_buddy', label: 'دستیار مطالعه', count: 2890 },
  ],
  bottomFeatures: [
    { name: 'konkur_roadmap', label: 'نقشه راه کنکور', count: 12 },
    { name: 'future_compass', label: 'راهنمای آینده', count: 34 },
  ],
}

const ROLES = [
  { value: 'student', label: 'دانش‌آموز', icon: '🎓' },
  { value: 'teacher', label: 'معلم', icon: '👨‍🏫' },
  { value: 'parent', label: 'والد', icon: '👪' },
  { value: 'counselor', label: 'مشاور', icon: '💼' },
]

const SCHOOLS = [
  { id: 'school-1', name: 'دبستان تلاش' },
  { id: 'school-2', name: 'دبستان نور' },
  { id: 'school-3', name: 'دبیرستان تیزهوشان' },
]

// ============================================
// کامپوننت اصلی
// ============================================

export default function AILimitsPage() {
  const [limits, setLimits] = useState<AILimit[]>(SAMPLE_LIMITS)
  const [specialUsers, setSpecialUsers] = useState<SpecialUser[]>(SAMPLE_SPECIAL_USERS)
  const [stats] = useState<UsageStats>(SAMPLE_STATS)
  
  const [activeTab, setActiveTab] = useState('global')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null)
  const [selectedRole, setSelectedRole] = useState('student')
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  
  const [editingLimit, setEditingLimit] = useState<AILimit | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedLimits, setSelectedLimits] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

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
      // در محیط واقعی API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setLimits(prev => prev.map(l => 
        l.id === editingLimit.id ? editingLimit : l
      ))
      setIsEditDialogOpen(false)
      setEditingLimit(null)
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // Toggle فعال/غیرفعال
  // ============================================

  const toggleLimit = (limitId: string) => {
    setLimits(prev => prev.map(l =>
      l.id === limitId ? { ...l, isEnabled: !l.isEnabled } : l
    ))
  }

  // ============================================
  // عملیات دسته‌جمعی
  // ============================================

  const handleBulkEnable = () => {
    setLimits(prev => prev.map(l =>
      selectedLimits.has(l.id) ? { ...l, isEnabled: true } : l
    ))
    setSelectedLimits(new Set())
  }

  const handleBulkDisable = () => {
    setLimits(prev => prev.map(l =>
      selectedLimits.has(l.id) ? { ...l, isEnabled: false } : l
    ))
    setSelectedLimits(new Set())
  }

  const handleResetToDefault = () => {
    setLimits(SAMPLE_LIMITS)
    setSelectedLimits(new Set())
  }

  // ============================================
  // رندر
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                مدیریت محدودیت‌های هوش مصنوعی
              </h1>
              <p className="text-gray-500 mt-2">
                کنترل و مدیریت استفاده از قابلیت‌های AI
              </p>
            </div>
            
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.location.href = '/admin/ai-usage-dashboard'}
            >
              <BarChart3 className="w-4 h-4" />
              مشاهده داشبورد مصرف
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* محتوای اصلی */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6 bg-white/80">
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
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                          <TableRow className="bg-gray-50">
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
                                <span className="text-gray-600">
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="text-sm text-blue-700">
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
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <span className="font-medium">📖 تولید داستان:</span>
                              <span className="mr-2">3/روز، 15/هفته، 50/ماه</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <span className="font-medium">📸 OCR:</span>
                              <span className="mr-2">10/روز</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <span className="font-medium">💬 دستیار مطالعه:</span>
                              <span className="mr-2">20 پیام/روز</span>
                            </div>
                          </>
                        )}
                        {selectedRole === 'teacher' && (
                          <>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <span className="font-medium">👤 تحلیل دانش‌آموز:</span>
                              <span className="mr-2">10/روز</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <span className="font-medium">✍️ تولید محتوا:</span>
                              <span className="mr-2">5/روز</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <span className="font-medium">📝 تولید آزمون:</span>
                              <span className="mr-2">3/روز</span>
                            </div>
                          </>
                        )}
                        {selectedRole === 'parent' && (
                          <>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <span className="font-medium">📸 OCR:</span>
                              <span className="mr-2">5/روز</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
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
                          <TableRow className="bg-gray-50">
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
                    {/* فرم افزودن */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <h4 className="font-medium mb-4">افزودن کاربر ویژه</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>جستجوی کاربر</Label>
                          <Command className="border rounded-md mt-1">
                            <CommandInput placeholder="نام، کد ملی، شماره..." />
                            <CommandList>
                              <CommandEmpty>کاربری یافت نشد</CommandEmpty>
                              <CommandGroup>
                                <CommandItem>
                                  <span>علی رضایی - دانش‌آموز - ششم الف</span>
                                </CommandItem>
                                <CommandItem>
                                  <span>سارا احمدی - معلم - ریاضی</span>
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </div>

                        <div>
                          <Label>قابلیت AI</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="انتخاب قابلیت" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(AI_FEATURES).map(([name, feature]) => (
                                <SelectItem key={name} value={name}>
                                  {feature.icon} {feature.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>محدودیت ویژه روزانه</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input type="number" placeholder="10" className="w-20" />
                            <span className="text-sm text-gray-500">بار (عادی: 3 بار)</span>
                          </div>
                        </div>

                        <div>
                          <Label>تاریخ انقضا</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input type="text" placeholder="1403/12/29" className="flex-1" />
                            <div className="flex items-center gap-1">
                              <Checkbox id="no-expire" />
                              <Label htmlFor="no-expire" className="text-sm">بدون انقضا</Label>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <Label>دلیل</Label>
                          <Textarea
                            placeholder="برنده مسابقه داستان‌نویسی مدرسه"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <Button className="mt-4 gap-2">
                        <Plus className="w-4 h-4" />
                        افزودن محدودیت ویژه
                      </Button>
                    </div>

                    {/* جدول کاربران ویژه */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>کاربر</TableHead>
                            <TableHead>قابلیت</TableHead>
                            <TableHead className="text-center">عادی</TableHead>
                            <TableHead className="text-center">ویژه</TableHead>
                            <TableHead>انقضا</TableHead>
                            <TableHead>دلیل</TableHead>
                            <TableHead className="w-20">حذف</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {specialUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{user.userName}</p>
                                  <p className="text-xs text-gray-500">
                                    {user.userRole} {user.userClass && `- ${user.userClass}`}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{user.featureLabel}</TableCell>
                              <TableCell className="text-center">{user.normalLimit}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  {user.specialLimit}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.expiresAt || '—'}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="text-sm text-gray-600">{user.reason}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {user.reason}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="text-red-500">
                                  <Trash2 className="w-4 h-4" />
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
                          {SCHOOLS.map((school) => (
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
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">یک مدرسه را انتخاب کنید</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
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
                              <TableRow className="bg-gray-50">
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
                  آمار کلی این ماه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsage.toLocaleString('fa-IR')}</p>
                  <p className="text-sm text-gray-500">کل استفاده</p>
                </div>
                
                <div>
                  <p className="text-2xl font-bold">{stats.totalCredits.toLocaleString('fa-IR')}</p>
                  <p className="text-sm text-gray-500">کل credit مصرفی</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">پرکاربردترین:</p>
                  <div className="space-y-2">
                    {stats.topFeatures.map((f, i) => (
                      <div key={f.name} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {i + 1}. {f.label}
                        </span>
                        <span className="font-medium">
                          {f.count.toLocaleString('fa-IR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">کمترین استفاده:</p>
                  <div className="space-y-2">
                    {stats.bottomFeatures.map((f, i) => (
                      <div key={f.name} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {i + 1}. {f.label}
                        </span>
                        <span className="font-medium text-gray-400">
                          {f.count.toLocaleString('fa-IR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
                    <span className="text-sm text-gray-500">
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
                      <span className="text-sm text-gray-500">بار در روز</span>
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
                      <span className="text-sm text-gray-500">بار در هفته</span>
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
                      <span className="text-sm text-gray-500">بار در ماه</span>
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
                      <span className="text-sm text-gray-500">credit</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-2">پیش‌نمایش:</p>
                  <ul className="space-y-1 text-gray-600">
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
      </div>
    </div>
  )
}







