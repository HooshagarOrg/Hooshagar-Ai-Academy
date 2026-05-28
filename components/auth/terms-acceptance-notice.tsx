import Link from 'next/link'

/** متن پذیرش قوانین — زیر فرم‌های ورود */
export function TermsAcceptanceNotice({ className }: { className?: string }) {
  return (
    <p className={`text-xs text-center text-muted-foreground leading-relaxed ${className ?? ''}`}>
      با ورود به سامانه،{' '}
      <Link
        href="/terms"
        className="text-brand-magenta font-medium hover:underline underline-offset-2"
      >
        قوانین و شرایط استفاده
      </Link>
      {' '}و{' '}
      <Link
        href="/privacy"
        className="text-brand-magenta font-medium hover:underline underline-offset-2"
      >
        حریم خصوصی
      </Link>
      {' '}هوشاگر را می‌پذیرید.
    </p>
  )
}
