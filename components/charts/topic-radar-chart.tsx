'use client'

import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts'

interface TopicRadarChartProps {
  data: Array<{ topic: string; score: number }>
}

export function TopicRadarChart({ data }: TopicRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="topic" fontSize={12} />
        <PolarRadiusAxis domain={[0, 100]} />
        <Radar
          name="نمره"
          dataKey="score"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.5}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}
