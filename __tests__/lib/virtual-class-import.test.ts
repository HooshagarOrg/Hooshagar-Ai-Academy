import {
  extractSkyroomSlug,
  mapVirtualClassImportRow,
} from '@/lib/virtual-class/import-spreadsheet'

describe('virtual class spreadsheet import', () => {
  it('extracts latin room name from public Skyroom URL', () => {
    expect(extractSkyroomSlug('https://skyroom.online/ch/omidan/kord')).toBe('kord')
    expect(extractSkyroomSlug('skyroom.online/ch/omidan/bagheri')).toBe('bagheri')
  })

  it('maps Persian headers and fills latin name from link when empty', () => {
    const mapped = mapVirtualClassImportRow(
      {
        پایه: '1',
        کلاس: 'اول خانم کرد',
        عنوان: 'کلاس اول خانم کرد',
        شناسه_اتاق: '182457',
        نام_لاتین_اتاق: '',
        لینک_اتاق: 'https://skyroom.online/ch/omidan/kord',
      },
      2
    )
    expect(mapped.grade).toBe(1)
    expect(mapped.className).toBe('اول خانم کرد')
    expect(mapped.roomIdRaw).toBe('182457')
    expect(mapped.latinName).toBe('kord')
  })
})
