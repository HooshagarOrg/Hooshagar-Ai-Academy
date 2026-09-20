-- ═══════════════════════════════════════════════════════════
-- Migration 170: MVP نقش‌های باقی‌ماندهٔ کارکنان اول مهر
-- جداول دامنه + RLS مدرسه‌محور + GRANT برای Data API
-- ═══════════════════════════════════════════════════════════

-- ── helpers: school staff check (inline in policies) ──

-- ═══════════════════════════════════════════════════════════
-- 1) school_meetings — منشی
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.school_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_meetings_school_at
  ON public.school_meetings (school_id, meeting_at DESC);

ALTER TABLE public.school_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_meetings_select" ON public.school_meetings;
CREATE POLICY "school_meetings_select"
ON public.school_meetings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = school_meetings.school_id
          AND p.role IN ('secretary', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "school_meetings_insert" ON public.school_meetings;
CREATE POLICY "school_meetings_insert"
ON public.school_meetings FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = school_meetings.school_id
          AND p.role IN ('secretary', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT ON public.school_meetings TO authenticated;
GRANT ALL ON public.school_meetings TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 2) correspondence_items — منشی
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.correspondence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  subject TEXT NOT NULL,
  party_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  body TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_correspondence_school_created
  ON public.correspondence_items (school_id, created_at DESC);

ALTER TABLE public.correspondence_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "correspondence_items_select" ON public.correspondence_items;
CREATE POLICY "correspondence_items_select"
ON public.correspondence_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = correspondence_items.school_id
          AND p.role IN ('secretary', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "correspondence_items_insert" ON public.correspondence_items;
CREATE POLICY "correspondence_items_insert"
ON public.correspondence_items FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = correspondence_items.school_id
          AND p.role IN ('secretary', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT ON public.correspondence_items TO authenticated;
GRANT ALL ON public.correspondence_items TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 3) tuition_settings — مالی
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tuition_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year TEXT,
  base_tuition BIGINT NOT NULL DEFAULT 0,
  with_service_tuition BIGINT NOT NULL DEFAULT 0,
  registration_fee BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tuition_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tuition_settings_select" ON public.tuition_settings;
CREATE POLICY "tuition_settings_select"
ON public.tuition_settings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = tuition_settings.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "tuition_settings_insert" ON public.tuition_settings;
CREATE POLICY "tuition_settings_insert"
ON public.tuition_settings FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = tuition_settings.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "tuition_settings_update" ON public.tuition_settings;
CREATE POLICY "tuition_settings_update"
ON public.tuition_settings FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = tuition_settings.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
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
          p.school_id = tuition_settings.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT, UPDATE ON public.tuition_settings TO authenticated;
GRANT ALL ON public.tuition_settings TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 4) student_tuition — مالی (+ والد SELECT)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.student_tuition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  total_due BIGINT NOT NULL DEFAULT 0,
  discount BIGINT NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_student_tuition_school
  ON public.student_tuition (school_id);

ALTER TABLE public.student_tuition ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_tuition_select" ON public.student_tuition;
CREATE POLICY "student_tuition_select"
ON public.student_tuition FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = student_tuition.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
        )
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_tuition.student_id
      AND (
        s.parent_id = (SELECT auth.uid())
        OR s.father_user_id = (SELECT auth.uid())
        OR s.mother_user_id = (SELECT auth.uid())
      )
  )
);

DROP POLICY IF EXISTS "student_tuition_insert" ON public.student_tuition;
CREATE POLICY "student_tuition_insert"
ON public.student_tuition FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = student_tuition.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "student_tuition_update" ON public.student_tuition;
CREATE POLICY "student_tuition_update"
ON public.student_tuition FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = student_tuition.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
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
          p.school_id = student_tuition.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT, UPDATE ON public.student_tuition TO authenticated;
GRANT ALL ON public.student_tuition TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 5) tuition_payments — مالی (+ والد SELECT)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tuition_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  paid_at DATE NOT NULL,
  method TEXT,
  receipt_no TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tuition_payments_school_paid
  ON public.tuition_payments (school_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_tuition_payments_student
  ON public.tuition_payments (student_id);

ALTER TABLE public.tuition_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tuition_payments_select" ON public.tuition_payments;
CREATE POLICY "tuition_payments_select"
ON public.tuition_payments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = tuition_payments.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
        )
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = tuition_payments.student_id
      AND (
        s.parent_id = (SELECT auth.uid())
        OR s.father_user_id = (SELECT auth.uid())
        OR s.mother_user_id = (SELECT auth.uid())
      )
  )
);

DROP POLICY IF EXISTS "tuition_payments_insert" ON public.tuition_payments;
CREATE POLICY "tuition_payments_insert"
ON public.tuition_payments FOR INSERT TO authenticated
WITH CHECK (
  recorded_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = tuition_payments.school_id
          AND p.role IN ('financial_vp', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT ON public.tuition_payments TO authenticated;
GRANT ALL ON public.tuition_payments TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 6) teacher_evaluations — معاون ارزیابی
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.teacher_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id),
  period_label TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 1 AND score <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_school
  ON public.teacher_evaluations (school_id, created_at DESC);

ALTER TABLE public.teacher_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_evaluations_select" ON public.teacher_evaluations;
CREATE POLICY "teacher_evaluations_select"
ON public.teacher_evaluations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = teacher_evaluations.school_id
          AND p.role IN ('evaluation_vp', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "teacher_evaluations_insert" ON public.teacher_evaluations;
CREATE POLICY "teacher_evaluations_insert"
ON public.teacher_evaluations FOR INSERT TO authenticated
WITH CHECK (
  evaluator_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = teacher_evaluations.school_id
          AND p.role IN ('evaluation_vp', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT ON public.teacher_evaluations TO authenticated;
GRANT ALL ON public.teacher_evaluations TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 7) library_books — کتابدار
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  copies INT NOT NULL DEFAULT 1 CHECK (copies >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_books_school
  ON public.library_books (school_id, title);

ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "library_books_select" ON public.library_books;
CREATE POLICY "library_books_select"
ON public.library_books FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = library_books.school_id
          AND p.role IN ('librarian', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "library_books_insert" ON public.library_books;
CREATE POLICY "library_books_insert"
ON public.library_books FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = library_books.school_id
          AND p.role IN ('librarian', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT ON public.library_books TO authenticated;
GRANT ALL ON public.library_books TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 8) book_loans — کتابدار
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.book_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  borrower_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  borrower_name TEXT,
  borrowed_at DATE NOT NULL,
  due_at DATE,
  returned_at DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_book_loans_school
  ON public.book_loans (school_id, borrowed_at DESC);

ALTER TABLE public.book_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_loans_select" ON public.book_loans;
CREATE POLICY "book_loans_select"
ON public.book_loans FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = book_loans.school_id
          AND p.role IN ('librarian', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "book_loans_insert" ON public.book_loans;
CREATE POLICY "book_loans_insert"
ON public.book_loans FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = book_loans.school_id
          AND p.role IN ('librarian', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "book_loans_update" ON public.book_loans;
CREATE POLICY "book_loans_update"
ON public.book_loans FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = book_loans.school_id
          AND p.role IN ('librarian', 'principal', 'admin')
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
          p.school_id = book_loans.school_id
          AND p.role IN ('librarian', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT, UPDATE ON public.book_loans TO authenticated;
GRANT ALL ON public.book_loans TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 9) specialty_reports — هنر / ورزش
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.specialty_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('art', 'sports')),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_specialty_reports_school_kind
  ON public.specialty_reports (school_id, kind, created_at DESC);

ALTER TABLE public.specialty_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "specialty_reports_select" ON public.specialty_reports;
CREATE POLICY "specialty_reports_select"
ON public.specialty_reports FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = specialty_reports.school_id
          AND p.role IN (
            'art_teacher', 'sports_teacher', 'principal', 'admin', 'teacher'
          )
        )
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = specialty_reports.student_id
      AND (
        s.parent_id = (SELECT auth.uid())
        OR s.father_user_id = (SELECT auth.uid())
        OR s.mother_user_id = (SELECT auth.uid())
      )
  )
);

DROP POLICY IF EXISTS "specialty_reports_insert" ON public.specialty_reports;
CREATE POLICY "specialty_reports_insert"
ON public.specialty_reports FOR INSERT TO authenticated
WITH CHECK (
  teacher_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = specialty_reports.school_id
          AND (
            (specialty_reports.kind = 'art' AND p.role IN ('art_teacher', 'principal', 'admin'))
            OR (specialty_reports.kind = 'sports' AND p.role IN ('sports_teacher', 'principal', 'admin'))
          )
        )
      )
  )
);

GRANT SELECT, INSERT ON public.specialty_reports TO authenticated;
GRANT ALL ON public.specialty_reports TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 10) entry_exit_logs — حراست
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.entry_exit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gate TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_entry_exit_logs_school
  ON public.entry_exit_logs (school_id, logged_at DESC);

ALTER TABLE public.entry_exit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entry_exit_logs_select" ON public.entry_exit_logs;
CREATE POLICY "entry_exit_logs_select"
ON public.entry_exit_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = entry_exit_logs.school_id
          AND p.role IN ('security', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "entry_exit_logs_insert" ON public.entry_exit_logs;
CREATE POLICY "entry_exit_logs_insert"
ON public.entry_exit_logs FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = entry_exit_logs.school_id
          AND p.role IN ('security', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT ON public.entry_exit_logs TO authenticated;
GRANT ALL ON public.entry_exit_logs TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 11) security_incidents — حراست
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  description TEXT,
  reported_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_school
  ON public.security_incidents (school_id, created_at DESC);

ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_incidents_select" ON public.security_incidents;
CREATE POLICY "security_incidents_select"
ON public.security_incidents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = security_incidents.school_id
          AND p.role IN ('security', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "security_incidents_insert" ON public.security_incidents;
CREATE POLICY "security_incidents_insert"
ON public.security_incidents FOR INSERT TO authenticated
WITH CHECK (
  reported_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = security_incidents.school_id
          AND p.role IN ('security', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT ON public.security_incidents TO authenticated;
GRANT ALL ON public.security_incidents TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 12) maintenance_requests — نگهداری
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  area TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  description TEXT,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_school
  ON public.maintenance_requests (school_id, created_at DESC);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "maintenance_requests_select" ON public.maintenance_requests;
CREATE POLICY "maintenance_requests_select"
ON public.maintenance_requests FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = maintenance_requests.school_id
          AND p.role IN ('maintenance', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "maintenance_requests_insert" ON public.maintenance_requests;
CREATE POLICY "maintenance_requests_insert"
ON public.maintenance_requests FOR INSERT TO authenticated
WITH CHECK (
  requested_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = maintenance_requests.school_id
          AND p.role IN ('maintenance', 'principal', 'admin')
        )
      )
  )
);

DROP POLICY IF EXISTS "maintenance_requests_update" ON public.maintenance_requests;
CREATE POLICY "maintenance_requests_update"
ON public.maintenance_requests FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = maintenance_requests.school_id
          AND p.role IN ('maintenance', 'principal', 'admin')
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
          p.school_id = maintenance_requests.school_id
          AND p.role IN ('maintenance', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT, UPDATE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 13) academic_foundation_scores — معلم
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.academic_foundation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  domain TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 1 AND score <= 5),
  notes TEXT,
  assessed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_foundation_school
  ON public.academic_foundation_scores (school_id, assessed_at DESC);

ALTER TABLE public.academic_foundation_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "academic_foundation_scores_select" ON public.academic_foundation_scores;
CREATE POLICY "academic_foundation_scores_select"
ON public.academic_foundation_scores FOR SELECT TO authenticated
USING (
  teacher_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = academic_foundation_scores.school_id
          AND p.role IN ('teacher', 'principal', 'admin', 'educational_vp')
        )
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = academic_foundation_scores.student_id
      AND (
        s.parent_id = (SELECT auth.uid())
        OR s.father_user_id = (SELECT auth.uid())
        OR s.mother_user_id = (SELECT auth.uid())
      )
  )
);

DROP POLICY IF EXISTS "academic_foundation_scores_insert" ON public.academic_foundation_scores;
CREATE POLICY "academic_foundation_scores_insert"
ON public.academic_foundation_scores FOR INSERT TO authenticated
WITH CHECK (
  teacher_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = academic_foundation_scores.school_id
          AND p.role IN ('teacher', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT ON public.academic_foundation_scores TO authenticated;
GRANT ALL ON public.academic_foundation_scores TO service_role;

COMMENT ON TABLE public.school_meetings IS 'جلسات مدرسه — نقش secretary';
COMMENT ON TABLE public.correspondence_items IS 'مکاتبات اداری — نقش secretary';
COMMENT ON TABLE public.tuition_settings IS 'تنظیمات شهریه مدرسه — نقش financial_vp';
COMMENT ON TABLE public.student_tuition IS 'بدهی/شهریه دانش‌آموز — financial_vp + والد';
COMMENT ON TABLE public.tuition_payments IS 'پرداخت شهریه — financial_vp + والد';
COMMENT ON TABLE public.teacher_evaluations IS 'ارزیابی معلمان — evaluation_vp';
COMMENT ON TABLE public.library_books IS 'کتابخانه مدرسه — librarian';
COMMENT ON TABLE public.book_loans IS 'امانت کتاب — librarian';
COMMENT ON TABLE public.specialty_reports IS 'گزارش هنر/ورزش — art_teacher / sports_teacher';
COMMENT ON TABLE public.entry_exit_logs IS 'ورود و خروج — security';
COMMENT ON TABLE public.security_incidents IS 'رخدادهای امنیتی — security';
COMMENT ON TABLE public.maintenance_requests IS 'درخواست تعمیر — maintenance';
COMMENT ON TABLE public.academic_foundation_scores IS 'مهارت پایه — teacher';
