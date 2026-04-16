-- Add missing columns to vendors table used by the dashboard
-- and create the update_vendor_photos RPC that the gallery editor relies on.

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS featured_urls   text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avatar_url      text,
  ADD COLUMN IF NOT EXISTS is_available    boolean  DEFAULT true,
  ADD COLUMN IF NOT EXISTS availability_note text,
  ADD COLUMN IF NOT EXISTS languages       text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_areas   text[]   DEFAULT '{}';

-- RPC used by the dashboard photo gallery to update portfolio_urls / featured_urls.
-- Bypasses the PostgREST text[] upsert issue by running a targeted UPDATE server-side.
-- Only a vendor can update their own photo arrays (SECURITY DEFINER runs as owner,
-- but we manually enforce ownership via auth.uid()).

CREATE OR REPLACE FUNCTION public.update_vendor_photos(
  p_field text,
  p_urls  text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Restrict to known columns to prevent SQL injection via p_field
  IF p_field NOT IN ('portfolio_urls', 'featured_urls') THEN
    RAISE EXCEPTION 'Invalid field: %', p_field;
  END IF;

  IF p_field = 'portfolio_urls' THEN
    UPDATE public.vendors
    SET portfolio_urls = p_urls
    WHERE profile_id = auth.uid();
  ELSE
    UPDATE public.vendors
    SET featured_urls = p_urls
    WHERE profile_id = auth.uid();
  END IF;
END;
$$;

-- Grant execute to authenticated users (RLS still scoped to auth.uid() inside the function)
GRANT EXECUTE ON FUNCTION public.update_vendor_photos(text, text[]) TO authenticated;
