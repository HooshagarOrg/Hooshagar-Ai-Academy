import { afterAll, describe, expect, it } from 'vitest'
import {
  cleanupTestData,
  createSignedInClient,
  createTestServiceClient,
  createUserWithRole,
  trackPeriodId,
} from '../helpers/supabase-test-client'
import { createTestSchool, createTestStudent } from '../helpers/test-factories'

function lotteryCapacity(capacity: number, platformQuota: number): number {
  return Math.max(0, capacity - platformQuota)
}

describe('lottery', () => {
  const admin = createTestServiceClient()

  afterAll(async () => {
    await cleanupTestData()
  })

  it('records registration priorities in order', async () => {
    const school = await createTestSchool()
    const student = await createTestStudent(school.id, { grade: 3 })
    const { data: period, error: periodError } = await admin
      .from('registration_periods')
      .insert({
        title: 'قرعه‌کشی تست',
        academic_year: '1404-1405',
        school_id: school.id,
        for_grade: 4,
        from_grade: 3,
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 86_400_000).toISOString(),
        status: 'open',
      })
      .select('id')
      .single()
    expect(periodError).toBeNull()
    trackPeriodId(period!.id)

    const classes: string[] = []
    for (const name of ['کلاس الف', 'کلاس ب', 'کلاس ج']) {
      const { data, error } = await admin
        .from('lottery_classes')
        .insert({
          period_id: period!.id,
          teacher_name: name,
          class_name: name,
          grade: 4,
          capacity: 10,
          school_id: school.id,
          platform_quota: 0,
        })
        .select('id')
        .single()
      expect(error).toBeNull()
      classes.push(data!.id)
    }

    const prefs = classes.map((classId, index) => ({
      period_id: period!.id,
      student_id: student.id,
      class_id: classId,
      priority: index + 1,
    }))
    const { error: prefError } = await admin.from('lottery_preferences').insert(prefs)
    expect(prefError).toBeNull()

    const { data: stored } = await admin
      .from('lottery_preferences')
      .select('class_id, priority')
      .eq('period_id', period!.id)
      .eq('student_id', student.id)
      .order('priority', { ascending: true })

    expect(stored?.map((row) => row.priority)).toEqual([1, 2, 3])
    expect(stored?.map((row) => row.class_id)).toEqual(classes)
  }, 180_000)

  it('applies platform_admin quota before the random draw and never exceeds capacity', async () => {
    const capacity = 4
    const platformQuota = 2
    expect(lotteryCapacity(capacity, platformQuota)).toBe(2)

    const school = await createTestSchool()
    const platformAdmin = await createUserWithRole('platform_admin', null)
    const students = await Promise.all(
      Array.from({ length: 6 }, () => createTestStudent(school.id, { grade: 3 })),
    )

    const { data: period, error: periodError } = await admin
      .from('registration_periods')
      .insert({
        title: 'قرعه‌کشی سهمیه',
        academic_year: '1404-1405',
        school_id: school.id,
        for_grade: 4,
        from_grade: 3,
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 86_400_000).toISOString(),
        status: 'open',
      })
      .select('id')
      .single()
    expect(periodError).toBeNull()
    trackPeriodId(period!.id)

    const { data: lotteryClass, error: classError } = await admin
      .from('lottery_classes')
      .insert({
        period_id: period!.id,
        teacher_name: 'خانم احمدی',
        class_name: 'چهارم الف',
        grade: 4,
        capacity,
        school_id: school.id,
        platform_quota: platformQuota,
      })
      .select('id')
      .single()
    expect(classError).toBeNull()

    const quotaStudent = students[0]
    const lotteryStudents = students.slice(1)

    const { error: quotaInsertError } = await admin.from('lottery_results').insert({
      period_id: period!.id,
      student_id: quotaStudent.id,
      class_id: lotteryClass!.id,
      status: 'assigned',
      assignment_type: 'platform_quota',
    })
    expect(quotaInsertError).toBeNull()

    const { error: prefError } = await admin.from('lottery_preferences').insert(
      lotteryStudents.map((student) => ({
        period_id: period!.id,
        student_id: student.id,
        class_id: lotteryClass!.id,
        priority: 1,
      })),
    )
    expect(prefError).toBeNull()

    const signedIn = await createSignedInClient(platformAdmin.email, platformAdmin.password)
    const { data: draw, error: drawError } = await signedIn.rpc('run_lottery', {
      p_period_id: period!.id,
    })
    expect(drawError).toBeNull()
    expect((draw as { success?: boolean })?.success).toBe(true)

    const { data: results } = await admin
      .from('lottery_results')
      .select('student_id, assignment_type, status')
      .eq('period_id', period!.id)
      .eq('status', 'assigned')

    const quotaAssigned = results?.filter((row) => row.assignment_type === 'platform_quota') ?? []
    const lotteryAssigned = results?.filter((row) => row.assignment_type === 'lottery') ?? []
    expect(quotaAssigned.length).toBeGreaterThanOrEqual(1)
    expect(lotteryAssigned.length).toBeLessThanOrEqual(lotteryCapacity(capacity, platformQuota))
    expect((results?.length ?? 0)).toBeLessThanOrEqual(capacity)
  }, 180_000)

  it('rejects a duplicate registration', async () => {
    const school = await createTestSchool()
    const student = await createTestStudent(school.id, { grade: 3 })
    const { data: period } = await admin
      .from('registration_periods')
      .insert({
        title: 'قرعه‌کشی تکراری',
        academic_year: '1404-1405',
        school_id: school.id,
        for_grade: 4,
        from_grade: 3,
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 86_400_000).toISOString(),
        status: 'open',
      })
      .select('id')
      .single()
    trackPeriodId(period!.id)

    const { data: lotteryClass } = await admin
      .from('lottery_classes')
      .insert({
        period_id: period!.id,
        teacher_name: 'آقای رضایی',
        class_name: 'چهارم ب',
        grade: 4,
        capacity: 20,
        school_id: school.id,
      })
      .select('id')
      .single()

    const row = {
      period_id: period!.id,
      student_id: student.id,
      class_id: lotteryClass!.id,
      priority: 1,
    }
    const first = await admin.from('lottery_preferences').insert(row)
    expect(first.error).toBeNull()
    const duplicate = await admin.from('lottery_preferences').insert(row)
    expect(duplicate.error).not.toBeNull()
  }, 180_000)
})
