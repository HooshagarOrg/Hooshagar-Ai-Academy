'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Zap,
  Star,
  Eye,
  EyeOff,
  Edit2,
  Save,
  RotateCcw,
  FlaskConical,
  GitCompare,
  History,
  Sliders,
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
  Play,
  RefreshCw,
  ExternalLink,
  Copy,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
import {
  AVAILABLE_MODELS,
  DEFAULT_FEATURE_CONFIGS,
  getModelInfo,
  formatCost,
  renderRating,
  renderSpeed,
  estimateCost,
  type AvailableModel,
  type AIModelConfig,
  type ModelTestResult,
} from '@/lib/ai-model-manager'

// ============================================
// تایپ‌ها
// ============================================

interface FeatureConfig {
  featureName: string
  featureLabel: string
  featureIcon: string
  featureDescription?: string
  primaryProvider: string
  primaryModel: string
  fallbackProvider?: string
  fallbackModel?: string
  temperature: number
  maxTokens: number
  topP: number
  enableFallback: boolean
  isEnabled: boolean
  stats: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    fallbackUsedCount: number
    avgResponseTimeMs: number
    totalCostThisMonth: number
  }
}

interface ChangeHistory {
  id: string
  featureName: string
  featureLabel: string
  oldProvider?: string
  oldModel?: string
  newProvider: string
  newModel: string
  changeType: string
  reason?: string
  changedBy: string
  createdAt: string
}

// ============================================
// داده‌های نمونه
// ============================================

const SAMPLE_CONFIGS: FeatureConfig[] = Object.entries(DEFAULT_FEATURE_CONFIGS).map(
  ([name, config]) => ({
    featureName: name,
    featureLabel: config.featureLabel || name,
    featureIcon: config.featureIcon || '🤖',
    featureDescription: '',
    primaryProvider: config.primaryProvider || 'gemini',
    primaryModel: config.primaryModel || 'gemini-1.5-flash',
    fallbackProvider: config.fallbackProvider,
    fallbackModel: config.fallbackModel,
    temperature: config.temperature || 0.7,
    maxTokens: config.maxTokens || 1000,
    topP: 0.9,
    enableFallback: true,
    isEnabled: true,
    stats: {
      totalRequests: Math.floor(Math.random() * 5000),
      successfulRequests: Math.floor(Math.random() * 4900),
      failedRequests: Math.floor(Math.random() * 100),
      fallbackUsedCount: Math.floor(Math.random() * 50),
      avgResponseTimeMs: Math.floor(Math.random() * 2000) + 500,
      totalCostThisMonth: Math.random() * 5,
    },
  })
)

const SAMPLE_HISTORY: ChangeHistory[] = [
  {
    id: '1',
    featureName: 'story_wizard',
    featureLabel: 'تولید داستان',
    oldProvider: 'gemini',
    oldModel: 'gemini-1.5-flash',
    newProvider: 'gemini',
    newModel: 'gemini-2.0-flash-exp',
    changeType: 'primary',
    reason: 'ارتقا به نسخه جدید',
    changedBy: 'مدیر سیستم',
    createdAt: '1403/09/15 14:30',
  },
  {
    id: '2',
    featureName: 'ocr_solver',
    featureLabel: 'حل مسئله با OCR',
    oldProvider: 'openrouter',
    oldModel: 'openai/gpt-4-turbo',
    newProvider: 'gemini',
    newModel: 'gemini-2.0-flash-exp',
    changeType: 'primary',
    reason: 'کاهش هزینه',
    changedBy: 'مدیر سیستم',
    createdAt: '1403/09/10 09:15',
  },
  {
    id: '3',
    featureName: 'student_analyzer',
    featureLabel: 'تحلیل دانش‌آموز',
    oldProvider: 'openrouter',
    oldModel: 'anthropic/claude-3-haiku',
    newProvider: 'openrouter',
    newModel: 'anthropic/claude-3.5-sonnet',
    changeType: 'fallback',
    reason: 'افزایش کیفیت',
    changedBy: 'مدیر سیستم',
    createdAt: '1403/09/05 11:20',
  },
]

// ============================================
// کامپوننت اصلی
// ============================================

export default function AIModelsPage() {
  const [configs, setConfigs] = useState<FeatureConfig[]>(SAMPLE_CONFIGS)
  const [history] = useState<ChangeHistory[]>(SAMPLE_HISTORY)
  
  const [activeTab, setActiveTab] = useState('configs')
  const [searchQuery, setSearchQuery] = useState('')
  const [providerFilter, setProviderFilter] = useState<string>('all')
  
  const [selectedFeature, setSelectedFeature] = useState<FeatureConfig | null>(null)
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<'primary' | 'fallback'>('primary')
  
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testInput, setTestInput] = useState('')
  const [testResult, setTestResult] = useState<ModelTestResult | null>(null)
  const [compareResults, setCompareResults] = useState<ModelTestResult[]>([])
  const [selectedModelsForCompare, setSelectedModelsForCompare] = useState<string[]>([])

  // محاسبه هزینه کل
  const totalCostThisMonth = configs.reduce((sum, c) => sum + c.stats.totalCostThisMonth, 0)

  // فیلتر کردن
  const filteredConfigs = configs.filter(config => {
    if (searchQuery && !config.featureLabel.includes(searchQuery)) return false
    if (providerFilter !== 'all' && config.primaryProvider !== providerFilter) return false
    return true
  })

  // ذخیره تنظیمات
  const handleSaveConfig = async (config: FeatureConfig) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setConfigs(prev => prev.map(c => 
        c.featureName === config.featureName ? config : c
      ))
    } finally {
      setIsSaving(false)
    }
  }

  // تست مدل
  const handleTestModel = async () => {
    if (!selectedFeature || !testInput) return
    
    setIsTesting(true)
    setTestResult(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const modelInfo = getModelInfo(selectedFeature.primaryProvider, selectedFeature.primaryModel)
      
      setTestResult({
        provider: selectedFeature.primaryProvider,
        model: selectedFeature.primaryModel,
        success: true,
        output: `این یک پاسخ نمونه است برای تست مدل ${modelInfo?.modelName || selectedFeature.primaryModel}.\n\nورودی شما: "${testInput}"\n\nدر محیط واقعی، پاسخ کامل از مدل AI نمایش داده می‌شود.`,
        responseTimeMs: Math.floor(Math.random() * 2000) + 500,
        inputTokens: Math.floor(testInput.length / 4),
        outputTokens: Math.floor(Math.random() * 500) + 100,
        estimatedCost: modelInfo?.isFree ? 0 : Math.random() * 0.01,
        qualityScore: 4,
        relevanceScore: 5,
        creativityScore: 4,
      })
    } catch (error) {
      setTestResult({
        provider: selectedFeature.primaryProvider,
        model: selectedFeature.primaryModel,
        success: false,
        responseTimeMs: 0,
        estimatedCost: 0,
        error: 'خطا در تست مدل',
      })
    } finally {
      setIsTesting(false)
    }
  }

  // مقایسه مدل‌ها
  const handleCompareModels = async () => {
    if (selectedModelsForCompare.length < 2 || !testInput) return
    
    setIsTesting(true)
    setCompareResults([])
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const results = selectedModelsForCompare.map(modelKey => {
        const [provider, modelId] = modelKey.split('/')
        const modelInfo = AVAILABLE_MODELS.find(m => m.provider === provider && m.modelId === modelId)
        
        return {
          provider,
          model: modelId,
          success: true,
          output: `پاسخ نمونه از ${modelInfo?.modelName || modelId}`,
          responseTimeMs: Math.floor(Math.random() * 3000) + 500,
          inputTokens: Math.floor(testInput.length / 4),
          outputTokens: Math.floor(Math.random() * 800) + 200,
          estimatedCost: modelInfo?.isFree ? 0 : Math.random() * 0.02,
          qualityScore: Math.floor(Math.random() * 2) + 4,
          relevanceScore: Math.floor(Math.random() * 2) + 4,
          creativityScore: Math.floor(Math.random() * 2) + 3,
        }
      })
      
      setCompareResults(results)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                مدیریت مدل‌های هوش مصنوعی
              </h1>
              <p className="text-gray-500 mt-2">
                انتخاب و پیکربندی مدل AI برای هر قابلیت
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg gap-2 px-4 py-2">
                <CreditCard className="w-4 h-4" />
                💰 هزینه این ماه: {formatCost(totalCostThisMonth)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6 bg-white/80">
            <TabsTrigger value="configs" className="gap-2">
              <Settings className="w-4 h-4" />
              پیکربندی مدل‌ها
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Sparkles className="w-4 h-4" />
              مدل‌های موجود
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-2">
              <GitCompare className="w-4 h-4" />
              مقایسه مدل‌ها
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              تاریخچه
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Sliders className="w-4 h-4" />
              تنظیمات
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: پیکربندی مدل‌ها */}
          <TabsContent value="configs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>پیکربندی مدل برای هر قابلیت</CardTitle>
                    <CardDescription>
                      انتخاب مدل اصلی و پشتیبان برای هر قابلیت AI
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
                  
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="gemini">Gemini 🆓</SelectItem>
                      <SelectItem value="openrouter">OpenRouter 💵</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* نکته */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">🎉 همه قابلیت‌ها از Gemini رایگان استفاده می‌کنند!</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredConfigs.map((config) => {
                    const primaryModel = getModelInfo(config.primaryProvider, config.primaryModel)
                    const fallbackModel = config.fallbackProvider && config.fallbackModel 
                      ? getModelInfo(config.fallbackProvider, config.fallbackModel)
                      : null

                    return (
                      <AccordionItem
                        key={config.featureName}
                        value={config.featureName}
                        className="border rounded-xl overflow-hidden bg-white"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full pl-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{config.featureIcon}</span>
                              <div className="text-right">
                                <p className="font-semibold">{config.featureLabel}</p>
                                <p className="text-sm text-gray-500">
                                  {primaryModel?.modelName || config.primaryModel}
                                  {fallbackModel && ` → ${fallbackModel.modelName}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {primaryModel?.isFree ? (
                                <Badge className="bg-green-100 text-green-700">🆓 رایگان</Badge>
                              ) : (
                                <Badge variant="secondary">💵 پولی</Badge>
                              )}
                              <Badge variant="outline">
                                {config.stats.totalRequests.toLocaleString('fa-IR')} درخواست
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="px-4 pb-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                            {/* مدل اصلی */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-gray-700">مدل اصلی:</h4>
                              <ModelCard
                                model={primaryModel}
                                provider={config.primaryProvider}
                                modelId={config.primaryModel}
                                isPrimary
                                onChangeClick={() => {
                                  setSelectedFeature(config)
                                  setEditingType('primary')
                                  setIsModelDialogOpen(true)
                                }}
                              />

                              {/* مدل پشتیبان */}
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-700">مدل پشتیبان (Fallback):</h4>
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`fallback-${config.featureName}`} className="text-sm">
                                    فعال
                                  </Label>
                                  <Switch
                                    id={`fallback-${config.featureName}`}
                                    checked={config.enableFallback}
                                    onCheckedChange={(checked) => {
                                      setConfigs(prev => prev.map(c =>
                                        c.featureName === config.featureName
                                          ? { ...c, enableFallback: checked }
                                          : c
                                      ))
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {config.enableFallback && fallbackModel && (
                                <ModelCard
                                  model={fallbackModel}
                                  provider={config.fallbackProvider!}
                                  modelId={config.fallbackModel!}
                                  onChangeClick={() => {
                                    setSelectedFeature(config)
                                    setEditingType('fallback')
                                    setIsModelDialogOpen(true)
                                  }}
                                />
                              )}
                            </div>

                            {/* تنظیمات و آمار */}
                            <div className="space-y-4">
                              {/* تنظیمات مدل */}
                              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                <h4 className="font-medium text-gray-700">تنظیمات مدل:</h4>
                                
                                <div className="space-y-4">
                                  <div>
                                    <div className="flex justify-between mb-2">
                                      <Label>Temperature (خلاقیت)</Label>
                                      <span className="text-sm text-gray-500">{config.temperature}</span>
                                    </div>
                                    <Slider
                                      value={[config.temperature]}
                                      min={0}
                                      max={1}
                                      step={0.1}
                                      onValueChange={([value]) => {
                                        setConfigs(prev => prev.map(c =>
                                          c.featureName === config.featureName
                                            ? { ...c, temperature: value }
                                            : c
                                        ))
                                      }}
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                      <span>دقیق</span>
                                      <span>خلاق</span>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Max Tokens (طول پاسخ)</Label>
                                    <Input
                                      type="number"
                                      value={config.maxTokens}
                                      onChange={(e) => {
                                        setConfigs(prev => prev.map(c =>
                                          c.featureName === config.featureName
                                            ? { ...c, maxTokens: parseInt(e.target.value) || 1000 }
                                            : c
                                        ))
                                      }}
                                      className="mt-1"
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <RotateCcw className="w-4 h-4 ml-1" />
                                      پیش‌فرض
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => handleSaveConfig(config)}
                                      disabled={isSaving}
                                    >
                                      {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin ml-1" />
                                      ) : (
                                        <Save className="w-4 h-4 ml-1" />
                                      )}
                                      ذخیره
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* آمار */}
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                  📊 آمار استفاده (این ماه)
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500">کل درخواست‌ها:</span>
                                    <span className="font-bold mr-2">
                                      {config.stats.totalRequests.toLocaleString('fa-IR')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">موفق:</span>
                                    <span className="font-bold text-green-600 mr-2">
                                      {config.stats.successfulRequests.toLocaleString('fa-IR')}
                                      ({((config.stats.successfulRequests / config.stats.totalRequests) * 100 || 0).toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">ناموفق:</span>
                                    <span className="font-bold text-red-600 mr-2">
                                      {config.stats.failedRequests.toLocaleString('fa-IR')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">استفاده پشتیبان:</span>
                                    <span className="font-bold text-yellow-600 mr-2">
                                      {config.stats.fallbackUsedCount.toLocaleString('fa-IR')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">میانگین زمان:</span>
                                    <span className="font-bold mr-2">
                                      {config.stats.avgResponseTimeMs.toLocaleString('fa-IR')}ms
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">هزینه تخمینی:</span>
                                    <span className="font-bold mr-2">
                                      {formatCost(config.stats.totalCostThisMonth)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* دکمه‌ها */}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1"
                                  onClick={() => {
                                    setSelectedFeature(config)
                                    setTestInput('')
                                    setTestResult(null)
                                    setIsTestDialogOpen(true)
                                  }}
                                >
                                  <FlaskConical className="w-4 h-4" />
                                  تست مدل
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1"
                                  onClick={() => {
                                    setSelectedFeature(config)
                                    setSelectedModelsForCompare([
                                      `${config.primaryProvider}/${config.primaryModel}`,
                                    ])
                                    setCompareResults([])
                                    setIsCompareDialogOpen(true)
                                  }}
                                >
                                  <GitCompare className="w-4 h-4" />
                                  مقایسه
                                </Button>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: مدل‌های موجود */}
          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle>مدل‌های AI موجود</CardTitle>
                <CardDescription>
                  لیست تمام مدل‌های قابل استفاده در پلتفرم
                </CardDescription>

                <div className="flex items-center gap-4 mt-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 cursor-pointer">🆓 رایگان</Badge>
                    <Badge variant="secondary" className="cursor-pointer">💵 پولی</Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>مدل</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-center">قابلیت‌ها</TableHead>
                        <TableHead className="text-center">هزینه</TableHead>
                        <TableHead className="text-center">سرعت</TableHead>
                        <TableHead className="text-center">کیفیت</TableHead>
                        <TableHead className="text-center">استفاده</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {AVAILABLE_MODELS.map((model) => {
                        const usageCount = configs.filter(
                          c => c.primaryModel === model.modelId || c.fallbackModel === model.modelId
                        ).length

                        return (
                          <TableRow key={`${model.provider}-${model.modelId}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{model.modelName}</p>
                                <p className="text-xs text-gray-500">{model.modelDescription}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {model.provider === 'gemini' ? 'Google' : 'OpenRouter'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className={cn(model.supportsText ? 'text-green-600' : 'text-gray-300')}>
                                        📝
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>متن</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className={cn(model.supportsVision ? 'text-green-600' : 'text-gray-300')}>
                                        🖼️
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>تصویر</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className={cn(model.supportsJson ? 'text-green-600' : 'text-gray-300')}>
                                        {'{ }'}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>JSON</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {model.isFree ? (
                                <Badge className="bg-green-100 text-green-700">🆓</Badge>
                              ) : (
                                <span className="text-sm text-gray-600">
                                  ${model.costPerMInputTokens}/$M
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {renderSpeed(model.speedRating)}
                            </TableCell>
                            <TableCell className="text-center">
                              {renderRating(model.qualityRating)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{usageCount} قابلیت</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: مقایسه مدل‌ها */}
          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle>مقایسه مدل‌ها</CardTitle>
                <CardDescription>
                  تست و مقایسه عملکرد مدل‌های مختلف
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((num) => (
                      <div key={num}>
                        <Label>مدل {num}</Label>
                        <Select
                          value={selectedModelsForCompare[num - 1] || ''}
                          onValueChange={(value) => {
                            const newModels = [...selectedModelsForCompare]
                            newModels[num - 1] = value
                            setSelectedModelsForCompare(newModels.filter(Boolean))
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="انتخاب مدل" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_MODELS.map((model) => (
                              <SelectItem
                                key={`${model.provider}/${model.modelId}`}
                                value={`${model.provider}/${model.modelId}`}
                              >
                                {model.modelName} {model.isFree && '🆓'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label>ورودی تست</Label>
                    <Textarea
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="متن ورودی برای تست مدل‌ها..."
                      className="mt-1 h-24"
                    />
                  </div>

                  <Button
                    onClick={handleCompareModels}
                    disabled={selectedModelsForCompare.length < 2 || !testInput || isTesting}
                    className="gap-2"
                  >
                    {isTesting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    اجرای مقایسه
                  </Button>

                  {/* نتایج مقایسه */}
                  {compareResults.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>معیار</TableHead>
                            {compareResults.map((result, i) => {
                              const model = getModelInfo(result.provider, result.model)
                              return (
                                <TableHead key={i} className="text-center">
                                  {model?.modelName || result.model}
                                </TableHead>
                              )
                            })}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">زمان پاسخ</TableCell>
                            {compareResults.map((result, i) => {
                              const isBest = result.responseTimeMs === Math.min(...compareResults.map(r => r.responseTimeMs))
                              return (
                                <TableCell key={i} className={cn('text-center', isBest && 'text-green-600 font-bold')}>
                                  {result.responseTimeMs}ms {isBest && '⭐'}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">کیفیت</TableCell>
                            {compareResults.map((result, i) => {
                              const isBest = result.qualityScore === Math.max(...compareResults.map(r => r.qualityScore || 0))
                              return (
                                <TableCell key={i} className={cn('text-center', isBest && 'text-green-600 font-bold')}>
                                  {result.qualityScore}/5 {isBest && '⭐'}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">هزینه</TableCell>
                            {compareResults.map((result, i) => {
                              const isBest = result.estimatedCost === Math.min(...compareResults.map(r => r.estimatedCost))
                              return (
                                <TableCell key={i} className={cn('text-center', isBest && 'text-green-600 font-bold')}>
                                  {formatCost(result.estimatedCost)} {isBest && '⭐'}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: تاریخچه */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>تاریخچه تغییرات</CardTitle>
                <CardDescription>
                  تمام تغییرات اعمال شده در تنظیمات مدل‌ها
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>تاریخ</TableHead>
                        <TableHead>قابلیت</TableHead>
                        <TableHead>از → به</TableHead>
                        <TableHead>نوع</TableHead>
                        <TableHead>کاربر</TableHead>
                        <TableHead>دلیل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-gray-500">
                            {item.createdAt}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.featureLabel}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{item.oldModel?.split('/').pop()}</span>
                              <span>→</span>
                              <span className="font-medium">{item.newModel.split('/').pop()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.changeType === 'primary' ? 'default' : 'secondary'}>
                              {item.changeType === 'primary' ? 'اصلی' : 'پشتیبان'}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.changedBy}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.reason || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: تنظیمات */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* تنظیمات Fallback */}
              <Card>
                <CardHeader>
                  <CardTitle>تنظیمات Fallback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>فعال‌سازی خودکار fallback</Label>
                    <Switch defaultChecked />
                  </div>
                  
                  <div>
                    <Label>تعداد تلاش مجدد</Label>
                    <Input type="number" defaultValue={3} className="mt-1 w-24" />
                  </div>
                  
                  <div>
                    <Label>Timeout (ثانیه)</Label>
                    <Input type="number" defaultValue={30} className="mt-1 w-24" />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>رویدادهای fallback</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="log" defaultChecked className="rounded" />
                        <Label htmlFor="log" className="font-normal">ثبت log</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="notify" defaultChecked className="rounded" />
                        <Label htmlFor="notify" className="font-normal">ارسال نوتیفیکیشن به مدیر</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="email" className="rounded" />
                        <Label htmlFor="email" className="font-normal">ارسال ایمیل</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API Keys */}
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Google Gemini API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="password" defaultValue="AIza•••••••••••••" className="flex-1" />
                      <Button variant="outline" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      معتبر
                    </p>
                  </div>

                  <div>
                    <Label>OpenRouter API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="password" defaultValue="sk-or-•••••••••••••" className="flex-1" />
                      <Button variant="outline" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      معتبر | اعتبار: $25.00
                    </p>
                  </div>

                  <Button variant="outline" className="gap-2 w-full">
                    <RefreshCw className="w-4 h-4" />
                    تست اتصال
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog انتخاب مدل */}
        <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                انتخاب مدل {editingType === 'primary' ? 'اصلی' : 'پشتیبان'} برای: {selectedFeature?.featureLabel}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="free">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="free">🆓 رایگان</TabsTrigger>
                <TabsTrigger value="paid">💵 پولی</TabsTrigger>
                <TabsTrigger value="all">همه</TabsTrigger>
              </TabsList>

              {['free', 'paid', 'all'].map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-3">
                  {AVAILABLE_MODELS
                    .filter(m => {
                      if (tab === 'free') return m.isFree
                      if (tab === 'paid') return !m.isFree
                      return true
                    })
                    .map((model) => (
                      <div
                        key={`${model.provider}-${model.modelId}`}
                        className={cn(
                          'border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-300',
                          selectedFeature?.primaryModel === model.modelId && editingType === 'primary' && 'border-blue-500 bg-blue-50',
                          selectedFeature?.fallbackModel === model.modelId && editingType === 'fallback' && 'border-blue-500 bg-blue-50'
                        )}
                        onClick={() => {
                          if (selectedFeature) {
                            if (editingType === 'primary') {
                              setConfigs(prev => prev.map(c =>
                                c.featureName === selectedFeature.featureName
                                  ? { ...c, primaryProvider: model.provider, primaryModel: model.modelId }
                                  : c
                              ))
                            } else {
                              setConfigs(prev => prev.map(c =>
                                c.featureName === selectedFeature.featureName
                                  ? { ...c, fallbackProvider: model.provider, fallbackModel: model.modelId }
                                  : c
                              ))
                            }
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{model.modelName}</h4>
                              {model.isFree && (
                                <Badge className="bg-green-100 text-green-700">🆓 رایگان</Badge>
                              )}
                              {model.recommendedFor.includes(selectedFeature?.featureName || '') && (
                                <Badge className="bg-yellow-100 text-yellow-700">⭐ توصیه شده</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{model.modelDescription}</p>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Provider: {model.provider === 'gemini' ? 'Google' : 'OpenRouter'}</span>
                              <span>Context: {(model.contextWindow! / 1000).toFixed(0)}K tokens</span>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-500">سرعت:</span>
                                <span>{renderSpeed(model.speedRating)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-500">کیفیت:</span>
                                <span>{renderRating(model.qualityRating)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <span className={model.supportsText ? 'text-green-600' : 'text-gray-300'}>✅ متن</span>
                              <span className={model.supportsVision ? 'text-green-600' : 'text-gray-300'}>
                                {model.supportsVision ? '✅' : '❌'} تصویر
                              </span>
                              <span className={model.supportsJson ? 'text-green-600' : 'text-gray-300'}>✅ JSON</span>
                            </div>
                          </div>
                          
                          <div className="text-left">
                            {model.isFree ? (
                              <p className="font-bold text-green-600">رایگان!</p>
                            ) : (
                              <div className="text-sm">
                                <p className="text-gray-500">~${((model.costPerMInputTokens * 0.5 + model.costPerMOutputTokens * 0.5) / 1000).toFixed(4)}/req</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </TabsContent>
              ))}
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModelDialogOpen(false)}>
                انصراف
              </Button>
              <Button onClick={() => {
                handleSaveConfig(configs.find(c => c.featureName === selectedFeature?.featureName)!)
                setIsModelDialogOpen(false)
              }}>
                <Save className="w-4 h-4 ml-2" />
                ذخیره انتخاب
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog تست مدل */}
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                تست مدل: {selectedFeature?.featureLabel}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>ورودی تست</Label>
                <Textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="متن ورودی برای تست مدل..."
                  className="mt-1 h-24"
                />
              </div>

              <Button
                onClick={handleTestModel}
                disabled={!testInput || isTesting}
                className="gap-2"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                اجرای تست
              </Button>

              {testResult && (
                <div className={cn(
                  'border rounded-lg p-4',
                  testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">نتیجه</h4>
                    <Badge variant={testResult.success ? 'default' : 'destructive'}>
                      {testResult.success ? '✅ موفق' : '❌ ناموفق'}
                    </Badge>
                  </div>

                  {testResult.success && (
                    <>
                      <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500">زمان:</span>
                          <span className="font-bold mr-1">{testResult.responseTimeMs}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tokens:</span>
                          <span className="font-bold mr-1">{testResult.outputTokens}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">هزینه:</span>
                          <span className="font-bold mr-1">{formatCost(testResult.estimatedCost)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">کیفیت:</span>
                          <span className="font-bold mr-1">{testResult.qualityScore}/5</span>
                        </div>
                      </div>

                      <div className="bg-white rounded p-3 text-sm whitespace-pre-wrap">
                        {testResult.output}
                      </div>
                    </>
                  )}

                  {testResult.error && (
                    <p className="text-red-600">{testResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت کارت مدل
// ============================================

function ModelCard({
  model,
  provider,
  modelId,
  isPrimary,
  onChangeClick,
}: {
  model: AvailableModel | null
  provider: string
  modelId: string
  isPrimary?: boolean
  onChangeClick: () => void
}) {
  if (!model) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <p className="text-gray-500">مدل یافت نشد: {modelId}</p>
        <Button variant="outline" size="sm" onClick={onChangeClick} className="mt-2">
          تغییر مدل
        </Button>
      </div>
    )
  }

  return (
    <div className={cn(
      'border rounded-lg p-4',
      isPrimary ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h5 className="font-semibold">{model.modelName}</h5>
            {model.isFree && (
              <Badge className="bg-green-100 text-green-700">🆓</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Provider: {model.provider === 'gemini' ? 'Google Gemini' : 'OpenRouter'}
          </p>
        </div>
        <div className="text-left text-sm">
          <p className={model.isFree ? 'text-green-600 font-bold' : ''}>
            {model.isFree ? 'رایگان' : `~$${((model.costPerMInputTokens + model.costPerMOutputTokens) / 2000).toFixed(4)}/req`}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-3 text-sm">
        <div>
          <span className="text-gray-500">سرعت:</span>
          <span className="mr-1">{renderSpeed(model.speedRating)}</span>
        </div>
        <div>
          <span className="text-gray-500">کیفیت:</span>
          <span className="mr-1">{renderRating(model.qualityRating)}</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onChangeClick}
        className="mt-3 gap-1"
      >
        <RefreshCw className="w-3 h-3" />
        تغییر مدل
      </Button>
    </div>
  )
}













