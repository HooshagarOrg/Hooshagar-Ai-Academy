-- ═══════════════════════════════════════════════════════════
-- Migration 166: برنامهٔ کلاسی + قالب زنگ + فهرست درس + تقویم
-- فاز ۱ — بدون حضور زنگ‌به‌زنگ و بدون کلاس مجازی
-- ═══════════════════════════════════════════════════════════

-- ── قالب زنگ مدرسه ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.school_bell_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  slot_index  SMALLINT NOT NULL CHECK (slot_index >= 0 AND slot_index < 20),
  kind        TEXT NOT NULL CHECK (kind IN ('lesson', 'recess', 'arrival')),
  starts_at   TIME NOT NULL,
  ends_at     TIME NOT NULL,
  label       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT school_bell_slots_unique UNIQUE (school_id, slot_index),
  CONSTRAINT school_bell_slots_time CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_school_bell_slots_school
  ON public.school_bell_slots (school_id);

COMMENT ON TABLE public.school_bell_slots IS
  'قالب ساعت زنگ‌ها و تفریح‌های یک مدرسه';

-- ── فهرست درس مدرسه ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.school_subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT school_subjects_name_unique UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_school_subjects_school
  ON public.school_subjects (school_id) WHERE is_active;

COMMENT ON TABLE public.school_subjects IS
  'فهرست ثابت درس‌های مدرسه — ادمین می‌تواند اضافه کند';

-- ── تقویم تحصیلی / تعطیلات ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academic_calendar_days (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  on_date     DATE NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('official_holiday', 'school_closure', 'exam_note')),
  title       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS academic_calendar_days_national_unique
  ON public.academic_calendar_days (on_date, kind, title)
  WHERE school_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS academic_calendar_days_school_unique
  ON public.academic_calendar_days (school_id, on_date, kind, title)
  WHERE school_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_academic_calendar_days_date
  ON public.academic_calendar_days (on_date);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_days_school
  ON public.academic_calendar_days (school_id, on_date);

COMMENT ON TABLE public.academic_calendar_days IS
  'تعطیلات رسمی (school_id NULL) و تعطیلی موردی مدرسه';

-- ── نسخهٔ برنامهٔ کلاس ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_timetable_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id       UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year   TEXT NOT NULL,
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'locked')),
  locked_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  locked_at       TIMESTAMPTZ,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT class_timetable_versions_range CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  )
);

CREATE INDEX IF NOT EXISTS idx_class_timetable_versions_class
  ON public.class_timetable_versions (class_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_class_timetable_versions_school
  ON public.class_timetable_versions (school_id, academic_year);

COMMENT ON TABLE public.class_timetable_versions IS
  'نسخهٔ برنامهٔ هفتگی کلاس از یک تاریخ مؤثر';

-- ── زنگ‌های یک نسخه ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_timetable_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id  UUID NOT NULL REFERENCES public.class_timetable_versions(id) ON DELETE CASCADE,
  weekday     SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 4),
  slot_index  SMALLINT NOT NULL CHECK (slot_index >= 0 AND slot_index < 20),
  subject_id  UUID REFERENCES public.school_subjects(id) ON DELETE SET NULL,
  teacher_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT class_timetable_slots_unique UNIQUE (version_id, weekday, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_class_timetable_slots_version
  ON public.class_timetable_slots (version_id);
CREATE INDEX IF NOT EXISTS idx_class_timetable_slots_teacher
  ON public.class_timetable_slots (teacher_id)
  WHERE teacher_id IS NOT NULL;

COMMENT ON TABLE public.class_timetable_slots IS
  'weekday: 0=شنبه … 4=چهارشنبه؛ تفریح/ورود بدون درس و معلم';
COMMENT ON COLUMN public.class_timetable_slots.weekday IS
  '0=شنبه، 1=یکشنبه، 2=دوشنبه، 3=سه‌شنبه، 4=چهارشنبه';

-- ── خواندن برنامهٔ کلاس ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.timetable_class_readable(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = p_class_id
      AND (
        public.is_admin_role((SELECT auth.uid()))
        OR c.teacher_id = (SELECT auth.uid())
        OR (
          c.school_id IS NOT NULL
          AND c.school_id = public.my_school_id()
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN (
                'principal', 'admin', 'platform_admin',
                'educational_vp', 'art_teacher', 'sports_teacher', 'teacher'
              )
          )
        )
        OR EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.class_id = p_class_id
            AND (
              s.user_id = (SELECT auth.uid())
              OR s.parent_id = (SELECT auth.uid())
              OR s.father_user_id = (SELECT auth.uid())
              OR s.mother_user_id = (SELECT auth.uid())
            )
        )
        OR EXISTS (
          SELECT 1
          FROM public.class_timetable_versions v
          JOIN public.class_timetable_slots sl ON sl.version_id = v.id
          WHERE v.class_id = p_class_id
            AND sl.teacher_id = (SELECT auth.uid())
        )
      )
  );
$fn$;

REVOKE ALL ON FUNCTION public.timetable_class_readable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.timetable_class_readable(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.timetable_class_readable(uuid) TO service_role;

-- آیا کاربر می‌تواند draft بنویسد / قفل کند؟
CREATE OR REPLACE FUNCTION public.timetable_class_writable(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = p_class_id
      AND (
        public.is_admin_role((SELECT auth.uid()))
        OR c.teacher_id = (SELECT auth.uid())
        OR (
          c.school_id IS NOT NULL
          AND c.school_id = public.my_school_id()
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN (
                'principal', 'admin', 'platform_admin', 'educational_vp'
              )
          )
        )
      )
  );
$fn$;

REVOKE ALL ON FUNCTION public.timetable_class_writable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.timetable_class_writable(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.timetable_class_writable(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.timetable_can_lock(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = p_class_id
      AND (
        public.is_admin_role((SELECT auth.uid()))
        OR (
          c.school_id IS NOT NULL
          AND c.school_id = public.my_school_id()
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN (
                'principal', 'admin', 'platform_admin', 'educational_vp'
              )
          )
        )
      )
  );
$fn$;

REVOKE ALL ON FUNCTION public.timetable_can_lock(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.timetable_can_lock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.timetable_can_lock(uuid) TO service_role;

-- ── RLS: school_bell_slots ─────────────────────────────────
ALTER TABLE public.school_bell_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_bell_slots_select" ON public.school_bell_slots;
CREATE POLICY "school_bell_slots_select"
  ON public.school_bell_slots FOR SELECT TO authenticated
  USING (
    public.is_admin_role((SELECT auth.uid()))
    OR school_id = public.my_school_id()
  );

DROP POLICY IF EXISTS "school_bell_slots_write" ON public.school_bell_slots;
CREATE POLICY "school_bell_slots_write"
  ON public.school_bell_slots FOR ALL TO authenticated
  USING (
    public.is_admin_role((SELECT auth.uid()))
    OR (
      school_id = public.my_school_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role IN ('principal', 'admin', 'platform_admin', 'educational_vp')
      )
    )
  )
  WITH CHECK (
    public.is_admin_role((SELECT auth.uid()))
    OR (
      school_id = public.my_school_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role IN ('principal', 'admin', 'platform_admin', 'educational_vp')
      )
    )
  );

-- ── RLS: school_subjects ───────────────────────────────────
ALTER TABLE public.school_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_subjects_select" ON public.school_subjects;
CREATE POLICY "school_subjects_select"
  ON public.school_subjects FOR SELECT TO authenticated
  USING (
    public.is_admin_role((SELECT auth.uid()))
    OR school_id = public.my_school_id()
  );

DROP POLICY IF EXISTS "school_subjects_write" ON public.school_subjects;
CREATE POLICY "school_subjects_write"
  ON public.school_subjects FOR ALL TO authenticated
  USING (
    public.is_admin_role((SELECT auth.uid()))
    OR (
      school_id = public.my_school_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role IN ('principal', 'admin', 'platform_admin', 'educational_vp')
      )
    )
  )
  WITH CHECK (
    public.is_admin_role((SELECT auth.uid()))
    OR (
      school_id = public.my_school_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role IN ('principal', 'admin', 'platform_admin', 'educational_vp')
      )
    )
  );

-- ── RLS: academic_calendar_days ────────────────────────────
ALTER TABLE public.academic_calendar_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "academic_calendar_days_select" ON public.academic_calendar_days;
CREATE POLICY "academic_calendar_days_select"
  ON public.academic_calendar_days FOR SELECT TO authenticated
  USING (
    school_id IS NULL
    OR public.is_admin_role((SELECT auth.uid()))
    OR school_id = public.my_school_id()
  );

DROP POLICY IF EXISTS "academic_calendar_days_write" ON public.academic_calendar_days;
CREATE POLICY "academic_calendar_days_write"
  ON public.academic_calendar_days FOR ALL TO authenticated
  USING (
    public.is_admin_role((SELECT auth.uid()))
    OR (
      school_id IS NOT NULL
      AND school_id = public.my_school_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role IN ('principal', 'admin', 'platform_admin', 'educational_vp')
      )
    )
  )
  WITH CHECK (
    public.is_admin_role((SELECT auth.uid()))
    OR (
      school_id IS NOT NULL
      AND school_id = public.my_school_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role IN ('principal', 'admin', 'platform_admin', 'educational_vp')
      )
    )
  );

-- ── RLS: class_timetable_versions ──────────────────────────
ALTER TABLE public.class_timetable_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_timetable_versions_select" ON public.class_timetable_versions;
CREATE POLICY "class_timetable_versions_select"
  ON public.class_timetable_versions FOR SELECT TO authenticated
  USING (public.timetable_class_readable(class_id));

DROP POLICY IF EXISTS "class_timetable_versions_insert" ON public.class_timetable_versions;
CREATE POLICY "class_timetable_versions_insert"
  ON public.class_timetable_versions FOR INSERT TO authenticated
  WITH CHECK (public.timetable_class_writable(class_id));

DROP POLICY IF EXISTS "class_timetable_versions_update" ON public.class_timetable_versions;
CREATE POLICY "class_timetable_versions_update"
  ON public.class_timetable_versions FOR UPDATE TO authenticated
  USING (public.timetable_class_writable(class_id))
  WITH CHECK (public.timetable_class_writable(class_id));

DROP POLICY IF EXISTS "class_timetable_versions_delete" ON public.class_timetable_versions;
CREATE POLICY "class_timetable_versions_delete"
  ON public.class_timetable_versions FOR DELETE TO authenticated
  USING (public.timetable_can_lock(class_id));

-- ── RLS: class_timetable_slots ─────────────────────────────
ALTER TABLE public.class_timetable_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_timetable_slots_select" ON public.class_timetable_slots;
CREATE POLICY "class_timetable_slots_select"
  ON public.class_timetable_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_timetable_versions v
      WHERE v.id = version_id
        AND public.timetable_class_readable(v.class_id)
    )
  );

DROP POLICY IF EXISTS "class_timetable_slots_write" ON public.class_timetable_slots;
CREATE POLICY "class_timetable_slots_write"
  ON public.class_timetable_slots FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_timetable_versions v
      WHERE v.id = version_id
        AND v.status = 'draft'
        AND public.timetable_class_writable(v.class_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.class_timetable_versions v
      WHERE v.id = version_id
        AND v.status = 'draft'
        AND public.timetable_class_writable(v.class_id)
    )
  );

-- ── GRANT ──────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_bell_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_bell_slots TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_subjects TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_calendar_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_calendar_days TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_timetable_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_timetable_versions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_timetable_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_timetable_slots TO service_role;
