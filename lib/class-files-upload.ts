import {
  MAX_DOC_BYTES,
  MAX_VIDEO_BYTES,
  isClassFileMime,
  maxBytesForMime,
  type ClassFileKind,
} from '@/lib/class-files'

export const CLASS_FILE_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  '.pdf',
  '.doc',
  '.docx',
  'video/mp4',
  'video/webm',
  '.mp4',
  '.webm',
].join(',')

/** متن راهنما برای کاربر — فرمت و سقف حجم */
export const CLASS_FILE_LIMITS_HINT =
  `فرمت‌های مجاز: تصویر (JPG، PNG، WebP)، PDF، ورد (DOC/DOCX)، کلیپ کوتاه (MP4، WebM). ` +
  `سقف حجم: سند و تصویر ${MAX_DOC_BYTES / (1024 * 1024)} مگابایت؛ کلیپ ${MAX_VIDEO_BYTES / (1024 * 1024)} مگابایت.`

export const CLASS_FILE_LIMITS_SHORT =
  `JPG/PNG/WebP، PDF، DOC/DOCX تا ${MAX_DOC_BYTES / (1024 * 1024)} مگ؛ MP4/WebM تا ${MAX_VIDEO_BYTES / (1024 * 1024)} مگ`

export function validateClassFile(file: File): string | null {
  const mime = file.type || guessMimeFromName(file.name)
  if (!isClassFileMime(mime)) {
    return 'فرمت مجاز: تصویر، PDF، ورد، یا کلیپ کوتاه mp4/webm'
  }
  if (file.size > maxBytesForMime(mime)) {
    const mb = Math.round(maxBytesForMime(mime) / (1024 * 1024))
    return `حجم فایل نباید بیشتر از ${mb} مگابایت باشد`
  }
  return null
}

function guessMimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mp4: 'video/mp4',
    webm: 'video/webm',
  }
  return ext && map[ext] ? map[ext] : ''
}

export async function presignAndPut(params: {
  kind: ClassFileKind
  classId: string
  file: File
  assignmentId?: string
  studentId?: string
}): Promise<{ filePath: string; mimeType: string; fileSize: number; originalName: string }> {
  const mimeType = params.file.type || guessMimeFromName(params.file.name)
  const err = validateClassFile(params.file)
  if (err) throw new Error(err)
  if (!isClassFileMime(mimeType)) throw new Error('فرمت فایل مجاز نیست')

  const presignRes = await fetch('/api/class-files/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: params.kind,
      classId: params.classId,
      assignmentId: params.assignmentId,
      studentId: params.studentId,
      fileName: params.file.name,
      fileSize: params.file.size,
      mimeType,
    }),
  })
  const presign = (await presignRes.json()) as {
    uploadUrl?: string
    filePath?: string
    error?: string
  }
  if (!presignRes.ok || !presign.uploadUrl || !presign.filePath) {
    throw new Error(presign.error || 'آماده‌سازی آپلود ناموفق بود')
  }

  const putRes = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: params.file,
    headers: { 'Content-Type': mimeType },
  })
  if (!putRes.ok) {
    throw new Error(
      'آپلود به فضای ذخیره‌سازی ناموفق بود. اگر تکرار شد، CORS باکت آروان را بررسی کنید.'
    )
  }

  return {
    filePath: presign.filePath,
    mimeType,
    fileSize: params.file.size,
    originalName: params.file.name,
  }
}
