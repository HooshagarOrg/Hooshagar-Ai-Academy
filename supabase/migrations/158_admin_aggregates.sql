-- ═══════════════════════════════════════════════════════════
-- Migration 158: تجمیع در SQL به‌جای کشیدن کل جدول
--
-- مشکل:
--   /api/admin/users در هر بار لیست، کل profiles را صفحه‌به‌صفحه
--   می‌خواند تا فقط تعداد هر نقش را بشمارد.
--   /api/admin/analytics کل grades و کل talent_garden را می‌کشد
--   تا میانگین بگیرد — دو جدولی که سریع‌ترین رشد را دارند.
--
-- راه‌حل: چهار تابع تجمیع.
--
-- نکتهٔ مهم: همه SECURITY INVOKER هستند (پیش‌فرض) تا RLS فراخوان
-- اعمال شود. اگر SECURITY DEFINER بودند، مدیرِ یک مدرسه آمار همهٔ
-- مدارس را می‌دید — هم تغییر رفتار، هم نشتی داده.
-- ═══════════════════════════════════════════════════════════

-- ── تعداد کاربران به‌ازای نقش ──
CREATE OR REPLACE FUNCTION public.profile_role_counts()
RETURNS TABLE (role text, total bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $fn$
  SELECT p.role::text, count(*)::bigint
  FROM public.profiles p
  GROUP BY p.role;
$fn$;

-- ── خلاصهٔ نمرات: میانگین از ۲۰، نرخ قبولی، تعداد ──
-- نرمال‌سازی عیناً معادل (score / (max_score || 20)) * 20 در JS است.
CREATE OR REPLACE FUNCTION public.grades_overview()
RETURNS TABLE (
  total_grades bigint,
  average_score numeric,
  passing_rate numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $fn$
  SELECT
    count(*)::bigint,
    COALESCE(AVG(g.score / COALESCE(NULLIF(g.max_score, 0), 20) * 20), 0),
    CASE
      WHEN count(*) = 0 THEN 0
      ELSE count(*) FILTER (
        WHERE g.score / COALESCE(NULLIF(g.max_score, 0), 20) >= 0.6
      ) * 100.0 / count(*)
    END
  FROM public.grades g;
$fn$;

-- ── میانگین هر درس، مرتب نزولی ──
CREATE OR REPLACE FUNCTION public.grades_subject_averages(p_limit integer DEFAULT 10)
RETURNS TABLE (subject text, avg numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $fn$
  SELECT
    g.subject,
    AVG(g.score / COALESCE(NULLIF(g.max_score, 0), 20) * 20) AS avg
  FROM public.grades g
  GROUP BY g.subject
  ORDER BY avg DESC
  LIMIT GREATEST(COALESCE(p_limit, 10), 1);
$fn$;

-- ── خلاصهٔ باغ استعداد ──
CREATE OR REPLACE FUNCTION public.talent_garden_overview()
RETURNS TABLE (
  total_xp bigint,
  active_users bigint,
  avg_level numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $fn$
  SELECT
    COALESCE(SUM(COALESCE(t.xp, 0)), 0)::bigint,
    count(*) FILTER (WHERE COALESCE(t.xp, 0) > 0)::bigint,
    COALESCE(AVG(COALESCE(t.level, 1)), 0)
  FROM public.talent_garden t;
$fn$;

REVOKE ALL ON FUNCTION public.profile_role_counts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.grades_overview() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.grades_subject_averages(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.talent_garden_overview() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.profile_role_counts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grades_overview() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grades_subject_averages(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.talent_garden_overview() TO authenticated, service_role;

COMMENT ON FUNCTION public.profile_role_counts() IS
  'تعداد کاربران هر نقش — SECURITY INVOKER تا RLS فراخوان اعمال شود';
COMMENT ON FUNCTION public.grades_overview() IS
  'میانگین از ۲۰ و نرخ قبولی و تعداد نمرات — تجمیع در SQL';
COMMENT ON FUNCTION public.grades_subject_averages(integer) IS
  'میانگین هر درس مرتب نزولی — تجمیع در SQL';
COMMENT ON FUNCTION public.talent_garden_overview() IS
  'جمع XP و کاربران فعال و میانگین سطح — تجمیع در SQL';
