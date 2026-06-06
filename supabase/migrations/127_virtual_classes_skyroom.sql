-- ═══════════════════════════════════════════════════════════════════
-- Migration 127: کلاس مجازی اسکای‌روم
-- ═══════════════════════════════════════════════════════════════════

-- ── virtual_classes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.virtual_classes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id          UUID NOT NULL UNIQUE REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  skyroom_room_id   INTEGER NOT NULL,
  skyroom_room_name TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_virtual_classes_school ON public.virtual_classes(school_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_teacher ON public.virtual_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_status ON public.virtual_classes(status);

COMMENT ON TABLE public.virtual_classes IS 'نگاشت کلاس درسی هوشاگر به اتاق اسکای‌روم';

-- ── virtual_class_sessions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.virtual_class_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  virtual_class_id    UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  join_buffer_minutes INTEGER NOT NULL DEFAULT 5,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT virtual_class_sessions_time_valid CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_vc_sessions_virtual_class ON public.virtual_class_sessions(virtual_class_id);
CREATE INDEX IF NOT EXISTS idx_vc_sessions_starts ON public.virtual_class_sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_vc_sessions_status ON public.virtual_class_sessions(status);

-- ── virtual_class_login_cache ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.virtual_class_login_cache (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  virtual_class_id UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  profile_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  login_url        TEXT NOT NULL,
  expires_at       TIMESTAMPTZ NOT NULL,
  access           SMALLINT NOT NULL CHECK (access IN (1, 2, 3)),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (virtual_class_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_vc_login_cache_expires ON public.virtual_class_login_cache(expires_at);

-- ── updated_at triggers ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_virtual_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_virtual_classes_updated_at ON public.virtual_classes;
CREATE TRIGGER tr_virtual_classes_updated_at
  BEFORE UPDATE ON public.virtual_classes
  FOR EACH ROW EXECUTE FUNCTION public.set_virtual_classes_updated_at();

DROP TRIGGER IF EXISTS tr_virtual_class_sessions_updated_at ON public.virtual_class_sessions;
CREATE TRIGGER tr_virtual_class_sessions_updated_at
  BEFORE UPDATE ON public.virtual_class_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_virtual_classes_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE public.virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_class_login_cache ENABLE ROW LEVEL SECURITY;

-- platform_admin: full access
CREATE POLICY "virtual_classes_platform_admin_all"
  ON public.virtual_classes FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

CREATE POLICY "vc_sessions_platform_admin_all"
  ON public.virtual_class_sessions FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

CREATE POLICY "vc_login_cache_platform_admin_all"
  ON public.virtual_class_login_cache FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- teachers: see own virtual classes
CREATE POLICY "virtual_classes_teacher_select"
  ON public.virtual_classes FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "vc_sessions_teacher_select"
  ON public.virtual_class_sessions FOR SELECT TO authenticated
  USING (
    virtual_class_id IN (
      SELECT id FROM public.virtual_classes WHERE teacher_id = auth.uid()
    )
  );

-- students: see virtual class for their class
CREATE POLICY "virtual_classes_student_select"
  ON public.virtual_classes FOR SELECT TO authenticated
  USING (
    class_id IN (
      SELECT class_id FROM public.students WHERE user_id = auth.uid() AND class_id IS NOT NULL
    )
  );

CREATE POLICY "vc_sessions_student_select"
  ON public.virtual_class_sessions FOR SELECT TO authenticated
  USING (
    virtual_class_id IN (
      SELECT vc.id FROM public.virtual_classes vc
      JOIN public.students s ON s.class_id = vc.class_id
      WHERE s.user_id = auth.uid()
    )
  );

-- parents: see virtual class for children's class
CREATE POLICY "virtual_classes_parent_select"
  ON public.virtual_classes FOR SELECT TO authenticated
  USING (
    class_id IN (
      SELECT class_id FROM public.students
      WHERE parent_id = auth.uid() AND class_id IS NOT NULL
    )
  );

CREATE POLICY "vc_sessions_parent_select"
  ON public.virtual_class_sessions FOR SELECT TO authenticated
  USING (
    virtual_class_id IN (
      SELECT vc.id FROM public.virtual_classes vc
      JOIN public.students s ON s.class_id = vc.class_id
      WHERE s.parent_id = auth.uid()
    )
  );

-- login cache: service_role only via API (no user policies except platform_admin above)

-- ── GRANTS ────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_classes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_class_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_class_sessions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_class_login_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_class_login_cache TO service_role;
