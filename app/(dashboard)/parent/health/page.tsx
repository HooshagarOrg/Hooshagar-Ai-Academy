'use client'

import { useEffect, useState } from 'react'
import {
  Heart,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardPage } from '@/components/layout/dashboard-page'

type HealthRecord = {
  blood_type: string | null
  chronic_diseases: string[] | null
  allergies: string[] | Record<string, unknown> | null
  medications: Array<{ name?: string; dosage?: string } | string> | null
  sports_restrictions: string[] | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  students?: { full_name?: string; classes?: { name?: string } | { name?: string }[] }
}

type Checkup = {
  id: string
  checkup_date: string
  checkup_type: string
  result_summary: string | null
  needs_followup: boolean | null
}

function asList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'name' in item) {
        const named = item as { name?: string; dosage?: string }
        return named.dosage ? `${named.name} (${named.dosage})` : named.name || ''
      }
      return String(item)
    }).filter(Boolean)
  }
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
  }
  return []
}

export default function ParentHealthPage() {
  const [loading, setLoading] = useState(true)
  const [childName, setChildName] = useState('')
  const [className, setClassName] = useState('')
  const [record, setRecord] = useState<HealthRecord | null>(null)
  const [checkups, setCheckups] = useState<Checkup[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const dashRes = await fetch('/api/parent/dashboard')
        const dash = await dashRes.json()
        const studentId = dash.activeChild?.id as string | undefined
        setChildName(dash.activeChild?.name || '')
        setClassName(dash.activeChild?.className || '')
        if (!studentId) {
          setError('فرزندی به حساب شما متصل نیست')
          return
        }

        const [recordRes, checkupRes] = await Promise.all([
          fetch(`/api/health/records?studentId=${studentId}`),
          fetch(`/api/health/checkups?studentId=${studentId}&limit=20`),
        ])
        const recordJson = await recordRes.json()
        const checkupJson = await checkupRes.json()
        if (!recordRes.ok) {
          setError(recordJson.error || 'دریافت پرونده سلامت ناموفق بود')
          return
        }
        setRecord(recordJson.data || null)
        setCheckups(Array.isArray(checkupJson.data) ? checkupJson.data : [])
      } catch {
        setError('خطای شبکه در دریافت پرونده سلامت')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <DashboardPage title="سلامت فرزند من">
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        </div>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-teal-400" />
          سلامت فرزند من
        </span>
      }
      description={childName ? `پرونده سلامت ${childName}${className ? ` — ${className}` : ''}` : 'پرونده سلامت ثبت‌شده در مدرسه'}
    >
      {error ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">{error}</CardContent>
        </Card>
      ) : !record ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Heart className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">هنوز پرونده سلامت برای فرزند شما ثبت نشده است</p>
            <p className="mt-2 text-sm text-muted-foreground/70">وقتی واحد بهداشت مدرسه پرونده را تکمیل کند، اینجا دیده می‌شود</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">گروه خونی</p>
                <p className="mt-1 text-lg font-semibold">{record.blood_type || 'ثبت نشده'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">بیماری مزمن</p>
                <p className="mt-1 text-lg font-semibold">
                  {asList(record.chronic_diseases).join('، ') || 'موردی ثبت نشده'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">تماس اضطراری</p>
                <p className="mt-1 font-semibold">{record.emergency_contact_name || 'ثبت نشده'}</p>
                {record.emergency_contact_phone ? (
                  <p className="text-sm text-muted-foreground">{record.emergency_contact_phone}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" />
                آلرژی و محدودیت
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {asList(record.allergies).length === 0 && asList(record.sports_restrictions).length === 0 ? (
                <p className="text-sm text-muted-foreground">موردی ثبت نشده است</p>
              ) : (
                <>
                  {asList(record.allergies).map((item) => (
                    <Badge key={item} variant="destructive">{item}</Badge>
                  ))}
                  {asList(record.sports_restrictions).map((item) => (
                    <Badge key={item} variant="secondary">{item}</Badge>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">داروها</CardTitle>
            </CardHeader>
            <CardContent>
              {asList(record.medications).length === 0 ? (
                <p className="text-sm text-muted-foreground">دارویی ثبت نشده است</p>
              ) : (
                <ul className="list-disc space-y-1 pr-5 text-sm">
                  {asList(record.medications).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                معاینات ثبت‌شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkups.length === 0 ? (
                <p className="text-sm text-muted-foreground">معاینه‌ای ثبت نشده است</p>
              ) : (
                <ul className="space-y-3">
                  {checkups.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{item.checkup_type}</p>
                        <p className="text-sm text-muted-foreground">{item.result_summary || 'بدون توضیح'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {item.needs_followup ? (
                          <Badge variant="outline">نیاز به پیگیری</Badge>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        )}
                        {item.checkup_date}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardPage>
  )
}
