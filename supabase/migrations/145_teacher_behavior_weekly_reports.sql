-- رفتار معلم + گزارش هفتگی — جداول عملیاتی برای پایلوت

CREATE TABLE IF NOT EXISTS public.behavior_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  positive_behaviors JSONB NOT NULL DEFAULT '[]'::jsonb,
  negative_behaviors JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavior_reports_teacher_date
  ON public.behavior_reports (teacher_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_reports_student
  ON public.behavior_reports (student_id);

CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary TEXT NOT NULL,
  positive_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  improvement_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  parent_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  sent_to_parent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT weekly_reports_week_dates CHECK (week_end >= week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_teacher_week
  ON public.weekly_reports (teacher_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_student
  ON public.weekly_reports (student_id);

ALTER TABLE public.behavior_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "behavior_reports_select" ON public.behavior_reports;
CREATE POLICY "behavior_reports_select" ON public.behavior_reports
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'platform_admin', 'principal')
        AND (p.school_id = behavior_reports.school_id OR p.role = 'platform_admin')
    )
  );

DROP POLICY IF EXISTS "behavior_reports_insert" ON public.behavior_reports;
CREATE POLICY "behavior_reports_insert" ON public.behavior_reports
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "weekly_reports_select" ON public.weekly_reports;
CREATE POLICY "weekly_reports_select" ON public.weekly_reports
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
    OR (
      sent_to_parent = true
      AND EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = weekly_reports.student_id
          AND s.parent_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'platform_admin', 'principal')
    )
  );

DROP POLICY IF EXISTS "weekly_reports_insert" ON public.weekly_reports;
CREATE POLICY "weekly_reports_insert" ON public.weekly_reports
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "weekly_reports_update" ON public.weekly_reports;
CREATE POLICY "weekly_reports_update" ON public.weekly_reports
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.behavior_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.weekly_reports TO authenticated;
