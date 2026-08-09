-- Restore EXECUTE for RLS helper functions required by profiles/schools policies.
-- Phase 2 accidentally revoked these from authenticated and broke admin login
-- (success toast → middleware could not read profiles → bounce back to /login).

REVOKE ALL ON FUNCTION public.is_admin_role(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_platform_admin_role(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin_role(uuid) TO authenticated, service_role;
