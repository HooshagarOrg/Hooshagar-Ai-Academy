'use client'

import { useEffect, useState } from 'react'
import { formatShamsiDate, toGregorianIsoDate, type JalaliDatePreset } from '@/lib/date/jalali'

/** تاریخ شمسی زنده — فقط بعد از mount (جلوگیری از hydration mismatch) */
export function usePersianDateString(preset: JalaliDatePreset = 'full'): string {
  const [value, setValue] = useState('\u00a0')

  useEffect(() => {
    const update = () => setValue(formatShamsiDate(new Date(), preset))
    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [preset])

  return value
}

/** تاریخ ISO میلادی برای time[dateTime] */
export function useGregorianIsoDate(): string {
  const [value, setValue] = useState('')

  useEffect(() => {
    const update = () => setValue(toGregorianIsoDate(new Date()))
    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [])

  return value
}
