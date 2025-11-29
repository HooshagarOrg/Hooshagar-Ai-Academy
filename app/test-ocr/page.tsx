'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Upload, Trash2, Sparkles, CheckCircle2, Image as ImageIcon } from 'lucide-react'

export default function TestOCR() {
  // State های تصویر
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imagePath, setImagePath] = useState<string>('')
  
  // State های loading
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // State نتیجه
  const [result, setResult] = useState<{
    problem: string
    solution: string
    steps: string[]
    subject: string
  } | null>(null)

  // آپلود تصویر به Arvan
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // چک سایز (حداکثر 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('❌ حجم تصویر باید کمتر از 5MB باشد')
      return
    }

    // چک فرمت
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('❌ فرمت تصویر باید JPEG، PNG یا WebP باشد')
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      // ایجاد پیش‌نمایش محلی
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // ایجاد FormData برای آپلود
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'ocr')

      // آپلود به Arvan
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'خطا در آپلود')
      }

      // ذخیره URL و Path از Arvan
      setImageUrl(uploadData.url)
      setImagePath(uploadData.path)

      toast.success('✅ تصویر با موفقیت آپلود شد')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : '❌ خطا در آپلود تصویر')
      setImagePreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  // حل مسئله با AI
  const handleSolve = async () => {
    if (!imageUrl) {
      toast.error('لطفاً ابتدا تصویر را آپلود کنید')
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: imageUrl, // استفاده از URL آروان
          // image: imagePreview, // Fallback به Base64 اگر نیاز بود
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'خطا در پردازش')
      }

      setResult(data.result)
      toast.success('✅ مسئله حل شد!')

    } catch (error) {
      console.error('Solve error:', error)
      toast.error(error instanceof Error ? error.message : '❌ خطا در حل مسئله')
    } finally {
      setIsProcessing(false)
    }
  }

  // پاک کردن همه چیز
  const handleClear = async () => {
    // حذف فایل از Arvan (اختیاری)
    if (imagePath) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: imagePath })
        })
      } catch (error) {
        console.warn('Failed to delete file from storage:', error)
      }
    }

    // Reset state ها
    setImagePreview(null)
    setImageUrl('')
    setImagePath('')
    setResult(null)
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-purple-50" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">
          📷 Problem Solver
        </h1>
        <p className="text-gray-600 text-center mb-8">
          عکس از مسئله بگیر، AI حلش می‌کند!
        </p>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <label className="block">
            <div className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isUploading 
                ? 'border-blue-400 bg-blue-50'
                : imageUrl 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}>
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                  <p className="text-xl font-semibold text-blue-600 mb-2">
                    در حال آپلود...
                  </p>
                  <p className="text-gray-500">لطفاً صبر کنید</p>
                </div>
              ) : imagePreview ? (
                <div>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg mb-4 shadow-lg" 
                  />
                  <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تصویر آماده است</span>
                  </div>
                  {imageUrl && (
                    <p className="text-xs text-gray-400 mt-2 truncate max-w-md mx-auto" dir="ltr">
                      {imageUrl}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-xl font-semibold mb-2">عکس مسئله را آپلود کنید</p>
                  <p className="text-gray-500 mb-3">کلیک کنید یا فایل را بکشید</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Upload className="w-4 h-4" />
                    <span>JPEG, PNG, WebP - حداکثر 5MB</span>
                  </div>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {imageUrl && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSolve}
                disabled={isProcessing || isUploading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال حل...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>حل کن!</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={isProcessing || isUploading}
                className="px-6 flex items-center gap-2 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
                <span>پاک کن</span>
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              جواب
            </h2>

            {/* مسئله */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold mb-2">📝 مسئله:</h3>
              <div 
                className="text-lg font-mono bg-white p-3 rounded border border-blue-200 overflow-x-auto"
                style={{ direction: 'ltr', textAlign: 'left' }}
              >
                {result.problem}
              </div>
            </div>

            {/* جواب */}
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="font-semibold mb-2">✅ جواب نهایی:</h3>
              <div 
                className="text-2xl font-bold text-green-600 font-mono bg-white p-4 rounded border-2 border-green-300 text-center"
                style={{ direction: 'ltr' }}
              >
                {result.solution}
              </div>
            </div>

            {/* مراحل حل */}
            {result.steps && result.steps.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-xl">
                <h3 className="font-semibold mb-3">📊 مراحل حل:</h3>
                <ol className="space-y-3">
                  {result.steps.map((step: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <div 
                        className="pt-1 flex-1 font-mono bg-white p-2 rounded border border-purple-200 overflow-x-auto"
                        style={{ 
                          direction: step.match(/[a-zA-Z0-9+\-=\/*^(){}[\]\\]/) ? 'ltr' : 'rtl',
                          textAlign: step.match(/[a-zA-Z0-9+\-=\/*^(){}[\]\\]/) ? 'left' : 'right'
                        }}
                      >
                        {step}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* موضوع */}
            {result.subject && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">📚 موضوع: </span>
                <span className="font-semibold">{result.subject}</span>
              </div>
            )}

            {/* دکمه حل دوباره */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                مسئله جدید
              </button>
            </div>
          </div>
        )}

        {/* راهنما */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>💡 نکته: برای بهترین نتیجه، عکس واضح و با نور کافی بگیرید</p>
        </div>
      </div>
    </div>
  )
}
