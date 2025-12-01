'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// =====================================
// Schema برای Form
// =====================================

const addStudentFormSchema = z.object({
  full_name: z
    .string()
    .min(2, 'نام باید حداقل 2 کاراکتر باشد')
    .max(100, 'نام نباید بیشتر از 100 کاراکتر باشد'),
  grade: z
    .string()
    .min(1, 'لطفاً پایه تحصیلی را انتخاب کنید')
    .transform((val) => parseInt(val, 10)),
  parent_email: z
    .string()
    .email('ایمیل نامعتبر است')
    .optional()
    .or(z.literal('')),
  class_id: z
    .string()
    .uuid('شناسه کلاس نامعتبر است')
    .optional()
    .or(z.literal('')),
})

type AddStudentFormValues = z.infer<typeof addStudentFormSchema>

// =====================================
// Component Props
// =====================================

interface AddStudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId?: string
  onSuccess?: () => void
}

// =====================================
// Add Student Modal Component
// =====================================

export default function AddStudentModal({
  open,
  onOpenChange,
  classId,
  onSuccess,
}: AddStudentModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // =====================================
  // Form Setup
  // =====================================

  const form = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentFormSchema),
    defaultValues: {
      full_name: '',
      grade: '',
      parent_email: '',
      class_id: classId || '',
    },
  })

  // =====================================
  // Submit Handler
  // =====================================

  async function onSubmit(values: AddStudentFormValues) {
    setIsSubmitting(true)

    try {
      const requestBody: Record<string, unknown> = {
        full_name: values.full_name,
        grade: values.grade,
      }

      // اضافه کردن فیلدهای اختیاری فقط اگر مقدار داشته باشند
      if (values.parent_email) {
        requestBody.parent_email = values.parent_email
      }

      if (values.class_id) {
        requestBody.class_id = values.class_id
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        // نمایش خطاهای اعتبارسنجی
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((detail: { field: string; message: string }) => {
            toast.error(`${detail.field}: ${detail.message}`)
          })
        } else {
          throw new Error(result.error || 'خطا در افزودن دانش‌آموز')
        }
        return
      }

      // موفقیت
      toast.success('دانش‌آموز با موفقیت اضافه شد', {
        description: result.credentials
          ? 'اطلاعات ورود به دانش‌آموز ارسال شد'
          : undefined,
      })

      // نمایش credentials اگر موجود باشد
      if (result.credentials) {
        toast.info('اطلاعات ورود دانش‌آموز', {
          description: `ایمیل: ${result.credentials.email}`,
          duration: 10000, // 10 ثانیه
        })
      }

      // بستن modal و reset form
      onOpenChange(false)
      form.reset()

      // callback موفقیت
      if (onSuccess) {
        onSuccess()
      }

      // بروزرسانی صفحه
      router.refresh()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'خطا در افزودن دانش‌آموز'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // =====================================
  // Close Handler
  // =====================================

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
      }
    }
  }

  // =====================================
  // Render
  // =====================================

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>افزودن دانش‌آموز جدید</DialogTitle>
          <DialogDescription>
            اطلاعات دانش‌آموز جدید را وارد کنید. فیلدهای ستاره‌دار الزامی هستند.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* نام کامل */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    نام و نام خانوادگی <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: علی احمدی"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* پایه تحصیلی */}
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    پایه تحصیلی <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب پایه" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                        <SelectItem key={grade} value={grade.toString()}>
                          پایه {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ایمیل والدین */}
            <FormField
              control={form.control}
              name="parent_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ایمیل والدین</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="parent@example.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    اختیاری - برای اتصال دانش‌آموز به حساب والدین
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* شناسه کلاس (hidden اگر از props آمده) */}
            {!classId && (
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شناسه کلاس</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UUID کلاس"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      اختیاری - UUID کلاسی که دانش‌آموز به آن تعلق دارد
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'در حال ذخیره...' : 'ذخیره'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
























