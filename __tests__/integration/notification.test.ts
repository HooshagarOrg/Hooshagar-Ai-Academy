import { afterAll, describe, expect, it } from 'vitest'
import {
  cleanupTestData,
  createSignedInClient,
  createTestServiceClient,
  createUserWithRole,
  trackNotificationId,
} from '../helpers/supabase-test-client'
import { createTestSchool } from '../helpers/test-factories'

describe('notifications', () => {
  const admin = createTestServiceClient()

  afterAll(async () => {
    await cleanupTestData()
  })

  it('does not deliver user A notifications to user B', async () => {
    const school = await createTestSchool()
    const userA = await createUserWithRole('student', school.id)
    const userB = await createUserWithRole('student', school.id)

    const { data: created, error } = await admin
      .from('notifications')
      .insert({
        user_id: userA.id,
        notification_type: 'system',
        title: 'اعلان خصوصی آ',
        message: 'فقط برای کاربر آ',
        priority: 'normal',
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    trackNotificationId(created!.id)

    const clientA = await createSignedInClient(userA.email, userA.password)
    const clientB = await createSignedInClient(userB.email, userB.password)

    const own = await clientA.from('notifications').select('id, title').eq('id', created!.id)
    const leaked = await clientB.from('notifications').select('id, title').eq('id', created!.id)

    expect(own.data?.some((row) => row.id === created!.id)).toBe(true)
    expect(leaked.data ?? []).toHaveLength(0)
  }, 180_000)

  it('reaches only the targeted role', async () => {
    const school = await createTestSchool()
    const teacher = await createUserWithRole('teacher', school.id)
    const parent = await createUserWithRole('parent', school.id)

    const { data: forTeacher, error } = await admin
      .from('notifications')
      .insert({
        user_id: teacher.id,
        notification_type: 'announcement',
        title: 'اعلان معلمان',
        message: 'فقط معلمان',
        priority: 'normal',
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    trackNotificationId(forTeacher!.id)

    const teacherClient = await createSignedInClient(teacher.email, teacher.password)
    const parentClient = await createSignedInClient(parent.email, parent.password)

    const teacherSeen = await teacherClient
      .from('notifications')
      .select('id')
      .eq('id', forTeacher!.id)
    const parentSeen = await parentClient
      .from('notifications')
      .select('id')
      .eq('id', forTeacher!.id)

    expect(teacherSeen.data?.some((row) => row.id === forTeacher!.id)).toBe(true)
    expect(parentSeen.data ?? []).toHaveLength(0)
  }, 180_000)
})
