-- تم گرم (کاغذی) علاوه بر روشن/تیره
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_ui_theme_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_ui_theme_check
  CHECK (ui_theme IN ('light', 'warm', 'dark'));

COMMENT ON COLUMN public.profiles.ui_theme IS 'ترجیح تم UI: light (روشن نرم)، warm (گرم کاغذی)، dark (تیره نرم)';
