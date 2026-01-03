import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/parent/dashboard
 * دریافت داده‌های داشبورد والدین
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

    // 2. دریافت پروفایل والد
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'parent') {
      return NextResponse.json(
        { error: 'دسترسی فقط برای والدین' },
        { status: 403 }
      );
    }

    // 3. دریافت فرزندان
    const { data: children, error: childrenError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        grade,
        class_id,
        classes (
          name,
          grade
        )
      `)
      .eq('parent_id', user.id);

    if (childrenError) {
      console.error('Error fetching children:', childrenError);
      return NextResponse.json(
        { error: 'خطا در دریافت اطلاعات فرزندان' },
        { status: 500 }
      );
    }

    // اگر والد فرزندی ندارد
    if (!children || children.length === 0) {
      return NextResponse.json({
        success: true,
        parent: {
          name: profile.full_name,
        },
        children: [],
        activeChild: null,
        grades: [],
        attendance: [],
        stats: {
          averageGrade: 0,
          attendanceRate: 0,
          totalGrades: 0,
          recentReports: 0,
        },
        recentGrades: [],
        messages: [],
      });
    }

    // 4. فرزند فعال (اولین فرزند)
    const activeChild = children[0];
    const childId = activeChild.id;

    // 5. دریافت نمرات فرزند
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('id, subject, score, exam_type, exam_date')
      .eq('student_id', childId)
      .order('exam_date', { ascending: false })
      .limit(20);

    // 6. دریافت حضور و غیاب (30 روز اخیر)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('id, date, status')
      .eq('student_id', childId)
      .gte('date', thirtyDaysAgoStr)
      .order('date', { ascending: false });

    // 7. محاسبه آمار
    const totalGrades = grades?.length || 0;
    const averageGrade =
      totalGrades > 0
        ? grades!.reduce((sum, g) => sum + g.score, 0) / totalGrades
        : 0;

    const totalDays = attendance?.length || 0;
    const presentDays = attendance?.filter((a) => a.status === 'present').length || 0;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // 8. آخرین نمرات (5 تا)
    const recentGrades = grades?.slice(0, 5).map((g) => ({
      id: g.id,
      subject: g.subject,
      score: g.score,
      type: g.exam_type,
      date: g.exam_date,
    })) || [];

    // 9. نمرات به تفکیک درس
    const gradesBySubject = new Map<string, { total: number; count: number }>();
    grades?.forEach((g) => {
      const existing = gradesBySubject.get(g.subject) || { total: 0, count: 0 };
      gradesBySubject.set(g.subject, {
        total: existing.total + g.score,
        count: existing.count + 1,
      });
    });

    const subjectGrades = Array.from(gradesBySubject.entries()).map(([subject, data]) => ({
      subject,
      average: Math.round((data.total / data.count) * 10) / 10,
      count: data.count,
    }));

    // 10. پاسخ نهایی
    return NextResponse.json({
      success: true,
      parent: {
        name: profile.full_name,
      },
      children: children.map((c) => ({
        id: c.id,
        name: c.full_name,
        grade: c.grade,
        className: c.classes?.name || 'نامشخص',
      })),
      activeChild: {
        id: activeChild.id,
        name: activeChild.full_name,
        grade: activeChild.grade,
        className: activeChild.classes?.name || 'نامشخص',
      },
      grades: subjectGrades,
      attendance: attendance || [],
      stats: {
        averageGrade: Math.round(averageGrade * 10) / 10,
        attendanceRate: Math.round(attendanceRate),
        totalGrades,
        recentReports: 0, // TODO: link to parent_reports
      },
      recentGrades,
      messages: [], // TODO: link to messages system
    });

  } catch (error: any) {
    console.error('❌ Parent dashboard error:', error);
    return NextResponse.json(
      { error: 'خطای سرور', details: error.message },
      { status: 500 }
    );
  }
}

