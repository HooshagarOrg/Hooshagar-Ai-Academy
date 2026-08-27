'use client'

import dynamic from 'next/dynamic'

export { default as ParentAttendanceCard } from './parent-attendance-card'
export { default as CounselorAttendanceCard } from './counselor-attendance-card'

/** recharts — بارگذاری تنبل */
export const PrincipalAttendanceCard = dynamic(
  () => import('./principal-attendance-card'),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-lg bg-muted" aria-hidden />
    ),
  }
)

export const AdminAttendanceCard = dynamic(
  () => import('./admin-attendance-card'),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-lg bg-muted" aria-hidden />
    ),
  }
)
