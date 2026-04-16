-- Create profile_views table (idempotent).
CREATE TABLE IF NOT EXISTS public.profile_views (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vendor_id  uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  viewer_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  view_date  date NOT NULL DEFAULT CURRENT_DATE,
  viewed_at  timestamptz NOT NULL DEFAULT now()
);

-- Add view_date column if table already existed without it
ALTER TABLE public.profile_views
  ADD COLUMN IF NOT EXISTS view_date date NOT NULL DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS profile_views_vendor_id_viewed_at_idx
  ON public.profile_views (vendor_id, viewed_at DESC);

-- One view per planner per vendor per calendar day (prevents refresh spam).
CREATE UNIQUE INDEX IF NOT EXISTS profile_views_dedup_idx
  ON public.profile_views (vendor_id, viewer_id, view_date)
  WHERE viewer_id IS NOT NULL;

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor read own views" ON public.profile_views;
DROP POLICY IF EXISTS "Planner insert view" ON public.profile_views;

CREATE POLICY "Vendor read own views" ON public.profile_views
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Planner insert view" ON public.profile_views
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RPC called from the frontend to record a view (deduped per day).
CREATE OR REPLACE FUNCTION public.record_profile_view(p_vendor_id uuid, p_viewer_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.profile_views (vendor_id, viewer_id, view_date, viewed_at)
  VALUES (p_vendor_id, p_viewer_id, CURRENT_DATE, now())
  ON CONFLICT (vendor_id, viewer_id, view_date) DO NOTHING;
$$;

GRANT EXECUTE ON FUNCTION public.record_profile_view(uuid, uuid) TO authenticated;
