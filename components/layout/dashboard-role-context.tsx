'use client'

import { createContext, useContext } from 'react'

const DashboardRoleContext = createContext<string>('student')

export function DashboardRoleProvider({
  role,
  children,
}: {
  role: string
  children: React.ReactNode
}) {
  return (
    <DashboardRoleContext.Provider value={role}>
      {children}
    </DashboardRoleContext.Provider>
  )
}

export function useDashboardRole(): string {
  return useContext(DashboardRoleContext)
}
