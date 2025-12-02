'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

interface School {
  id: string
  name: string
}

interface Class {
  id: string
  name: string
  teacher_id: string
}

interface Teacher {
  id: string
  first_name: string
  last_name: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  grade: number
  school_id: string
  class_id: string | null
  teacher_id: string | null
  is_active: boolean
}

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    grade: 1,
    school_id: '',
    class_id: '',
    teacher_id: '',
    is_active: true,
  })

  useEffect(() => {
    fetchData()
  }, [params.id])

  useEffect(() => {
    if (formData.school_id) {
      fetchClasses(formData.school_id)
    }
  }, [formData.school_id])

  const fetchData = async () => {
    try {
      // دریافت اطلاعات دانش‌آموز
      const studentRes = await fetch(`/api/students/${params.id}`)
      const studentData = await studentRes.json()

      if (studentData.success) {
        const s = studentData.data
        setStudent(s)
        setFormData({
          first_name: s.first_name,
          last_name: s.last_name,
          grade: s.grade,
          school_id: s.school_id || '',
          class_id: s.class_id || '',
          teacher_id: s.teacher_id || '',
          is_active: s.is_active,
        })
      }

      // دریافت لیست مدارس
      const schoolsRes = await fetch('/api/schools')
      const schoolsData = await schoolsRes.json()
      if (schoolsData.success) {
        setSchools(schoolsData.data)
      }

      // دریافت لیست معلمان
      const teachersRes = await fetch('/api/teachers')
      const teachersData = await teachersRes.json()
      if (teachersData.success) {
        setTeachers(teachersData.data)
      }
    } catch (error) {
      console.error('خطا در دریافت اطلاعات:', error)
      toast.error('خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async (schoolId: string) => {
    try {
      const response = await fetch(`/api/classes?school_id=${schoolId}`)
      const data = await response.json()

      if (data.success) {
        setClasses(data.data)
      }
    } catch (error) {
      console.error('خطا در دریافت کلاس‌ها:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/students/${params.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          grade: formData.grade,
          school_id: formData.school_id || null,
          class_id: formData.class_id || null,
          teacher_id: formData.teacher_id || null,
          is_active: formData.is_active,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        router.push('/admin/students')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('خطا در ذخیره تغییرات:', error)
      toast.error('خطا در ذخیره تغییرات')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">در حال بارگذاری...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="ml-2 h-4 w-4" />
        بازگشت
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>✏️ ویرایش اطلاعات دانش‌آموز</CardTitle>
          <CardDescription>
            ویرایش اطلاعات {student?.first_name} {student?.last_name}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">نام *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">نام خانوادگی *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">پایه تحصیلی *</Label>
              <Select
                value={formData.grade.toString()}
                onValueChange={(value) => setFormData({ ...formData, grade: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      پایه {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">مدرسه *</Label>
              <Select
                value={formData.school_id}
                onValueChange={(value) => setFormData({ ...formData, school_id: value, class_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب مدرسه" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">کلاس</Label>
              <Select
                value={formData.class_id}
                onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                disabled={!formData.school_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کلاس" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.school_id && (
                <p className="text-sm text-muted-foreground">ابتدا مدرسه را انتخاب کنید</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher">معلم کلاس</Label>
              <Select
                value={formData.teacher_id}
                onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب معلم" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                دانش‌آموز فعال است
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              انصراف
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                'در حال ذخیره...'
              ) : (
                <>
                  <Save className="ml-2 h-4 w-4" />
                  ذخیره تغییرات
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

