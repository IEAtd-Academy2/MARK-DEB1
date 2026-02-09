
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Site Configs
CREATE TABLE IF NOT EXISTS site_configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 2. Employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    base_salary NUMERIC NOT NULL DEFAULT 0,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    personal_catalog_url TEXT,
    is_sales_specialist BOOLEAN DEFAULT FALSE,
    sales_commission_rate NUMERIC DEFAULT 0,
    monthly_sales_target NUMERIC DEFAULT 0,
    other_commission_rate NUMERIC DEFAULT 0,
    leave_balance INTEGER DEFAULT 21,
    can_view_plans BOOLEAN DEFAULT FALSE,
    plan_permissions JSONB DEFAULT '{}',
    column_permissions JSONB DEFAULT '{}',
    nav_permissions JSONB DEFAULT '{}',
    default_incentive NUMERIC DEFAULT 1000
);

-- 3. KPI Configs
CREATE TABLE IF NOT EXISTS kpi_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    target_value NUMERIC NOT NULL DEFAULT 0,
    incentive_percentage NUMERIC DEFAULT 0, -- Deprecated but kept
    unit_value NUMERIC DEFAULT 0, -- New piece-rate
    smart_s TEXT,
    smart_m TEXT,
    smart_a TEXT,
    smart_r TEXT,
    smart_t TEXT,
    applicable_month INTEGER,
    applicable_year INTEGER,
    status TEXT DEFAULT 'Draft',
    manager_feedback TEXT,
    kpi_name TEXT
);

-- 4. KPI Records
CREATE TABLE IF NOT EXISTS kpi_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    kpi_config_id UUID REFERENCES kpi_configs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    achieved_value NUMERIC NOT NULL DEFAULT 0,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Task Columns (Kanban)
CREATE TABLE IF NOT EXISTS task_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default columns
INSERT INTO task_columns (title, order_index)
SELECT 'مهام جديدة', 0 WHERE NOT EXISTS (SELECT 1 FROM task_columns);
INSERT INTO task_columns (title, order_index)
SELECT 'قيد التنفيذ', 1 WHERE NOT EXISTS (SELECT 1 FROM task_columns WHERE title = 'قيد التنفيذ');
INSERT INTO task_columns (title, order_index)
SELECT 'تم الإنجاز', 2 WHERE NOT EXISTS (SELECT 1 FROM task_columns WHERE title = 'تم الإنجاز');

-- 6. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    source_dept TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    completion_date TIMESTAMP WITH TIME ZONE,
    is_problem_solving BOOLEAN DEFAULT FALSE,
    column_id UUID REFERENCES task_columns(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    timer_start TIMESTAMP WITH TIME ZONE,
    total_duration INTEGER DEFAULT 0,
    is_running BOOLEAN DEFAULT FALSE,
    attachment_url TEXT,
    notes TEXT
);

-- 7. Task Logs (History)
CREATE TABLE IF NOT EXISTS task_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    task_title TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    month INTEGER,
    year INTEGER
);

-- 8. Behavior Logs
CREATE TABLE IF NOT EXISTS behavior_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    week_number INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    mood_rating TEXT NOT NULL,
    notes TEXT
);

-- 9. Problem Logs
CREATE TABLE IF NOT EXISTS problem_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    problem_desc TEXT NOT NULL,
    solution_status TEXT NOT NULL DEFAULT 'Unsolved',
    guidance_given BOOLEAN DEFAULT FALSE,
    logged_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    solved_date TIMESTAMP WITH TIME ZONE,
    potential_bonus_amount NUMERIC DEFAULT 0
);

-- 10. Financials
CREATE TABLE IF NOT EXISTS financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    calculated_incentive NUMERIC DEFAULT 0,
    manual_deduction NUMERIC DEFAULT 0,
    manual_deduction_note TEXT,
    problem_solving_bonus NUMERIC DEFAULT 0,
    sales_commission_payout NUMERIC DEFAULT 0,
    other_commission_payout NUMERIC DEFAULT 0,
    final_payout NUMERIC DEFAULT 0,
    base_salary_at_month NUMERIC DEFAULT 0,
    kpi_score_percentage NUMERIC DEFAULT 0,
    manager_feedback TEXT,
    UNIQUE(employee_id, month, year)
);

-- 11. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    expenses NUMERIC NOT NULL DEFAULT 0,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_info TEXT,
    source_department TEXT,
    acquired_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    acquisition_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    initial_revenue NUMERIC DEFAULT 0,
    notes TEXT
);

-- 13. Other Commission Logs
CREATE TABLE IF NOT EXISTS other_commission_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    logged_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count NUMERIC NOT NULL DEFAULT 0,
    hours_count INTEGER DEFAULT 0,
    reason TEXT,
    attachment_url TEXT,
    status TEXT DEFAULT 'Pending',
    manager_comment TEXT,
    can_work_remotely BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Attendance Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- 16. Plans
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL, 
    sheet_name TEXT NOT NULL, 
    data JSONB DEFAULT '[]', 
    links JSONB DEFAULT '{}', 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Manager Tasks
CREATE TABLE IF NOT EXISTS manager_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    date DATE NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Ad Campaigns
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    destination_number TEXT,
    link TEXT,
    targeting TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Storage Buckets (Safe Insert)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', true, false, null, null)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies (Drop and Recreate)
DROP POLICY IF EXISTS "Give public access to documents" ON storage.objects;
CREATE POLICY "Give public access to documents" ON storage.objects FOR SELECT USING ( bucket_id = 'documents' );

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'documents' );
