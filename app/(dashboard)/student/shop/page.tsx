'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  ShoppingCart, 
  Gift, 
  Search, 
  Eye, 
  Clock,
  Lock,
  Check,
  Coins,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  Flame,
  AlertCircle,
  Package,
  Filter,
  SlidersHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  ShopItem,
  ShopItemType,
  ItemRarity,
  UserTalentInfo,
  ShopFilters,
  ITEM_TYPE_CONFIG,
  RARITY_CONFIG,
  RARITY_ICONS,
  formatPrice,
  formatTimeRemaining,
  isExpired,
} from '@/lib/types/shop.types'

// داده نمونه
const SAMPLE_USER: UserTalentInfo = {
  user_id: '1',
  coins: 1234,
  xp: 5600,
  level: 8,
  streak_days: 14,
}

const SAMPLE_ITEMS: ShopItem[] = [
  // آواتارها
  {
    id: '1', name: 'ستاره درخشان', name_en: 'Shining Star',
    description: 'آواتار ستاره طلایی برای شروع ماجراجویی',
    type: 'avatar', price_coins: 100, image_url: '⭐', preview_url: null,
    required_level: 1, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'common', theme_config: null,
    sort_order: 1, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '2', name: 'شیر شجاع', name_en: 'Brave Lion',
    description: 'آواتار شیر قدرتمند نشان‌دهنده شجاعت',
    type: 'avatar', price_coins: 500, image_url: '🦁', preview_url: null,
    required_level: 5, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: true, rarity: 'rare', theme_config: null,
    sort_order: 2, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '3', name: 'جغد دانا', name_en: 'Wise Owl',
    description: 'آواتار جغد نماد دانش و خرد',
    type: 'avatar', price_coins: 400, image_url: '🦉', preview_url: null,
    required_level: 4, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'rare', theme_config: null,
    sort_order: 3, created_at: '', updated_at: '', is_purchased: true, can_purchase: false
  },
  {
    id: '4', name: 'اژدهای حکیم', name_en: 'Wise Dragon',
    description: 'آواتار اژدهای قدرتمند و حکیم',
    type: 'avatar', price_coins: 1000, image_url: '🐉', preview_url: null,
    required_level: 10, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'epic', theme_config: null,
    sort_order: 4, created_at: '', updated_at: '', is_purchased: false, can_purchase: false,
    purchase_blocked_reason: 'نیاز به سطح 10'
  },
  {
    id: '5', name: 'یونیکورن رویایی', name_en: 'Dreamy Unicorn',
    description: 'آواتار یونیکورن زیبا و جادویی',
    type: 'avatar', price_coins: 800, image_url: '🦄', preview_url: null,
    required_level: 8, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'epic', theme_config: null,
    sort_order: 5, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '6', name: 'فینیکس افسانه‌ای', name_en: 'Legendary Phoenix',
    description: 'آواتار فینیکس نماد تجدید حیات و قدرت ابدی',
    type: 'avatar', price_coins: 2500, image_url: '🔥', preview_url: null,
    required_level: 20, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: true, rarity: 'legendary', theme_config: null,
    sort_order: 6, created_at: '', updated_at: '', is_purchased: false, can_purchase: false,
    purchase_blocked_reason: 'نیاز به سطح 20'
  },
  {
    id: '7', name: 'ربات دوستانه', name_en: 'Friendly Robot',
    description: 'آواتار ربات آینده‌نگر و هوشمند',
    type: 'avatar', price_coins: 300, image_url: '🤖', preview_url: null,
    required_level: 2, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'common', theme_config: null,
    sort_order: 7, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '8', name: 'پاندای شاد', name_en: 'Happy Panda',
    description: 'آواتار پاندای خوش‌اخلاق و دوست‌داشتنی',
    type: 'avatar', price_coins: 350, image_url: '🐼', preview_url: null,
    required_level: 3, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'common', theme_config: null,
    sort_order: 8, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },

  // پس‌زمینه‌ها
  {
    id: '10', name: 'آسمان ستاره‌ای', name_en: 'Starry Sky',
    description: 'پس‌زمینه آسمان شب با ستاره‌های درخشان',
    type: 'background', price_coins: 200, image_url: '🌌', preview_url: null,
    required_level: 1, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'common', theme_config: null,
    sort_order: 10, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '11', name: 'جنگل سحرآمیز', name_en: 'Magic Forest',
    description: 'پس‌زمینه جنگل رویایی و سحرآمیز',
    type: 'background', price_coins: 400, image_url: '🌳', preview_url: null,
    required_level: 5, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'rare', theme_config: null,
    sort_order: 11, created_at: '', updated_at: '', is_purchased: true, can_purchase: false
  },
  {
    id: '12', name: 'کهکشان مهتابی', name_en: 'Moonlight Galaxy',
    description: 'پس‌زمینه کهکشان با نور ماه و ستارگان',
    type: 'background', price_coins: 800, image_url: '🌙', preview_url: null,
    required_level: 10, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: true, rarity: 'epic', theme_config: null,
    sort_order: 12, created_at: '', updated_at: '', is_purchased: false, can_purchase: false,
    purchase_blocked_reason: 'نیاز به سطح 10'
  },
  {
    id: '13', name: 'اقیانوس آرام', name_en: 'Calm Ocean',
    description: 'پس‌زمینه امواج آرام اقیانوس آبی',
    type: 'background', price_coins: 250, image_url: '🌊', preview_url: null,
    required_level: 2, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'common', theme_config: null,
    sort_order: 13, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },

  // تم‌ها
  {
    id: '20', name: 'تم آبی اقیانوس', name_en: 'Ocean Blue',
    description: 'تم رنگی آبی آرامش‌بخش',
    type: 'theme', price_coins: 300, image_url: '💙', preview_url: null,
    required_level: 1, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'common', theme_config: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA' },
    sort_order: 20, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '21', name: 'تم سبز جنگلی', name_en: 'Forest Green',
    description: 'تم رنگی سبز طبیعی',
    type: 'theme', price_coins: 300, image_url: '💚', preview_url: null,
    required_level: 1, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'common', theme_config: { primary: '#10B981', secondary: '#047857', accent: '#34D399' },
    sort_order: 21, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '22', name: 'تم بنفش شاهانه', name_en: 'Royal Purple',
    description: 'تم رنگی بنفش شاهانه',
    type: 'theme', price_coins: 600, image_url: '💜', preview_url: null,
    required_level: 5, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'rare', theme_config: { primary: '#8B5CF6', secondary: '#6D28D9', accent: '#A78BFA' },
    sort_order: 22, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '23', name: 'تم طلایی درخشان', name_en: 'Shining Gold',
    description: 'تم رنگی طلایی لوکس و درخشان',
    type: 'theme', price_coins: 1200, image_url: '💛', preview_url: null,
    required_level: 15, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: true, rarity: 'legendary', theme_config: { primary: '#F59E0B', secondary: '#B45309', accent: '#FCD34D' },
    sort_order: 23, created_at: '', updated_at: '', is_purchased: false, can_purchase: false,
    purchase_blocked_reason: 'نیاز به سطح 15'
  },

  // نشان‌ها
  {
    id: '30', name: 'نشان ستاره', name_en: 'Star Badge',
    description: 'نشان ستاره برای شروع',
    type: 'badge', price_coins: 150, image_url: '⭐', preview_url: null,
    required_level: 1, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'common', theme_config: null,
    sort_order: 30, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '31', name: 'نشان کتاب', name_en: 'Book Badge',
    description: 'نشان عاشق کتاب و مطالعه',
    type: 'badge', price_coins: 250, image_url: '📚', preview_url: null,
    required_level: 3, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'rare', theme_config: null,
    sort_order: 31, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '32', name: 'نشان قهرمان', name_en: 'Champion Badge',
    description: 'نشان قهرمان تلاشگر',
    type: 'badge', price_coins: 500, image_url: '🏆', preview_url: null,
    required_level: 8, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'epic', theme_config: null,
    sort_order: 32, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '33', name: 'نشان تاج', name_en: 'Crown Badge',
    description: 'نشان پادشاه دانش',
    type: 'badge', price_coins: 1500, image_url: '👑', preview_url: null,
    required_level: 15, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: true, rarity: 'legendary', theme_config: null,
    sort_order: 33, created_at: '', updated_at: '', is_purchased: false, can_purchase: false,
    purchase_blocked_reason: 'نیاز به سطح 15'
  },

  // قدرت‌ها
  {
    id: '40', name: 'دو برابر XP', name_en: '2x XP Boost',
    description: 'دو برابر امتیاز به مدت ۲۴ ساعت',
    type: 'power_up', price_coins: 500, image_url: '⚡', preview_url: null,
    required_level: 1, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: true, rarity: 'rare', theme_config: null,
    sort_order: 40, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '41', name: 'محافظ Streak', name_en: 'Streak Shield',
    description: 'نجات یک روز از شکست Streak',
    type: 'power_up', price_coins: 300, image_url: '🛡️', preview_url: null,
    required_level: 1, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'rare', theme_config: null,
    sort_order: 41, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },
  {
    id: '42', name: 'جعبه تصادفی', name_en: 'Mystery Box',
    description: 'جعبه تصادفی با جایزه غافلگیرکننده!',
    type: 'power_up', price_coins: 200, image_url: '🎁', preview_url: null,
    required_level: 1, is_limited: false, limited_quantity: null, available_until: null,
    is_active: true, is_featured: false, rarity: 'common', theme_config: null,
    sort_order: 42, created_at: '', updated_at: '', is_purchased: false, can_purchase: true
  },

  // آیتم محدود
  {
    id: '100', name: 'اژدهای یخی', name_en: 'Ice Dragon',
    description: 'آواتار اژدهای یخی - محدود و نادر!',
    type: 'avatar', price_coins: 1500, image_url: '🐲', preview_url: null,
    required_level: 10, is_limited: true, limited_quantity: 50, available_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true, is_featured: true, rarity: 'legendary', theme_config: null,
    sort_order: 100, created_at: '', updated_at: '', is_purchased: false, can_purchase: false,
    sold_count: 45, remaining_quantity: 5, purchase_blocked_reason: 'نیاز به سطح 10'
  },
]

export default function ShopPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserTalentInfo>(SAMPLE_USER)
  const [items, setItems] = useState<ShopItem[]>([])
  const [featuredIndex, setFeaturedIndex] = useState(0)
  
  // فیلترها
  const [activeTab, setActiveTab] = useState<ShopItemType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | 'all'>('all')
  const [sortBy, setSortBy] = useState<string>('default')
  const [onlyAffordable, setOnlyAffordable] = useState(false)
  
  // دیالوگ‌ها
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)

  // بارگذاری داده‌ها
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      // شبیه‌سازی API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setItems(SAMPLE_ITEMS)
      setIsLoading(false)
    }
    loadData()
  }, [])

  // آیتم‌های ویژه
  const featuredItems = useMemo(() => 
    items.filter(item => item.is_featured),
    [items]
  )

  // اسلایدر خودکار
  useEffect(() => {
    if (featuredItems.length <= 1) return
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % featuredItems.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [featuredItems.length])

  // فیلتر کردن آیتم‌ها
  const filteredItems = useMemo(() => {
    let result = [...items]

    // فیلتر نوع
    if (activeTab !== 'all') {
      result = result.filter(item => item.type === activeTab)
    }

    // فیلتر جستجو
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.name_en.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    }

    // فیلتر نادری
    if (rarityFilter !== 'all') {
      result = result.filter(item => item.rarity === rarityFilter)
    }

    // فیلتر قابل خرید
    if (onlyAffordable) {
      result = result.filter(item => 
        item.price_coins <= user.coins && 
        !item.is_purchased &&
        item.required_level <= user.level
      )
    }

    // مرتب‌سازی
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price_coins - b.price_coins)
        break
      case 'price_desc':
        result.sort((a, b) => b.price_coins - a.price_coins)
        break
      case 'rarity':
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
        result.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
        break
      default:
        result.sort((a, b) => a.sort_order - b.sort_order)
    }

    return result
  }, [items, activeTab, searchQuery, rarityFilter, sortBy, onlyAffordable, user])

  // خرید آیتم
  const handlePurchase = async () => {
    if (!selectedItem) return
    
    setIsPurchasing(true)
    // شبیه‌سازی API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // بروزرسانی موجودی
    setUser(prev => ({
      ...prev,
      coins: prev.coins - selectedItem.price_coins
    }))
    
    // بروزرسانی آیتم
    setItems(prev => prev.map(item => 
      item.id === selectedItem.id 
        ? { ...item, is_purchased: true, can_purchase: false }
        : item
    ))
    
    setIsPurchasing(false)
    setShowPurchaseDialog(false)
    
    // نمایش پیام موفقیت
    if (selectedItem.rarity === 'legendary') {
      // کانفتی برای آیتم‌های افسانه‌ای
      toast.success('🎉 تبریک! آیتم افسانه‌ای خریداری شد!', {
        description: `${selectedItem.name} به مجموعه شما اضافه شد.`,
        duration: 5000,
      })
    } else {
      toast.success('خرید موفق!', {
        description: `${selectedItem.name} به مجموعه شما اضافه شد.`,
      })
    }
  }

  // رندر کارت آیتم
  const renderItemCard = (item: ShopItem) => {
    const rarityConfig = RARITY_CONFIG[item.rarity]
    const typeConfig = ITEM_TYPE_CONFIG[item.type]
    const canAfford = user.coins >= item.price_coins
    const meetsLevel = user.level >= item.required_level

    return (
      <Card 
        key={item.id}
        className={`
          relative overflow-hidden transition-all duration-300
          hover:shadow-lg hover:-translate-y-1
          ${rarityConfig.borderColor} border-2
          ${item.rarity === 'legendary' ? 'animate-pulse-slow' : ''}
        `}
      >
        {/* نشان نادری */}
        <div className={`absolute top-2 right-2 z-10`}>
          <Badge className={`${rarityConfig.bgColor} ${rarityConfig.textColor} border ${rarityConfig.borderColor}`}>
            {RARITY_ICONS[item.rarity]} {rarityConfig.label}
          </Badge>
        </div>

        {/* نشان محدود */}
        {item.is_limited && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="destructive" className="animate-pulse">
              <Flame className="h-3 w-3 ml-1" />
              محدود!
            </Badge>
          </div>
        )}

        {/* نشان خریداری شده */}
        {item.is_purchased && (
          <div className="absolute inset-0 bg-green-500/10 z-10 flex items-center justify-center">
            <Badge className="bg-green-500 text-white text-lg px-4 py-2">
              <Check className="h-5 w-5 ml-2" />
              خریداری شده
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-2">
          <div className={`
            text-6xl mb-2 mx-auto
            ${item.rarity === 'legendary' ? 'animate-bounce-slow' : ''}
          `}>
            {item.image_url}
          </div>
          <h3 className="font-bold text-lg">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.name_en}</p>
        </CardHeader>

        <CardContent className="text-center space-y-2 pb-2">
          <Badge variant="outline">
            {typeConfig.icon} {typeConfig.label}
          </Badge>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>

          {/* محدودیت‌ها */}
          {item.is_limited && item.remaining_quantity !== undefined && (
            <div className="flex items-center justify-center gap-1 text-orange-500 text-sm">
              <Package className="h-4 w-4" />
              فقط {item.remaining_quantity} عدد باقی‌مانده!
            </div>
          )}

          {item.available_until && !isExpired(item.available_until) && (
            <div className="flex items-center justify-center gap-1 text-purple-500 text-sm">
              <Clock className="h-4 w-4" />
              {formatTimeRemaining(item.available_until)} باقی‌مانده
            </div>
          )}

          {!meetsLevel && (
            <div className="flex items-center justify-center gap-1 text-amber-500 text-sm">
              <Lock className="h-4 w-4" />
              نیاز به سطح {item.required_level}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {/* قیمت */}
          <div className={`
            flex items-center justify-center gap-1 text-lg font-bold
            ${canAfford ? 'text-amber-500' : 'text-red-500'}
          `}>
            <Coins className="h-5 w-5" />
            {formatPrice(item.price_coins)}
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedItem(item)
                setShowPreviewDialog(true)
              }}
            >
              <Eye className="h-4 w-4 ml-1" />
              پیش‌نمایش
            </Button>
            
            {item.is_purchased ? (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => router.push('/student/shop/my-items')}
              >
                <Check className="h-4 w-4 ml-1" />
                استفاده
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1"
                disabled={!canAfford || !meetsLevel}
                onClick={() => {
                  setSelectedItem(item)
                  setShowPurchaseDialog(true)
                }}
              >
                <ShoppingCart className="h-4 w-4 ml-1" />
                خرید
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            فروشگاه
          </h1>
          <p className="text-muted-foreground mt-1">
            آیتم‌های جذاب را با سکه‌هایت بخر!
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* موجودی */}
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200">
            <CardContent className="flex items-center gap-2 p-3">
              <div className="bg-amber-100 dark:bg-amber-800 rounded-full p-2">
                <Coins className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">موجودی</p>
                <p className="text-xl font-bold text-amber-600">{formatPrice(user.coins)}</p>
              </div>
            </CardContent>
          </Card>

          {/* سطح */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
            <CardContent className="flex items-center gap-2 p-3">
              <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-2">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">سطح</p>
                <p className="text-xl font-bold text-blue-600">{user.level}</p>
              </div>
            </CardContent>
          </Card>

          {/* دکمه آیتم‌های من */}
          <Button onClick={() => router.push('/student/shop/my-items')}>
            <Gift className="h-4 w-4 ml-2" />
            آیتم‌های من
          </Button>
        </div>
      </div>

      {/* بنر ویژه */}
      {featuredItems.length > 0 && (
        <Card className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6" />
                <span className="text-xl font-bold">ویژه این هفته</span>
              </div>
              
              {/* ناوبری */}
              {featuredItems.length > 1 && (
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => setFeaturedIndex(prev => 
                      prev === 0 ? featuredItems.length - 1 : prev - 1
                    )}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => setFeaturedIndex(prev => 
                      (prev + 1) % featuredItems.length
                    )}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* آیتم ویژه */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-8xl animate-bounce-slow">
                {featuredItems[featuredIndex]?.image_url}
              </div>
              
              <div className="flex-1 text-center md:text-right">
                <h2 className="text-3xl font-bold mb-2">
                  {featuredItems[featuredIndex]?.name}
                </h2>
                <p className="text-white/80 mb-4">
                  {featuredItems[featuredIndex]?.description}
                </p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Badge className="bg-white/20 text-white text-lg px-4 py-1">
                    {RARITY_ICONS[featuredItems[featuredIndex]?.rarity || 'common']}
                    {' '}
                    {RARITY_CONFIG[featuredItems[featuredIndex]?.rarity || 'common'].label}
                  </Badge>
                  
                  <Badge className="bg-amber-400 text-amber-900 text-lg px-4 py-1">
                    <Coins className="h-4 w-4 ml-1" />
                    {formatPrice(featuredItems[featuredIndex]?.price_coins || 0)}
                  </Badge>

                  {featuredItems[featuredIndex]?.is_limited && (
                    <Badge className="bg-red-500 text-white text-lg px-4 py-1 animate-pulse">
                      <Flame className="h-4 w-4 ml-1" />
                      محدود!
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  size="lg" 
                  className="bg-white text-purple-600 hover:bg-white/90"
                  onClick={() => {
                    setSelectedItem(featuredItems[featuredIndex])
                    setShowPurchaseDialog(true)
                  }}
                  disabled={
                    featuredItems[featuredIndex]?.is_purchased ||
                    user.coins < (featuredItems[featuredIndex]?.price_coins || 0) ||
                    user.level < (featuredItems[featuredIndex]?.required_level || 1)
                  }
                >
                  <ShoppingCart className="h-5 w-5 ml-2" />
                  {featuredItems[featuredIndex]?.is_purchased ? 'خریداری شده' : 'خرید الان'}
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    setSelectedItem(featuredItems[featuredIndex])
                    setShowPreviewDialog(true)
                  }}
                >
                  <Eye className="h-4 w-4 ml-2" />
                  پیش‌نمایش
                </Button>
              </div>
            </div>

            {/* نشانگر اسلاید */}
            {featuredItems.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {featuredItems.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === featuredIndex ? 'bg-white w-6' : 'bg-white/50'
                    }`}
                    onClick={() => setFeaturedIndex(idx)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* تب‌ها و فیلترها */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ShopItemType | 'all')}>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all" className="gap-1">
              همه
              <Badge variant="secondary" className="mr-1 text-xs">
                {items.length}
              </Badge>
            </TabsTrigger>
            {Object.entries(ITEM_TYPE_CONFIG).map(([type, config]) => (
              <TabsTrigger key={type} value={type} className="gap-1">
                {config.icon} {config.label}
                <Badge variant="secondary" className="mr-1 text-xs">
                  {items.filter(i => i.type === type).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* فیلترها */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 w-48"
              />
            </div>

            <Select value={rarityFilter} onValueChange={(v) => setRarityFilter(v as ItemRarity | 'all')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="کمیابی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                  <SelectItem key={rarity} value={rarity}>
                    {RARITY_ICONS[rarity as ItemRarity]} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="مرتب‌سازی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">پیش‌فرض</SelectItem>
                <SelectItem value="price_asc">ارزان‌ترین</SelectItem>
                <SelectItem value="price_desc">گران‌ترین</SelectItem>
                <SelectItem value="rarity">کمیاب‌ترین</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="affordable"
                checked={onlyAffordable}
                onCheckedChange={setOnlyAffordable}
              />
              <Label htmlFor="affordable" className="text-sm cursor-pointer">
                قابل خرید برای من
              </Label>
            </div>
          </div>
        </div>

        {/* لیست آیتم‌ها */}
        <TabsContent value={activeTab} className="mt-6">
          {filteredItems.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">آیتمی یافت نشد</h3>
                <p className="text-muted-foreground">
                  فیلترها را تغییر دهید یا در دسته‌بندی دیگری جستجو کنید.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(renderItemCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* دیالوگ خرید */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              تأیید خرید
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* تصویر و نام */}
              <div className="text-center">
                <div className={`
                  text-7xl mb-3
                  ${selectedItem.rarity === 'legendary' ? 'animate-bounce-slow' : ''}
                `}>
                  {selectedItem.image_url}
                </div>
                <h3 className="text-xl font-bold">{selectedItem.name}</h3>
                <Badge className={`${RARITY_CONFIG[selectedItem.rarity].bgColor} ${RARITY_CONFIG[selectedItem.rarity].textColor} mt-2`}>
                  {RARITY_ICONS[selectedItem.rarity]} {RARITY_CONFIG[selectedItem.rarity].label}
                </Badge>
              </div>

              {/* توضیحات */}
              <p className="text-center text-muted-foreground">
                {selectedItem.description}
              </p>

              <Separator />

              {/* اطلاعات مالی */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">قیمت:</span>
                  <span className="font-bold flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-500" />
                    {formatPrice(selectedItem.price_coins)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">موجودی شما:</span>
                  <span className={`font-bold ${user.coins >= selectedItem.price_coins ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPrice(user.coins)} سکه
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">پس از خرید:</span>
                  <span className={`font-bold ${user.coins >= selectedItem.price_coins ? 'text-blue-500' : 'text-red-500'}`}>
                    {user.coins >= selectedItem.price_coins 
                      ? `${formatPrice(user.coins - selectedItem.price_coins)} سکه`
                      : `کمبود ${formatPrice(selectedItem.price_coins - user.coins)} سکه`
                    }
                  </span>
                </div>
              </div>

              {/* هشدار کمبود سکه */}
              {user.coins < selectedItem.price_coins && (
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                  <CardContent className="p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-400">سکه کافی ندارید!</p>
                      <p className="text-amber-600 dark:text-amber-500">
                        با انجام فعالیت‌ها و چالش‌ها می‌توانید سکه بیشتری کسب کنید.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* هشدار سطح */}
              {user.level < selectedItem.required_level && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <CardContent className="p-3 flex items-start gap-2">
                    <Lock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-700 dark:text-blue-400">
                        نیاز به سطح {selectedItem.required_level}
                      </p>
                      <p className="text-blue-600 dark:text-blue-500">
                        سطح فعلی شما: {user.level}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPurchaseDialog(false)}
            >
              انصراف
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={
                isPurchasing || 
                !selectedItem ||
                user.coins < (selectedItem?.price_coins || 0) ||
                user.level < (selectedItem?.required_level || 1)
              }
            >
              {isPurchasing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2" />
                  در حال خرید...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 ml-2" />
                  تأیید و خرید
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ پیش‌نمایش */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              پیش‌نمایش: {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* تصویر بزرگ */}
              <div className={`
                text-center py-8 rounded-xl
                ${RARITY_CONFIG[selectedItem.rarity].bgColor}
                ${selectedItem.rarity === 'legendary' ? 'animate-pulse-slow' : ''}
              `}>
                <div className="text-9xl">
                  {selectedItem.image_url}
                </div>
              </div>

              {/* اطلاعات */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">نوع:</span>
                  <Badge variant="outline">
                    {ITEM_TYPE_CONFIG[selectedItem.type].icon}
                    {' '}
                    {ITEM_TYPE_CONFIG[selectedItem.type].label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">کمیابی:</span>
                  <Badge className={`${RARITY_CONFIG[selectedItem.rarity].bgColor} ${RARITY_CONFIG[selectedItem.rarity].textColor}`}>
                    {RARITY_ICONS[selectedItem.rarity]}
                    {' '}
                    {RARITY_CONFIG[selectedItem.rarity].label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">قیمت:</span>
                  <span className="font-bold flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-500" />
                    {formatPrice(selectedItem.price_coins)}
                  </span>
                </div>
                {selectedItem.required_level > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">سطح مورد نیاز:</span>
                    <span className="font-bold">{selectedItem.required_level}</span>
                  </div>
                )}
              </div>

              <Separator />

              <p className="text-muted-foreground text-center">
                {selectedItem.description}
              </p>

              {/* پیش‌نمایش تم */}
              {selectedItem.type === 'theme' && selectedItem.theme_config && (
                <div className="space-y-2">
                  <p className="font-medium">رنگ‌های تم:</p>
                  <div className="flex gap-2 justify-center">
                    <div 
                      className="w-12 h-12 rounded-lg border"
                      style={{ backgroundColor: selectedItem.theme_config.primary }}
                      title="رنگ اصلی"
                    />
                    <div 
                      className="w-12 h-12 rounded-lg border"
                      style={{ backgroundColor: selectedItem.theme_config.secondary }}
                      title="رنگ ثانویه"
                    />
                    <div 
                      className="w-12 h-12 rounded-lg border"
                      style={{ backgroundColor: selectedItem.theme_config.accent }}
                      title="رنگ تأکیدی"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPreviewDialog(false)}
            >
              بستن
            </Button>
            {selectedItem && !selectedItem.is_purchased && (
              <Button
                onClick={() => {
                  setShowPreviewDialog(false)
                  setShowPurchaseDialog(true)
                }}
                disabled={
                  user.coins < selectedItem.price_coins ||
                  user.level < selectedItem.required_level
                }
              >
                <ShoppingCart className="h-4 w-4 ml-2" />
                خرید الان
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* استایل‌های انیمیشن */}
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
