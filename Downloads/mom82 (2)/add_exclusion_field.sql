-- Add is_excluded_from_top_performers column to financials table
ALTER TABLE financials ADD COLUMN IF NOT EXISTS is_excluded_from_top_performers BOOLEAN DEFAULT FALSE;
