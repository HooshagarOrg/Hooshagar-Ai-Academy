'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface StoryResult {
  title: string
  story: string
  moral: string
}

export default function TestStory() {
  const [topic, setTopic] = useState('')
  const [age, setAge] = useState(8)
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<StoryResult | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('❌ لطفاً موضوع داستان را وارد کنید')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, age, length })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ساخت داستان')
      }

      setResult(data)
      toast.success('✨ داستان جادویی ساخته شد!')

    } catch (error: any) {
      toast.error(`❌ ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    
    const text = `📖 ${result.title}\n\n${result.story}\n\n💡 نکته اخلاقی: ${result.moral}`
    navigator.clipboard.writeText(text)
    toast.success('📋 داستان کپی شد!')
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            ✨ جادوگر داستان ✨
          </h1>
          <p className="text-gray-600 text-lg">
            موضوع رو بگو، یه داستان جادویی برات می‌سازم! 🪄
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border-4 border-purple-200">
          {/* Topic Input */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-purple-700 mb-2">
              🎯 موضوع داستان چیه؟
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثلاً: یک پسر کوچولو که می‌خواد فضانورد بشه"
              className="w-full p-4 text-lg border-3 border-purple-300 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Age Select */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-blue-700 mb-2">
              🎂 چند سالته؟
            </label>
            <div className="flex flex-wrap gap-2">
              {[6, 7, 8, 9, 10, 11, 12].map((a) => (
                <button
                  key={a}
                  onClick={() => setAge(a)}
                  disabled={isLoading}
                  className={`w-14 h-14 rounded-full text-xl font-bold transition-all ${
                    age === a
                      ? 'bg-blue-500 text-white scale-110 shadow-lg'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Length Radio */}
          <div className="mb-8">
            <label className="block text-lg font-bold text-green-700 mb-3">
              📏 داستان چقدر بلند باشه؟
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'short', label: '🐣 کوتاه', desc: '۲ دقیقه' },
                { value: 'medium', label: '🐥 متوسط', desc: '۵ دقیقه' },
                { value: 'long', label: '🦅 بلند', desc: '۱۰ دقیقه' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLength(option.value as 'short' | 'medium' | 'long')}
                  disabled={isLoading}
                  className={`p-4 rounded-2xl text-center transition-all ${
                    length === option.value
                      ? 'bg-green-500 text-white scale-105 shadow-lg'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.label.split(' ')[0]}</div>
                  <div className="font-bold">{option.label.split(' ')[1]}</div>
                  <div className="text-sm opacity-75">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !topic.trim()}
            className="w-full py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white text-2xl font-bold rounded-2xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-spin text-3xl">🪄</span>
                در حال ساختن داستان جادویی...
              </span>
            ) : (
              '✨ ساخت داستان جادویی ✨'
            )}
          </button>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-yellow-200 animate-pulse">
            <div className="h-10 bg-yellow-200 rounded-xl w-2/3 mx-auto mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-yellow-100 rounded w-full"></div>
              <div className="h-4 bg-yellow-100 rounded w-full"></div>
              <div className="h-4 bg-yellow-100 rounded w-5/6"></div>
              <div className="h-4 bg-yellow-100 rounded w-full"></div>
              <div className="h-4 bg-yellow-100 rounded w-4/5"></div>
            </div>
            <div className="mt-6 text-center text-yellow-600 text-lg">
              🧙‍♂️ جادوگر در حال نوشتن داستان است...
            </div>
          </div>
        )}

        {/* Result Card */}
        {result && !isLoading && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-yellow-300">
            {/* Title */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-center">
              <h2 className="text-3xl font-bold text-white drop-shadow-md">
                📖 {result.title}
              </h2>
            </div>

            {/* Story */}
            <div className="p-8">
              <div className="prose prose-lg max-w-none text-gray-700 leading-loose text-justify">
                {result.story.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4 first-letter:text-3xl first-letter:font-bold first-letter:text-purple-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Moral */}
            <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 mx-6 mb-6 rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="text-3xl">💡</span>
                <div>
                  <div className="font-bold text-green-700 mb-1">نکته اخلاقی داستان:</div>
                  <div className="text-gray-700 text-lg">{result.moral}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 flex justify-between items-center">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all font-bold"
              >
                📋 کپی داستان
              </button>
              
              <button
                onClick={() => setResult(null)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-bold"
              >
                🔄 داستان جدید
              </button>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>🌟 هر داستان یک ماجراجویی جدید است! 🌟</p>
        </div>
      </div>
    </div>
  )
}

