-- =====================================================
-- افزودن ستون‌های برندینگ و لوگو به جدول مدارس
-- نسخه: 1.0
-- تاریخ: آذر 1403
-- =====================================================

-- =====================================================
-- افزودن ستون‌های جدید به جدول schools
-- =====================================================

-- لوگوی اصلی مدرسه
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Favicon (آیکون مرورگر)
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- رنگ‌های سازمانی
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3b82f6';

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#8b5cf6';

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1f2937';

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#f9fafb';

-- تنظیمات نمایش نام
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS show_name_in_header BOOLEAN DEFAULT true;

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS show_name_in_sidebar BOOLEAN DEFAULT true;

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS show_name_in_login BOOLEAN DEFAULT false;

-- اندازه لوگو در Sidebar
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS logo_size_in_sidebar TEXT DEFAULT 'md'
CHECK (logo_size_in_sidebar IN ('sm', 'md', 'lg'));

-- متن پاورقی
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS footer_text TEXT;

-- توضیحات مدرسه
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS description TEXT;

-- اطلاعات تماس اضافی
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS website TEXT;

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- =====================================================
-- ایجاد جدول تاریخچه تغییرات برندینگ
-- =====================================================

CREATE TABLE IF NOT EXISTS school_branding_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_type VARCHAR(50) NOT NULL, -- 'logo', 'favicon', 'colors', 'settings'
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ایندکس‌ها
CREATE INDEX idx_branding_history_school ON school_branding_history(school_id);
CREATE INDEX idx_branding_history_date ON school_branding_history(created_at DESC);

-- RLS
ALTER TABLE school_branding_history ENABLE ROW LEVEL SECURITY;

-- فقط مدیران مدرسه می‌توانند تاریخچه را ببینند
CREATE POLICY "School admins see branding history" ON school_branding_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.school_id = school_branding_history.school_id
        AND p.role IN ('principal', 'admin')
    )
  );

-- =====================================================
-- Trigger برای ثبت تغییرات
-- =====================================================

CREATE OR REPLACE FUNCTION log_branding_changes()
RETURNS TRIGGER AS $$
DECLARE
  change_type TEXT;
  old_val JSONB;
  new_val JSONB;
BEGIN
  -- تعیین نوع تغییر
  IF OLD.logo_url IS DISTINCT FROM NEW.logo_url THEN
    change_type := 'logo';
    old_val := jsonb_build_object('logo_url', OLD.logo_url);
    new_val := jsonb_build_object('logo_url', NEW.logo_url);
    
    INSERT INTO school_branding_history (school_id, changed_by, change_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), change_type, old_val, new_val);
  END IF;
  
  IF OLD.favicon_url IS DISTINCT FROM NEW.favicon_url THEN
    change_type := 'favicon';
    old_val := jsonb_build_object('favicon_url', OLD.favicon_url);
    new_val := jsonb_build_object('favicon_url', NEW.favicon_url);
    
    INSERT INTO school_branding_history (school_id, changed_by, change_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), change_type, old_val, new_val);
  END IF;
  
  IF OLD.primary_color IS DISTINCT FROM NEW.primary_color OR
     OLD.secondary_color IS DISTINCT FROM NEW.secondary_color OR
     OLD.text_color IS DISTINCT FROM NEW.text_color OR
     OLD.background_color IS DISTINCT FROM NEW.background_color THEN
    change_type := 'colors';
    old_val := jsonb_build_object(
      'primary_color', OLD.primary_color,
      'secondary_color', OLD.secondary_color,
      'text_color', OLD.text_color,
      'background_color', OLD.background_color
    );
    new_val := jsonb_build_object(
      'primary_color', NEW.primary_color,
      'secondary_color', NEW.secondary_color,
      'text_color', NEW.text_color,
      'background_color', NEW.background_color
    );
    
    INSERT INTO school_branding_history (school_id, changed_by, change_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), change_type, old_val, new_val);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER schools_branding_changes
  AFTER UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION log_branding_changes();

-- =====================================================
-- Function برای دریافت تنظیمات برندینگ مدرسه
-- =====================================================

CREATE OR REPLACE FUNCTION get_school_branding(p_school_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'description', s.description,
    'logo_url', s.logo_url,
    'favicon_url', s.favicon_url,
    'primary_color', COALESCE(s.primary_color, '#3b82f6'),
    'secondary_color', COALESCE(s.secondary_color, '#8b5cf6'),
    'text_color', COALESCE(s.text_color, '#1f2937'),
    'background_color', COALESCE(s.background_color, '#f9fafb'),
    'show_name_in_header', COALESCE(s.show_name_in_header, true),
    'show_name_in_sidebar', COALESCE(s.show_name_in_sidebar, true),
    'show_name_in_login', COALESCE(s.show_name_in_login, false),
    'logo_size_in_sidebar', COALESCE(s.logo_size_in_sidebar, 'md'),
    'footer_text', s.footer_text,
    'phone', s.phone,
    'email', s.email,
    'website', s.website,
    'address', s.address,
    'postal_code', s.postal_code
  ) INTO result
  FROM schools s
  WHERE s.id = p_school_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function برای بروزرسانی تنظیمات برندینگ
-- =====================================================

CREATE OR REPLACE FUNCTION update_school_branding(
  p_school_id UUID,
  p_settings JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  -- بررسی دسترسی
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND school_id = p_school_id
      AND role IN ('principal', 'admin')
  ) THEN
    RAISE EXCEPTION 'شما دسترسی ویرایش تنظیمات این مدرسه را ندارید';
  END IF;

  UPDATE schools SET
    name = COALESCE(p_settings->>'name', name),
    description = COALESCE(p_settings->>'description', description),
    logo_url = COALESCE(p_settings->>'logo_url', logo_url),
    favicon_url = COALESCE(p_settings->>'favicon_url', favicon_url),
    primary_color = COALESCE(p_settings->>'primary_color', primary_color),
    secondary_color = COALESCE(p_settings->>'secondary_color', secondary_color),
    text_color = COALESCE(p_settings->>'text_color', text_color),
    background_color = COALESCE(p_settings->>'background_color', background_color),
    show_name_in_header = COALESCE((p_settings->>'show_name_in_header')::boolean, show_name_in_header),
    show_name_in_sidebar = COALESCE((p_settings->>'show_name_in_sidebar')::boolean, show_name_in_sidebar),
    show_name_in_login = COALESCE((p_settings->>'show_name_in_login')::boolean, show_name_in_login),
    logo_size_in_sidebar = COALESCE(p_settings->>'logo_size_in_sidebar', logo_size_in_sidebar),
    footer_text = COALESCE(p_settings->>'footer_text', footer_text),
    phone = COALESCE(p_settings->>'phone', phone),
    email = COALESCE(p_settings->>'email', email),
    website = COALESCE(p_settings->>'website', website),
    address = COALESCE(p_settings->>'address', address),
    postal_code = COALESCE(p_settings->>'postal_code', postal_code),
    updated_at = NOW()
  WHERE id = p_school_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Policy برای دسترسی به schools
-- =====================================================

-- همه می‌توانند اطلاعات عمومی مدرسه خود را ببینند
CREATE POLICY "Users see own school" ON schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = schools.id
    )
  );

-- فقط مدیران می‌توانند ویرایش کنند
CREATE POLICY "Admins update school" ON schools
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = schools.id
        AND profiles.role IN ('principal', 'admin')
    )
  );

-- =====================================================
-- کامنت‌ها
-- =====================================================

COMMENT ON COLUMN schools.logo_url IS 'URL لوگوی اصلی مدرسه';
COMMENT ON COLUMN schools.favicon_url IS 'URL آیکون مرورگر';
COMMENT ON COLUMN schools.primary_color IS 'رنگ اصلی مدرسه (Hex)';
COMMENT ON COLUMN schools.secondary_color IS 'رنگ ثانویه مدرسه (Hex)';
COMMENT ON COLUMN schools.text_color IS 'رنگ متن پیش‌فرض (Hex)';
COMMENT ON COLUMN schools.background_color IS 'رنگ پس‌زمینه پیش‌فرض (Hex)';
COMMENT ON COLUMN schools.show_name_in_header IS 'نمایش نام مدرسه در Header';
COMMENT ON COLUMN schools.show_name_in_sidebar IS 'نمایش نام مدرسه در Sidebar';
COMMENT ON COLUMN schools.show_name_in_login IS 'نمایش نام مدرسه در صفحه ورود';
COMMENT ON COLUMN schools.logo_size_in_sidebar IS 'اندازه لوگو در Sidebar: sm, md, lg';
COMMENT ON COLUMN schools.footer_text IS 'متن پاورقی در گزارشات';

COMMENT ON TABLE school_branding_history IS 'تاریخچه تغییرات برندینگ مدرسه';
COMMENT ON FUNCTION get_school_branding(UUID) IS 'دریافت تنظیمات برندینگ مدرسه';
COMMENT ON FUNCTION update_school_branding(UUID, JSONB) IS 'بروزرسانی تنظیمات برندینگ مدرسه';



















