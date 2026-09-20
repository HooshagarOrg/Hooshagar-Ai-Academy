-- Migration 169: nurturing activities update/delete + disciplinary_vp behavior insert
-- First Mehr write paths beyond MVP-thin dashboards

-- ── nurturing_activities: UPDATE / DELETE for school nurturing staff ──
DROP POLICY IF EXISTS "nurturing_activities_update" ON public.nurturing_activities;
CREATE POLICY "nurturing_activities_update"
ON public.nurturing_activities FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = nurturing_activities.school_id
          AND p.role IN ('nurturing_vp', 'principal', 'admin')
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = nurturing_activities.school_id
          AND p.role IN ('nurturing_vp', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "nurturing_activities_delete" ON public.nurturing_activities;
CREATE POLICY "nurturing_activities_delete"
ON public.nurturing_activities FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = nurturing_activities.school_id
          AND p.role IN ('nurturing_vp', 'principal', 'admin')
        )
      )
  )
);

GRANT UPDATE, DELETE ON public.nurturing_activities TO authenticated;

-- ── behavior_reports: disciplinary_vp may insert (teacher_id = self) ──
DROP POLICY IF EXISTS "behavior_reports_insert" ON public.behavior_reports;
CREATE POLICY "behavior_reports_insert"
ON public.behavior_reports FOR INSERT TO authenticated
WITH CHECK (
  teacher_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN (
        'teacher',
        'art_teacher',
        'sports_teacher',
        'principal',
        'admin',
        'platform_admin',
        'disciplinary_vp'
      )
  )
);
