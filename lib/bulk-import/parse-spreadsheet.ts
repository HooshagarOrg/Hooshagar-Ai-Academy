import type { ImportSheetType } from './types'

export interface ParsedSheet {
  sheetName: string
  type: ImportSheetType
  headers: string[]
  rows: Record<string, string>[]
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/^\uFEFF/, '').toLowerCase()
}

export function detectSheetType(headers: string[]): ImportSheetType {
  const joined = headers.map(normalizeHeader).join('|')
  if (
    joined.includes('نقش') ||
    joined.includes('role') ||
    (joined.includes('کارکن') && !joined.includes('والد'))
  ) {
    return 'staff'
  }
  return 'students'
}

function cellToString(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Number.isInteger(value) || Math.abs(value) >= 1e6) {
      return String(Math.trunc(value))
    }
    return String(value)
  }
  return String(value).trim().replace(/\.0+$/, '')
}

function parseCsvText(text: string): ParsedSheet[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  const headerLine = lines[0]
  if (!headerLine) return []

  const headers = headerLine.split(',').map((h) => h.trim().replace(/^\uFEFF/, ''))
  const rows = lines
    .slice(1)
    .map((line) => {
      const vals = line.split(',').map((v) => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, i) => {
        row[h] = cellToString(vals[i] ?? '')
      })
      return row
    })
    .filter((r) => Object.values(r).some((v) => v))

  return [
    {
      sheetName: 'CSV',
      type: detectSheetType(headers),
      headers,
      rows,
    },
  ]
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet[]> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    throw new Error(
      'برای امنیت، فایل Excel پذیرفته نمی‌شود. لطفاً شیت را به‌صورت CSV ذخیره کنید و دوباره بارگذاری کنید.'
    )
  }

  const text = await readUploadText(file)
  return parseCsvText(text)
}

async function readUploadText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text()
  }
  if (typeof file.arrayBuffer === 'function') {
    return new TextDecoder('utf-8').decode(await file.arrayBuffer())
  }
  throw new Error('خواندن فایل ممکن نشد')
}
