-- Fix: vendors.profile_id was referencing profiles(id) but vendor users
-- never get a profiles row. Change FK to reference auth.users(id) directly.

ALTER TABLE public.vendors
  DROP CONSTRAINT IF EXISTS vendors_profile_id_fkey;

ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
