'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Award, 
  Search,
  User,
  Medal,
  Gift,
  Check,
  Send,
  History,
  MessageSquare,
  Bell,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { PageSkeletonCards } from '@/components/ui/page-states'
import { toast } from 'sonner'
import {
  Badge as BadgeType,
  BadgeCategory,
  BADGE_CATEGORY_CONFIG,
  BADGE_RARITY_CONFIG,
  formatBadgeDate,
} from '@/lib/types/badge.types'

// داده نمونه دانش‌آموزان
const SAMPLE_STUDENTS = [
  { id: '1', full_name: 'علی رضایی', class_name: 'ششم الف', avatar: null, badges_count: 5 },
  { id: '2', full_name: 'سارا احمدی', class_name: 'ششم الف', avatar: null, badges_count: 8 },
  { id: '3', full_name: 'محمد حسینی', class_name: 'ششم الف', avatar: null, badges_count: 3 },
  { id: '4', full_name: 'فاطمه کریمی', class_name: 'ششم ب', avatar: null, badges_count: 6 },
  { id: '5', full_name: 'حسین محمدی', class_name: 'ششم ب', avatar: null, badges_count: 4 },
]

// داده نمونه نشان‌های قابل اعطا (فقط non-auto)
const SAMPLE_AWARDABLE_BADGES: BadgeType[] = [
  {
    id: '10', name: 'دوست خوب', name_en: 'Good Friend', description: 'رفتار دوستانه با همکلاسی‌ها',
    icon_url: '/badges/friend.png', icon_locked_url: null, icon_emoji: '🤝',
    category: 'behavior', rarity: 'common', auto_award: false,
    award_condition: null, xp_reward: 50,
    is_active: true, is_secret: false, sort_order: 20, created_at: '', updated_at: ''
  },
  {
    id: '11', name: 'کمک‌کار', name_en: 'Helper', description: 'کمک به همکلاسی‌ها در درس',
    icon_url: '/badges/helper.png', icon_locked_url: null, icon_emoji: '🙋',
    category: 'behavior', rarity: 'common', auto_award: false,
    award_condition: null, xp_reward: 75,
    is_active: true, is_secret: false, sort_order: 21, created_at: '', updated_at: ''
  },
  {
    id: '12', name: 'دوست مهربان', name_en: 'Kind Friend', description: 'رفتار نمونه و مهربانی مستمر',
    icon_url: '/badges/kind.png', icon_locked_url: null, icon_emoji: '💝',
    category: 'behavior', rarity: 'rare', auto_award: false,
    award_condition: null, xp_reward: 100,
    is_active: true, is_secret: false, sort_order: 22, created_at: '', updated_at: ''
  },
  {
    id: '13', name: 'الگوی کلاس', name_en: 'Role Model', description: 'الگو بودن برای سایر دانش‌آموزان',
    icon_url: '/badges/rolemodel.png', icon_locked_url: null, icon_emoji: '⭐',
    category: 'behavior', rarity: 'rare', auto_award: false,
    award_condition: null, xp_reward: 150,
    is_active: true, is_secret: false, sort_order: 23, created_at: '', updated_at: ''
  },
  {
    id: '14', name: 'رهبر کلاس', name_en: 'Class Leader', description: 'مسئولیت‌پذیری و رهبری عالی',
    icon_url: '/badges/leader.png', icon_locked_url: null, icon_emoji: '🏆',
    category: 'behavior', rarity: 'epic', auto_award: false,
    award_condition: null, xp_reward: 200,
    is_active: true, is_secret: false, sort_order: 24, created_at: '', updated_at: ''
  },
  {
    id: '20', name: 'تیم‌یار', name_en: 'Team Player', description: 'همکاری خوب در کارهای گروهی',
    icon_url: '/badges/teamplayer.png', icon_locked_url: null, icon_emoji: '🤼',
    category: 'social', rarity: 'common', auto_award: false,
    award_condition: null, xp_reward: 50,
    is_active: true, is_secret: false, sort_order: 50, created_at: '', updated_at: ''
  },
  {
    id: '21', name: 'دوست همه', name_en: 'Friend of All', description: 'دوستی با همه همکلاسی‌ها',
    icon_url: '/badges/friendall.png', icon_locked_url: null, icon_emoji: '👥',
    category: 'social', rarity: 'rare', auto_award: false,
    award_condition: null, xp_reward: 100,
    is_active: true, is_secret: false, sort_order: 51, created_at: '', updated_at: ''
  },
  {
    id: '22', name: 'آشتی‌دهنده', name_en: 'Peacemaker', description: 'حل اختلافات بین دوستان',
    icon_url: '/badges/peacemaker.png', icon_locked_url: null, icon_emoji: '☮️',
    category: 'social', rarity: 'epic', auto_award: false,
    award_condition: null, xp_reward: 150,
    is_active: true, is_secret: false, sort_order: 52, created_at: '', updated_at: ''
  },
  {
    id: '30', name: 'ستاره کلاس', name_en: 'Class Star', description: 'عملکرد برجسته در کلاس',
    icon_url: '/badges/classstar.png', icon_locked_url: null, icon_emoji: '⭐',
    category: 'special', rarity: 'epic', auto_award: false,
    award_condition: null, xp_reward: 500,
    is_active: true, is_secret: false, sort_order: 60, created_at: '', updated_at: ''
  },
  {
    id: '31', name: 'نوآور', name_en: 'Innovator', description: 'ارائه ایده خلاقانه',
    icon_url: '/badges/innovator.png', icon_locked_url: null, icon_emoji: '💡',
    category: 'special', rarity: 'epic', auto_award: false,
    award_condition: null, xp_reward: 300,
    is_active: true, is_secret: false, sort_order: 63, created_at: '', updated_at: ''
  },
  {
    id: '32', name: 'هنرمند', name_en: 'Artist', description: 'استعداد برجسته در هنر',
    icon_url: '/badges/artist.png', icon_locked_url: null, icon_emoji: '🎨',
    category: 'special', rarity: 'rare', auto_award: false,
    award_condition: null, xp_reward: 200,
    is_active: true, is_secret: false, sort_order: 64, created_at: '', updated_at: ''
  },
  {
    id: '33', name: 'ورزشکار', name_en: 'Athlete', description: 'موفقیت در رشته ورزشی',
    icon_url: '/badges/athlete.png', icon_locked_url: null, icon_emoji: '⚽',
    category: 'special', rarity: 'rare', auto_award: false,
    award_condition: null, xp_reward: 200,
    is_active: true, is_secret: false, sort_order: 65, created_at: '', updated_at: ''
  },
]

// داده نمونه تاریخچه اعطا
const SAMPLE_AWARD_HISTORY = [
  {
    id: '1',
    student: { id: '2', full_name: 'سارا احمدی', class_name: 'ششم الف' },
    badge: { id: '12', name: 'دوست مهربان', icon_emoji: '💝', rarity: 'rare' },
    reason: 'به خاطر کمک مستمر به همکلاسی‌ها و رفتار نمونه',
    awarded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    student: { id: '1', full_name: 'علی رضایی', class_name: 'ششم الف' },
    badge: { id: '20', name: 'تیم‌یار', icon_emoji: '🤼', rarity: 'common' },
    reason: 'همکاری عالی در پروژه گروهی علوم',
    awarded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    student: { id: '4', full_name: 'فاطمه کریمی', class_name: 'ششم ب' },
    badge: { id: '30', name: 'ستاره کلاس', icon_emoji: '⭐', rarity: 'epic' },
    reason: 'بهترین عملکرد در امتحانات میان‌ترم',
    awarded_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    student: { id: '3', full_name: 'محمد حسینی', class_name: 'ششم الف' },
    badge: { id: '10', name: 'دوست خوب', icon_emoji: '🤝', rarity: 'common' },
    reason: 'رفتار دوستانه با دانش‌آموز جدید',
    awarded_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    student: { id: '5', full_name: 'حسین محمدی', class_name: 'ششم ب' },
    badge: { id: '33', name: 'ورزشکار', icon_emoji: '⚽', rarity: 'rare' },
    reason: 'قهرمانی در مسابقات فوتبال بین کلاسی',
    awarded_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

interface Student {
  id: string
  full_name: string
  class_name: string
  avatar: string | null
  badges_count: number
}

interface AwardHistory {
  id: string
  student: { id: string; full_name: string; class_name: string }
  badge: { id: string; name: string; icon_emoji: string; rarity: string }
  reason: string
  awarded_at: string
}

export default function TeacherAwardBadgesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [awardHistory, setAwardHistory] = useState<AwardHistory[]>([])
  
  // انتخاب دانش‌آموز
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSearchOpen, setStudentSearchOpen] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  
  // نشان‌های دانش‌آموز انتخاب شده
  const [studentBadges, setStudentBadges] = useState<string[]>([])
  
  // فیلتر نشان‌ها
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | 'all'>('all')
  
  // دیالوگ اعطا
  const [showAwardDialog, setShowAwardDialog] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null)
  const [awardReason, setAwardReason] = useState('')
  const [notifyParent, setNotifyParent] = useState(true)
  const [showInClass, setShowInClass] = useState(true)
  const [isAwarding, setIsAwarding] = useState(false)

  // بارگذاری داده‌ها
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStudents(SAMPLE_STUDENTS)
      setBadges(SAMPLE_AWARDABLE_BADGES)
      setAwardHistory(SAMPLE_AWARD_HISTORY)
      setIsLoading(false)
    }
    loadData()
  }, [])

  // وقتی دانش‌آموز انتخاب می‌شود، نشان‌هایش را بگیر
  useEffect(() => {
    if (selectedStudent) {
      // شبیه‌سازی دریافت نشان‌های دانش‌آموز
      // فرض می‌کنیم برخی نشان‌ها را دارد
      setStudentBadges(['10', '20']) // نمونه
    } else {
      setStudentBadges([])
    }
  }, [selectedStudent])

  // فیلتر نشان‌ها
  const filteredBadges = useMemo(() => {
    let result = badges
    
    // فیلتر دسته‌بندی
    if (categoryFilter !== 'all') {
      result = result.filter(b => b.category === categoryFilter)
    }
    
    // فیلتر نشان‌هایی که دانش‌آموز ندارد
    if (selectedStudent) {
      result = result.filter(b => !studentBadges.includes(b.id))
    }
    
    return result
  }, [badges, categoryFilter, selectedStudent, studentBadges])

  // اعطای نشان
  const handleAward = async () => {
    if (!selectedStudent || !selectedBadge || !awardReason.trim()) {
      toast.error('لطفاً همه فیلدها را پر کنید')
      return
    }

    setIsAwarding(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // اضافه کردن به تاریخچه
    const newAward: AwardHistory = {
      id: Date.now().toString(),
      student: {
        id: selectedStudent.id,
        full_name: selectedStudent.full_name,
        class_name: selectedStudent.class_name,
      },
      badge: {
        id: selectedBadge.id,
        name: selectedBadge.name,
        icon_emoji: selectedBadge.icon_emoji || '',
        rarity: selectedBadge.rarity,
      },
      reason: awardReason,
      awarded_at: new Date().toISOString(),
    }
    setAwardHistory(prev => [newAward, ...prev])

    // اضافه به نشان‌های دانش‌آموز
    setStudentBadges(prev => [...prev, selectedBadge.id])

    setIsAwarding(false)
    setShowAwardDialog(false)
    setAwardReason('')
    
    // نمایش پیام موفقیت
    if (selectedBadge.rarity === 'legendary' || selectedBadge.rarity === 'epic') {
      toast.success('🎉 نشان ویژه با موفقیت اعطا شد!', {
        description: `${selectedBadge.name} به ${selectedStudent.full_name} اعطا شد.`,
        duration: 5000,
      })
    } else {
      toast.success('نشان با موفقیت اعطا شد! ✨', {
        description: `${selectedBadge.name} به ${selectedStudent.full_name} اعطا شد.`,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 p-4 sm:p-6" dir="rtl">
        <PageSkeletonCards count={4} />
      </div>
    )
  }

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <Award className="h-8 w-8 text-amber-400" />
          اعطای نشان به دانش‌آموزان
        </span>
      }
      description="به دانش‌آموزان برتر نشان اعطا کنید"
    >
      <DashboardSectionBlock>
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            انتخاب دانش‌آموز
          </CardTitle>
          <CardDescription>
            ابتدا دانش‌آموز مورد نظر را انتخاب کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={studentSearchOpen}
                className="w-full justify-between"
              >
                {selectedStudent ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{selectedStudent.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{selectedStudent.full_name}</span>
                    <Badge variant="outline">{selectedStudent.class_name}</Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">جستجو و انتخاب دانش‌آموز...</span>
                )}
                <Search className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="جستجوی نام دانش‌آموز..." 
                  value={studentSearch}
                  onValueChange={setStudentSearch}
                />
                <CommandList>
                  <CommandEmpty>دانش‌آموزی یافت نشد</CommandEmpty>
                  <CommandGroup heading="دانش‌آموزان">
                    {students
                      .filter(s => 
                        s.full_name.includes(studentSearch) ||
                        s.class_name.includes(studentSearch)
                      )
                      .map(student => (
                        <CommandItem
                          key={student.id}
                          value={student.full_name}
                          onSelect={() => {
                            setSelectedStudent(student)
                            setStudentSearchOpen(false)
                          }}
                        >
                          <Avatar className="h-8 w-8 ml-2">
                            <AvatarFallback>{student.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">{student.class_name}</p>
                          </div>
                          <Badge variant="secondary">
                            {student.badges_count} نشان
                          </Badge>
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* نشان‌های فعلی دانش‌آموز */}
          {selectedStudent && studentBadges.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                نشان‌های فعلی {selectedStudent.full_name}:
              </p>
              <div className="flex flex-wrap gap-2">
                {studentBadges.map(badgeId => {
                  const badge = badges.find(b => b.id === badgeId)
                  return badge ? (
                    <Badge key={badgeId} variant="outline" className="text-lg py-1 px-3">
                      {badge.icon_emoji} {badge.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      {/* انتخاب نشان */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              انتخاب نشان برای اعطا
            </CardTitle>
            <CardDescription>
              نشانی که می‌خواهید به {selectedStudent.full_name} اعطا کنید را انتخاب کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* فیلتر */}
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={categoryFilter} 
                onValueChange={(v) => setCategoryFilter(v as BadgeCategory | 'all')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دسته‌ها</SelectItem>
                  {(Object.entries(BADGE_CATEGORY_CONFIG) as [BadgeCategory, typeof BADGE_CATEGORY_CONFIG[BadgeCategory]][]).map(([cat, config]) => (
                    <SelectItem key={cat} value={cat}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grid نشان‌ها */}
            {filteredBadges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>نشان قابل اعطایی در این دسته‌بندی وجود ندارد</p>
                <p className="text-sm">یا دانش‌آموز تمام نشان‌ها را دارد</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredBadges.map(badge => {
                  const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity]
                  const categoryConfig = BADGE_CATEGORY_CONFIG[badge.category]
                  
                  return (
                    <Card 
                      key={badge.id}
                      className={`
                        cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1
                        ${rarityConfig.borderColor} border-2
                      `}
                      onClick={() => {
                        setSelectedBadge(badge)
                        setShowAwardDialog(true)
                      }}
                    >
                      <CardContent className="pt-4 text-center">
                        <div className={`
                          text-4xl mb-2
                          ${badge.rarity === 'legendary' ? 'animate-bounce-slow' : ''}
                        `}>
                          {badge.icon_emoji}
                        </div>
                        <h3 className="font-bold text-sm">{badge.name}</h3>
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                          <Badge variant="outline" className={`text-xs ${rarityConfig.color}`}>
                            {rarityConfig.icon}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${categoryConfig.color}`}>
                            {categoryConfig.icon}
                          </Badge>
                        </div>
                        <p className="text-xs text-amber-500 mt-1">+{badge.xp_reward} XP</p>
                        <Button size="sm" className="mt-2 w-full">
                          <Gift className="h-3 w-3 ml-1" />
                          اعطا
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* تاریخچه اعطا */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            تاریخچه اعطای نشان
          </CardTitle>
          <CardDescription>
            نشان‌هایی که اخیراً اعطا کرده‌اید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">تاریخ</TableHead>
                <TableHead className="text-right">دانش‌آموز</TableHead>
                <TableHead className="text-right">نشان</TableHead>
                <TableHead className="text-right">دلیل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {awardHistory.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">
                    {formatBadgeDate(item.awarded_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{item.student.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{item.student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{item.student.class_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={BADGE_RARITY_CONFIG[item.badge.rarity as keyof typeof BADGE_RARITY_CONFIG]?.color}
                    >
                      {item.badge.icon_emoji} {item.badge.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.reason}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </DashboardSectionBlock>

      {/* دیالوگ اعطای نشان */}
      <Dialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-500" />
              اعطای نشان
            </DialogTitle>
            <DialogDescription>
              اعطای نشان به: {selectedStudent?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedBadge && (
            <div className="space-y-4">
              {/* نشان انتخاب شده */}
              <div className={`
                text-center py-6 rounded-xl
                ${BADGE_RARITY_CONFIG[selectedBadge.rarity].bgColor}
              `}>
                <div className="text-6xl mb-2">{selectedBadge.icon_emoji}</div>
                <h3 className="text-xl font-bold">{selectedBadge.name}</h3>
                <Badge className={`mt-1 ${BADGE_RARITY_CONFIG[selectedBadge.rarity].color}`}>
                  {BADGE_RARITY_CONFIG[selectedBadge.rarity].icon}
                  {' '}
                  {BADGE_RARITY_CONFIG[selectedBadge.rarity].label}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">{selectedBadge.description}</p>
                <p className="text-amber-500 mt-1">+{selectedBadge.xp_reward} XP</p>
              </div>

              <Separator />

              {/* دلیل اعطا */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  <MessageSquare className="h-4 w-4 inline ml-1" />
                  دلیل اعطا *
                </Label>
                <Textarea
                  id="reason"
                  placeholder="چرا این نشان را به این دانش‌آموز می‌دهید؟"
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* گزینه‌ها */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="notify-parent" 
                    checked={notifyParent}
                    onCheckedChange={(v) => setNotifyParent(v as boolean)}
                  />
                  <Label htmlFor="notify-parent" className="text-sm cursor-pointer">
                    <Bell className="h-4 w-4 inline ml-1" />
                    ارسال اطلاع به والدین
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="show-class" 
                    checked={showInClass}
                    onCheckedChange={(v) => setShowInClass(v as boolean)}
                  />
                  <Label htmlFor="show-class" className="text-sm cursor-pointer">
                    <User className="h-4 w-4 inline ml-1" />
                    نمایش در کلاس
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAwardDialog(false)}>
              انصراف
            </Button>
            <Button 
              onClick={handleAward} 
              disabled={isAwarding || !awardReason.trim()}
            >
              {isAwarding ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2" />
              ) : (
                <Send className="h-4 w-4 ml-2" />
              )}
              اعطای نشان
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* استایل انیمیشن */}
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </DashboardPage>
  )
}












































