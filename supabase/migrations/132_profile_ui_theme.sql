-- تم رابط کاربری (روشن / تیره نرم) — همسان روی همه دستگاه‌ها
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ui_theme TEXT NOT NULL DEFAULT 'dark'
  CHECK (ui_theme IN ('light', 'dark'));

COMMENT ON COLUMN profiles.ui_theme IS 'ترجیح تم UI: light (روشن نرم) یا dark (تیره نرم)';
