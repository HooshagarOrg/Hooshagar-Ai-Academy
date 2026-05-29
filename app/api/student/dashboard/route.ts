import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { asOne } from '@/lib/supabase/relation';

/**
 * GET /api/student/dashboard
 * دریافت داده‌های داشبورد دانش‌آموز
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 1. دریافت اطلاعات کاربر
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      );
    }

    // 2. دریافت پروفایل دانش‌آموز
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'student') {
      return NextResponse.json(
        { error: 'دسترسی فقط برای دانش‌آموزان' },
        { status: 403 }
      );
    }

    // 3. دریافت اطلاعات دانش‌آموز
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        grade,
        class_id,
        classes (
          id,
          name,
          grade
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'اطلاعات دانش‌آموز یافت نشد' },
        { status: 404 }
      );
    }

    // 4. دریافت XP data از talent_garden
    const { data: xpData, error: xpError } = await supabase
      .from('talent_garden')
      .select('total_xp, level, coins, current_streak, longest_streak')
      .eq('user_id', user.id)
      .single();

    const xp = {
      ...(xpData || {
        total_xp: 0,
        level: 1,
        coins: 0,
        current_streak: 0,
        longest_streak: 0,
      }),
      rank: 0,
      total_students: 0,
    };

    // 5. دریافت نمرات (20 نمره اخیر)
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('id, subject, score, exam_type, exam_date')
      .eq('student_id', student.id)
      .order('exam_date', { ascending: false })
      .limit(20);

    // 6. دریافت حضور امروز
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', student.id)
      .eq('date', today)
      .single();

    // تکالیف در انتظار
    const { data: homeworkRows } = await supabase
      .from('homework_submissions')
      .select('id, subject, title, due_date, submission_status')
      .eq('student_id', student.id)
      .in('submission_status', ['pending', 'late', 'not_submitted'])
      .order('due_date', { ascending: true })
      .limit(5);

    // 7. محاسبه میانگین نمرات
    const totalGrades = grades?.length || 0;
    const averageGrade =
      totalGrades > 0
        ? grades!.reduce((sum, g) => sum + g.score, 0) / totalGrades
        : 0;

    // 8. آخرین 5 نمره
    const recentGrades = grades?.slice(0, 5).map((g) => ({
      id: g.id,
      subject: g.subject,
      score: g.score,
      type: g.exam_type,
      date: g.exam_date,
    })) || [];

    // 9. محاسبه رتبه در کلاس (ساده: بر اساس XP)
    if (student.class_id) {
      const { data: classStudents } = await supabase
        .from('students')
        .select('user_id')
        .eq('class_id', student.class_id);

      if (classStudents) {
        const userIds = classStudents.map((s) => s.user_id).filter(Boolean);
        
        const { data: classRanks } = await supabase
          .from('talent_garden')
          .select('user_id, total_xp')
          .in('user_id', userIds)
          .order('total_xp', { ascending: false });

        const rankIndex = classRanks?.findIndex((r) => r.user_id === user.id) ?? -1;
        const rank = rankIndex >= 0 ? rankIndex + 1 : 0;
        xp.rank = rank;
        xp.total_students = classRanks?.length || 0;
      }
    }

    // 10. پاسخ نهایی
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.full_name,
        grade: student.grade,
        class: asOne(student.classes)?.name || 'نامشخص',
      },
      xp: {
        total: xp.total_xp,
        level: xp.level,
        coins: xp.coins,
        currentStreak: xp.current_streak,
        longestStreak: xp.longest_streak,
        rank: xp.rank || 0,
        totalStudents: xp.total_students || 0,
      },
      grades: {
        average: Math.round(averageGrade * 10) / 10,
        total: totalGrades,
        recent: recentGrades,
      },
      attendance: {
        today: todayAttendance?.status || 'unknown',
      },
      homework: (homeworkRows || []).map((h) => ({
        id: h.id,
        subject: h.subject,
        title: h.title,
        due_date: h.due_date,
        status: h.submission_status,
      })),
      schedule: [],
    });

  } catch (error: any) {
    console.error('❌ Student dashboard error:', error);
    return NextResponse.json(
      { error: 'خطای سرور', details: error.message },
      { status: 500 }
    );
  }
}

