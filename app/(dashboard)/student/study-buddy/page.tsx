import { Metadata } from 'next'
import { StudyBuddyClient } from '@/components/student/study-buddy-client'

export const metadata: Metadata = {
  title: 'دستیار مطالعه | هوشاگر',
  description: 'پرسش و پاسخ درسی با دستیار هوشمند',
}

export default function StudyBuddyPage() {
  return <StudyBuddyClient />
}
