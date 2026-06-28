'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'

// =====================================
// Types
// =====================================

interface Student {
  id: string
  grade: number
  user: {
    full_name: string
  }
  class: {
    name: string
  }
}

interface StudentsTableProps {
  initialStudents: Student[]
}

// =====================================
// Students Table Component
// =====================================

export default function StudentsTable({ initialStudents }: StudentsTableProps) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // State برای فرم افزودن دانش‌آموز
  const [formData, setFormData] = useState({
    full_name: '',
    grade: '',
    class_id: '',
    parent_email: '',
  })

  // =====================================
  // Handlers
  // =====================================

  const handleAddStudent = async () => {
    if (!formData.full_name || !formData.grade || !formData.class_id) {
      toast.error('لطفاً تمام فیلدهای الزامی را پر کنید')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          grade: parseInt(formData.grade),
          class_id: formData.class_id,
          parent_email: formData.parent_email || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'خطا در افزودن دانش‌آموز')
      }

      toast.success('دانش‌آموز با موفقیت اضافه شد')
      setIsAddModalOpen(false)
      setFormData({ full_name: '', grade: '', class_id: '', parent_email: '' })
      
      // بروزرسانی لیست
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'خطا در افزودن دانش‌آموز')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudentId) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/students/${selectedStudentId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'خطا در حذف دانش‌آموز')
      }

      toast.success('دانش‌آموز با موفقیت حذف شد')
      setIsDeleteModalOpen(false)
      setSelectedStudentId(null)
      
      // حذف از state
      setStudents(students.filter(s => s.id !== selectedStudentId))
      
      // بروزرسانی از سرور
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'خطا در حذف دانش‌آموز')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (studentId: string) => {
    router.push(`/teacher/students/${studentId}`)
  }

  // =====================================
  // Render
  // =====================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">دانش‌آموزان</h2>
          <p className="text-sm text-muted-foreground">
            مدیریت دانش‌آموزان کلاس‌های شما
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="min-h-10 w-full sm:w-auto">
          افزودن دانش‌آموز
        </Button>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="هنوز دانش‌آموزی ثبت نشده"
          description="اولین دانش‌آموز کلاس خود را اضافه کنید."
          action={
            <Button onClick={() => setIsAddModalOpen(true)} className="min-h-10">
              افزودن دانش‌آموز
            </Button>
          }
        />
      ) : (
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>نام و نام خانوادگی</TableHead>
              <TableHead>پایه تحصیلی</TableHead>
              <TableHead>کلاس</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.user.full_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">پایه {student.grade}</Badge>
                  </TableCell>
                  <TableCell>{student.class.name}</TableCell>
                  <TableCell className="text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-9"
                        onClick={() => handleViewDetails(student.id)}
                      >
                        جزئیات
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="min-h-9"
                        onClick={() => {
                          setSelectedStudentId(student.id)
                          setIsDeleteModalOpen(true)
                        }}
                      >
                        حذف
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      )}

      {/* Add Student Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن دانش‌آموز جدید</DialogTitle>
            <DialogDescription>
              اطلاعات دانش‌آموز جدید را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">نام و نام خانوادگی *</Label>
              <Input
                id="full_name"
                placeholder="مثال: علی احمدی"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">پایه تحصیلی *</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) =>
                  setFormData({ ...formData, grade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب پایه" />
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
              <Label htmlFor="class_id">شناسه کلاس *</Label>
              <Input
                id="class_id"
                placeholder="UUID کلاس"
                value={formData.class_id}
                onChange={(e) =>
                  setFormData({ ...formData, class_id: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_email">ایمیل والدین (اختیاری)</Label>
              <Input
                id="parent_email"
                type="email"
                placeholder="parent@example.com"
                value={formData.parent_email}
                onChange={(e) =>
                  setFormData({ ...formData, parent_email: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isLoading}
            >
              انصراف
            </Button>
            <Button onClick={handleAddStudent} disabled={isLoading}>
              {isLoading ? 'در حال افزودن...' : 'افزودن'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأیید حذف</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید این دانش‌آموز را حذف کنید؟ این عمل
              قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setSelectedStudentId(null)
              }}
              disabled={isLoading}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStudent}
              disabled={isLoading}
            >
              {isLoading ? 'در حال حذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

