'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Gift, 
  ArrowRight,
  Check,
  Clock,
  Sparkles,
  User,
  Image as ImageIcon,
  Palette,
  Award,
  Zap,
  Calendar,
  Coins,
  CheckCircle2,
  CircleDot,
  History,
  ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { PageSkeletonCards } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  ShopItem,
  ShopItemType,
  UserPurchase,
  CoinTransaction,
  ITEM_TYPE_CONFIG,
  RARITY_CONFIG,
  RARITY_ICONS,
  formatPrice,
  formatTimeRemaining,
  isExpired,
} from '@/lib/types/shop.types'

export default function MyItemsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [purchases, setPurchases] = useState<(UserPurchase & { item: ShopItem })[]>([])
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const [isEquipping, setIsEquipping] = useState<string | null>(null)

  // بارگذاری داده‌ها
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [itemsRes, txRes] = await Promise.all([
          fetch('/api/shop/my-items'),
          fetch('/api/shop/transactions'),
        ])
        const itemsJson = await itemsRes.json()
        const txJson = await txRes.json()
        if (!itemsRes.ok || itemsJson.success === false) {
          throw new Error(itemsJson.error || 'دریافت آیتم‌ها ناموفق بود')
        }
        setPurchases(itemsJson.data?.purchases || [])
        setTransactions(txJson.data?.transactions || [])
      } catch {
        setPurchases([])
        setTransactions([])
        toast.error('آیتم‌های خریداری‌شده دریافت نشد')
      } finally {
        setIsLoading(false)
      }
    }
    void loadData()
  }, [])

  // گروه‌بندی آیتم‌ها
  const groupedItems = useMemo(() => {
    const equipped = purchases.filter(p => p.is_equipped)
    const byType: Record<ShopItemType, (UserPurchase & { item: ShopItem })[]> = {
      avatar: [],
      background: [],
      theme: [],
      badge: [],
      power_up: [],
    }
    
    purchases.forEach(p => {
      byType[p.item.type].push(p)
    })

    return { equipped, byType }
  }, [purchases])

  // فیلتر آیتم‌ها بر اساس تب
  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return purchases
    if (activeTab === 'equipped') return groupedItems.equipped
    return groupedItems.byType[activeTab as ShopItemType] || []
  }, [purchases, activeTab, groupedItems])

  // تجهیز/غیرفعال کردن آیتم
  const handleEquip = async (purchase: UserPurchase & { item: ShopItem }) => {
    if (purchase.item.type === 'power_up') {
      toast.error('این نوع آیتم قابل تجهیز نیست')
      return
    }

    setIsEquipping(purchase.id)
    try {
      const res = await fetch('/api/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase_id: purchase.id,
          action: purchase.is_equipped ? 'unequip' : 'equip',
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        toast.error(data.error || 'تغییر وضعیت آیتم ناموفق بود')
        return
      }
      const itemsRes = await fetch('/api/shop/my-items')
      const itemsJson = await itemsRes.json()
      setPurchases(itemsJson.data?.purchases || [])
      toast.success(purchase.is_equipped ? 'آیتم غیرفعال شد' : 'آیتم فعال شد')
    } catch {
      toast.error('تغییر وضعیت آیتم ناموفق بود')
    } finally {
      setIsEquipping(null)
    }
  }

  // آیکون نوع آیتم
  const getTypeIcon = (type: ShopItemType) => {
    switch (type) {
      case 'avatar': return <User className="h-4 w-4" />
      case 'background': return <ImageIcon className="h-4 w-4" />
      case 'theme': return <Palette className="h-4 w-4" />
      case 'badge': return <Award className="h-4 w-4" />
      case 'power_up': return <Zap className="h-4 w-4" />
    }
  }

  // فرمت تاریخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6" dir="rtl">
        <PageSkeletonCards count={4} />
      </div>
    )
  }

  return (
    <DashboardPage
      className="container mx-auto p-4 sm:p-6"
      title={
        <span className="flex items-center gap-2">
          <Gift className="h-8 w-8 text-primary" />
          آیتم‌های من
        </span>
      }
      description="آیتم‌هایی که خریداری کرده‌اید را مدیریت کنید"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/shop">
              <ArrowRight className="h-4 w-4 ml-1" />
              بازگشت به فروشگاه
            </Link>
          </Button>
          <Button onClick={() => router.push('/student/shop')}>
            <ShoppingCart className="h-4 w-4 ml-2" />
            خرید آیتم جدید
          </Button>
        </div>
      }
    >
      <DashboardSectionBlock>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
              <Gift className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">کل آیتم‌ها</p>
              <p className="text-2xl font-bold">{purchases.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">فعال</p>
              <p className="text-2xl font-bold">{groupedItems.equipped.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-2">
              <Coins className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مجموع خرج شده</p>
              <p className="text-2xl font-bold">
                {formatPrice(purchases.reduce((sum, p) => sum + p.price_paid, 0))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-[var(--lux-primary)]/15 dark:bg-blue-900/30 rounded-full p-2">
              <Zap className="h-5 w-5 text-[var(--lux-primary)]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قدرت‌های فعال</p>
              <p className="text-2xl font-bold">
                {purchases.filter(p => 
                  p.item.type === 'power_up' && 
                  p.expires_at && 
                  !isExpired(p.expires_at)
                ).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </DashboardSectionBlock>

      {groupedItems.equipped.length > 0 && (
        <DashboardSectionBlock>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Sparkles className="h-5 w-5" />
              در حال استفاده
            </CardTitle>
            <CardDescription>آیتم‌هایی که الان روی پروفایل شما نمایش داده می‌شوند</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {groupedItems.equipped.map(purchase => (
                <div 
                  key={purchase.id}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
                >
                  <div className="text-4xl">{purchase.item.image_url}</div>
                  <div>
                    <p className="font-medium">{purchase.item.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {ITEM_TYPE_CONFIG[purchase.item.type].icon}
                      {' '}
                      {ITEM_TYPE_CONFIG[purchase.item.type].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </DashboardSectionBlock>
      )}

      <DashboardSectionBlock>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all" className="gap-1">
            همه
            <Badge variant="secondary" className="mr-1 text-xs">
              {purchases.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="equipped" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            فعال
            <Badge variant="secondary" className="mr-1 text-xs">
              {groupedItems.equipped.length}
            </Badge>
          </TabsTrigger>
          {Object.entries(ITEM_TYPE_CONFIG).map(([type, config]) => {
            const count = groupedItems.byType[type as ShopItemType].length
            if (count === 0) return null
            return (
              <TabsTrigger key={type} value={type} className="gap-1">
                {config.icon} {config.label}
                <Badge variant="secondary" className="mr-1 text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredItems.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">هنوز آیتمی ندارید!</h3>
                <p className="text-muted-foreground mb-4">
                  به فروشگاه بروید و اولین آیتم خود را بخرید.
                </p>
                <Button onClick={() => router.push('/student/shop')}>
                  <ShoppingCart className="h-4 w-4 ml-2" />
                  رفتن به فروشگاه
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(purchase => {
                const rarityConfig = RARITY_CONFIG[purchase.item.rarity]
                const isPowerUp = purchase.item.type === 'power_up'
                const isExpiredPowerUp = isPowerUp && purchase.expires_at && isExpired(purchase.expires_at)
                
                return (
                  <Card 
                    key={purchase.id}
                    className={`
                      relative overflow-hidden transition-all
                      ${purchase.is_equipped ? 'ring-2 ring-green-500' : ''}
                      ${rarityConfig.borderColor} border-2
                      ${isExpiredPowerUp ? 'opacity-50' : ''}
                    `}
                  >
                    {/* نشان فعال */}
                    {purchase.is_equipped && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          فعال
                        </Badge>
                      </div>
                    )}

                    {/* نشان نادری */}
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className={`${rarityConfig.bgColor} ${rarityConfig.textColor}`}>
                        {RARITY_ICONS[purchase.item.rarity]}
                      </Badge>
                    </div>

                    <CardContent className="pt-10 text-center">
                      <div className="text-5xl mb-3">{purchase.item.image_url}</div>
                      <h3 className="font-bold">{purchase.item.name}</h3>
                      
                      <Badge variant="outline" className="mt-2">
                        {ITEM_TYPE_CONFIG[purchase.item.type].icon}
                        {' '}
                        {ITEM_TYPE_CONFIG[purchase.item.type].label}
                      </Badge>

                      {/* زمان انقضا برای power_up */}
                      {isPowerUp && purchase.expires_at && (
                        <div className={`mt-3 text-sm ${isExpiredPowerUp ? 'text-red-500' : 'text-orange-500'}`}>
                          {isExpiredPowerUp ? (
                            <span className="flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4" />
                              منقضی شده
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTimeRemaining(purchase.expires_at)} باقی‌مانده
                            </span>
                          )}
                        </div>
                      )}

                      {/* تاریخ خرید */}
                      <p className="text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3 inline ml-1" />
                        {formatDate(purchase.purchased_at)}
                      </p>

                      {/* دکمه */}
                      {!isPowerUp && (
                        <Button
                          className="mt-4 w-full"
                          variant={purchase.is_equipped ? 'outline' : 'default'}
                          disabled={isEquipping === purchase.id}
                          onClick={() => handleEquip(purchase)}
                        >
                          {isEquipping === purchase.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent ml-2" />
                          ) : purchase.is_equipped ? (
                            <>
                              <CircleDot className="h-4 w-4 ml-2" />
                              غیرفعال کردن
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 ml-2" />
                              فعال کردن
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            تاریخچه تراکنش‌های سکه
          </CardTitle>
          <CardDescription>تمام دریافت‌ها و خرج‌های سکه شما</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">تاریخ</TableHead>
                <TableHead className="text-right">توضیحات</TableHead>
                <TableHead className="text-right">نوع</TableHead>
                <TableHead className="text-right">مقدار</TableHead>
                <TableHead className="text-right">موجودی</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(tx.created_at)}
                  </TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === 'spend' ? 'destructive' : 'default'}>
                      {tx.type === 'earn' && '🎁 دریافت'}
                      {tx.type === 'spend' && '🛒 خرید'}
                      {tx.type === 'bonus' && '⭐ پاداش'}
                      {tx.type === 'refund' && '↩️ برگشت'}
                    </Badge>
                  </TableCell>
                  <TableCell className={tx.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                    {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(tx.balance_after)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}












































