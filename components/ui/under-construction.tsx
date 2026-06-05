import Link from 'next/link'
import { Construction, ArrowRight, Sparkles, Clock } from 'lucide-react'
import { Button } from './button'
import { GlassCard } from './glass-card'

interface UnderConstructionProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  features?: string[]
}

export function UnderConstruction({
  title,
  description = 'این بخش در حال توسعه است و به‌زودی فعال خواهد شد',
  backHref = '/dashboard',
  backLabel = 'بازگشت به داشبورد',
  features,
}: UnderConstructionProps) {
  return (
    <div dir="rtl" className="min-h-[60vh] flex items-center justify-center px-4">
      <GlassCard className="max-w-md w-full text-center p-8">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-3xl bg-brand-purple/15 border border-brand-purple/20 flex items-center justify-center mx-auto">
            <Construction className="w-12 h-12 text-brand-purple" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-yellow/15 border border-brand-yellow/25 flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-brand-yellow" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>

        {features && features.length > 0 && (
          <div className="glass-panel-quiet rounded-2xl p-4 mb-6 text-right">
            <p className="text-sm font-bold mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4 text-brand-cyan" />
              قابلیت‌های در حال توسعه:
            </p>
            <ul className="space-y-1.5">
              {features.map((f, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan mt-1.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link href={backHref}>
          <Button variant="outline" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            {backLabel}
          </Button>
        </Link>
      </GlassCard>
    </div>
  )
}
