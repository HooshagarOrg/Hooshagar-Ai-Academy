import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/teacher/dashboard
 * دریافت داده‌های داشبورد معلم
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 1. دریافت اطلاعات معلم
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      );
    }

    // 2. دریافت پروفایل معلم
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'دسترسی فقط برای معلمان' },
        { status: 403 }
      );
    }

    // 3. دریافت کلاس معلم
    const { data: teacherClass, error: classError } = await supabase
      .from('classes')
      .select('id, name, grade, academic_year')
      .eq('teacher_id', user.id)
      .single();

    if (classError || !teacherClass) {
      // معلم کلاسی ندارد
      return NextResponse.json({
        success: true,
        teacher: {
          name: profile.full_name,
          class: null,
        },
        students: [],
        stats: {
          totalStudents: 0,
          presentToday: 0,
          averageGrade: 0,
          upcomingExams: 0,
        },
        recentGrades: [],
        alerts: [],
      });
    }

    // 4. دریافت دانش‌آموزان کلاس
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        grade,
        user_id
      `)
      .eq('class_id', teacherClass.id)
      .order('full_name', { ascending: true });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'خطا در دریافت دانش‌آموزان' },
        { status: 500 }
      );
    }

    const studentIds = students?.map((s) => s.id) || [];

    // 5. دریافت آخرین نمرات (برای هر دانش‌آموز)
    const { data: allGrades, error: gradesError } = await supabase
      .from('grades')
      .select('student_id, score, subject, exam_date, exam_type')
      .in('student_id', studentIds)
      .order('exam_date', { ascending: false })
      .limit(100);

    // 6. دریافت حضور امروز
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .in('student_id', studentIds)
      .eq('date', today);

    // 7. محاسبه آخرین نمره هر دانش‌آموز
    const lastGradeMap = new Map<string, { score: number; subject: string }>();
    if (allGrades) {
      for (const grade of allGrades) {
        if (!lastGradeMap.has(grade.student_id)) {
          lastGradeMap.set(grade.student_id, {
            score: grade.score,
            subject: grade.subject,
          });
        }
      }
    }

    // 8. محاسبه حضور امروز
    const attendanceMap = new Map<string, string>();
    if (todayAttendance) {
      todayAttendance.forEach((a) => {
        attendanceMap.set(a.student_id, a.status);
      });
    }

    // 9. ترکیب داده‌ها
    const studentsWithData = students?.map((student) => {
      const lastGrade = lastGradeMap.get(student.id);
      const attendance = attendanceMap.get(student.id) || 'unknown';
      
      // شناسایی دانش‌آموزان نیازمند توجه
      const needsAttention = 
        (lastGrade && lastGrade.score < 14) || 
        attendance === 'absent';

      return {
        id: student.id,
        name: student.full_name,
        grade: student.grade,
        lastScore: lastGrade?.score || null,
        lastSubject: lastGrade?.subject || null,
        attendance,
        needsAttention,
      };
    }) || [];

    // 10. محاسبه آمار کلی
    const totalStudents = studentsWithData.length;
    const presentToday = studentsWithData.filter(
      (s) => s.attendance === 'present'
    ).length;
    
    const gradesWithScore = studentsWithData
      .filter((s) => s.lastScore !== null)
      .map((s) => s.lastScore!);
    
    const averageGrade =
      gradesWithScore.length > 0
        ? gradesWithScore.reduce((sum, score) => sum + score, 0) / gradesWithScore.length
        : 0;

    // 11. آخرین نمرات ثبت شده (5 تا)
    const recentGrades = allGrades
      ?.slice(0, 5)
      .map((g) => {
        const student = students?.find((s) => s.id === g.student_id);
        return {
          id: g.student_id + g.exam_date,
          studentName: student?.full_name || 'نامشخص',
          subject: g.subject,
          score: g.score,
          type: g.exam_type,
          date: g.exam_date,
        };
      }) || [];

    // 12. هشدارها - دانش‌آموزان نیازمند توجه
    const alerts = studentsWithData
      .filter((s) => s.needsAttention)
      .slice(0, 5)
      .map((s) => {
        if (s.lastScore !== null && s.lastScore < 14) {
          return {
            id: s.id,
            type: 'grade_drop',
            student: s.name,
            message: `نمره ${s.lastSubject}: ${s.lastScore} از 20`,
            badgeText: 'افت نمره',
            badgeColor: 'bg-red-500/20 text-red-400 border-red-500/50',
            borderColor: 'border-red-500/50 bg-red-500/10',
            score: s.lastScore,
          };
        } else if (s.attendance === 'absent') {
          return {
            id: s.id,
            type: 'absence',
            student: s.name,
            message: 'غایب در روز جاری',
            badgeText: 'غیبت',
            badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
            borderColor: 'border-orange-500/50 bg-orange-500/10',
          };
        }
        return null;
      })
      .filter((a) => a !== null);

    // 13. پاسخ نهایی
    return NextResponse.json({
      success: true,
      teacher: {
        name: profile.full_name,
        class: {
          id: teacherClass.id,
          name: teacherClass.name,
          grade: teacherClass.grade,
          academicYear: teacherClass.academic_year,
        },
      },
      students: studentsWithData,
      stats: {
        totalStudents,
        presentToday,
        attendanceRate: totalStudents > 0 
          ? Math.round((presentToday / totalStudents) * 100) 
          : 0,
        averageGrade: Math.round(averageGrade * 10) / 10,
        upcomingExams: 0, // TODO: اضافه کردن exams table
      },
      recentGrades,
      alerts,
    });

  } catch (error: any) {
    console.error('❌ Teacher dashboard error:', error);
    return NextResponse.json(
      { error: 'خطای سرور', details: error.message },
      { status: 500 }
    );
  }
}

