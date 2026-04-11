-- Fix RLS policies: auth.jwt() ->> 'user_type' was checking the top-level
-- JWT payload, but Supabase stores custom claims under app_metadata.
-- Correct path is: auth.jwt()->'app_metadata'->>'user_type'

-- ── Profiles (planners) ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Planner write own profile" ON public.profiles;

CREATE POLICY "Planner write own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND auth.jwt()->'app_metadata'->>'user_type' = 'planner'
  );

-- ── Vendors ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Vendor write own profile" ON public.vendors;

CREATE POLICY "Vendor write own profile" ON public.vendors
  FOR ALL USING (auth.uid() = profile_id)
  WITH CHECK (
    auth.uid() = profile_id
    AND auth.jwt()->'app_metadata'->>'user_type' = 'vendor'
  );

-- ── Inquiries ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Planner insert inquiry" ON public.inquiries;

CREATE POLICY "Planner insert inquiry" ON public.inquiries
  FOR INSERT WITH CHECK (
    auth.uid() = planner_id
    AND auth.jwt()->'app_metadata'->>'user_type' = 'planner'
  );
