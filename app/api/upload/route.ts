import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  uploadToArvan,
  generateFilePath,
  validateFile,
  deleteFromArvan,
  type FileType,
} from '@/lib/arvan-storage'

// ============================================
// تایپ‌ها
// ============================================

interface UploadResponse {
  success: boolean
  url?: string
  path?: string
  size?: number
  type?: string
  originalName?: string
  error?: string
}

interface FilesResponse {
  success: boolean
  files?: FileRecord[]
  error?: string
}

interface FileRecord {
  id: string
  user_id: string
  school_id?: string
  file_type: string
  file_path: string
  file_url: string
  file_size: number
  mime_type: string
  original_name: string
  created_at: string
}

// ============================================
// Valid file types
// ============================================

const VALID_FILE_TYPES: FileType[] = [
  'avatar',
  'ocr',
  'attachment',
  'logo',
  'document',
  'report',
  'art-sample',
  'story-image',
  'misc',
]

// ============================================
// POST - Upload File
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // 1. Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت لازم است' },
        { status: 401 }
      )
    }

    // 2. Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { success: false, error: 'فرمت درخواست نامعتبر است' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null
    const type = (formData.get('type') as FileType) || 'misc'
    const userId = (formData.get('userId') as string) || user.id
    const schoolId = formData.get('schoolId') as string | null

    // 3. Validate file exists
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'فایل انتخاب نشده است' },
        { status: 400 }
      )
    }

    // 4. Validate file type parameter
    if (!VALID_FILE_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'نوع فایل نامعتبر است' },
        { status: 400 }
      )
    }

    // 5. Validate file content
    const validation = validateFile(file, type)

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // 6. Check file is not empty
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'فایل خالی است' },
        { status: 400 }
      )
    }

    // 7. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 8. Generate unique file path
    const filePath = generateFilePath(type, file.name, userId, schoolId || undefined)

    // 9. Upload to Arvan S3
    console.log(`📤 Uploading file: ${file.name} (${file.size} bytes) to ${filePath}`)

    const result = await uploadToArvan(buffer, filePath, file.type)

    if (!result.success) {
      console.error(`❌ Upload failed: ${result.error}`)
      return NextResponse.json(
        { success: false, error: result.error || 'خطا در آپلود فایل' },
        { status: 500 }
      )
    }

    // 10. Save metadata to database (optional, based on file type)
    if (['avatar', 'document', 'attachment', 'report', 'art-sample'].includes(type)) {
      const { error: dbError } = await supabase.from('files').insert({
        user_id: userId,
        school_id: schoolId,
        file_type: type,
        file_path: result.path,
        file_url: result.url,
        file_size: file.size,
        mime_type: file.type,
        original_name: file.name,
      })

      if (dbError) {
        console.warn('⚠️ Failed to save file metadata:', dbError.message)
        // Don't fail the upload, just log the warning
      }
    }

    // 11. Log success
    console.log(`✅ File uploaded successfully: ${result.url}`)

    // 12. Return success response
    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
      size: file.size,
      type: file.type,
      originalName: file.name,
    })
  } catch (error) {
    console.error('❌ Upload API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'خطای سرور در آپلود فایل',
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET - List User Files
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse<FilesResponse>> {
  try {
    // 1. Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت لازم است' },
        { status: 401 }
      )
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId') || user.id
    const schoolId = searchParams.get('schoolId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // 3. Build query
    let query = supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (type && VALID_FILE_TYPES.includes(type as FileType)) {
      query = query.eq('file_type', type)
    }

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    // 4. Execute query with pagination
    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Get files error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // 5. Return files
    return NextResponse.json({
      success: true,
      files: data as FileRecord[],
    })
  } catch (error) {
    console.error('❌ Get files API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'خطای سرور',
      },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete File
// ============================================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت لازم است' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    let body: { path?: string; fileId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'فرمت درخواست نامعتبر است' },
        { status: 400 }
      )
    }

    const { path, fileId } = body

    if (!path && !fileId) {
      return NextResponse.json(
        { success: false, error: 'مسیر یا شناسه فایل الزامی است' },
        { status: 400 }
      )
    }

    let filePath = path

    // 3. If fileId provided, get path from database
    if (fileId) {
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('file_path, user_id')
        .eq('id', fileId)
        .single()

      if (fileError || !file) {
        return NextResponse.json(
          { success: false, error: 'فایل یافت نشد' },
          { status: 404 }
        )
      }

      // Check ownership
      if (file.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز' },
          { status: 403 }
        )
      }

      filePath = file.file_path
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'مسیر فایل نامعتبر است' },
        { status: 400 }
      )
    }

    // 4. Delete from Arvan S3
    const deleted = await deleteFromArvan(filePath)

    if (!deleted) {
      console.warn(`⚠️ Failed to delete from S3: ${filePath}`)
      // Continue to delete from database anyway
    }

    // 5. Delete from database
    if (fileId) {
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id)

      if (dbError) {
        console.error('❌ Database delete error:', dbError)
      }
    } else if (filePath) {
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('file_path', filePath)
        .eq('user_id', user.id)

      if (dbError) {
        console.error('❌ Database delete error:', dbError)
      }
    }

    // 6. Return success
    console.log(`🗑️ File deleted: ${filePath}`)

    return NextResponse.json({
      success: true,
      message: 'فایل با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('❌ Delete file API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'خطای سرور',
      },
      { status: 500 }
    )
  }
}

// ============================================
// Config: Disable body parser for file uploads
// ============================================

export const config = {
  api: {
    bodyParser: false,
  },
}




