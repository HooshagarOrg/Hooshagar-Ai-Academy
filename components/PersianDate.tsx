'use client'

import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { getFullPersianDate } from '@/lib/shamsi-date'

interface PersianDateProps {
  className?: string
  showIcon?: boolean
}

export default function PersianDate({ className = '', showIcon = true }: PersianDateProps) {
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateDateTime = () => {
      setDate(getFullPersianDate())
      
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setTime(`${hours}:${minutes}`)
    }

    // Initial update
    updateDateTime()

    // Update every minute
    const interval = setInterval(updateDateTime, 60000)

    return () => clearInterval(interval)
  }, [])

  if (!date) return null

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`} dir="rtl">
      {showIcon && <Calendar className="w-4 h-4" />}
      <span className="font-medium">{date}</span>
      <span className="text-gray-500">•</span>
      <span className="text-gray-600">{time}</span>
    </div>
  )
}



