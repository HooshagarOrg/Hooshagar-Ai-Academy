import { Metadata } from 'next'
import { TalentDiscoveryClient } from '@/components/talent/talent-discovery-client'

export const metadata: Metadata = {
  title: 'باغ استعداد | هوشاگر',
  description: 'کشف استعداد با کهکشان سه‌بعدی و تحلیل هوشمند',
}

export default function TalentGardenPage() {
  return <TalentDiscoveryClient />
}
