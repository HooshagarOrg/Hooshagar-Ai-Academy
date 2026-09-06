import { detectSheetType, parseSpreadsheetFile } from '@/lib/bulk-import/parse-spreadsheet'

describe('parseSpreadsheetFile (H4 csv-only)', () => {
  it('parses a CSV without the xlsx package', async () => {
    const file = {
      name: 'staff.csv',
      text: async () => 'نام,نقش\nمریم,معلم\n',
    } as File
    const sheets = await parseSpreadsheetFile(file)
    expect(sheets).toHaveLength(1)
    expect(detectSheetType(sheets[0].headers)).toBe('staff')
    expect(sheets[0].rows[0]).toEqual({ نام: 'مریم', نقش: 'معلم' })
  })

  it('rejects Excel workbooks instead of using the unpatched xlsx parser', async () => {
    const file = { name: 'staff.xlsx' } as File
    await expect(parseSpreadsheetFile(file)).rejects.toThrow(/CSV/)
  })
})
