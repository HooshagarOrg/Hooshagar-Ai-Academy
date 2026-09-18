import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { DEFAULT_BELL_SLOTS } from '@/lib/timetable/defaults'
import { ensureSchoolBellSlots } from '@/lib/timetable/seed'

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}))

const mockedServiceClient = vi.mocked(createServiceClient)

type QueryResult<T> = {
  data: T | null
  error: { code?: string; message: string } | null
}

type Call = { table: string; inserted: boolean }

function fakeClient(
  handler: (call: Call) => QueryResult<unknown>
): SupabaseClient {
  return {
    from(table: string) {
      let inserted = false
      const api: Record<string | symbol, unknown> = {}
      const self = new Proxy(api, {
        get(_target, prop) {
          if (prop === 'insert') {
            return () => {
              inserted = true
              return self
            }
          }
          if (prop === 'then') {
            return (
              onFulfilled: (value: QueryResult<unknown>) => unknown,
              onRejected?: (reason: unknown) => unknown
            ) =>
              Promise.resolve(handler({ table, inserted })).then(
                onFulfilled,
                onRejected
              )
          }
          return () => self
        },
      })
      return self
    },
  } as unknown as SupabaseClient
}

describe('ensureSchoolBellSlots', () => {
  beforeEach(() => {
    mockedServiceClient.mockReset()
  })

  it('returns rows the signed-in user can already read', async () => {
    const existing = [
      {
        id: 'b1',
        school_id: 'school-1',
        slot_index: 1,
        kind: 'lesson',
        starts_at: '08:00',
        ends_at: '08:45',
        label: 'زنگ ۱',
      },
    ]
    const user = fakeClient(() => ({ data: existing, error: null }))

    await expect(ensureSchoolBellSlots(user, 'school-1')).resolves.toEqual(
      existing
    )
    expect(mockedServiceClient).not.toHaveBeenCalled()
  })

  it('does not insert with the user client when RLS hides existing rows', async () => {
    const hidden = [
      {
        id: 'b1',
        school_id: 'school-1',
        slot_index: 0,
        kind: 'arrival',
        starts_at: '07:45',
        ends_at: '08:00',
        label: 'ورود',
      },
    ]
    const user = fakeClient(() => ({ data: [], error: null }))
    const admin = fakeClient((call) => {
      expect(call.inserted).toBe(false)
      return { data: hidden, error: null }
    })
    mockedServiceClient.mockReturnValue(admin)

    await expect(ensureSchoolBellSlots(user, 'school-1')).resolves.toEqual(
      hidden
    )
  })

  it('seeds defaults via service role when the table is empty', async () => {
    const user = fakeClient(() => ({ data: [], error: null }))
    let adminSelects = 0
    const admin = fakeClient((call) => {
      if (!call.inserted) {
        adminSelects += 1
        return { data: [], error: null }
      }
      expect(call.table).toBe('school_bell_slots')
      return {
        data: DEFAULT_BELL_SLOTS.map((s, i) => ({
          id: `id-${i}`,
          school_id: 'school-1',
          ...s,
        })),
        error: null,
      }
    })
    mockedServiceClient.mockReturnValue(admin)

    const slots = await ensureSchoolBellSlots(user, 'school-1')
    expect(adminSelects).toBe(1)
    expect(slots).toHaveLength(DEFAULT_BELL_SLOTS.length)
    expect(slots[0]?.label).toBe(DEFAULT_BELL_SLOTS[0]?.label)
  })

  it('recovers from a unique race with a service-role re-read', async () => {
    const seeded = [
      {
        id: 'b1',
        school_id: 'school-1',
        slot_index: 1,
        kind: 'lesson',
        starts_at: '08:00',
        ends_at: '08:45',
        label: 'زنگ ۱',
      },
    ]
    const user = fakeClient(() => ({ data: [], error: null }))
    let adminSelects = 0
    const admin = fakeClient((call) => {
      if (call.inserted) {
        return {
          data: null,
          error: { code: '23505', message: 'duplicate key value' },
        }
      }
      adminSelects += 1
      return {
        data: adminSelects === 1 ? [] : seeded,
        error: null,
      }
    })
    mockedServiceClient.mockReturnValue(admin)

    await expect(ensureSchoolBellSlots(user, 'school-1')).resolves.toEqual(
      seeded
    )
    expect(adminSelects).toBe(2)
  })

  it('does not insert bell slots through the teacher JWT client', async () => {
    const user = fakeClient((call) => {
      if (call.inserted) {
        throw new Error('user client must not insert bell slots')
      }
      return { data: [], error: null }
    })
    const admin = fakeClient((call) => {
      if (!call.inserted) return { data: [], error: null }
      return {
        data: DEFAULT_BELL_SLOTS.map((s, i) => ({
          id: `id-${i}`,
          school_id: 'school-1',
          ...s,
        })),
        error: null,
      }
    })
    mockedServiceClient.mockReturnValue(admin)

    await expect(ensureSchoolBellSlots(user, 'school-1')).resolves.toHaveLength(
      DEFAULT_BELL_SLOTS.length
    )
  })
})
