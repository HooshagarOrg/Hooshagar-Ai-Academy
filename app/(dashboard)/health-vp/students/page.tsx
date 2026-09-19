'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Heart, Loader2, Pencil, Plus } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type HealthRecord = {
  id: string
  student_id: string
  school_id: string | null
  blood_type: string | null
  chronic_diseases: string[] | null
  allergies: Record<string, unknown> | null
  medications: string[] | null
  sports_restrictions: string[] | null
  special_needs: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  family_doctor_name: string | null
  family_doctor_phone: string | null
  insurance_company: string | null
  insurance_number: string | null
  students?: {
    id?: string
    full_name?: string
    classes?: { name?: string } | { name?: string }[]
  }
}

type StudentOption = {
  id: string
  full_name: string
  school_id: string | null
}

type FormState = {
  studentId: string
  schoolId: string
  bloodType: string
  chronicDiseases: string
  allergies: string
  medications: string
  sportsRestrictions: string
  specialNeeds: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  familyDoctorName: string
  familyDoctorPhone: string
  insuranceCompany: string
  insuranceNumber: string
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

const emptyForm = (): FormState => ({
  studentId: '',
  schoolId: '',
  bloodType: '',
  chronicDiseases: '',
  allergies: '',
  medications: '',
  sportsRestrictions: '',
  specialNeeds: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  familyDoctorName: '',
  familyDoctorPhone: '',
  insuranceCompany: '',
  insuranceNumber: '',
})

function classNameOf(record: HealthRecord): string {
  const cls = record.students?.classes
  const row = Array.isArray(cls) ? cls[0] : cls
  return row?.name || ''
}

function splitList(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function allergiesNote(allergies: Record<string, unknown> | null): string {
  if (!allergies || typeof allergies !== 'object') return ''
  if (typeof allergies.note === 'string') return allergies.note
  return Object.values(allergies)
    .filter((v): v is string => typeof v === 'string')
    .join('، ')
}

function recordToForm(record: HealthRecord): FormState {
  return {
    studentId: record.student_id,
    schoolId: record.school_id || '',
    bloodType: record.blood_type || '',
    chronicDiseases: (record.chronic_diseases || []).join('، '),
    allergies: allergiesNote(record.allergies),
    medications: (record.medications || []).join('، '),
    sportsRestrictions: (record.sports_restrictions || []).join('، '),
    specialNeeds: record.special_needs || '',
    emergencyContactName: record.emergency_contact_name || '',
    emergencyContactPhone: record.emergency_contact_phone || '',
    emergencyContactRelation: record.emergency_contact_relation || '',
    familyDoctorName: record.family_doctor_name || '',
    familyDoctorPhone: record.family_doctor_phone || '',
    insuranceCompany: record.insurance_company || '',
    insuranceNumber: record.insurance_number || '',
  }
}

export default function HealthVpStudentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [recordsRes, studentsRes] = await Promise.all([
        fetch('/api/health/records'),
        fetch('/api/students?limit=100'),
      ])
      const recordsJson = await recordsRes.json()
      const studentsJson = await studentsRes.json()

      if (!recordsRes.ok || recordsJson.success === false) {
        setError(recordsJson.error || 'دریافت پرونده‌ها ناموفق بود')
        return
      }

      setRecords((recordsJson.data || []) as HealthRecord[])
      setError('')

      const rows = (studentsJson.students || []) as Array<{
        id: string
        full_name?: string | null
        school_id?: string | null
        profiles?: { full_name?: string } | { full_name?: string }[]
      }>
      setStudents(
        rows.map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
          return {
            id: row.id,
            full_name: row.full_name || profile?.full_name || 'دانش‌آموز',
            school_id: row.school_id ?? null,
          }
        })
      )
    } catch {
      setError('خطای اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const studentsWithoutRecord = useMemo(() => {
    const taken = new Set(records.map((r) => r.student_id))
    return students.filter((s) => !taken.has(s.id))
  }, [records, students])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (record: HealthRecord) => {
    setEditingId(record.id)
    setForm(recordToForm(record))
    setDialogOpen(true)
  }

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const onStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    setForm((current) => ({
      ...current,
      studentId,
      schoolId: student?.school_id || current.schoolId,
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId && !form.studentId) {
      toast.error('دانش‌آموز را انتخاب کنید')
      return
    }

    setSaving(true)
    try {
      const payload = {
        bloodType: form.bloodType || null,
        chronicDiseases: splitList(form.chronicDiseases),
        allergies: form.allergies.trim() ? { note: form.allergies.trim() } : {},
        medications: splitList(form.medications),
        sportsRestrictions: splitList(form.sportsRestrictions),
        specialNeeds: form.specialNeeds.trim() || null,
        emergencyContactName: form.emergencyContactName.trim() || null,
        emergencyContactPhone: form.emergencyContactPhone.trim() || null,
        emergencyContactRelation: form.emergencyContactRelation.trim() || null,
        familyDoctorName: form.familyDoctorName.trim() || null,
        familyDoctorPhone: form.familyDoctorPhone.trim() || null,
        insuranceCompany: form.insuranceCompany.trim() || null,
        insuranceNumber: form.insuranceNumber.trim() || null,
      }

      const res = await fetch('/api/health/records', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId
            ? { id: editingId, ...payload }
            : {
                studentId: form.studentId,
                schoolId: form.schoolId || undefined,
                ...payload,
              }
        ),
      })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        toast.error(json.error || 'ذخیره پرونده ناموفق بود')
        return
      }
      toast.success(editingId ? 'پرونده بروزرسانی شد' : 'پرونده ثبت شد')
      setDialogOpen(false)
      setLoading(true)
      await load()
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage
      kicker="معاون بهداشت"
      title="پرونده‌های بهداشتی"
      actions={
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4 ml-1" />
          پرونده جدید
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Heart} title="پرونده‌ها در دسترس نیست" description={error} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="هنوز پرونده بهداشتی ثبت نشده"
          description="با دکمهٔ «پرونده جدید» اولین پرونده را بسازید."
        />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <GlassCard key={record.id} className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{record.students?.full_name || 'دانش‌آموز'}</p>
                <p className="text-sm text-[var(--lux-text-muted)]">
                  {classNameOf(record) ? `کلاس ${classNameOf(record)} · ` : ''}
                  گروه خونی: {record.blood_type || 'ثبت نشده'}
                </p>
                {record.emergency_contact_name ? (
                  <p className="text-sm mt-1 text-[var(--lux-text-muted)]">
                    اضطراری: {record.emergency_contact_name}
                    {record.emergency_contact_phone ? ` — ${record.emergency_contact_phone}` : ''}
                  </p>
                ) : null}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => openEdit(record)}>
                <Pencil className="h-3.5 w-3.5 ml-1" />
                ویرایش
              </Button>
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'ویرایش پرونده سلامت' : 'پرونده سلامت جدید'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            {!editingId ? (
              <div className="space-y-2">
                <Label>دانش‌آموز</Label>
                <Select value={form.studentId} onValueChange={onStudentChange}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        studentsWithoutRecord.length === 0
                          ? 'همه دانش‌آموزان پرونده دارند'
                          : 'انتخاب دانش‌آموز'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsWithoutRecord.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>گروه خونی</Label>
              <Select
                value={form.bloodType || undefined}
                onValueChange={(value) => updateField('bloodType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختیاری" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>بیماری‌های مزمن (با ویرگول)</Label>
              <Input
                value={form.chronicDiseases}
                onChange={(e) => updateField('chronicDiseases', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>آلرژی‌ها</Label>
              <Textarea
                value={form.allergies}
                onChange={(e) => updateField('allergies', e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>داروها (با ویرگول)</Label>
              <Input
                value={form.medications}
                onChange={(e) => updateField('medications', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>محدودیت ورزشی (با ویرگول)</Label>
              <Input
                value={form.sportsRestrictions}
                onChange={(e) => updateField('sportsRestrictions', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>نیازهای ویژه</Label>
              <Textarea
                value={form.specialNeeds}
                onChange={(e) => updateField('specialNeeds', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>نام تماس اضطراری</Label>
                <Input
                  value={form.emergencyContactName}
                  onChange={(e) => updateField('emergencyContactName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>تلفن اضطراری</Label>
                <Input
                  value={form.emergencyContactPhone}
                  onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                  className="text-left"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>نسبت تماس اضطراری</Label>
              <Input
                value={form.emergencyContactRelation}
                onChange={(e) => updateField('emergencyContactRelation', e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>پزشک خانواده</Label>
                <Input
                  value={form.familyDoctorName}
                  onChange={(e) => updateField('familyDoctorName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>تلفن پزشک</Label>
                <Input
                  value={form.familyDoctorPhone}
                  onChange={(e) => updateField('familyDoctorPhone', e.target.value)}
                  className="text-left"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>بیمه</Label>
                <Input
                  value={form.insuranceCompany}
                  onChange={(e) => updateField('insuranceCompany', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>شماره بیمه</Label>
                <Input
                  value={form.insuranceNumber}
                  onChange={(e) => updateField('insuranceNumber', e.target.value)}
                  className="text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={saving || (!editingId && !form.studentId)}>
                {saving ? 'در حال ذخیره...' : 'ذخیره'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  )
}
