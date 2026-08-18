import {
  evaluateVirtualClassRow,
  extractSkyroomSlug,
  mapVirtualClassImportRow,
} from '@/lib/virtual-class/import-map'

const classes = [
  { id: 'c1', name: 'اول خانم کرد', grade: 1, teacher_id: 't1' },
  { id: 'c2', name: 'دوم خانم ناصری', grade: 2, teacher_id: null },
]

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

  it('keeps original Excel row number when ردیف is sent back for import', () => {
    const mapped = mapVirtualClassImportRow(
      { ردیف: '9', کلاس: 'اول خانم کرد', شناسه_اتاق: '182457' },
      2
    )
    expect(mapped.rowNumber).toBe(9)
  })

  it('flags missing class, unknown class, and missing room identifiers', () => {
    const claimed = new Set<string>()
    const linked = new Set<string>()

    const noClass = evaluateVirtualClassRow(
      mapVirtualClassImportRow({ شناسه_اتاق: '1' }, 2),
      classes,
      linked,
      claimed
    )
    expect(noClass.status).toBe('error')
    expect(noClass.errors.some((e) => e.includes('ستون کلاس'))).toBe(true)

    const unknown = evaluateVirtualClassRow(
      mapVirtualClassImportRow(
        { کلاس: 'هفتم الف', شناسه_اتاق: '99', نام_لاتین_اتاق: 'x' },
        3
      ),
      classes,
      linked,
      claimed
    )
    expect(unknown.status).toBe('error')
    expect(unknown.errors[0]).toContain('پیدا نشد')

    const noRoom = evaluateVirtualClassRow(
      mapVirtualClassImportRow({ کلاس: 'اول خانم کرد' }, 4),
      classes,
      linked,
      claimed
    )
    expect(noRoom.status).toBe('error')
    expect(noRoom.errors.some((e) => e.includes('شناسه_اتاق'))).toBe(true)
  })

  it('accepts a matching class with room id and rejects duplicate class in the same file', () => {
    const claimed = new Set<string>()
    const linked = new Set<string>()
    const first = evaluateVirtualClassRow(
      mapVirtualClassImportRow(
        { پایه: '1', کلاس: 'اول خانم کرد', شناسه_اتاق: '182457' },
        2
      ),
      classes,
      linked,
      claimed
    )
    expect(first.status).toBe('valid')

    const dup = evaluateVirtualClassRow(
      mapVirtualClassImportRow(
        { پایه: '1', کلاس: 'اول خانم کرد', شناسه_اتاق: '182458' },
        3
      ),
      classes,
      linked,
      claimed
    )
    expect(dup.status).toBe('error')
    expect(dup.errors[0]).toContain('چند بار')
  })

  it('marks already-linked classes as skipped', () => {
    const claimed = new Set<string>()
    const linked = new Set(['c1'])
    const row = evaluateVirtualClassRow(
      mapVirtualClassImportRow({ کلاس: 'اول خانم کرد' }, 2),
      classes,
      linked,
      claimed
    )
    expect(row.status).toBe('skipped')
    expect(row.alreadyLinked).toBe(true)
  })
})
