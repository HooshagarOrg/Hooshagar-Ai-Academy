import { toast as sonnerToast, type ExternalToast } from 'sonner'

/** فرم shadcn/ui: toast({ title, description, variant }) */
interface ShadcnToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

function toast(options: ShadcnToastOptions): void
function toast(message: string, options?: ExternalToast): void
function toast(
  messageOrOptions: string | ShadcnToastOptions,
  data?: ExternalToast,
): void {
  if (typeof messageOrOptions === 'object') {
    const { title, description, variant } = messageOrOptions
    const opts: ExternalToast = description && title ? { description } : {}
    if (variant === 'destructive') {
      sonnerToast.error(title ?? description ?? 'خطا', opts)
    } else {
      sonnerToast(title ?? description ?? '', opts)
    }
    return
  }
  sonnerToast(messageOrOptions, data)
}

toast.error   = sonnerToast.error
toast.success = sonnerToast.success
toast.warning = sonnerToast.warning
toast.info    = sonnerToast.info
toast.loading = sonnerToast.loading
toast.dismiss = sonnerToast.dismiss
toast.promise = sonnerToast.promise
toast.custom  = sonnerToast.custom
toast.message = sonnerToast.message

export { toast }

export const useToast = () => ({ toast })
