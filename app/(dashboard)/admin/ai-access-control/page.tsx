'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  Search,
  School,
  Users,
  User,
  Calendar,
  Clock,
  Check,
  X,
  AlertTriangle,
  Info,
  History,
  Settings,
  ChevronDown,
  Filter,
  RotateCcw,
  Save,
  Loader2,
  Ban,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { AI_FEATURES } from '@/lib/check-ai-limit'
import {
  type FeatureAccessRecord,
  type AccessHistoryRecord,
  setFeatureAccess,
  setAllFeaturesAccess,
  translateScope,
  translateAction,
  formatAccessDate,
} from '@/lib/check-ai-access'

// ============================================
// تایپ‌ها
// ============================================

interface FeatureStatus {
  featureName: string
  featureLabel: string
  featureIcon: string
  isEnabled: boolean
  disabledReason?: string
  disabledUntil?: string
}

interface School {
  id: string
  name: string
}

interface ClassItem {
  id: string
  name: string
  grade: number
  schoolId: string
}

interface UserItem {
  id: string
  name: string
  role: string
  class?: string
  school?: string
}

// ============================================
// داده‌های نمونه
// ============================================

const SAMPLE_SCHOOLS: School[] = [
  { id: 'school-1', name: 'دبستان تلاش' },
  { id: 'school-2', name: 'دبستان نور' },
  { id: 'school-3', name: 'دبیرستان تیزهوشان' },
]

const SAMPLE_CLASSES: ClassItem[] = [
  { id: 'class-1', name: 'کلاس ششم الف', grade: 6, schoolId: 'school-1' },
  { id: 'class-2', name: 'کلاس ششم ب', grade: 6, schoolId: 'school-1' },
  { id: 'class-3', name: 'کلاس پنجم الف', grade: 5, schoolId: 'school-1' },
  { id: 'class-4', name: 'کلاس چهارم الف', grade: 4, schoolId: 'school-2' },
]

const SAMPLE_USERS: UserItem[] = [
  { id: 'user-1', name: 'علی رضایی', role: 'دانش‌آموز', class: 'ششم الف', school: 'دبستان تلاش' },
  { id: 'user-2', name: 'سارا احمدی', role: 'دانش‌آموز', class: 'پنجم ب', school: 'دبستان تلاش' },
  { id: 'user-3', name: 'محمد کریمی', role: 'معلم', school: 'دبستان تلاش' },
  { id: 'user-4', name: 'فاطمه محمدی', role: 'دانش‌آموز', class: 'ششم الف', school: 'دبستان نور' },
]

const SAMPLE_HISTORY: AccessHistoryRecord[] = [
  {
    id: '1',
    featureName: 'story_wizard',
    featureLabel: 'تولید داستان',
    scope: 'school',
    scopeId: 'school-1',
    scopeName: 'دبستان تلاش',
    action: 'disabled',
    reason: 'تست محدودیت',
    changedBy: 'admin-1',
    changedByName: 'مدیر سیستم',
    createdAt: '1403/09/15 14:30',
  },
  {
    id: '2',
    featureName: 'ocr_solver',
    featureLabel: 'حل مسئله با OCR',
    scope: 'class',
    scopeId: 'class-1',
    scopeName: 'کلاس ششم الف',
    action: 'disabled',
    reason: 'زمان امتحانات',
    disabledUntil: '1403/09/20',
    changedBy: 'admin-1',
    changedByName: 'مدیر سیستم',
    createdAt: '1403/09/10 09:15',
  },
  {
    id: '3',
    featureName: 'study_buddy',
    featureLabel: 'دستیار مطالعه',
    scope: 'user',
    scopeId: 'user-1',
    scopeName: 'علی رضایی',
    action: 'disabled',
    reason: 'سوءاستفاده از سیستم',
    changedBy: 'admin-1',
    changedByName: 'مدیر سیستم',
    createdAt: '1403/09/05 11:20',
  },
  {
    id: '4',
    featureName: 'study_buddy',
    featureLabel: 'دستیار مطالعه',
    scope: 'user',
    scopeId: 'user-1',
    scopeName: 'علی رضایی',
    action: 'enabled',
    changedBy: 'admin-1',
    changedByName: 'مدیر سیستم',
    createdAt: '1403/09/08 16:45',
  },
]

// ============================================
// کامپوننت اصلی
// ============================================

export default function AIAccessControlPage() {
  const [activeTab, setActiveTab] = useState('school')
  
  // انتخاب‌ها
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  
  // وضعیت قابلیت‌ها
  const [featureStatuses, setFeatureStatuses] = useState<FeatureStatus[]>([])
  
  // Dialog غیرفعال کردن
  const [disableDialogOpen, setDisableDialogOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<FeatureStatus | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [disableUntil, setDisableUntil] = useState('')
  const [noExpiry, setNoExpiry] = useState(true)
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // بارگذاری وضعیت قابلیت‌ها
  // ============================================

  useEffect(() => {
    const loadFeatureStatuses = () => {
      // تبدیل AI_FEATURES به FeatureStatus
      const statuses = Object.entries(AI_FEATURES).map(([name, feature]) => ({
        featureName: name,
        featureLabel: feature.label,
        featureIcon: feature.icon,
        isEnabled: Math.random() > 0.1, // 90% فعال در حالت نمونه
        disabledReason: undefined,
        disabledUntil: undefined,
      }))
      setFeatureStatuses(statuses)
    }

    loadFeatureStatuses()
  }, [selectedSchool, selectedClass, selectedUser])

  // ============================================
  // فیلتر کردن کلاس‌ها بر اساس مدرسه
  // ============================================

  const filteredClasses = SAMPLE_CLASSES.filter(
    c => !selectedSchool || c.schoolId === selectedSchool
  )

  // ============================================
  // جستجوی کاربران
  // ============================================

  const filteredUsers = SAMPLE_USERS.filter(
    u => !userSearchQuery || 
         u.name.includes(userSearchQuery) ||
         u.role.includes(userSearchQuery)
  )

  // ============================================
  // Toggle قابلیت
  // ============================================

  const handleToggleFeature = async (feature: FeatureStatus, newEnabled: boolean) => {
    if (newEnabled) {
      // فعال کردن مستقیم
      setIsSaving(true)
      try {
        const scopeId = activeTab === 'school' ? selectedSchool :
                       activeTab === 'class' ? selectedClass :
                       selectedUser?.id || ''
        
        await setFeatureAccess(
          feature.featureName,
          activeTab as 'school' | 'class' | 'user',
          scopeId,
          true
        )
        
        setFeatureStatuses(prev => prev.map(f =>
          f.featureName === feature.featureName
            ? { ...f, isEnabled: true, disabledReason: undefined, disabledUntil: undefined }
            : f
        ))
      } finally {
        setIsSaving(false)
      }
    } else {
      // باز کردن Dialog برای غیرفعال کردن
      setSelectedFeature(feature)
      setDisableReason('')
      setDisableUntil('')
      setNoExpiry(true)
      setDisableDialogOpen(true)
    }
  }

  // ============================================
  // تأیید غیرفعال کردن
  // ============================================

  const handleConfirmDisable = async () => {
    if (!selectedFeature || !disableReason) return
    
    setIsSaving(true)
    try {
      const scopeId = activeTab === 'school' ? selectedSchool :
                     activeTab === 'class' ? selectedClass :
                     selectedUser?.id || ''
      
      const scopeName = activeTab === 'school' 
        ? SAMPLE_SCHOOLS.find(s => s.id === selectedSchool)?.name
        : activeTab === 'class'
        ? SAMPLE_CLASSES.find(c => c.id === selectedClass)?.name
        : selectedUser?.name

      await setFeatureAccess(
        selectedFeature.featureName,
        activeTab as 'school' | 'class' | 'user',
        scopeId,
        false,
        {
          reason: disableReason,
          disabledUntil: noExpiry ? undefined : disableUntil,
          scopeName,
        }
      )
      
      setFeatureStatuses(prev => prev.map(f =>
        f.featureName === selectedFeature.featureName
          ? { 
              ...f, 
              isEnabled: false, 
              disabledReason: disableReason,
              disabledUntil: noExpiry ? undefined : disableUntil,
            }
          : f
      ))
      
      setDisableDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // فعال/غیرفعال کردن همه
  // ============================================

  const handleEnableAll = async () => {
    setIsSaving(true)
    try {
      const scopeId = activeTab === 'school' ? selectedSchool :
                     activeTab === 'class' ? selectedClass :
                     selectedUser?.id || ''
      
      await setAllFeaturesAccess(
        activeTab as 'school' | 'class' | 'user',
        scopeId,
        true
      )
      
      setFeatureStatuses(prev => prev.map(f => ({
        ...f,
        isEnabled: true,
        disabledReason: undefined,
        disabledUntil: undefined,
      })))
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // دریافت نام سطح فعلی
  // ============================================

  const getCurrentScopeName = () => {
    if (activeTab === 'school') {
      return SAMPLE_SCHOOLS.find(s => s.id === selectedSchool)?.name || ''
    }
    if (activeTab === 'class') {
      return SAMPLE_CLASSES.find(c => c.id === selectedClass)?.name || ''
    }
    return selectedUser?.name || ''
  }

  const hasSelection = 
    (activeTab === 'school' && selectedSchool) ||
    (activeTab === 'class' && selectedClass) ||
    (activeTab === 'user' && selectedUser)

  // ============================================
  // رندر
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            کنترل دسترسی قابلیت‌های AI
          </h1>
          <p className="text-gray-500 mt-2">
            فعال یا غیرفعال کردن قابلیت‌های هوش مصنوعی برای مدرسه، کلاس یا کاربر خاص
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6 bg-white/80">
            <TabsTrigger value="school" className="gap-2">
              <School className="w-4 h-4" />
              کنترل مدرسه
            </TabsTrigger>
            <TabsTrigger value="class" className="gap-2">
              <Users className="w-4 h-4" />
              کنترل کلاس
            </TabsTrigger>
            <TabsTrigger value="user" className="gap-2">
              <User className="w-4 h-4" />
              کنترل کاربر
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: کنترل مدرسه */}
          <TabsContent value="school">
            <Card>
              <CardHeader>
                <CardTitle>کنترل دسترسی در سطح مدرسه</CardTitle>
                <CardDescription>
                  غیرفعال کردن قابلیت‌ها برای همه کاربران یک مدرسه
                </CardDescription>

                <div className="mt-4">
                  <Label>انتخاب مدرسه</Label>
                  <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                    <SelectTrigger className="w-64 mt-1">
                      <SelectValue placeholder="یک مدرسه انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_SCHOOLS.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                {selectedSchool ? (
                  <FeatureAccessTable
                    features={featureStatuses}
                    scopeName={getCurrentScopeName()}
                    scopeType="مدرسه"
                    onToggle={handleToggleFeature}
                    onEnableAll={handleEnableAll}
                    isSaving={isSaving}
                  />
                ) : (
                  <EmptyState message="لطفاً یک مدرسه را انتخاب کنید" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: کنترل کلاس */}
          <TabsContent value="class">
            <Card>
              <CardHeader>
                <CardTitle>کنترل دسترسی در سطح کلاس</CardTitle>
                <CardDescription>
                  غیرفعال کردن قابلیت‌ها برای دانش‌آموزان یک کلاس خاص
                </CardDescription>

                <div className="flex items-center gap-4 mt-4">
                  <div>
                    <Label>مدرسه</Label>
                    <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                      <SelectTrigger className="w-48 mt-1">
                        <SelectValue placeholder="انتخاب مدرسه" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_SCHOOLS.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>کلاس</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-48 mt-1">
                        <SelectValue placeholder="انتخاب کلاس" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {selectedClass ? (
                  <FeatureAccessTable
                    features={featureStatuses}
                    scopeName={getCurrentScopeName()}
                    scopeType="کلاس"
                    onToggle={handleToggleFeature}
                    onEnableAll={handleEnableAll}
                    isSaving={isSaving}
                  />
                ) : (
                  <EmptyState message="لطفاً یک کلاس را انتخاب کنید" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: کنترل کاربر */}
          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle>کنترل دسترسی در سطح کاربر</CardTitle>
                <CardDescription>
                  غیرفعال کردن قابلیت‌ها برای یک کاربر خاص
                </CardDescription>

                <div className="mt-4">
                  <Label>جستجوی کاربر</Label>
                  <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userSearchOpen}
                        className="w-80 justify-between mt-1"
                      >
                        {selectedUser ? (
                          <span>
                            {selectedUser.name} - {selectedUser.role}
                          </span>
                        ) : (
                          <span className="text-gray-400">جستجوی نام، کد ملی...</span>
                        )}
                        <Search className="w-4 h-4 mr-2 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <Command dir="rtl">
                        <CommandInput 
                          placeholder="جستجو..." 
                          value={userSearchQuery}
                          onValueChange={setUserSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>کاربری یافت نشد</CommandEmpty>
                          <CommandGroup>
                            {filteredUsers.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.name}
                                onSelect={() => {
                                  setSelectedUser(user)
                                  setUserSearchOpen(false)
                                }}
                              >
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {user.role} {user.class && `- ${user.class}`} {user.school && `- ${user.school}`}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedUser && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold">{selectedUser.name}</p>
                        <p className="text-sm text-gray-600">
                          {selectedUser.role}
                          {selectedUser.class && ` - ${selectedUser.class}`}
                          {selectedUser.school && ` - ${selectedUser.school}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {selectedUser ? (
                  <FeatureAccessTable
                    features={featureStatuses}
                    scopeName={selectedUser.name}
                    scopeType="کاربر"
                    onToggle={handleToggleFeature}
                    onEnableAll={handleEnableAll}
                    isSaving={isSaving}
                  />
                ) : (
                  <EmptyState message="لطفاً یک کاربر را جستجو و انتخاب کنید" />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* تاریخچه */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              تاریخچه تغییرات اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>تاریخ</TableHead>
                    <TableHead>قابلیت</TableHead>
                    <TableHead>سطح</TableHead>
                    <TableHead>عملیات</TableHead>
                    <TableHead>دلیل</TableHead>
                    <TableHead>انجام‌دهنده</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SAMPLE_HISTORY.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-gray-500">
                        {item.createdAt}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{item.featureLabel}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">{translateScope(item.scope)}</Badge>
                          <span className="text-gray-500 mr-2 text-sm">{item.scopeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.action === 'disabled' ? (
                          <Badge className="bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3 ml-1" />
                            غیرفعال شد
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            فعال شد
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {item.reason || '—'}
                        {item.disabledUntil && (
                          <span className="text-xs text-gray-500 block">
                            تا: {item.disabledUntil}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{item.changedByName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog غیرفعال کردن */}
        <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Ban className="w-5 h-5" />
                غیرفعال کردن: {selectedFeature?.featureLabel}
              </DialogTitle>
              <DialogDescription>
                این قابلیت برای {
                  activeTab === 'school' ? 'همه کاربران این مدرسه' :
                  activeTab === 'class' ? 'همه دانش‌آموزان این کلاس' :
                  'این کاربر'
                } غیرفعال می‌شود.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label className="flex items-center gap-1">
                  دلیل غیرفعال‌سازی
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  placeholder="دلیل غیرفعال کردن این قابلیت..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>غیرفعال تا (اختیاری)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="text"
                    value={disableUntil}
                    onChange={(e) => setDisableUntil(e.target.value)}
                    placeholder="1403/10/15"
                    className="flex-1"
                    disabled={noExpiry}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="no-expiry"
                    checked={noExpiry}
                    onCheckedChange={(checked) => setNoExpiry(checked === true)}
                  />
                  <Label htmlFor="no-expiry" className="text-sm font-normal">
                    بدون تاریخ انقضا (تا زمانی که دستی فعال شود)
                  </Label>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  این تغییر فوری اعمال می‌شود و کاربرانی که در حال استفاده از این قابلیت هستند، 
                  دسترسی‌شان قطع می‌شود.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
                انصراف
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDisable}
                disabled={!disableReason || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Ban className="w-4 h-4 ml-2" />
                )}
                غیرفعال کردن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت جدول دسترسی
// ============================================

function FeatureAccessTable({
  features,
  scopeName,
  scopeType,
  onToggle,
  onEnableAll,
  isSaving,
}: {
  features: FeatureStatus[]
  scopeName: string
  scopeType: string
  onToggle: (feature: FeatureStatus, enabled: boolean) => void
  onEnableAll: () => void
  isSaving: boolean
}) {
  const disabledCount = features.filter(f => !f.isEnabled).length

  return (
    <div className="space-y-4">
      {/* نوار عملیات */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {scopeType}: <span className="font-medium text-gray-700">{scopeName}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {disabledCount > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              {disabledCount} قابلیت غیرفعال
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onEnableAll}
            disabled={disabledCount === 0 || isSaving}
          >
            <CheckCircle className="w-4 h-4 ml-1" />
            فعال کردن همه
          </Button>
        </div>
      </div>

      {/* جدول */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-1/3">قابلیت AI</TableHead>
              <TableHead className="text-center">وضعیت</TableHead>
              <TableHead>دلیل/تاریخ</TableHead>
              <TableHead className="w-20">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow
                key={feature.featureName}
                className={cn(!feature.isEnabled && 'bg-red-50')}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{feature.featureIcon}</span>
                    <span className="font-medium">{feature.featureLabel}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={feature.isEnabled}
                    onCheckedChange={(checked) => onToggle(feature, checked)}
                    disabled={isSaving}
                  />
                </TableCell>
                <TableCell>
                  {!feature.isEnabled && (
                    <div className="text-sm">
                      {feature.disabledReason && (
                        <p className="text-gray-600">{feature.disabledReason}</p>
                      )}
                      {feature.disabledUntil && (
                        <p className="text-gray-400 text-xs">
                          تا: {feature.disabledUntil}
                        </p>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت حالت خالی
// ============================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  )
}


