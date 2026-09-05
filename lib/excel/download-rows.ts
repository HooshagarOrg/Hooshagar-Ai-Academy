export async function downloadRowsAsXlsx(
  filename: string,
  _sheetName: string,
  rows: Record<string, string | number>[]
): Promise<void> {
  const headers = rows[0] ? Object.keys(rows[0]) : ['ستون']
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? '')
          if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
          return value
        })
        .join(',')
    ),
  ]
  const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  const base = filename.replace(/\.xlsx$/i, '')
  anchor.download = `${base}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
