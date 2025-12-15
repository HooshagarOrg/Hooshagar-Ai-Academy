'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Settings,
  Building,
  Palette,
  Image as ImageIcon,
  Upload,
  RotateCw,
  Crop,
  ZoomIn,
  ZoomOut,
  Save,
  Check,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Download,
  Info,
  Loader2,
  Sun,
  Moon,
  Layout,
  Sidebar,
  LogIn,
  FileOutput,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { HexColorPicker, HexColorInput } from 'react-colorful'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

interface SchoolSettings {
  id: string
  name: string
  description: string
  phone: string
  address: string
  postalCode: string
  website: string
  email: string
  logoUrl: string
  faviconUrl: string
  primaryColor: string
  secondaryColor: string
  textColor: string
  backgroundColor: string
  showNameInHeader: boolean
  showNameInSidebar: boolean
  showNameInLogin: boolean
  logoSizeInSidebar: 'sm' | 'md' | 'lg'
  footerText: string
}

interface ColorPreset {
  name: string
  primary: string
  secondary: string
  text: string
  background: string
}

// ============================================
// داده‌های نمونه
// ============================================

const INITIAL_SETTINGS: SchoolSettings = {
  id: 'school-1',
  name: 'دبستان تلاش',
  description: 'مدرسه ابتدایی پسرانه با سابقه 40 ساله در آموزش و پرورش',
  phone: '021-12345678',
  address: 'تهران، خیابان ولیعصر، کوچه امید، پلاک 15',
  postalCode: '1234567890',
  website: 'https://talash-school.ir',
  email: 'info@talash-school.ir',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  textColor: '#1f2937',
  backgroundColor: '#f9fafb',
  showNameInHeader: true,
  showNameInSidebar: true,
  showNameInLogin: false,
  logoSizeInSidebar: 'md',
  footerText: 'مدرسه تلاش - از سال 1380',
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'آبی کلاسیک',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    text: '#1f2937',
    background: '#f8fafc',
  },
  {
    name: 'سبز طبیعت',
    primary: '#22c55e',
    secondary: '#4ade80',
    text: '#14532d',
    background: '#f0fdf4',
  },
  {
    name: 'قرمز انرژی',
    primary: '#ef4444',
    secondary: '#f87171',
    text: '#7f1d1d',
    background: '#fef2f2',
  },
  {
    name: 'بنفش ملایم',
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    text: '#4c1d95',
    background: '#faf5ff',
  },
  {
    name: 'نارنجی گرم',
    primary: '#f97316',
    secondary: '#fb923c',
    text: '#7c2d12',
    background: '#fff7ed',
  },
  {
    name: 'فیروزه‌ای',
    primary: '#14b8a6',
    secondary: '#2dd4bf',
    text: '#134e4a',
    background: '#f0fdfa',
  },
]

// ============================================
// کامپوننت‌های کمکی
// ============================================

function ColorPicker({
  label,
  color,
  onChange,
}: {
  label: string
  color: string
  onChange: (color: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-3">
            <div
              className="w-6 h-6 rounded border shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-sm">{color}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-3">
            <HexColorPicker color={color} onChange={onChange} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">#</span>
              <HexColorInput
                color={color}
                onChange={onChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors font-mono"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function LogoUploader({
  currentUrl,
  onUpload,
  title,
  description,
  recommendedSize,
  maxSize,
  formats,
}: {
  currentUrl: string
  onUpload: (url: string) => void
  title: string
  description: string
  recommendedSize: string
  maxSize: string
  formats: string
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('لطفاً یک فایل تصویری انتخاب کنید')
      return
    }

    const maxSizeBytes = parseInt(maxSize) * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error(`حجم فایل بیشتر از ${maxSize} است`)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
      setRotation(0)
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }, [maxSize])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleSave = async () => {
    if (!previewUrl) return

    setIsUploading(true)
    try {
      // در واقعیت، آپلود به Arvan S3
      await new Promise((r) => setTimeout(r, 1500))
      onUpload(previewUrl)
      setIsDialogOpen(false)
      setPreviewUrl('')
      toast.success('لوگو با موفقیت ذخیره شد')
    } catch (error) {
      toast.error('خطا در ذخیره لوگو')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onUpload('')
    toast.success('لوگو حذف شد')
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* نمایش لوگوی فعلی */}
          <div className="flex justify-center">
            {currentUrl ? (
              <div className="relative group">
                <img
                  src={currentUrl}
                  alt="لوگو"
                  className="w-32 h-32 object-contain rounded-lg border bg-white p-2"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemove}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* دکمه تغییر */}
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            {currentUrl ? 'تغییر لوگو' : 'آپلود لوگو'}
          </Button>

          {/* راهنما */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1">
            <p>• فرمت: {formats}</p>
            <p>• ابعاد پیشنهادی: {recommendedSize}</p>
            <p>• حداکثر حجم: {maxSize}</p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog آپلود */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              آپلود {title}
            </DialogTitle>
            <DialogDescription>
              تصویر جدید را انتخاب یا بکشید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drop Zone */}
            {!previewUrl && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/x-icon"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-700 mb-1">تصویر لوگو را اینجا بکشید</p>
                <p className="text-sm text-gray-500">یا کلیک کنید</p>
                <p className="text-xs text-gray-400 mt-2">{formats} (حداکثر {maxSize})</p>
              </div>
            )}

            {/* پیش‌نمایش */}
            {previewUrl && (
              <div className="space-y-4">
                <div className="flex justify-center bg-checkerboard rounded-lg p-4">
                  <img
                    src={previewUrl}
                    alt="پیش‌نمایش"
                    className="max-w-[200px] max-h-[200px] object-contain transition-transform"
                    style={{
                      transform: `rotate(${rotation}deg) scale(${zoom})`,
                    }}
                  />
                </div>

                {/* ابزارهای ویرایش */}
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => r - 90)}
                    className="gap-1"
                  >
                    <RotateCw className="w-4 h-4" />
                    چرخش
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                    className="gap-1"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                    className="gap-1"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewUrl('')
                      setRotation(0)
                      setZoom(1)
                    }}
                    className="gap-1 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              انصراف
            </Button>
            <Button
              onClick={handleSave}
              disabled={!previewUrl || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              ذخیره لوگو
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .bg-checkerboard {
          background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </>
  )
}

function LivePreview({
  settings,
  previewMode,
}: {
  settings: SchoolSettings
  previewMode: 'header' | 'sidebar' | 'login' | 'pdf'
}) {
  const [isDark, setIsDark] = useState(false)

  const renderPreview = () => {
    const bgClass = isDark ? 'bg-gray-800' : 'bg-white'
    const textClass = isDark ? 'text-white' : 'text-gray-900'

    switch (previewMode) {
      case 'header':
        return (
          <div className={cn('rounded-lg border p-4', bgClass)}>
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="لوگو"
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {settings.name.charAt(0)}
                </div>
              )}
              {settings.showNameInHeader && (
                <span className={cn('font-bold', textClass)}>
                  {settings.name}
                </span>
              )}
            </div>
          </div>
        )

      case 'sidebar':
        return (
          <div className={cn('rounded-lg border p-4 w-[200px]', bgClass)}>
            <div className="flex flex-col items-center gap-2">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="لوگو"
                  className="object-contain"
                  style={{
                    width: settings.logoSizeInSidebar === 'sm' ? 48 : settings.logoSizeInSidebar === 'md' ? 64 : 80,
                    height: settings.logoSizeInSidebar === 'sm' ? 48 : settings.logoSizeInSidebar === 'md' ? 64 : 80,
                  }}
                />
              ) : (
                <div
                  className="rounded-xl flex items-center justify-center text-white font-bold"
                  style={{
                    backgroundColor: settings.primaryColor,
                    width: settings.logoSizeInSidebar === 'sm' ? 48 : settings.logoSizeInSidebar === 'md' ? 64 : 80,
                    height: settings.logoSizeInSidebar === 'sm' ? 48 : settings.logoSizeInSidebar === 'md' ? 64 : 80,
                    fontSize: settings.logoSizeInSidebar === 'sm' ? 20 : settings.logoSizeInSidebar === 'md' ? 26 : 32,
                  }}
                >
                  {settings.name.charAt(0)}
                </div>
              )}
              {settings.showNameInSidebar && (
                <span className={cn('text-sm font-medium text-center', textClass)}>
                  {settings.name}
                </span>
              )}
            </div>
          </div>
        )

      case 'login':
        return (
          <div
            className="rounded-lg border p-8 text-center"
            style={{ backgroundColor: settings.backgroundColor }}
          >
            <div className="flex flex-col items-center gap-4">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="لوگو"
                  className="w-20 h-20 object-contain"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {settings.name.charAt(0)}
                </div>
              )}
              {settings.showNameInLogin && (
                <h2
                  className="text-xl font-bold"
                  style={{ color: settings.textColor }}
                >
                  {settings.name}
                </h2>
              )}
              <div
                className="w-48 h-10 rounded-lg"
                style={{ backgroundColor: settings.primaryColor }}
              />
              <div
                className="w-48 h-10 rounded-lg"
                style={{ backgroundColor: settings.primaryColor }}
              />
              <button
                className="w-48 h-10 rounded-lg text-white font-medium"
                style={{ backgroundColor: settings.primaryColor }}
              >
                ورود
              </button>
            </div>
          </div>
        )

      case 'pdf':
        return (
          <div className="rounded-lg border bg-white p-6 w-[300px]">
            <div className="flex items-center gap-4 border-b pb-4 mb-4">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="لوگو"
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {settings.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold" style={{ color: settings.textColor }}>
                  {settings.name}
                </h3>
                <p className="text-xs text-gray-500">گزارش ماهانه</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-xs text-gray-400">{settings.footerText}</p>
            </div>
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            پیش‌نمایش زنده
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={isDark ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsDark(!isDark)}
              className="gap-1"
            >
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {isDark ? 'تیره' : 'روشن'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          'rounded-lg p-6 flex justify-center',
          isDark ? 'bg-gray-900' : 'bg-gray-100'
        )}>
          {renderPreview()}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function SchoolSettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings>(INITIAL_SETTINGS)
  const [activeTab, setActiveTab] = useState('general')
  const [previewMode, setPreviewMode] = useState<'header' | 'sidebar' | 'login' | 'pdf'>('header')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  const updateSettings = (updates: Partial<SchoolSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      setHasChanges(false)
      toast.success('تغییرات ذخیره شد')
    } catch (error) {
      toast.error('خطا در ذخیره تغییرات')
    } finally {
      setIsSaving(false)
    }
  }

  const applyColorPreset = (preset: ColorPreset) => {
    updateSettings({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      textColor: preset.text,
      backgroundColor: preset.background,
    })
    toast.success(`پالت "${preset.name}" اعمال شد`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                تنظیمات مدرسه
              </h1>
              <p className="text-gray-500 mt-2 mr-14">
                مدیریت اطلاعات، لوگو و برندینگ مدرسه
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Building className="w-4 h-4 ml-2" />
                {settings.name}
              </Badge>
              {hasChanges && (
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  ذخیره تغییرات
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-[500px] mb-6">
            <TabsTrigger value="general" className="gap-2">
              <Building className="w-4 h-4" />
              اطلاعات عمومی
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="w-4 h-4" />
              لوگو و برندینگ
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Settings className="w-4 h-4" />
              تنظیمات پیشرفته
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: اطلاعات عمومی */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  اطلاعات پایه مدرسه
                </CardTitle>
                <CardDescription>
                  اطلاعات تماس و آدرس مدرسه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      نام مدرسه *
                    </Label>
                    <Input
                      value={settings.name}
                      onChange={(e) => updateSettings({ name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      شماره تماس
                    </Label>
                    <Input
                      value={settings.phone}
                      onChange={(e) => updateSettings({ phone: e.target.value })}
                      placeholder="021-12345678"
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      توضیحات کوتاه
                    </Label>
                    <Textarea
                      value={settings.description}
                      onChange={(e) => updateSettings({ description: e.target.value })}
                      placeholder="درباره مدرسه..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      آدرس کامل
                    </Label>
                    <Textarea
                      value={settings.address}
                      onChange={(e) => updateSettings({ address: e.target.value })}
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>کد پستی</Label>
                    <Input
                      value={settings.postalCode}
                      onChange={(e) => updateSettings({ postalCode: e.target.value })}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      وب‌سایت
                    </Label>
                    <Input
                      value={settings.website}
                      onChange={(e) => updateSettings({ website: e.target.value })}
                      placeholder="https://example.com"
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      ایمیل
                    </Label>
                    <Input
                      value={settings.email}
                      onChange={(e) => updateSettings({ email: e.target.value })}
                      type="email"
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    ذخیره تغییرات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: لوگو و برندینگ */}
          <TabsContent value="branding">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ستون سمت راست - آپلودها و رنگ‌ها */}
              <div className="lg:col-span-2 space-y-6">
                {/* لوگوها */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LogoUploader
                    currentUrl={settings.logoUrl}
                    onUpload={(url) => updateSettings({ logoUrl: url })}
                    title="لوگوی اصلی مدرسه"
                    description="استفاده در Header, Sidebar و گزارشات"
                    recommendedSize="500×500 پیکسل"
                    maxSize="1MB"
                    formats="PNG یا SVG (پس‌زمینه شفاف)"
                  />

                  <LogoUploader
                    currentUrl={settings.faviconUrl}
                    onUpload={(url) => updateSettings({ faviconUrl: url })}
                    title="Favicon (آیکون مرورگر)"
                    description="نمایش در تب مرورگر"
                    recommendedSize="32×32 یا 64×64 پیکسل"
                    maxSize="100KB"
                    formats="PNG یا ICO"
                  />
                </div>

                {/* رنگ‌های سازمانی */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-600" />
                      پالت رنگی مدرسه
                    </CardTitle>
                    <CardDescription>
                      رنگ‌های سازمانی برای شخصی‌سازی ظاهر
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <ColorPicker
                        label="رنگ اصلی (Primary)"
                        color={settings.primaryColor}
                        onChange={(color) => updateSettings({ primaryColor: color })}
                      />
                      <ColorPicker
                        label="رنگ ثانویه (Secondary)"
                        color={settings.secondaryColor}
                        onChange={(color) => updateSettings({ secondaryColor: color })}
                      />
                      <ColorPicker
                        label="رنگ متن"
                        color={settings.textColor}
                        onChange={(color) => updateSettings({ textColor: color })}
                      />
                      <ColorPicker
                        label="رنگ پس‌زمینه"
                        color={settings.backgroundColor}
                        onChange={(color) => updateSettings({ backgroundColor: color })}
                      />
                    </div>

                    <Separator />

                    {/* پیش‌تنظیم‌ها */}
                    <div>
                      <Label className="mb-3 block">پیش‌تنظیم‌های رنگی:</Label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            onClick={() => applyColorPreset(preset)}
                            className="gap-2"
                          >
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: preset.primary }}
                            />
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ستون سمت چپ - پیش‌نمایش */}
              <div className="space-y-6">
                {/* انتخاب نوع پیش‌نمایش */}
                <Card>
                  <CardContent className="py-4">
                    <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as typeof previewMode)}>
                      <TabsList className="grid grid-cols-4 w-full">
                        <TabsTrigger value="header" className="text-xs">
                          <Layout className="w-3 h-3" />
                        </TabsTrigger>
                        <TabsTrigger value="sidebar" className="text-xs">
                          <Sidebar className="w-3 h-3" />
                        </TabsTrigger>
                        <TabsTrigger value="login" className="text-xs">
                          <LogIn className="w-3 h-3" />
                        </TabsTrigger>
                        <TabsTrigger value="pdf" className="text-xs">
                          <FileOutput className="w-3 h-3" />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardContent>
                </Card>

                <LivePreview settings={settings} previewMode={previewMode} />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: تنظیمات پیشرفته */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  تنظیمات پیشرفته نمایش
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* نمایش نام کنار لوگو */}
                <div className="space-y-4">
                  <Label>نمایش نام مدرسه کنار لوگو:</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="showInHeader"
                        checked={settings.showNameInHeader}
                        onCheckedChange={(c) => updateSettings({ showNameInHeader: c as boolean })}
                      />
                      <Label htmlFor="showInHeader" className="cursor-pointer flex items-center gap-2">
                        <Layout className="w-4 h-4" />
                        در Header
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="showInSidebar"
                        checked={settings.showNameInSidebar}
                        onCheckedChange={(c) => updateSettings({ showNameInSidebar: c as boolean })}
                      />
                      <Label htmlFor="showInSidebar" className="cursor-pointer flex items-center gap-2">
                        <Sidebar className="w-4 h-4" />
                        در Sidebar
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="showInLogin"
                        checked={settings.showNameInLogin}
                        onCheckedChange={(c) => updateSettings({ showNameInLogin: c as boolean })}
                      />
                      <Label htmlFor="showInLogin" className="cursor-pointer flex items-center gap-2">
                        <LogIn className="w-4 h-4" />
                        در صفحه ورود
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* اندازه لوگو */}
                <div className="space-y-4">
                  <Label>اندازه لوگو در Sidebar:</Label>
                  <RadioGroup
                    value={settings.logoSizeInSidebar}
                    onValueChange={(v) => updateSettings({ logoSizeInSidebar: v as 'sm' | 'md' | 'lg' })}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="sm" id="size-sm" />
                      <Label htmlFor="size-sm" className="cursor-pointer">
                        کوچک (48px)
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="md" id="size-md" />
                      <Label htmlFor="size-md" className="cursor-pointer">
                        متوسط (64px)
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="lg" id="size-lg" />
                      <Label htmlFor="size-lg" className="cursor-pointer">
                        بزرگ (80px)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* متن پاورقی */}
                <div className="space-y-2">
                  <Label>متن پاورقی در گزارشات:</Label>
                  <Input
                    value={settings.footerText}
                    onChange={(e) => updateSettings({ footerText: e.target.value })}
                    placeholder="مدرسه تلاش - از سال 1380"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    ذخیره تغییرات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}










































