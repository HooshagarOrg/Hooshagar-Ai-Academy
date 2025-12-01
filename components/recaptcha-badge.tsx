// =====================================
// 🔒 reCAPTCHA Badge Component
// =====================================
// نمایش Badge محافظت reCAPTCHA

import { Shield } from 'lucide-react'

export function RecaptchaBadge() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <Shield className="w-3 h-3" />
      <span>این سایت توسط Google reCAPTCHA محافظت می‌شود</span>
    </div>
  )
}

export function RecaptchaInfo() {
  return (
    <div className="text-xs text-center text-muted-foreground mt-4 space-y-1">
      <p>این سایت توسط Google reCAPTCHA محافظت می‌شود</p>
      <p className="text-[10px]">
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          حریم خصوصی
        </a>
        {' و '}
        <a
          href="https://policies.google.com/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          شرایط استفاده
        </a>
        {' Google اعمال می‌شود'}
      </p>
    </div>
  )
}

