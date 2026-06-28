'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Star,
  Zap,
  Trophy,
  Clock,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  Sparkles,
  Target,
  Award,
  Play,
  PartyPopper,
} from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'

// ============================================
// تایپ‌ها
// ============================================
type Subject = 'math' | 'spelling' | 'science' | 'persian' | null
type MathOperation = 'addition' | 'multiplication' | 'division'

interface MathQuestion {
  id: number
  num1: number
  num2: number
  operation: MathOperation
  answer: number
  options: number[]
}

interface SpellingWord {
  id: number
  word: string
  pronunciation: string
}

interface GameResult {
  correct: number
  total: number
  xpEarned: number
  stars: number
  timeTaken: number
}

// ============================================
// داده‌های نمونه
// ============================================
const subjects = [
  { id: 'math', label: 'ریاضی', emoji: '🔢', color: 'from-blue-500 to-cyan-500', description: 'جمع، تفریق، ضرب و تقسیم' },
  { id: 'spelling', label: 'املا', emoji: '✍️', color: 'from-green-500 to-emerald-500', description: 'گوش بده و بنویس' },
  { id: 'science', label: 'علوم', emoji: '🌍', color: 'from-purple-500 to-pink-500', description: 'به زودی...' },
  { id: 'persian', label: 'فارسی', emoji: '📚', color: 'from-orange-500 to-red-500', description: 'به زودی...' },
]

const spellingWords: SpellingWord[] = [
  { id: 1, word: 'آسمان', pronunciation: 'آ-سِ-مان' },
  { id: 2, word: 'خورشید', pronunciation: 'خور-شید' },
  { id: 3, word: 'دانش‌آموز', pronunciation: 'دا-نِش-آ-موز' },
  { id: 4, word: 'کتابخانه', pronunciation: 'کِ-تاب-خا-نه' },
  { id: 5, word: 'معلم', pronunciation: 'مُ-عَل-لِم' },
]

// تولید سوال ریاضی
const generateMathQuestion = (operation: MathOperation, id: number): MathQuestion => {
  let num1: number, num2: number, answer: number

  switch (operation) {
    case 'addition':
      num1 = Math.floor(Math.random() * 50) + 1
      num2 = Math.floor(Math.random() * 50) + 1
      answer = num1 + num2
      break
    case 'multiplication':
      num1 = Math.floor(Math.random() * 10) + 1
      num2 = Math.floor(Math.random() * 10) + 1
      answer = num1 * num2
      break
    case 'division':
      num2 = Math.floor(Math.random() * 9) + 1
      answer = Math.floor(Math.random() * 10) + 1
      num1 = num2 * answer
      break
    default:
      num1 = 1
      num2 = 1
      answer = 2
  }

  // تولید گزینه‌های اشتباه
  const wrongOptions = new Set<number>()
  while (wrongOptions.size < 3) {
    const offset = Math.floor(Math.random() * 20) - 10
    const wrongAnswer = answer + offset
    if (wrongAnswer !== answer && wrongAnswer > 0) {
      wrongOptions.add(wrongAnswer)
    }
  }

  const options = [...wrongOptions, answer].sort(() => Math.random() - 0.5)

  return { id, num1, num2, operation, answer, options }
}

// ============================================
// کامپوننت انتخاب درس
// ============================================
interface SubjectSelectorProps {
  onSelect: (subject: Subject) => void
}

function SubjectSelector({ onSelect }: SubjectSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {subjects.map((subject) => (
        <button
          key={subject.id}
          onClick={() => subject.id === 'math' || subject.id === 'spelling' ? onSelect(subject.id as Subject) : null}
          disabled={subject.id === 'science' || subject.id === 'persian'}
          className={`relative overflow-hidden bg-gradient-to-br ${subject.color} rounded-3xl p-6 text-center transition-all group
            ${subject.id === 'science' || subject.id === 'persian' 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-105 hover:shadow-2xl cursor-pointer active:scale-95'
            }`}
        >
          {/* دکوراسیون */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/30" />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/20" />
          </div>

          <div className="relative z-10">
            <div className="text-6xl mb-3 group-hover:scale-125 transition-transform duration-300">
              {subject.emoji}
            </div>
            <h3 className="text-white text-xl font-bold mb-1">{subject.label}</h3>
            <p className="text-white/70 text-sm">{subject.description}</p>
          </div>

          {(subject.id === 'science' || subject.id === 'persian') && (
            <div className="absolute top-2 left-2 bg-black/30 text-white text-xs px-2 py-1 rounded-full">
              به زودی
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

// ============================================
// کامپوننت تایمر
// ============================================
interface TimerProps {
  seconds: number
  maxSeconds: number
}

function Timer({ seconds, maxSeconds }: TimerProps) {
  const percentage = (seconds / maxSeconds) * 100
  const isWarning = seconds <= 10

  return (
    <div className="flex items-center gap-3">
      <Clock className={`w-5 h-5 ${isWarning ? 'text-red-400 animate-pulse' : 'text-white/70'}`} />
      <div className="w-24 h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isWarning ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-bold font-mono ${isWarning ? 'text-red-400' : 'text-white'}`}>
        {seconds}
      </span>
    </div>
  )
}

// ============================================
// کامپوننت بازی ریاضی
// ============================================
interface MathGameProps {
  onFinish: (result: GameResult) => void
  onBack: () => void
}

function MathGame({ onFinish, onBack }: MathGameProps) {
  const [operation, setOperation] = useState<MathOperation>('addition')
  const [questions, setQuestions] = useState<MathQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(30)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [totalTime, setTotalTime] = useState(0)

  // تولید سوالات
  useEffect(() => {
    const newQuestions = Array.from({ length: 10 }, (_, i) => 
      generateMathQuestion(operation, i + 1)
    )
    setQuestions(newQuestions)
    setCurrentIndex(0)
    setScore(0)
    setTimer(30)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setGameStarted(true)
    setTotalTime(0)
  }, [operation])

  // تایمر
  useEffect(() => {
    if (!gameStarted || selectedAnswer !== null) return

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // زمان تمام شد - رفتن به سوال بعدی
          handleAnswer(-1)
          return 30
        }
        return prev - 1
      })
      setTotalTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStarted, selectedAnswer, currentIndex])

  // پاسخ دادن
  const handleAnswer = useCallback((answer: number) => {
    if (selectedAnswer !== null) return

    const currentQuestion = questions[currentIndex]
    const correct = answer === currentQuestion?.answer

    setSelectedAnswer(answer)
    setIsCorrect(correct)

    if (correct) {
      setScore((prev) => prev + 1)
    }

    // رفتن به سوال بعدی بعد از 1.5 ثانیه
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
        setTimer(30)
      } else {
        // پایان بازی
        const finalScore = correct ? score + 1 : score
        const stars = finalScore >= 9 ? 3 : finalScore >= 7 ? 2 : finalScore >= 5 ? 1 : 0
        onFinish({
          correct: finalScore,
          total: questions.length,
          xpEarned: finalScore * 10,
          stars,
          timeTaken: totalTime,
        })
      }
    }, 1500)
  }, [currentIndex, questions, score, selectedAnswer, totalTime, onFinish])

  const currentQuestion = questions[currentIndex]
  const operationSymbol = operation === 'addition' ? '+' : operation === 'multiplication' ? '×' : '÷'

  const operationTabs = [
    { id: 'addition', label: 'جمع و تفریق', emoji: '➕' },
    { id: 'multiplication', label: 'ضرب', emoji: '✖️' },
    { id: 'division', label: 'تقسیم', emoji: '➗' },
  ]

  return (
    <div>
      {/* تب‌ها */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {operationTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setOperation(tab.id as MathOperation)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap
              ${operation === tab.id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* هدر بازی */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          بازگشت
        </button>
        <Timer seconds={timer} maxSeconds={30} />
        <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-xl">
          <Star className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-bold">{score}/{questions.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-white/60 text-sm mb-2">
          <span>سوال {currentIndex + 1} از {questions.length}</span>
          <span>{Math.round(((currentIndex) / questions.length) * 100)}% تکمیل</span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* سوال */}
      {currentQuestion && (
        <GlassCard className="rounded-3xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-6xl md:text-8xl font-bold text-white mb-4">
              {currentQuestion.num1} {operationSymbol} {currentQuestion.num2} = ?
            </div>
            {isCorrect !== null && (
              <div className={`flex items-center justify-center gap-2 text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-8 h-8" />
                    آفرین! 🎉
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8" />
                    پاسخ درست: {currentQuestion.answer}
                  </>
                )}
              </div>
            )}
          </div>

          {/* گزینه‌ها */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option
              const isCorrectOption = option === currentQuestion.answer
              const showResult = selectedAnswer !== null

              let buttonClass = 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
              
              if (showResult) {
                if (isCorrectOption) {
                  buttonClass = 'bg-gradient-to-br from-green-500 to-emerald-600 ring-4 ring-green-400/50'
                } else if (isSelected && !isCorrectOption) {
                  buttonClass = 'bg-gradient-to-br from-red-500 to-rose-600 ring-4 ring-red-400/50'
                } else {
                  buttonClass = 'bg-white/20 opacity-50'
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={`${buttonClass} text-white text-3xl md:text-4xl font-bold py-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:transform-none`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// ============================================
// کامپوننت بازی املا
// ============================================
interface SpellingGameProps {
  onFinish: (result: GameResult) => void
  onBack: () => void
}

function SpellingGame({ onFinish, onBack }: SpellingGameProps) {
  const [words] = useState<SpellingWord[]>(spellingWords)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [score, setScore] = useState(0)
  const [isChecked, setIsChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const currentWord = words[currentIndex]

  // پخش صدا (شبیه‌سازی)
  const playSound = (): void => {
    setIsPlaying(true)
    // در نسخه واقعی از Web Speech API استفاده می‌شود
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word)
      utterance.lang = 'fa-IR'
      utterance.rate = 0.8
      utterance.onend = () => setIsPlaying(false)
      speechSynthesis.speak(utterance)
    } else {
      setTimeout(() => setIsPlaying(false), 1000)
    }
  }

  // بررسی پاسخ
  const checkAnswer = (): void => {
    const correct = userInput.trim() === currentWord.word
    setIsChecked(true)
    setIsCorrect(correct)
    if (correct) {
      setScore((prev) => prev + 1)
    }
  }

  // سوال بعدی
  const nextWord = (): void => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setUserInput('')
      setIsChecked(false)
      setIsCorrect(null)
    } else {
      // پایان بازی
      const finalScore = isCorrect ? score + 1 : score
      const stars = finalScore >= 5 ? 3 : finalScore >= 4 ? 2 : finalScore >= 3 ? 1 : 0
      onFinish({
        correct: finalScore,
        total: words.length,
        xpEarned: finalScore * 15,
        stars,
        timeTaken: 0,
      })
    }
  }

  return (
    <div>
      {/* هدر */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          بازگشت
        </button>
        <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-xl">
          <Star className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-bold">{score}/{words.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-white/60 text-sm mb-2">
          <span>کلمه {currentIndex + 1} از {words.length}</span>
          <span>{Math.round(((currentIndex) / words.length) * 100)}% تکمیل</span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${((currentIndex) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* سوال */}
      <GlassCard className="rounded-3xl p-8">
        <div className="text-center mb-8">
          <h3 className="text-white/60 text-lg mb-4">به صدا گوش کن و بنویس:</h3>

          {/* دکمه پخش صدا */}
          <button
            onClick={playSound}
            disabled={isPlaying}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all transform hover:scale-110 active:scale-95
              ${isPlaying
                ? 'bg-green-500 animate-pulse'
                : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
              }`}
          >
            {isPlaying ? (
              <Volume2 className="w-12 h-12 text-white animate-bounce" />
            ) : (
              <Play className="w-12 h-12 text-white mr-1" />
            )}
          </button>

          <p className="text-white/50 text-sm mb-6">
            راهنما: {currentWord.pronunciation}
          </p>

          {/* Input */}
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isChecked}
            placeholder="کلمه را بنویس..."
            className="w-full max-w-md mx-auto block bg-white/10 border-2 border-white/30 rounded-2xl px-6 py-4 text-white text-2xl text-center placeholder:text-white/30 focus:outline-none focus:border-green-500 disabled:opacity-50"
            dir="rtl"
          />

          {/* نتیجه */}
          {isChecked && (
            <div className={`mt-6 flex items-center justify-center gap-2 text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-8 h-8" />
                  عالی! 🎉
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8" />
                  پاسخ درست: {currentWord.word}
                </>
              )}
            </div>
          )}
        </div>

        {/* دکمه‌ها */}
        <div className="flex justify-center gap-4">
          {!isChecked ? (
            <button
              onClick={checkAnswer}
              disabled={!userInput.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all"
            >
              <Target className="w-5 h-5" />
              بررسی کن
            </button>
          ) : (
            <button
              onClick={nextWord}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl transition-all"
            >
              {currentIndex < words.length - 1 ? 'کلمه بعدی' : 'پایان بازی'}
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

// ============================================
// کامپوننت نتیجه بازی
// ============================================
interface GameResultCardProps {
  result: GameResult
  subject: Subject
  onPlayAgain: () => void
  onChangeSubject: () => void
}

function GameResultCard({ result, subject, onPlayAgain, onChangeSubject }: GameResultCardProps) {
  const percentage = Math.round((result.correct / result.total) * 100)
  const isGreat = percentage >= 70
  const isPerfect = percentage >= 90

  return (
    <GlassCard className="rounded-3xl p-8 text-center">
      {/* انیمیشن جشن */}
      <div className="text-8xl mb-4 animate-bounce">
        {isPerfect ? '🏆' : isGreat ? '🎉' : '💪'}
      </div>

      <h2 className="text-3xl font-bold text-white mb-2">
        {isPerfect ? 'عالی! نابغه‌ای!' : isGreat ? 'آفرین! خیلی خوب بود!' : 'تلاش خوبی بود!'}
      </h2>

      <p className="text-white/60 text-lg mb-6">
        {result.correct} از {result.total} پاسخ درست
      </p>

      {/* ستاره‌ها */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`w-12 h-12 transition-all duration-500 ${
              star <= result.stars
                ? 'text-yellow-400 fill-yellow-400 scale-100'
                : 'text-white/20 scale-75'
            }`}
            style={{ transitionDelay: `${star * 200}ms` }}
          />
        ))}
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-yellow-500/20 rounded-2xl p-4">
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-yellow-400 text-2xl font-bold">+{result.xpEarned}</p>
          <p className="text-white/60 text-sm">امتیاز XP</p>
        </div>
        <div className="bg-purple-500/20 rounded-2xl p-4">
          <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className="text-purple-400 text-2xl font-bold">{percentage}%</p>
          <p className="text-white/60 text-sm">درصد موفقیت</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-4 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isPerfect ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
              isGreat ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
              'bg-gradient-to-r from-blue-400 to-cyan-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* دکمه‌ها */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onPlayAgain}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-4 rounded-xl transition-all transform hover:scale-105"
        >
          <RotateCcw className="w-5 h-5" />
          دوباره بازی کن
        </button>
        <button
          onClick={onChangeSubject}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition-all border border-white/20"
        >
          درس بعدی
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    </GlassCard>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function PracticePlaygroundPage() {
  const [selectedSubject, setSelectedSubject] = useState<Subject>(null)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [totalXp, setTotalXp] = useState(150)

  // پایان بازی
  const handleGameFinish = (result: GameResult): void => {
    setGameResult(result)
    setTotalXp((prev) => prev + result.xpEarned)
  }

  // بازی دوباره
  const handlePlayAgain = (): void => {
    setGameResult(null)
  }

  // تغییر درس
  const handleChangeSubject = (): void => {
    setSelectedSubject(null)
    setGameResult(null)
  }

  // برگشت به انتخاب درس
  const handleBack = (): void => {
    setSelectedSubject(null)
    setGameResult(null)
  }

  return (
    <DashboardPage
      className="max-w-3xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <span className="text-4xl">🎮</span>
          زمین بازی تمرین
        </span>
      }
      description={
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-yellow" />
          یاد بگیر و بازی کن!
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl px-4 py-2 border border-yellow-500/30 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{totalXp}</span>
            <span className="text-yellow-400/70 text-sm">XP</span>
          </div>
          <Link href="/student">
            <Button variant="outline" size="icon" className="glass-panel-quiet" aria-label="بازگشت">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      }
      animatedSections={false}
    >
      <LuxStagger className="space-y-6" stagger={0.12}>
        <LuxStaggerItem>
        <main>
          {/* نمایش نتیجه */}
          {gameResult ? (
            <GameResultCard
              result={gameResult}
              subject={selectedSubject}
              onPlayAgain={handlePlayAgain}
              onChangeSubject={handleChangeSubject}
            />
          ) : !selectedSubject ? (
            /* انتخاب درس */
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                یک درس انتخاب کن!
              </h2>
              <SubjectSelector onSelect={setSelectedSubject} />
            </GlassCard>
          ) : selectedSubject === 'math' ? (
            /* بازی ریاضی */
            <MathGame onFinish={handleGameFinish} onBack={handleBack} />
          ) : selectedSubject === 'spelling' ? (
            /* بازی املا */
            <SpellingGame onFinish={handleGameFinish} onBack={handleBack} />
          ) : null}
        </main>
        </LuxStaggerItem>

        <LuxStaggerItem>
        <footer className="text-center text-muted-foreground text-sm py-6 mt-6">
          <p>🎓 یادگیری با هوشاگر، لذت‌بخش و هوشمند!</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
        </LuxStaggerItem>
      </LuxStagger>
    </DashboardPage>
  )
}

















































