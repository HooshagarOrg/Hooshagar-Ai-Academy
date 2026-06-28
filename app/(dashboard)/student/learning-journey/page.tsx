import type { Metadata } from 'next'
import { LearningJourneyContent } from '@/components/student/learning-journey-content'

export const metadata: Metadata = {
  title: 'مسیر یادگیری | هوشاگر',
  description: 'برنامه شخصی‌سازی‌شده یادگیری دانش‌آموز',
}

export default function LearningJourneyPage() {
  return <LearningJourneyContent />
}
