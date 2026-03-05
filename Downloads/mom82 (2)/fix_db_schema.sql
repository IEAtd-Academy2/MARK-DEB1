-- Run this command in your Supabase SQL Editor to fix the database schema
ALTER TABLE financials 
ADD COLUMN IF NOT EXISTS recommendations TEXT,
ADD COLUMN IF NOT EXISTS report_notes TEXT,
ADD COLUMN IF NOT EXISTS is_excluded_from_top_performers BOOLEAN DEFAULT FALSE;
