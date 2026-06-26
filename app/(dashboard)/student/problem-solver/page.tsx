import { Metadata } from 'next'
import { ProblemSolverClient } from '@/components/student/problem-solver-client'

export const metadata: Metadata = {
  title: 'حل مسئله | هوشاگر',
  description: 'حل مسائل درسی از روی عکس با هوش مصنوعی',
}

export default function ProblemSolverPage() {
  return <ProblemSolverClient />
}
