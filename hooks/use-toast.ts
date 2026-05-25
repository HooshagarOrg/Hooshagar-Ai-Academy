import { toast as sonnerToast, type ExternalToast } from 'sonner'

/** سازگاری با فراخوانی‌های shadcn/ui: toast({ title, description, variant }) */
export type ShadcnToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
} & Omit<ExternalToast, 'title' | 'description'>

function isShadcnToast(value: unknown): value is ShadcnToastProps {
  if (typeof value !== 'object' || value === null) return false
  if ('variant' in value) return true
  if ('title' in value || 'description' in value) {
    return !('message' in value)
  }
  return false
}

function shadcnToast(props: ShadcnToastProps) {
  const { title, description, variant, ...rest } = props
  const opts: ExternalToast = { ...rest, description }

  if (variant === 'destructive') {
    return sonnerToast.error(title ?? description ?? 'خطا', opts)
  }
  if (title) {
    return sonnerToast(title, opts)
  }
  return sonnerToast(description ?? '', rest)
}

type ToastFn = typeof sonnerToast

const toastCompat = ((message: unknown, data?: unknown) => {
  if (isShadcnToast(message)) {
    return shadcnToast(message)
  }
  return sonnerToast(message as Parameters<ToastFn>[0], data as Parameters<ToastFn>[1])
}) as ToastFn

Object.assign(toastCompat, sonnerToast)

export const toast = toastCompat

export const useToast = () => ({
  toast: toastCompat,
})
