'use client'

import { StudentAiToolClient } from '@/components/student/student-ai-tool-client'
import { practicePlaygroundSystemPrompt } from '@/lib/ai/elementary-prompts'

export default function PracticePlaygroundPage() {
  return (
    <StudentAiToolClient
      featureName="practice_playground"
      title="زمین بازی مطالعه"
      description="یک تمرین کوتاه و شیرین برای درس انتخابی بگیر و با کمک هوش مصنوعی بازخورد بگیر"
      placeholder="مثلاً: یک تمرین ریاضی پایهٔ چهارم بده"
      showSubjectPicker
      quickPrompts={[
        'یک سوال ریاضی بده',
        'یک کلمهٔ جدید فارسی یادم بده',
        'یک معمای علوم ساده',
      ]}
      buildPrompt={(text, grade, subject) =>
        `${practicePlaygroundSystemPrompt(grade, subject)}\n\nدرخواست دانش‌آموز: ${text}`
      }
    />
  )
}
