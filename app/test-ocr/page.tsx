'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function TestOCR() {
  const [image, setImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // چک سایز (حداکثر 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('❌ حجم تصویر باید کمتر از 5MB باشد')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result as string)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const handleSolve = async () => {
    if (!image) return

    setIsProcessing(true)

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'خطا')
      }

      setResult(data.result)
      toast.success('✅ مسئله حل شد!')

    } catch (error: any) {
      toast.error(`❌ ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
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
              image ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}>
              {image ? (
                <div>
                  <img src={image} alt="Preview" className="max-h-64 mx-auto rounded-lg mb-4" />
                  <p className="text-green-600 font-semibold">✅ تصویر آماده است</p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-xl font-semibold mb-2">عکس مسئله را آپلود کنید</p>
                  <p className="text-gray-500">کلیک کنید یا فایل را بکشید</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {image && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSolve}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isProcessing ? '⏳ در حال حل...' : '🤖 حل کن!'}
              </button>
              <button
                onClick={() => {
                  setImage(null)
                  setResult(null)
                }}
                className="px-6 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all"
              >
                🗑️ پاک کن
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">
              ✨ جواب
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

            {/* موضوع */}
            <div className="text-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">📚 موضوع: </span>
              <span className="font-semibold">{result.subject}</span>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

