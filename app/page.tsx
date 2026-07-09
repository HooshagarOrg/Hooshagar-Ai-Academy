import type { Metadata } from 'next'
import LandingPage from '@/components/landing/page'

export const metadata: Metadata = {
  title: 'هوشاگر | سیستم‌عامل هوشمند مدیریت مدارس',
  description:
    'هوشاگر با قدرت هوش مصنوعی، تحلیل تحصیلی، کشف استعداد، همراه مطالعه و گزارش‌های عمیق والدین را در یک پلتفرم یکپارچهٔ فارسی گرد هم می‌آورد.',
}

export default function Home(): JSX.Element {
  return <LandingPage />
}
