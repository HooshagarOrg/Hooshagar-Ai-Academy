import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { withAuth } from '@/lib/security/api-guard';
import { REPORT_API_ROLES } from '@/lib/security/sensitive-api-roles';

const autoGenerateSchema = z.object({
  reportType: z.enum(['weekly', 'monthly']),
  studentIds: z.array(z.string().uuid()).optional(),
});

export async function POST(req: NextRequest) {
  return withAuth(
    req,
    async () => {
      try {
        const supabase = await createClient();

        const body = await req.json();
        const result = autoGenerateSchema.safeParse(body);

        if (!result.success) {
          return NextResponse.json(
            { error: 'داده‌های نامعتبر', details: result.error.issues },
            { status: 400 }
          );
        }

        const { reportType, studentIds } = result.data;

        const now = new Date();
        let periodStart: Date;
        const periodEnd: Date = now;

        if (reportType === 'weekly') {
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 7);
        } else {
          periodStart = new Date(now);
          periodStart.setMonth(now.getMonth() - 1);
        }

        let query = supabase
          .from('students')
          .select('id, parent_id')
          .not('parent_id', 'is', null);

        if (studentIds && studentIds.length > 0) {
          query = query.in('id', studentIds);
        }

        const { data: students, error: studentsError } = await query;

        if (studentsError) {
          console.error('خطا در دریافت دانش‌آموزان:', studentsError);
          return NextResponse.json(
            { error: 'دریافت دانش‌آموزان ناموفق بود' },
            { status: 500 }
          );
        }

        if (!students || students.length === 0) {
          return NextResponse.json(
            { error: 'هیچ دانش‌آموزی یافت نشد' },
            { status: 404 }
          );
        }

        const results = [];
        const errors = [];

        for (const student of students) {
          try {
            const { data: reportId, error: generateError } = await supabase.rpc(
              'generate_parent_report',
              {
                p_student_id: student.id,
                p_report_type: reportType,
                p_period_start: periodStart.toISOString(),
                p_period_end: periodEnd.toISOString(),
              }
            );

            if (generateError) {
              errors.push({
                student_id: student.id,
                error: generateError.message,
              });
            } else {
              await supabase.rpc('publish_report', {
                p_report_id: reportId,
              });

              results.push({
                student_id: student.id,
                report_id: reportId,
                status: 'success',
              });
            }
          } catch (err) {
            errors.push({
              student_id: student.id,
              error: err instanceof Error ? err.message : 'خطای نامشخص',
            });
          }
        }

        return NextResponse.json({
          success: true,
          message: `${results.length} گزارش با موفقیت ایجاد شد`,
          results,
          errors: errors.length > 0 ? errors : undefined,
          stats: {
            total: students.length,
            success: results.length,
            failed: errors.length,
          },
        });
      } catch (error) {
        console.error('خطای سرور:', error);
        return NextResponse.json(
          { error: 'خطای داخلی سرور' },
          { status: 500 }
        );
      }
    },
    { roles: REPORT_API_ROLES }
  );
}
