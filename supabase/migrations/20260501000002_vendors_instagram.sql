-- Add instagram column to vendors. The onboarding form collects it but
-- no column existed, so it was silently dropped on every submission.

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS instagram text;
