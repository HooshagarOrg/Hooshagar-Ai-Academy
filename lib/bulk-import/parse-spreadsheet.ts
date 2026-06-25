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

export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet[]> {
  const sheets: ParsedSheet[] = []

  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    const { read, utils } = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = read(buffer)

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      if (!ws) continue
      const json = utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      if (json.length === 0) continue
      const first = json[0]
      if (!first) continue
      const headers = Object.keys(first)
      const rows = json
        .map((row) => {
          const r: Record<string, string> = {}
          headers.forEach((h) => { r[h] = String(row[h] ?? '').trim() })
          return r
        })
        .filter((r) => Object.values(r).some((v) => v))

      sheets.push({
        sheetName,
        type: detectSheetType(headers),
        headers,
        rows,
      })
    }
    return sheets
  }

  const text = await file.text()
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  const headerLine = lines[0]
  if (!headerLine) return []

  const headers = headerLine.split(',').map((h) => h.trim().replace(/^\uFEFF/, ''))
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  }).filter((r) => Object.values(r).some((v) => v))

  sheets.push({
    sheetName: 'CSV',
    type: detectSheetType(headers),
    headers,
    rows,
  })

  return sheets
}
