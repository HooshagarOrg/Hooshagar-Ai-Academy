'use client'

import { Bar, BarChart, ResponsiveContainer } from 'recharts'
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface GradesBarChartProps {
  data: Array<{ subject: string; score: number }>
}

export function GradesBarChart({ data }: GradesBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
