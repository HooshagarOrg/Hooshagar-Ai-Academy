import Link from 'next/link'
import { Construction, ArrowRight, Sparkles, Clock } from 'lucide-react'
import { Button } from './button'

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
      <div className="max-w-md w-full text-center">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto">
            <Construction className="w-12 h-12 text-blue-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-yellow-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">{description}</p>

        {features && features.length > 0 && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-right">
            <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              قابلیت‌های در حال توسعه:
            </p>
            <ul className="space-y-1.5">
              {features.map((f, i) => (
                <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
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
      </div>
    </div>
  )
}
