import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, CheckCircle2, Compass, Target } from 'lucide-react'
import {
  AITutorPreview,
  LearningJourneyPreview,
  SoftCard,
  SoftFeatureCard,
} from '@/components/ui/hooshagaar-soft'

export const metadata: Metadata = {
  title: 'مسیر یادگیری | هوشاگر',
  description: 'برنامه شخصی‌سازی‌شده یادگیری دانش‌آموز',
}

const DAILY_PLAN = [
  { title: 'مرور ریاضی', time: '۱۵ دقیقه', done: true },
  { title: 'تمرین علوم', time: '۲۰ دقیقه', done: true },
  { title: 'فیزیک پایه', time: '۳۰ دقیقه', active: true },
  { title: 'سوال پیشنهادی AI', time: '۱۰ دقیقه' },
]

export default function LearningJourneyPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <SoftCard className="p-6 sm:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="hf-kicker mb-2">Learning Journey</p>
            <h1 className="hf-h1">
              مسیر یادگیری <span className="hf-gradient-text">شخصی تو</span>
            </h1>
            <p className="hf-body mt-4 max-w-2xl">
              هوشاگر هر روز بر اساس سطح، هدف، فعالیت‌های قبلی و پیشنهاد AI، مسیر بعدی را
              برایت می‌چیند.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/student/study-buddy" className="hf-btn-primary">
                از همراه AI کمک بگیر
              </Link>
              <Link href="/student/talent-garden" className="hf-btn-secondary">
                دیدن استعدادها
              </Link>
            </div>
          </div>
          <LearningJourneyPreview />
        </div>
      </SoftCard>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="hf-kicker mb-1">Daily Plan</p>
              <h2 className="text-2xl font-black text-[#111827]">برنامه امروز</h2>
            </div>
            <Target className="h-7 w-7 text-[#8B7CFF]" />
          </div>
          <div className="space-y-3">
            {DAILY_PLAN.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-3xl border border-[#DCE8FF] bg-white/75 p-4"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{
                    background: item.active ? '#8B7CFF18' : item.done ? '#39D98A18' : '#EAF1FF',
                    color: item.active ? '#8B7CFF' : item.done ? '#39D98A' : '#64748B',
                  }}
                >
                  {item.done ? <CheckCircle2 className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-black text-[#111827]">{item.title}</p>
                  <p className="text-xs text-[#64748B]">{item.time}</p>
                </div>
                {item.active && (
                  <span className="rounded-full bg-[#8B7CFF]/10 px-3 py-1 text-xs font-black text-[#8B7CFF]">
                    الان
                  </span>
                )}
              </div>
            ))}
          </div>
        </SoftCard>

        <AITutorPreview />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SoftFeatureCard
          icon={<Compass className="h-6 w-6" />}
          title="هدف هفته"
          description="روی تسلط پایه‌ای فیزیک و حل مسئله تمرکز کن."
          color="#8B7CFF"
        />
        <SoftFeatureCard
          icon={<Target className="h-6 w-6" />}
          title="گام بعدی"
          description="بعد از تمرین امروز، یک آزمون کوتاه برای تثبیت یادگیری بزن."
          color="#54D2FF"
        />
        <SoftFeatureCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="پیشرفت"
          description="۲ مرحله از مسیر امروز تکمیل شده و سطح تمرکزت رو به رشد است."
          color="#39D98A"
        />
      </div>
    </div>
  )
}
