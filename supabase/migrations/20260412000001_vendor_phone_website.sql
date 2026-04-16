-- Add phone and website columns used by the vendor dashboard form.

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS phone   text,
  ADD COLUMN IF NOT EXISTS website text;
