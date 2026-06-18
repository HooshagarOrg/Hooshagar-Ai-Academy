/**
 * ساخت دانش‌آموز تستی برای توسعه و QA
 * استفاده: node scripts/create-test-student.js
 */
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const TEST = {
  email: 'student.test@hooshagar.ir',
  fullName: 'علی رضایی (تست)',
  studentNumber: 'TEST1403001',
  pin: '1234',
  grade: 7,
  schoolName: 'مدرسه تستی هوشاگر',
  className: 'هفتم الف',
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL یا SUPABASE_SERVICE_ROLE_KEY در .env.local نیست')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('🔍 بررسی دانش‌آموز تستی موجود...')

  const { data: existingStudent } = await admin
    .from('students')
    .select('id, user_id, full_name, student_number, grade, school_id, class_id')
    .eq('student_number', TEST.studentNumber)
    .maybeSingle()

  if (existingStudent) {
    await admin
      .from('students')
      .update({
        full_name: TEST.fullName,
        grade: TEST.grade,
        pin_hash: Buffer.from(TEST.pin).toString('base64'),
        can_login: true,
        status: 'active',
      })
      .eq('id', existingStudent.id)

    await ensureTalentGarden(admin, existingStudent.id)

    printCredentials({
      ...TEST,
      userId: existingStudent.user_id,
      studentId: existingStudent.id,
      note: 'دانش‌آموز از قبل وجود داشت — اطلاعات به‌روزرسانی شد',
    })
    return
  }

  // مدرسه
  let schoolId
  const { data: school } = await admin
    .from('schools')
    .select('id')
    .eq('name', TEST.schoolName)
    .maybeSingle()

  if (school) {
    schoolId = school.id
  } else {
    const { data: newSchool, error: schoolError } = await admin
      .from('schools')
      .insert({
        name: TEST.schoolName,
        address: 'تهران — محیط تست',
        subscription_status: 'active',
        metadata: { test: true },
      })
      .select('id')
      .single()

    if (schoolError) throw new Error('خطا در ساخت مدرسه: ' + schoolError.message)
    schoolId = newSchool.id
  }

  // کلاس
  let classId
  const { data: cls } = await admin
    .from('classes')
    .select('id')
    .eq('school_id', schoolId)
    .eq('name', TEST.className)
    .maybeSingle()

  if (cls) {
    classId = cls.id
  } else {
    const { data: newClass, error: classError } = await admin
      .from('classes')
      .insert({
        school_id: schoolId,
        name: TEST.className,
        grade: TEST.grade,
        academic_year: '1404-1405',
        metadata: { test: true },
      })
      .select('id')
      .single()

    if (classError) throw new Error('خطا در ساخت کلاس: ' + classError.message)
    classId = newClass.id
  }

  // حذف کاربر قبلی با همان ایمیل (اگر ناقص مانده)
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingAuth = existingUsers?.users?.find((u) => u.email === TEST.email)
  if (existingAuth) {
    await admin.from('students').delete().eq('user_id', existingAuth.id)
    await admin.from('profiles').delete().eq('id', existingAuth.id)
    await admin.auth.admin.deleteUser(existingAuth.id)
  }

  const authPassword = `student_${TEST.studentNumber}_${Buffer.from(TEST.pin).toString('base64').slice(0, 8)}`

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: TEST.email,
    password: authPassword,
    email_confirm: true,
    user_metadata: { role: 'student', full_name: TEST.fullName },
  })

  if (authError) throw new Error('خطا در ساخت auth user: ' + authError.message)

  const userId = authUser.user.id

  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    email: TEST.email,
    full_name: TEST.fullName,
    role: 'student',
    school_id: schoolId,
    is_staff: false,
    must_change_password: false,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error('خطا در ساخت پروفایل: ' + profileError.message)
  }

  const { data: student, error: studentError } = await admin
    .from('students')
    .insert({
      user_id: userId,
      school_id: schoolId,
      class_id: classId,
      full_name: TEST.fullName,
      student_number: TEST.studentNumber,
      pin_hash: Buffer.from(TEST.pin).toString('base64'),
      grade: TEST.grade,
      can_login: true,
      status: 'active',
      metadata: { test_student: true },
    })
    .select('id')
    .single()

  if (studentError) {
    await admin.from('profiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
    throw new Error('خطا در ساخت رکورد دانش‌آموز: ' + studentError.message)
  }

  await ensureTalentGarden(admin, student.id)

  printCredentials({
    ...TEST,
    userId,
    studentId: student.id,
    note: 'دانش‌آموز تستی با موفقیت ساخته شد',
  })
}

async function ensureTalentGarden(admin, studentId) {
  const { data: existing } = await admin
    .from('talent_garden')
    .select('student_id')
    .eq('student_id', studentId)
    .maybeSingle()

  if (existing) return

  await admin.from('talent_garden').insert({
    student_id: studentId,
    xp_points: 250,
    level: 3,
    garden_state: {
      plants: [{ name: 'قهرمان ریاضی', level: 2 }],
      achievements: [],
      unlocked_items: [],
    },
  })
}

function printCredentials({ fullName, studentNumber, pin, email, grade, userId, studentId, note }) {
  console.log('\n══════════════════════════════════════════════')
  console.log('✅', note)
  console.log('══════════════════════════════════════════════')
  console.log('نام:           ', fullName)
  console.log('پایه:          ', grade)
  console.log('کد دانش‌آموزی: ', studentNumber)
  console.log('PIN:           ', pin)
  console.log('ایمیل (داخلی): ', email)
  console.log('User ID:       ', userId)
  console.log('Student ID:    ', studentId)
  console.log('──────────────────────────────────────────────')
  console.log('ورود: http://localhost:3000/login')
  console.log('تب «دانش‌آموز» → کد + PIN')
  console.log('══════════════════════════════════════════════\n')
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
