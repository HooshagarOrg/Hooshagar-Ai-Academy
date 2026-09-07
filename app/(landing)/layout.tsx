import type { ReactNode } from 'react'
import '../styles/landing.css'

export default function LandingLayout({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  return <>{children}</>
}
