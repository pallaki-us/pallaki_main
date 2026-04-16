-- Ensure profile_id has a unique constraint so PostgREST can resolve
-- onConflict: 'profile_id' in upsert calls from the vendor dashboard.

ALTER TABLE public.vendors
  DROP CONSTRAINT IF EXISTS vendors_profile_id_unique;

ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_profile_id_unique UNIQUE (profile_id);
