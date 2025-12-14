'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const handleUpload = async () => {
    if (!file) {
      toast.error('لطفاً یک فایل انتخاب کنید')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'misc')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('✅ فایل با موفقیت آپلود شد!')
        setUploadedUrl(data.url)
      } else {
        toast.error(data.error || 'خطا در آپلود فایل')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('خطای غیرمنتظره در آپلود')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">🧪 تست ArvanCloud Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* انتخاب فایل */}
          <div className="space-y-2">
            <label className="text-sm font-medium">انتخاب فایل:</label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* دکمه آپلود */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال آپلود...
              </>
            ) : (
              <>
                <Upload className="ml-2 h-4 w-4" />
                آپلود به ArvanCloud
              </>
            )}
          </Button>

          {/* نتیجه */}
          {uploadedUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium text-green-900 mb-2">✅ آپلود موفق!</p>
              <p className="text-sm text-green-700 break-all">
                <strong>URL:</strong> {uploadedUrl}
              </p>
              {uploadedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                <img
                  src={uploadedUrl}
                  alt="Uploaded"
                  className="mt-4 max-w-full rounded-md"
                />
              )}
            </div>
          )}

          {/* راهنما */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm">
            <p className="font-medium text-blue-900 mb-2">📋 راهنما:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>فایل انتخاب کنید</li>
              <li>روی دکمه "آپلود به ArvanCloud" کلیک کنید</li>
              <li>اگر موفق بود، URL نمایش داده می‌شود</li>
              <li>عکس‌ها به صورت خودکار نمایش داده می‌شوند</li>
            </ul>
          </div>

          {/* وضعیت تنظیمات */}
          <div className="p-4 bg-gray-50 border rounded-md text-xs">
            <p className="font-medium mb-2">⚙️ تنظیمات ArvanCloud:</p>
            <div className="space-y-1 text-gray-600">
              <p>
                Bucket:{' '}
                {process.env.NEXT_PUBLIC_ARVAN_BUCKET || 'hooshagar-prod'}
              </p>
              <p>
                Region:{' '}
                {process.env.NEXT_PUBLIC_ARVAN_REGION || 'ir-thr-at1'}
              </p>
              <p>
                Endpoint:{' '}
                {process.env.NEXT_PUBLIC_ARVAN_ENDPOINT ||
                  'https://s3.ir-thr-at1.arvanstorage.ir'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



