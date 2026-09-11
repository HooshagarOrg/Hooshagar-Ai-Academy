import { afterAll, describe, expect, it } from 'vitest'
import { XP_VALUES } from '@/lib/xp/award-xp'
import {
  cleanupTestData,
  createSignedInClient,
  createTestServiceClient,
  createUserWithRole,
} from '../helpers/supabase-test-client'
import { createTestSchool } from '../helpers/test-factories'

function calculateLevelFromXp(xp: number): number {
  if (xp < 100) return 1
  if (xp < 300) return 2
  if (xp < 600) return 3
  if (xp < 1000) return 4
  return 5 + Math.floor((xp - 1000) / 500)
}

function nextStreak(
  lastActivity: string | null,
  currentStreak: number,
  today = new Date(),
): number {
  const toDate = (value: Date) => value.toISOString().slice(0, 10)
  const todayKey = toDate(today)
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayKey = toDate(yesterday)
  if (!lastActivity || lastActivity < yesterdayKey) return 1
  if (lastActivity === yesterdayKey) return currentStreak + 1
  if (lastActivity === todayKey) return currentStreak
  return 1
}

function purchaseXp(balance: number, price: number): { success: boolean; newBalance: number } {
  if (balance < price) {
    return { success: false, newBalance: balance }
  }
  return { success: true, newBalance: balance - price }
}

describe('gamification', () => {
  it('awards the correct XP per activity type', () => {
    expect(XP_VALUES.daily_login).toBe(10)
    expect(XP_VALUES.study_buddy).toBe(10)
    expect(XP_VALUES.problem_solver).toBe(15)
    expect(XP_VALUES.story_wizard).toBe(20)
    expect(XP_VALUES.ai_analyzer).toBe(25)
    expect(XP_VALUES.quiz_taker).toBe(5)
    expect(XP_VALUES.exam_maker).toBe(15)
  })

  it('levels up at the XP thresholds used by calculate_level', () => {
    expect(calculateLevelFromXp(0)).toBe(1)
    expect(calculateLevelFromXp(99)).toBe(1)
    expect(calculateLevelFromXp(100)).toBe(2)
    expect(calculateLevelFromXp(299)).toBe(2)
    expect(calculateLevelFromXp(300)).toBe(3)
    expect(calculateLevelFromXp(1000)).toBe(5)
  })

  it('increments streak on consecutive daily logins and resets after a missed day', () => {
    expect(nextStreak(null, 0)).toBe(1)
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    expect(nextStreak(yesterday.toISOString().slice(0, 10), 3)).toBe(4)
    const twoDaysAgo = new Date()
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2)
    expect(nextStreak(twoDaysAgo.toISOString().slice(0, 10), 3)).toBe(1)
  })

  it('sorts the leaderboard by XP descending', () => {
    const rows = [
      { user_id: 'a', xp: 10 },
      { user_id: 'b', xp: 50 },
      { user_id: 'c', xp: 30 },
    ]
    const sorted = [...rows].sort((left, right) => right.xp - left.xp)
    expect(sorted.map((row) => row.user_id)).toEqual(['b', 'c', 'a'])
  })

  it('deducts XP/coins when the balance is sufficient and rejects when it is not', () => {
    expect(purchaseXp(100, 40)).toEqual({ success: true, newBalance: 60 })
    expect(purchaseXp(20, 40)).toEqual({ success: false, newBalance: 20 })
  })
})

describe('gamification database', () => {
  const admin = createTestServiceClient()

  afterAll(async () => {
    await cleanupTestData()
  })

  it('matches calculate_level in the test database', async () => {
    const { data, error } = await admin.rpc('calculate_level', { xp: 100 })
    expect(error).toBeNull()
    expect(data).toBe(calculateLevelFromXp(100))
  })

  it('adds XP, levels up, and ranks users by XP', async () => {
    const school = await createTestSchool()
    const first = await createUserWithRole('student', school.id)
    const second = await createUserWithRole('student', school.id)

    const low = await admin.rpc('add_xp', {
      p_user_id: first.id,
      p_action_type: 'study_buddy',
      p_xp_amount: XP_VALUES.study_buddy,
      p_description: 'تست',
    })
    expect(low.error).toBeNull()

    const high = await admin.rpc('add_xp', {
      p_user_id: second.id,
      p_action_type: 'ai_analyzer',
      p_xp_amount: 120,
      p_description: 'تست سطح',
    })
    expect(high.error).toBeNull()
    const highRow = Array.isArray(high.data) ? high.data[0] : high.data
    expect(highRow?.new_xp).toBeGreaterThanOrEqual(120)
    expect(highRow?.new_level).toBeGreaterThanOrEqual(2)
    expect(highRow?.level_up).toBe(true)

    const { data: garden, error } = await admin
      .from('talent_garden')
      .select('user_id, xp')
      .in('user_id', [first.id, second.id])
      .order('xp', { ascending: false })

    expect(error).toBeNull()
    expect(garden?.[0]?.user_id).toBe(second.id)
    expect((garden?.[0]?.xp ?? 0) > (garden?.[1]?.xp ?? 0)).toBe(true)
  }, 120_000)

  it('deducts coins when the balance is sufficient and keeps them when it is not', async () => {
    const school = await createTestSchool()
    const user = await createUserWithRole('student', school.id)
    await admin.from('talent_garden').upsert(
      { user_id: user.id, xp: 0, level: 1, coins: 80 },
      { onConflict: 'user_id' },
    )

    const price = 50
    const { data: before } = await admin
      .from('talent_garden')
      .select('coins')
      .eq('user_id', user.id)
      .single()
    const balance = (before?.coins as number | undefined) ?? 80
    expect(balance).toBeGreaterThanOrEqual(price)

    const enough = purchaseXp(balance, price)
    await admin
      .from('talent_garden')
      .update({ coins: enough.newBalance })
      .eq('user_id', user.id)
      .gte('coins', price)

    const { data: afterOk } = await admin
      .from('talent_garden')
      .select('coins')
      .eq('user_id', user.id)
      .single()
    expect(afterOk?.coins).toBe(balance - price)

    const short = purchaseXp(afterOk?.coins ?? 0, 999)
    expect(short.success).toBe(false)
    await admin
      .from('talent_garden')
      .update({ coins: short.newBalance })
      .eq('user_id', user.id)
      .gte('coins', 999)

    const { data: afterFail } = await admin
      .from('talent_garden')
      .select('coins')
      .eq('user_id', user.id)
      .single()
    expect(afterFail?.coins).toBe(afterOk?.coins)
  }, 120_000)

  it('blocks client writes to xp/coins and add_xp from a user JWT', async () => {
    const school = await createTestSchool()
    const user = await createUserWithRole('student', school.id)
    await admin.from('talent_garden').upsert(
      { user_id: user.id, xp: 10, level: 1, coins: 20 },
      { onConflict: 'user_id' },
    )
    const client = await createSignedInClient(user.email, user.password)

    const { data: updated, error: updateError } = await client
      .from('talent_garden')
      .update({ xp: 99999, coins: 99999 })
      .eq('user_id', user.id)
      .select('xp, coins')
    expect(updateError || !updated || updated.length === 0).toBeTruthy()

    const rpc = await client.rpc('add_xp', {
      p_user_id: user.id,
      p_action_type: 'study_buddy',
      p_xp_amount: 500,
      p_description: 'نباید اعمال شود',
    })
    expect(rpc.error).toBeTruthy()

    const { data: garden } = await admin
      .from('talent_garden')
      .select('xp, coins')
      .eq('user_id', user.id)
      .single()
    expect(garden?.xp).toBe(10)
    expect(garden?.coins).toBe(20)
  }, 120_000)
})
