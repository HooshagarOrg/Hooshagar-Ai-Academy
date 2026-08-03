'use client'

import { useMemo } from 'react'
import DatePicker, { DateObject } from 'react-multi-date-picker'
import TimePicker from 'react-multi-date-picker/plugins/time_picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import gregorian from 'react-date-object/calendars/gregorian'
import { cn } from '@/lib/utils'

export type PersianDateTimeValue = string

interface PersianDateTimePickerProps {
  value: PersianDateTimeValue
  onChange: (value: PersianDateTimeValue) => void
  id?: string
  disabled?: boolean
  placeholder?: string
  className?: string
  /** حداقل تاریخ قابل انتخاب (ISO یا datetime-local) */
  min?: string
}

/** تبدیل مقدار ذخیره‌شده (ISO / datetime-local) به DateObject شمسی */
function toPickerValue(value: string): DateObject | undefined {
  if (!value?.trim()) return undefined
  const d = new Date(value.includes('T') && !value.endsWith('Z') && value.length <= 16
    ? `${value}:00`
    : value)
  if (Number.isNaN(d.getTime())) return undefined
  return new DateObject({ date: d, calendar: persian, locale: persian_fa })
}

/** خروجی سازگار با datetime-local و درج در Postgres timestamptz */
export function toDatetimeLocalValue(date: DateObject | null | undefined): string {
  if (!date) return ''
  return date.convert(gregorian).format('YYYY-MM-DDTHH:mm')
}

/**
 * انتخابگر تاریخ و ساعت شمسی — مقدار داخلی Gregorian datetime-local است
 * تا APIها بدون تغییر کار کنند.
 */
export function PersianDateTimePicker({
  value,
  onChange,
  id,
  disabled,
  placeholder = 'انتخاب تاریخ و ساعت',
  className,
  min,
}: PersianDateTimePickerProps) {
  const pickerValue = useMemo(() => toPickerValue(value), [value])
  const minDate = useMemo(() => (min ? toPickerValue(min) : undefined), [min])

  return (
    <DatePicker
      id={id}
      value={pickerValue}
      disabled={disabled}
      calendar={persian}
      locale={persian_fa}
      format="YYYY/MM/DD HH:mm"
      calendarPosition="bottom-right"
      containerClassName="w-full"
      minDate={minDate}
      placeholder={placeholder}
      editable={false}
      portal
      zIndex={80}
      plugins={[
        <TimePicker key="time" hideSeconds position="bottom" />,
      ]}
      onChange={(date) => {
        if (!date || Array.isArray(date)) {
          onChange('')
          return
        }
        onChange(toDatetimeLocalValue(date))
      }}
      inputClass={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'text-left',
        className,
      )}
      style={{ width: '100%' }}
    />
  )
}
