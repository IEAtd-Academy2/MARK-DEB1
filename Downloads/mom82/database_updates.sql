
-- 1. جداول الخزنة
CREATE TABLE IF NOT EXISTS password_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🔐',
    color TEXT DEFAULT 'indigo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES password_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    username TEXT,
    password TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. تحديث جدول الموظفين لإضافة صلاحيات الخزنة
ALTER TABLE employees ADD COLUMN IF NOT EXISTS vault_permissions JSONB DEFAULT '{}';

-- 3. إضافة الفئات الافتراضية
INSERT INTO password_categories (name, icon, color) 
SELECT 'حسابات عامة', '🌐', 'blue' WHERE NOT EXISTS (SELECT 1 FROM password_categories WHERE name = 'حسابات عامة');
INSERT INTO password_categories (name, icon, color) 
SELECT 'سوشيال ميديا', '📱', 'purple' WHERE NOT EXISTS (SELECT 1 FROM password_categories WHERE name = 'سوشيال ميديا');
INSERT INTO password_categories (name, icon, color) 
SELECT 'ديزاينرز', '🎨', 'pink' WHERE NOT EXISTS (SELECT 1 FROM password_categories WHERE name = 'ديزاينرز');
