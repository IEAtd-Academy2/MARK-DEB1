-- 1. Add performance columns to financials table
ALTER TABLE financials ADD COLUMN IF NOT EXISTS commitment_score NUMERIC DEFAULT 0;
ALTER TABLE financials ADD COLUMN IF NOT EXISTS is_needs_improvement BOOLEAN DEFAULT FALSE;
ALTER TABLE financials ADD COLUMN IF NOT EXISTS improvement_note TEXT;

-- 2. Ensure behavior_logs table exists
CREATE TABLE IF NOT EXISTS behavior_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    week_number INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    mood_rating TEXT NOT NULL,
    notes TEXT
);
