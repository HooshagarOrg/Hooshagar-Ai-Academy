'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { History, TrendingUp, TrendingDown, Award, BookOpen, CheckCircle, Gift } from 'lucide-react'

interface XPTransaction {
  id: string
  xp_earned: number
  action_type: string
  metadata: any
  created_at: string
}

interface XPHistoryProps {
  studentId: string
  limit?: number
}

const sourceIcons: Record<string, any> = {
  homework: BookOpen,
  quiz: CheckCircle,
  attendance: CheckCircle,
  badge_reward: Award,
  bonus: Gift,
  other: History
}

const sourceLabels: Record<string, string> = {
  homework: 'تکلیف',
  quiz: 'آزمون',
  attendance: 'حضور',
  badge_reward: 'پاداش نشان',
  bonus: 'جایزه',
  other: 'سایر'
}

export default function XPHistory({ studentId, limit = 10 }: XPHistoryProps) {
  const [transactions, setTransactions] = useState<XPTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [studentId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/xp/history?studentId=${studentId}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to load XP history')
      }

      const data = await response.json()
      setTransactions(data.history || [])
    } catch (err) {
      console.error('❌ Error loading XP history:', err)
      setError('خطا در بارگذاری تاریخچه')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            تاریخچه امتیازات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            تاریخچه امتیازات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            تاریخچه امتیازات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            هنوز تراکنشی ثبت نشده است
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          تاریخچه امتیازات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {transactions.map((tx) => {
          const Icon = sourceIcons[tx.action_type] || History
          const isPositive = tx.xp_earned > 0
          const description = tx.metadata?.description || sourceLabels[tx.action_type] || 'تراکنش'

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Icon className={`h-4 w-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{tx.xp_earned.toLocaleString('fa-IR')}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

