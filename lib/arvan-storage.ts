/**
 * Arvan Cloud S3 Storage Helper
 * کتابخانه کمکی برای مدیریت فایل‌ها در آروان
 *
 * @see https://www.arvancloud.ir/fa/products/cloud-storage
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'

// ============================================
// تایپ‌ها و اینترفیس‌ها
// ============================================

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  size?: number
  error?: string
}

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export interface FileInfo {
  path: string
  size: number
  lastModified: Date
  contentType?: string
}

export type FileType = 
  | 'avatar' 
  | 'ocr' 
  | 'attachment' 
  | 'logo' 
  | 'document' 
  | 'report'
  | 'art-sample'
  | 'story-image'
  | 'misc'

// ============================================
// Constants
// ============================================

const BUCKET_NAME = process.env.ARVAN_BUCKET || 'hooshagar-prod'
const CDN_URL = process.env.ARVAN_CDN
const ENDPOINT = process.env.ARVAN_ENDPOINT || 'https://s3.ir-thr-at1.arvanstorage.ir'

// حداکثر حجم فایل بر حسب مگابایت
const MAX_FILE_SIZES: Record<FileType, number> = {
  avatar: 2,
  ocr: 5,
  attachment: 10,
  logo: 1,
  document: 20,
  report: 10,
  'art-sample': 5,
  'story-image': 3,
  misc: 5,
}

// فرمت‌های مجاز
const ALLOWED_TYPES: Record<FileType, string[]> = {
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
  ocr: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  attachment: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  logo: ['image/jpeg', 'image/png', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  report: ['application/pdf'],
  'art-sample': ['image/jpeg', 'image/png', 'image/webp'],
  'story-image': ['image/jpeg', 'image/png', 'image/webp'],
  misc: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
}

// ============================================
// Initialize Arvan S3 Client
// ============================================

function getS3Client(): S3Client {
  const accessKey = process.env.ARVAN_ACCESS_KEY
  const secretKey = process.env.ARVAN_SECRET_KEY

  if (!accessKey || !secretKey) {
    throw new Error('Arvan S3 credentials not configured')
  }

  return new S3Client({
    region: 'default',
    endpoint: ENDPOINT,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  })
}

// Lazy initialization
let s3ClientInstance: S3Client | null = null

function getClient(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = getS3Client()
  }
  return s3ClientInstance
}

// ============================================
// Upload Functions
// ============================================

/**
 * آپلود فایل به Arvan S3
 */
export async function uploadToArvan(
  fileBuffer: Buffer,
  path: string,
  contentType: string
): Promise<UploadResult> {
  try {
    const client = getClient()

    const upload = new Upload({
      client,
      params: {
        Bucket: BUCKET_NAME,
        Key: path,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read',
        CacheControl: 'max-age=31536000', // 1 year cache
      },
    })

    // Progress tracking (optional)
    upload.on('httpUploadProgress', (progress) => {
      if (progress.loaded && progress.total) {
        const percent = Math.round((progress.loaded / progress.total) * 100)
        console.log(`📤 Upload progress: ${percent}%`)
      }
    })

    await upload.done()

    const url = getArvanURL(path)

    console.log(`✅ File uploaded: ${path}`)

    return {
      success: true,
      url,
      path,
      size: fileBuffer.length,
    }
  } catch (error) {
    console.error('❌ Arvan upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در آپلود فایل',
    }
  }
}

/**
 * آپلود فایل با streaming (برای فایل‌های بزرگ)
 */
export async function uploadStreamToArvan(
  stream: ReadableStream | NodeJS.ReadableStream,
  path: string,
  contentType: string,
  contentLength?: number
): Promise<UploadResult> {
  try {
    const client = getClient()

    const upload = new Upload({
      client,
      params: {
        Bucket: BUCKET_NAME,
        Key: path,
        Body: stream as unknown as Buffer,
        ContentType: contentType,
        ACL: 'public-read',
        ContentLength: contentLength,
      },
      queueSize: 4, // concurrent uploads
      partSize: 5 * 1024 * 1024, // 5MB parts
    })

    await upload.done()

    return {
      success: true,
      url: getArvanURL(path),
      path,
    }
  } catch (error) {
    console.error('❌ Arvan stream upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در آپلود فایل',
    }
  }
}

/**
 * آپلود مستقیم با PutObjectCommand (برای فایل‌های کوچک)
 */
export async function uploadSmallFile(
  fileBuffer: Buffer,
  path: string,
  contentType: string
): Promise<UploadResult> {
  try {
    const client = getClient()

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read',
      })
    )

    return {
      success: true,
      url: getArvanURL(path),
      path,
      size: fileBuffer.length,
    }
  } catch (error) {
    console.error('❌ Arvan small file upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در آپلود فایل',
    }
  }
}

// ============================================
// Delete Functions
// ============================================

/**
 * حذف فایل از Arvan
 */
export async function deleteFromArvan(path: string): Promise<boolean> {
  try {
    const client = getClient()

    await client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path,
      })
    )

    console.log(`🗑️ File deleted: ${path}`)
    return true
  } catch (error) {
    console.error('❌ Arvan delete error:', error)
    return false
  }
}

/**
 * حذف چند فایل به صورت همزمان
 */
export async function deleteMultipleFromArvan(paths: string[]): Promise<{
  success: string[]
  failed: string[]
}> {
  const results = await Promise.allSettled(
    paths.map((path) => deleteFromArvan(path))
  )

  const success: string[] = []
  const failed: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      success.push(paths[index])
    } else {
      failed.push(paths[index])
    }
  })

  return { success, failed }
}

// ============================================
// File Info Functions
// ============================================

/**
 * بررسی وجود فایل
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const client = getClient()

    await client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path,
      })
    )

    return true
  } catch {
    return false
  }
}

/**
 * دریافت اطلاعات فایل
 */
export async function getFileInfo(path: string): Promise<FileInfo | null> {
  try {
    const client = getClient()

    const response = await client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path,
      })
    )

    return {
      path,
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType,
    }
  } catch {
    return null
  }
}

/**
 * لیست فایل‌های یک پوشه
 */
export async function listFiles(prefix: string, maxKeys: number = 100): Promise<FileInfo[]> {
  try {
    const client = getClient()

    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys,
      })
    )

    return (response.Contents || []).map((item) => ({
      path: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
    }))
  } catch (error) {
    console.error('❌ Arvan list files error:', error)
    return []
  }
}

// ============================================
// Copy/Move Functions
// ============================================

/**
 * کپی فایل
 */
export async function copyFile(sourcePath: string, destPath: string): Promise<boolean> {
  try {
    const client = getClient()

    await client.send(
      new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${sourcePath}`,
        Key: destPath,
        ACL: 'public-read',
      })
    )

    console.log(`📋 File copied: ${sourcePath} → ${destPath}`)
    return true
  } catch (error) {
    console.error('❌ Arvan copy error:', error)
    return false
  }
}

/**
 * انتقال فایل (کپی + حذف)
 */
export async function moveFile(sourcePath: string, destPath: string): Promise<boolean> {
  const copied = await copyFile(sourcePath, destPath)
  if (copied) {
    return await deleteFromArvan(sourcePath)
  }
  return false
}

// ============================================
// Signed URL Functions
// ============================================

/**
 * تولید URL امضا شده برای دانلود خصوصی
 */
export async function getSignedDownloadUrl(
  path: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string | null> {
  try {
    const client = getClient()

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    })

    const signedUrl = await getSignedUrl(client, command, { expiresIn })
    return signedUrl
  } catch (error) {
    console.error('❌ Arvan signed URL error:', error)
    return null
  }
}

// ============================================
// Path Generation Functions
// ============================================

/**
 * تولید مسیر یکتا برای فایل
 */
export function generateFilePath(
  type: FileType,
  filename: string,
  userId?: string,
  schoolId?: string
): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const ext = filename.split('.').pop()?.toLowerCase() || 'bin'
  const sanitizedFilename = filename
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[^a-zA-Z0-9\u0600-\u06FF.-]/g, '_') // keep Persian chars
    .substring(0, 50) // limit length

  const userPart = userId ? `${userId.substring(0, 8)}/` : ''
  const schoolPart = schoolId ? `${schoolId.substring(0, 8)}/` : ''

  switch (type) {
    case 'avatar':
      return `uploads/avatars/${userPart}${timestamp}_${random}.${ext}`

    case 'ocr':
      return `uploads/ocr/${schoolPart}${timestamp}_${random}.${ext}`

    case 'attachment':
      return `uploads/attachments/${schoolPart}${timestamp}_${sanitizedFilename}.${ext}`

    case 'logo':
      return `static/logos/${schoolPart}${sanitizedFilename}.${ext}`

    case 'document':
      return `uploads/documents/${schoolPart}${timestamp}_${sanitizedFilename}.${ext}`

    case 'report':
      return `uploads/reports/${schoolPart}${timestamp}_${random}.pdf`

    case 'art-sample':
      return `uploads/art/${schoolPart}${userPart}${timestamp}_${random}.${ext}`

    case 'story-image':
      return `uploads/stories/${schoolPart}${timestamp}_${random}.${ext}`

    case 'misc':
    default:
      return `uploads/misc/${timestamp}_${random}_${sanitizedFilename}.${ext}`
  }
}

/**
 * تولید مسیر برای آواتار کاربر
 */
export function generateAvatarPath(userId: string): string {
  const timestamp = Date.now()
  return `uploads/avatars/${userId}/${timestamp}.jpg`
}

/**
 * تولید مسیر برای لوگوی مدرسه
 */
export function generateSchoolLogoPath(schoolId: string): string {
  return `static/logos/schools/${schoolId}.png`
}

// ============================================
// URL Functions
// ============================================

/**
 * دریافت URL کامل فایل از CDN
 */
export function getArvanURL(path: string): string {
  if (!path) return ''

  // اگر path یک URL کامل باشد
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // حذف slash ابتدایی
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  // استفاده از CDN در صورت وجود
  if (CDN_URL) {
    return `${CDN_URL}/${cleanPath}`
  }

  // Fallback به endpoint مستقیم
  return `${ENDPOINT}/${BUCKET_NAME}/${cleanPath}`
}

/**
 * استخراج path از URL
 */
export function extractPathFromURL(url: string): string | null {
  if (!url) return null

  try {
    // اگر CDN URL باشد
    if (CDN_URL && url.startsWith(CDN_URL)) {
      return url.replace(`${CDN_URL}/`, '')
    }

    // اگر endpoint مستقیم باشد
    const endpointPrefix = `${ENDPOINT}/${BUCKET_NAME}/`
    if (url.startsWith(endpointPrefix)) {
      return url.replace(endpointPrefix, '')
    }

    // اگر فقط path باشد
    if (!url.startsWith('http')) {
      return url
    }

    return null
  } catch {
    return null
  }
}

// ============================================
// Validation Functions
// ============================================

/**
 * اعتبارسنجی فایل
 */
export function validateFile(
  file: File | { size: number; type: string },
  fileType: FileType = 'misc'
): FileValidationResult {
  const maxSizeMB = MAX_FILE_SIZES[fileType]
  const allowedTypes = ALLOWED_TYPES[fileType]

  // بررسی حجم فایل
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `حجم فایل نباید بیشتر از ${maxSizeMB} مگابایت باشد`,
    }
  }

  // بررسی فرمت فایل
  if (!allowedTypes.includes(file.type)) {
    const extensions = allowedTypes
      .map((t) => t.split('/')[1])
      .join(', ')
    return {
      valid: false,
      error: `فرمت فایل مجاز نیست. فرمت‌های مجاز: ${extensions}`,
    }
  }

  return { valid: true }
}

/**
 * اعتبارسنجی با تنظیمات سفارشی
 */
export function validateFileCustom(
  file: File | { size: number; type: string },
  maxSizeMB: number,
  allowedTypes: string[]
): FileValidationResult {
  // بررسی حجم فایل
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `حجم فایل نباید بیشتر از ${maxSizeMB} مگابایت باشد`,
    }
  }

  // بررسی فرمت فایل
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'فرمت فایل مجاز نیست',
    }
  }

  return { valid: true }
}

/**
 * دریافت پسوند فایل از MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  }

  return mimeMap[mimeType] || 'bin'
}

// ============================================
// Utility Functions
// ============================================

/**
 * فرمت‌بندی حجم فایل
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * تبدیل Base64 به Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  // حذف prefix اگر وجود داشته باشد
  const base64Data = base64.replace(/^data:.*?;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

/**
 * دریافت MIME type از Base64
 */
export function getMimeFromBase64(base64: string): string | null {
  const match = base64.match(/^data:([^;]+);base64,/)
  return match ? match[1] : null
}

// ============================================
// Export default
// ============================================

export default {
  uploadToArvan,
  uploadStreamToArvan,
  uploadSmallFile,
  deleteFromArvan,
  deleteMultipleFromArvan,
  fileExists,
  getFileInfo,
  listFiles,
  copyFile,
  moveFile,
  getSignedDownloadUrl,
  generateFilePath,
  generateAvatarPath,
  generateSchoolLogoPath,
  getArvanURL,
  extractPathFromURL,
  validateFile,
  validateFileCustom,
  getExtensionFromMime,
  formatFileSize,
  base64ToBuffer,
  getMimeFromBase64,
}




























