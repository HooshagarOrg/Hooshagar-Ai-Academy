'use client'

import { StudentAiToolClient } from '@/components/student/student-ai-tool-client'
import { aiGuidanceSystemPrompt } from '@/lib/ai/elementary-prompts'

export default function AiGuidancePage() {
  return (
    <StudentAiToolClient
      featureName="ai_guidance"
      title="راهنمای مطالعه"
      description="برای برنامهٔ مطالعه، تمرکز و عادت‌های خوب یادگیری راهنمایی بگیر"
      placeholder="مثلاً: چطور هر روز ۲۰ دقیقه منظم مطالعه کنم؟"
      quickPrompts={[
        'برنامه مطالعه هفتگی',
        'قبل امتحان چکار کنم؟',
        'وقتی حوصله ندارم',
      ]}
      buildPrompt={(text, grade) =>
        `${aiGuidanceSystemPrompt(grade)}\n\nسؤال: ${text}`
      }
    />
  )
}
