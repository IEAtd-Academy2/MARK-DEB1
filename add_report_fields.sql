-- Add recommendations and report_notes columns to financials table
ALTER TABLE financials ADD COLUMN IF NOT EXISTS recommendations TEXT;
ALTER TABLE financials ADD COLUMN IF NOT EXISTS report_notes TEXT;
