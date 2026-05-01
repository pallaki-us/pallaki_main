-- Add email column to vendors so VendorOnboarding can store it,
-- and so inquiry notifications know where to send vendor alerts.

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS email text;

-- Backfill email from auth.users for any existing vendor rows
UPDATE public.vendors v
SET email = u.email
FROM auth.users u
WHERE u.id = v.profile_id
  AND v.email IS NULL;
