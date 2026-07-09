'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export interface AttendancePieDatum {
  name: string
  value: number
  color: string
}

interface AttendancePieChartProps {
  data: AttendancePieDatum[]
}

export function AttendancePieChart({ data }: AttendancePieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--lux-text-muted)]">
        داده‌ای برای نمایش نیست
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgba(26, 32, 48, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#F1F5F9',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
