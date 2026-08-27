import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security/api-guard';
import { asOne } from '@/lib/supabase/relation';

/**
 * GET /api/student/dashboard
 * دریافت داده‌های داشبورد دانش‌آموز
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
    const supabase = ctx.supabase;
    const userId = ctx.userId;

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
      .eq('user_id', userId)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'اطلاعات دانش‌آموز یافت نشد' },
        { status: 404 }
      );
    }

    // 4–6. XP، نمرات، حضور و تکالیف (موازی پس از دانستن student.id)
    const today = new Date().toISOString().split('T')[0];

    const [
      { data: xpData },
      { data: grades },
      { data: todayAttendance },
      { data: homeworkRows },
      { data: classStudents },
    ] = await Promise.all([
      supabase
        .from('talent_garden')
        .select('total_xp, level, coins, current_streak, longest_streak')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('grades')
        .select('id, subject, score, exam_type, exam_date')
        .eq('student_id', student.id)
        .order('exam_date', { ascending: false })
        .limit(20),
      supabase
        .from('attendance')
        .select('status')
        .eq('student_id', student.id)
        .eq('date', today)
        .maybeSingle(),
      supabase
        .from('homework_submissions')
        .select('id, subject, title, due_date, submission_status')
        .eq('student_id', student.id)
        .in('submission_status', ['pending', 'late', 'not_submitted'])
        .order('due_date', { ascending: true })
        .limit(5),
      student.class_id
        ? supabase
            .from('students')
            .select('user_id')
            .eq('class_id', student.class_id)
            .limit(200)
        : Promise.resolve({ data: null as { user_id: string | null }[] | null }),
    ]);

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

    // 9. رتبه در کلاس با دو COUNT به‌جای کشیدن همهٔ ردیف‌های XP
    if (classStudents && classStudents.length > 0) {
      const userIds = classStudents.map((s) => s.user_id).filter(Boolean) as string[];

      if (userIds.length > 0) {
        const myXp = xpData?.total_xp ?? 0
        const [{ count: totalStudents }, { count: higher }] = await Promise.all([
          supabase
            .from('talent_garden')
            .select('user_id', { count: 'exact', head: true })
            .in('user_id', userIds),
          supabase
            .from('talent_garden')
            .select('user_id', { count: 'exact', head: true })
            .in('user_id', userIds)
            .gt('total_xp', myXp),
        ])

        xp.total_students = totalStudents ?? 0
        xp.rank = xp.total_students > 0 ? (higher ?? 0) + 1 : 0
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
    },
    { roles: ['student'] }
  );
}

