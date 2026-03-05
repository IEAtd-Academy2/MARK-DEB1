CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  report_link TEXT,
  duration_months INT,
  duration_years INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
