'use client'

import { useEffect, useState } from 'react'

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

/** تاریخ شمسی فقط بعد از mount — جلوگیری از hydration mismatch */
export function usePersianDateString(
  options: Intl.DateTimeFormatOptions = DEFAULT_OPTIONS,
): string {
  const optionsKey = JSON.stringify(options)
  const [value, setValue] = useState('\u00a0')

  useEffect(() => {
    const opts = JSON.parse(optionsKey) as Intl.DateTimeFormatOptions
    const format = () => new Intl.DateTimeFormat('fa-IR', opts).format(new Date())
    setValue(format())
    const timer = setInterval(format, 60_000)
    return () => clearInterval(timer)
  }, [optionsKey])

  return value
}
