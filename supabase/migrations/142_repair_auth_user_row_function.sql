-- ═══════════════════════════════════════════════════════════════════
-- Migration 142: تابع ترمیم رکوردهای قدیمی/معیوب auth.users
-- علت: کاربرانی که با INSERT مستقیم SQL ساخته شده‌اند (اسکریپت‌های
-- تست دستی مثل CREATE_FINANCIAL_VP_TEST_USER.sql) ستون‌های
-- instance_id/aud/token را NULL دارند به‌جای مقدار مورد انتظار GoTrue.
-- این باعث خطای "Database error loading user" یا 404 هنگام حذف/ویرایش
-- کاربر از طریق Admin API می‌شود («خطا در حذف کاربر» در پنل ادمین).
--
-- این تابع به‌صورت best-effort قبل از تلاش دوم حذف کاربر فراخوانی
-- می‌شود (در app/api/admin/users/route.ts) تا نیازی به مداخله دستی
-- در دیتابیس نباشد.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.repair_auth_user_row(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET
    instance_id = COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'),
    aud = COALESCE(aud, 'authenticated'),
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    reauthentication_token = COALESCE(reauthentication_token, '')
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.repair_auth_user_row(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.repair_auth_user_row(uuid) TO service_role;

-- ترمیم پیشگیرانه هر رکورد موجودی که همین مشکل را دارد
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM auth.users
    WHERE instance_id IS NULL
       OR aud IS NULL
       OR confirmation_token IS NULL
       OR recovery_token IS NULL
       OR email_change_token_new IS NULL
       OR email_change IS NULL
       OR email_change_token_current IS NULL
       OR phone_change IS NULL
       OR phone_change_token IS NULL
       OR reauthentication_token IS NULL
  LOOP
    PERFORM public.repair_auth_user_row(r.id);
  END LOOP;
END $$;
