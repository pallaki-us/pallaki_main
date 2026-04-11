-- Track when planners view vendor profiles.
-- One row per planner per vendor per day to avoid double-counting refreshes.

CREATE TABLE IF NOT EXISTS public.profile_views (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vendor_id  uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  viewer_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for vendor analytics queries
CREATE INDEX IF NOT EXISTS profile_views_vendor_id_viewed_at_idx
  ON public.profile_views (vendor_id, viewed_at DESC);

-- RLS: vendors can read their own view counts; inserts are open to authenticated planners
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

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
