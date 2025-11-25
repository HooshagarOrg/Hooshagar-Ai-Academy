-- اضافه کردن ستون full_name
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- اضافه کردن ستون parent_email
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- اضافه کردن constraint برای full_name (اجباری)
ALTER TABLE students 
ALTER COLUMN full_name SET NOT NULL;

