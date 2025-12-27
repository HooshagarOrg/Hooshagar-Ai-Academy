'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Key, 
  Database, 
  BarChart3, 
  Save,
  RefreshCw,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface GeminiKey {
  id: string
  key_name: string
  api_key: string
  daily_count: number
  daily_limit: number
  monthly_count: number
  is_active: boolean
}

interface AIConfig {
  id: string
  capability_key: string
  capability_name: string
  tier5_enabled: boolean
  tier6_enabled: boolean
  total_requests: number
  cache_hits: number
}

interface SystemStats {
  totalRequests: number
  totalCacheHits: number
  cacheRate: string
  totalTokensSaved: string
  cacheSize: number
  geminiKeysActive: number
  geminiDailyUsage: number
  geminiDailyLimit: number
  geminiRemaining: number
}

export default function AISettingsPage() {
  const [geminiKeys, setGeminiKeys] = useState<GeminiKey[]>([])
  const [aiConfigs, setAIConfigs] = useState<AIConfig[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyValue, setNewKeyValue] = useState('')

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // TODO: ایجاد API routes برای دریافت داده‌ها
      toast.info('در حال بارگذاری...')
    } catch (error) {
      toast.error('خطا در بارگذاری داده‌ها')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddKey = async () => {
    if (!newKeyName || !newKeyValue) {
      toast.error('لطفاً نام و کلید را وارد کنید')
      return
    }

    // TODO: API call
    toast.success(`کلید ${newKeyName} اضافه شد`)
    setNewKeyName('')
    setNewKeyValue('')
  }

  const handleToggleKey = async (keyId: string, active: boolean) => {
    // TODO: API call
    toast.success(active ? 'کلید فعال شد' : 'کلید غیرفعال شد')
  }

  const handleToggleTier = async (configId: string, tier: 5 | 6, enabled: boolean) => {
    // TODO: API call
    toast.success(`Tier ${tier} ${enabled ? 'فعال' : 'غیرفعال'} شد`)
  }

  const handleClearCache = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید کل Cache را پاک کنید؟')) {
      return
    }
    // TODO: API call
    toast.success('Cache پاک شد')
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          تنظیمات سیستم AI
        </h1>
        <p className="text-muted-foreground">
          مدیریت کلیدها، لایه‌ها و کش سیستم هوش مصنوعی
        </p>
      </div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="stats">
            <BarChart3 className="w-4 h-4 ml-2" />
            آمار
          </TabsTrigger>
          <TabsTrigger value="keys">
            <Key className="w-4 h-4 ml-2" />
            کلیدهای Gemini
          </TabsTrigger>
          <TabsTrigger value="tiers">
            <Settings className="w-4 h-4 ml-2" />
            لایه‌های پولی
          </TabsTrigger>
          <TabsTrigger value="cache">
            <Database className="w-4 h-4 ml-2" />
            مدیریت Cache
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: آمار */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  کل درخواست‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12,547</div>
                <p className="text-xs text-muted-foreground mt-1">
                  از ابتدای راه‌اندازی
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  نرخ Cache Hit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">73.2%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  صرفه‌جویی عالی!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Token صرفه‌جویی شده
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">8.2M</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ $16.40 saved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gemini Usage */}
          <Card>
            <CardHeader>
              <CardTitle>استفاده از کلیدهای Gemini</CardTitle>
              <CardDescription>
                وضعیت استفاده روزانه از 10 کلید Gemini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">استفاده امروز</span>
                    <span className="text-sm font-medium">4,230 / 15,000</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: '28.2%' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    10,770 درخواست باقی‌مانده (71.8%)
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Key {i + 1}
                      </div>
                      <div className="text-sm font-medium">
                        {Math.floor(Math.random() * 600)}/1500
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Usage */}
          <Card>
            <CardHeader>
              <CardTitle>استفاده از لایه‌ها</CardTitle>
              <CardDescription>
                توزیع درخواست‌ها بین 6 لایه
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm">Tier 1 🟢</div>
                  <div className="flex-1 bg-muted rounded-full h-6">
                    <div className="bg-green-500 h-6 rounded-full flex items-center justify-end px-2 text-xs text-white" style={{ width: '58%' }}>
                      58%
                    </div>
                  </div>
                  <div className="w-20 text-sm text-right">7,277</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm">Tier 2 🟢</div>
                  <div className="flex-1 bg-muted rounded-full h-6">
                    <div className="bg-green-400 h-6 rounded-full flex items-center justify-end px-2 text-xs text-white" style={{ width: '25%' }}>
                      25%
                    </div>
                  </div>
                  <div className="w-20 text-sm text-right">3,137</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm">Tier 3 🟢</div>
                  <div className="flex-1 bg-muted rounded-full h-6">
                    <div className="bg-blue-500 h-6 rounded-full flex items-center justify-end px-2 text-xs text-white" style={{ width: '12%' }}>
                      12%
                    </div>
                  </div>
                  <div className="w-20 text-sm text-right">1,506</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm">Tier 4 🟢</div>
                  <div className="flex-1 bg-muted rounded-full h-6">
                    <div className="bg-blue-400 h-6 rounded-full flex items-center justify-end px-2 text-xs text-white" style={{ width: '4%' }}>
                      4%
                    </div>
                  </div>
                  <div className="w-20 text-sm text-right">502</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm">Tier 5 🟡</div>
                  <div className="flex-1 bg-muted rounded-full h-6">
                    <div className="bg-yellow-500 h-6 rounded-full flex items-center justify-end px-2 text-xs text-white" style={{ width: '1%' }}>
                      1%
                    </div>
                  </div>
                  <div className="w-20 text-sm text-right">125</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm">Tier 6 🔴</div>
                  <div className="flex-1 bg-muted rounded-full h-6">
                    <div className="bg-red-500 h-6 rounded-full flex items-center justify-end px-2 text-xs text-white" style={{ width: '0%' }}>
                      0%
                    </div>
                  </div>
                  <div className="w-20 text-sm text-right">0</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: کلیدهای Gemini */}
        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>افزودن کلید جدید</CardTitle>
              <CardDescription>
                کلیدهای Gemini را از Google AI Studio دریافت کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نام کلید</Label>
                  <Input
                    placeholder="gemini_key_11"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="AIza..."
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddKey} className="w-full md:w-auto">
                <Plus className="w-4 h-4 ml-2" />
                افزودن کلید
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>کلیدهای فعلی (10 کلید)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>استفاده روزانه</TableHead>
                    <TableHead>استفاده ماهانه</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 10 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        gemini_key_{i + 1}
                      </TableCell>
                      <TableCell>
                        {Math.floor(Math.random() * 600)} / 1500
                      </TableCell>
                      <TableCell>
                        {Math.floor(Math.random() * 15000)} / 50000
                      </TableCell>
                      <TableCell>
                        <Badge variant={i < 9 ? "default" : "secondary"}>
                          {i < 9 ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleKey(`key${i}`, i >= 9)}
                          >
                            {i < 9 ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirm('حذف کلید؟')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: لایه‌های پولی */}
        <TabsContent value="tiers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>فعال/غیرفعال کردن لایه‌های پولی</CardTitle>
              <CardDescription>
                Tier 5 (ارزان) و Tier 6 (گران) به صورت پیش‌فرض غیرفعال هستند
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Tier 5 */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        🟡 Tier 5: Cheap Models
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        هزینه: ~$0.001 - $0.01 per 1K tokens
                      </p>
                    </div>
                    <Switch 
                      checked={false}
                      onCheckedChange={(checked) => {}}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• فقط زمانی استفاده می‌شود که Tier 1-4 fail شوند</p>
                    <p>• مناسب برای زمان‌های اوج مصرف</p>
                    <p>• کیفیت خوب با هزینه پایین</p>
                  </div>
                </div>

                {/* Tier 6 */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        🔴 Tier 6: Premium Models
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        هزینه: ~$0.05 - $0.15+ per 1K tokens
                      </p>
                    </div>
                    <Switch 
                      checked={false}
                      onCheckedChange={(checked) => {}}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• آخرین راه حل (اگر همه fail شدند)</p>
                    <p>• بالاترین کیفیت ممکن</p>
                    <p>• توصیه می‌شود فقط برای موارد حیاتی فعال شود</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* جدول هزینه‌ها */}
          <Card>
            <CardHeader>
              <CardTitle>جدول هزینه مدل‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>نمونه مدل</TableHead>
                    <TableHead>قیمت (Input)</TableHead>
                    <TableHead>قیمت (Output)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1-4</TableCell>
                    <TableCell>Gemini, OpenRouter Free</TableCell>
                    <TableCell className="text-green-600 font-medium">رایگان</TableCell>
                    <TableCell className="text-green-600 font-medium">رایگان</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>5</TableCell>
                    <TableCell>GPT-4o-mini, Claude Haiku</TableCell>
                    <TableCell>$0.15/1M</TableCell>
                    <TableCell>$0.60/1M</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>6</TableCell>
                    <TableCell>GPT-4o, Claude Sonnet</TableCell>
                    <TableCell>$2.50/1M</TableCell>
                    <TableCell>$10/1M</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: مدیریت Cache */}
        <TabsContent value="cache" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>وضعیت Cache</CardTitle>
              <CardDescription>
                مدیریت و بهینه‌سازی cache پاسخ‌های AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">تعداد کل</div>
                  <div className="text-2xl font-bold">8,547</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Cache Hits</div>
                  <div className="text-2xl font-bold text-green-600">9,187</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">نرخ Hit</div>
                  <div className="text-2xl font-bold text-blue-600">73.2%</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={loadData}>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  بروزرسانی
                </Button>
                <Button variant="destructive" onClick={handleClearCache}>
                  <Trash2 className="w-4 h-4 ml-2" />
                  پاک کردن همه Cache
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p><strong>نکته:</strong> Cache به صورت خودکار بعد از 30 روز منقضی می‌شود</p>
                <p>• پاسخ‌های تکراری بدون فراخوانی AI برگردانده می‌شوند</p>
                <p>• صرفه‌جویی 70%+ در هزینه و زمان</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

