'use client'

import dynamic from 'next/dynamic'

/** recharts — بارگذاری تنبل */
const GrowthChart = dynamic(() => import('./growth-chart'), {
  ssr: false,
  loading: () => (
    <div className="h-64 animate-pulse rounded-lg bg-muted" aria-hidden />
  ),
})

export default GrowthChart
export { GrowthChart }
