-- Add structured intake data column to inquiries.
-- Stores the guided booking form answers as JSON.
-- Nullable so existing inquiries are unaffected.
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS intake_data jsonb;
