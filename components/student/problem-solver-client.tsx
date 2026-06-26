'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  Upload,
  Trash2,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Lightbulb,
} from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SolveResult = {
  problem: string
  solution: string
  steps: string[]
  subject: string
}

export function ProblemSolverClient() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePath, setImagePath] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<SolveResult | null>(null)

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم تصویر باید کمتر از 5MB باشد')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('فرمت تصویر باید JPEG، PNG یا WebP باشد')
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('خطا در خواندن فایل'))
        reader.readAsDataURL(file)
      })

      setImagePreview(base64)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'ocr')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (uploadData.success) {
        setImageUrl(uploadData.url)
        setImagePath(uploadData.path)
        toast.success('تصویر آماده است')
      } else {
        setImageUrl('')
        setImagePath('')
        toast.message('تصویر محلی بارگذاری شد (ذخیره ابری در دسترس نیست)')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'خطا در بارگذاری تصویر')
      setImagePreview(null)
      setImageUrl('')
      setImagePath('')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processFile(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await processFile(file)
  }

  const handleSolve = async () => {
    if (!imagePreview) {
      toast.error('لطفاً ابتدا تصویر مسئله را انتخاب کنید')
      return
    }

    setIsProcessing(true)

    try {
      const payload: { imageUrl?: string; image?: string } = {}
      if (imageUrl) payload.imageUrl = imageUrl
      else payload.image = imagePreview

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'خطا در پردازش')
      }

      setResult(data.result)
      toast.success('مسئله حل شد!')
    } catch (error) {
      console.error('Solve error:', error)
      toast.error(error instanceof Error ? error.message : 'خطا در حل مسئله')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = async () => {
    if (imagePath) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: imagePath }),
        })
      } catch {
        // optional cleanup
      }
    }

    setImagePreview(null)
    setImageUrl('')
    setImagePath('')
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canSolve = !!imagePreview && !isUploading

  return (
    <DashboardPage
      className="max-w-4xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-brand-yellow" />
          حل مسئله از روی عکس
        </span>
      }
      description="عکس مسئله را آپلود کنید تا هوش مصنوعی آن را حل کند"
      animatedSections={false}
    >
      <GlassCard className="p-6">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
            isDragging && 'border-brand-cyan bg-brand-cyan/5',
            isUploading && 'border-brand-purple bg-brand-purple/5',
            imagePreview && !isUploading && 'border-brand-green bg-brand-green/5',
            !imagePreview && !isUploading && !isDragging && 'border-border hover:border-brand-purple/50 hover:bg-muted/30'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-brand-purple animate-spin" />
              <p className="font-semibold">در حال بارگذاری...</p>
            </div>
          ) : imagePreview ? (
            <div>
              <img
                src={imagePreview}
                alt="پیش‌نمایش مسئله"
                className="max-h-64 mx-auto rounded-xl mb-4 shadow-md"
              />
              <div className="flex items-center justify-center gap-2 text-brand-green font-medium">
                <CheckCircle2 className="w-5 h-5" />
                <span>تصویر آماده حل است</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-brand-purple" />
              </div>
              <p className="text-lg font-semibold">عکس مسئله را انتخاب یا بکشید اینجا</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Upload className="w-4 h-4" />
                JPEG, PNG, WebP — حداکثر 5MB
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageUpload}
          className="hidden"
          disabled={isUploading}
        />

        {canSolve && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={handleSolve}
              disabled={isProcessing}
              className="flex-1 min-w-[140px] gap-2"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال حل...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  حل کن
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isProcessing}
              className="gap-2"
            >
              <Trash2 className="w-5 h-5" />
              پاک کردن
            </Button>
          </div>
        )}
      </GlassCard>

      {result && (
        <GlassCard className="p-6 space-y-5">
          <h2 className="text-xl font-bold flex items-center gap-2 text-brand-purple">
            <Sparkles className="w-6 h-6" />
            نتیجه
          </h2>

          <div className="rounded-xl bg-muted/40 p-4">
            <h3 className="font-semibold mb-2">مسئله</h3>
            <div className="font-mono text-sm bg-background p-3 rounded-lg overflow-x-auto" dir="ltr">
              {result.problem}
            </div>
          </div>

          <div className="rounded-xl bg-brand-green/10 p-4">
            <h3 className="font-semibold mb-2">جواب نهایی</h3>
            <div className="text-2xl font-bold text-brand-green font-mono text-center" dir="ltr">
              {result.solution}
            </div>
          </div>

          {result.steps?.length > 0 && (
            <div className="rounded-xl bg-brand-purple/5 p-4">
              <h3 className="font-semibold mb-3">مراحل حل</h3>
              <ol className="space-y-3">
                {result.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-purple text-white text-sm flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <div className="pt-0.5 flex-1 text-sm font-mono bg-background p-2 rounded-lg overflow-x-auto">
                      {step}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.subject && (
            <p className="text-center text-sm text-muted-foreground">
              موضوع: <span className="font-semibold text-foreground">{result.subject}</span>
            </p>
          )}
        </GlassCard>
      )}

      <p className="text-center text-sm text-muted-foreground">
        برای بهترین نتیجه، عکس واضح با نور کافی بگیرید.
      </p>
    </DashboardPage>
  )
}
