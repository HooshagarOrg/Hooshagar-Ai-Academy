import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  cleanupTestData,
  createSignedInClient,
  createUserWithRole,
  type TestUserRole,
} from '../helpers/supabase-test-client'
import {
  createTestClass,
  createTestExam,
  createTestSchool,
  createTestStudent,
  createTestTeacher,
} from '../helpers/test-factories'

const ROLES: TestUserRole[] = [
  'platform_admin',
  'admin',
  'teacher',
  'student',
  'parent',
  'financial_vp',
  'health_vp',
  'counselor',
]

describe.sequential('RLS isolation', () => {
  let school1: { id: string }
  let school2: { id: string }
  const users: Partial<Record<TestUserRole, Awaited<ReturnType<typeof createUserWithRole>>>> = {}
  let student1: Awaited<ReturnType<typeof createTestStudent>>
  let student2: Awaited<ReturnType<typeof createTestStudent>>
  let teacher1: Awaited<ReturnType<typeof createTestTeacher>>
  let teacher2: Awaited<ReturnType<typeof createTestTeacher>>
  let class1: Awaited<ReturnType<typeof createTestClass>>
  let class2: Awaited<ReturnType<typeof createTestClass>>
  let exam2: Awaited<ReturnType<typeof createTestExam>>

  beforeAll(async () => {
    school1 = await createTestSchool()
    school2 = await createTestSchool()
    const parent = await createUserWithRole('parent', school1.id)
    users.parent = parent
    users.platform_admin = await createUserWithRole('platform_admin', null)
    users.admin = await createUserWithRole('admin', school1.id)
    users.financial_vp = await createUserWithRole('financial_vp', school1.id)
    users.health_vp = await createUserWithRole('health_vp', school1.id)
    users.counselor = await createUserWithRole('counselor', school1.id)

    teacher1 = await createTestTeacher(school1.id)
    teacher2 = await createTestTeacher(school2.id)
    users.teacher = teacher1.user

    class1 = await createTestClass(school1.id, { teacherId: teacher1.id, grade: 6 })
    class2 = await createTestClass(school2.id, { teacherId: teacher2.id, grade: 6 })

    student1 = await createTestStudent(school1.id, {
      parentId: parent.id,
      classId: class1.id,
    })
    student2 = await createTestStudent(school2.id, { classId: class2.id })
    users.student = student1.user

    exam2 = await createTestExam(teacher2.id, class2.id, { status: 'draft' })
  }, 180_000)

  afterAll(async () => {
    await cleanupTestData()
  })

  it.each(ROLES)('%s can read their own profile', async (role) => {
    const user = users[role]
    expect(user).toBeTruthy()
    const client = await createSignedInClient(user!.email, user!.password)
    const { data, error } = await client.from('profiles').select('id, role').eq('id', user!.id)
    expect(error).toBeNull()
    expect(data?.some((row) => row.id === user!.id)).toBe(true)
  }, 60_000)

  it.each(ROLES.filter((role) => role !== 'platform_admin'))(
    '%s cannot read another user private profile email in the other school',
    async (role) => {
      const user = users[role]!
      const other = student2.user
      const client = await createSignedInClient(user.email, user.password)
      const { data } = await client
        .from('profiles')
        .select('id, email')
        .eq('id', other.id)
      expect(data ?? []).toHaveLength(0)
    },
    60_000,
  )

  it('authenticated user cannot elevate their own role', async () => {
    const user = users.student!
    const client = await createSignedInClient(user.email, user.password)
    const { data, error } = await client
      .from('profiles')
      .update({ role: 'platform_admin' })
      .eq('id', user.id)
      .select('id, role')
    expect(error || !data || data.length === 0).toBeTruthy()
    if (data?.length) {
      expect(data[0]?.role).not.toBe('platform_admin')
    }
    const { data: again } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    expect(again?.role).toBe('student')
  }, 60_000)

  it('student from school 1 cannot see the student from school 2', async () => {
    const client = await createSignedInClient(student1.user.email, student1.user.password)
    const { data } = await client.from('students').select('id').eq('id', student2.id)
    expect(data ?? []).toHaveLength(0)
    const own = await client.from('students').select('id').eq('id', student1.id)
    expect(own.data?.some((row) => row.id === student1.id)).toBe(true)
  }, 60_000)

  it('teacher from school 1 cannot see a draft exam from school 2', async () => {
    const client = await createSignedInClient(teacher1.user.email, teacher1.user.password)
    const { data } = await client.from('exams').select('id, school_id, status').eq('id', exam2.id)
    expect(data ?? []).toHaveLength(0)
  }, 60_000)

  it('admin of school 1 cannot read students from school 2', async () => {
    const client = await createSignedInClient(users.admin!.email, users.admin!.password)
    const { data } = await client.from('students').select('id').eq('id', student2.id)
    expect(data ?? []).toHaveLength(0)
    const own = await client.from('students').select('id').eq('id', student1.id)
    expect(own.data?.some((row) => row.id === student1.id)).toBe(true)
  }, 60_000)

  it('admin of school 1 cannot modify school 2', async () => {
    const client = await createSignedInClient(users.admin!.email, users.admin!.password)
    const { data, error } = await client
      .from('schools')
      .update({ address: 'نباید ذخیره شود' })
      .eq('id', school2.id)
      .select('id')
    expect(error || !data || data.length === 0).toBeTruthy()
  }, 60_000)

  it('school staff cannot read students from a different school', async () => {
    for (const role of ['financial_vp', 'health_vp', 'counselor'] as const) {
      const user = users[role]!
      const client = await createSignedInClient(user.email, user.password)
      const { data } = await client.from('students').select('id').eq('id', student2.id)
      expect(data ?? []).toHaveLength(0)
    }
  }, 90_000)

  it('students cannot write classes outside their permission', async () => {
    const client = await createSignedInClient(student1.user.email, student1.user.password)
    const { data, error } = await client
      .from('classes')
      .update({ name: 'هک کلاس' })
      .eq('id', class2.id)
      .select('id')
    expect(error || !data || data.length === 0).toBeTruthy()
  }, 60_000)

  it('parent can read their child and not the other school student', async () => {
    const client = await createSignedInClient(users.parent!.email, users.parent!.password)
    const own = await client.from('students').select('id').eq('id', student1.id)
    expect(own.data?.some((row) => row.id === student1.id)).toBe(true)
    const other = await client.from('students').select('id').eq('id', student2.id)
    expect(other.data ?? []).toHaveLength(0)
  }, 60_000)
})
