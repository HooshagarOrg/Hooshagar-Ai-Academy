'use client'

import { useMemo } from 'react'
import {
  getYear,
  getMonth,
  getDate,
  getHours,
  getMinutes,
  getDaysInMonth,
  setYear,
  setMonth,
  setDate,
  setHours,
  setMinutes,
} from 'date-fns-jalali'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type PersianDateTimeValue = string

interface PersianDateTimePickerProps {
  value: PersianDateTimeValue
  onChange: (value: PersianDateTimeValue) => void
  id?: string
  disabled?: boolean
  className?: string
  min?: string
}

const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function toDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function parseStoredValue(value: string): Date | null {
  if (!value?.trim()) return null
  const raw =
    value.includes('T') && !value.endsWith('Z') && value.length <= 16
      ? `${value}:00`
      : value
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function buildDate(parts: {
  year: number
  monthIndex: number
  day: number
  hour: number
  minute: number
}): Date {
  let d = new Date()
  d = setYear(d, parts.year)
  d = setMonth(d, parts.monthIndex)
  const dim = getDaysInMonth(d)
  d = setDate(d, Math.min(parts.day, dim))
  d = setHours(d, parts.hour)
  d = setMinutes(d, parts.minute)
  d.setSeconds(0, 0)
  return d
}

export function PersianDateTimePicker({
  value,
  onChange,
  id,
  disabled,
  className,
  min,
}: PersianDateTimePickerProps) {
  const now = useMemo(() => new Date(), [])
  const currentYear = getYear(now)
  const parsed = useMemo(() => parseStoredValue(value), [value])
  const minDate = useMemo(() => parseStoredValue(min || ''), [min])

  const draft = useMemo(() => {
    const base = parsed ?? now
    return {
      year: getYear(base),
      monthIndex: getMonth(base),
      day: getDate(base),
      hour: parsed ? getHours(base) : 8,
      minute: parsed ? getMinutes(base) : 0,
      hasValue: !!parsed,
    }
  }, [parsed, now])

  const years = useMemo(() => {
    const list: number[] = []
    for (let y = currentYear - 1; y <= currentYear + 5; y += 1) list.push(y)
    if (draft.hasValue && !list.includes(draft.year)) list.push(draft.year)
    return list.sort((a, b) => a - b)
  }, [currentYear, draft.hasValue, draft.year])

  const daysInMonth = useMemo(() => {
    const probe = buildDate({
      year: draft.year,
      monthIndex: draft.monthIndex,
      day: 1,
      hour: 0,
      minute: 0,
    })
    return getDaysInMonth(probe)
  }, [draft.year, draft.monthIndex])

  const commit = (next: {
    year: number
    monthIndex: number
    day: number
    hour: number
    minute: number
  }) => {
    let d = buildDate(next)
    if (minDate && d.getTime() < minDate.getTime()) d = new Date(minDate.getTime())
    onChange(toDatetimeLocalValue(d))
  }

  const selectClass = 'h-9'

  return (
    <div id={id} className={cn('space-y-2', className)} dir="rtl">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">سال</Label>
          <Select
            disabled={disabled}
            value={draft.hasValue ? String(draft.year) : undefined}
            onValueChange={(v) =>
              commit({
                year: Number(v),
                monthIndex: draft.monthIndex,
                day: Math.min(draft.day, 29),
                hour: draft.hour,
                minute: draft.minute,
              })
            }
          >
            <SelectTrigger className={selectClass}>
              <SelectValue placeholder="سال" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">ماه</Label>
          <Select
            disabled={disabled}
            value={draft.hasValue ? String(draft.monthIndex) : undefined}
            onValueChange={(v) =>
              commit({
                year: draft.year,
                monthIndex: Number(v),
                day: Math.min(draft.day, 29),
                hour: draft.hour,
                minute: draft.minute,
              })
            }
          >
            <SelectTrigger className={selectClass}>
              <SelectValue placeholder="ماه" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, idx) => (
                <SelectItem key={name} value={String(idx)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">روز</Label>
          <Select
            disabled={disabled}
            value={draft.hasValue ? String(Math.min(draft.day, daysInMonth)) : undefined}
            onValueChange={(v) =>
              commit({
                year: draft.year,
                monthIndex: draft.monthIndex,
                day: Number(v),
                hour: draft.hour,
                minute: draft.minute,
              })
            }
          >
            <SelectTrigger className={selectClass}>
              <SelectValue placeholder="روز" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <SelectItem key={d} value={String(d)}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">ساعت</Label>
          <Select
            disabled={disabled}
            value={draft.hasValue ? String(draft.hour) : undefined}
            onValueChange={(v) =>
              commit({
                year: draft.year,
                monthIndex: draft.monthIndex,
                day: draft.day,
                hour: Number(v),
                minute: draft.minute,
              })
            }
          >
            <SelectTrigger className={selectClass}>
              <SelectValue placeholder="ساعت" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Array.from({ length: 24 }, (_, h) => (
                <SelectItem key={h} value={String(h)}>{pad2(h)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">دقیقه</Label>
          <Select
            disabled={disabled}
            value={draft.hasValue ? String(draft.minute) : undefined}
            onValueChange={(v) =>
              commit({
                year: draft.year,
                monthIndex: draft.monthIndex,
                day: draft.day,
                hour: draft.hour,
                minute: Number(v),
              })
            }
          >
            <SelectTrigger className={selectClass}>
              <SelectValue placeholder="دقیقه" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <SelectItem key={m} value={String(m)}>{pad2(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
