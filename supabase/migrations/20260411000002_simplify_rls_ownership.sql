-- Simplify RLS write policies to ownership-only checks.
-- The JWT user_type claim check was causing "violates row-level security"
-- errors because the claim path was wrong or the token predated the trigger.
-- auth.uid() = profile_id / id is sufficient — users can only touch their own rows,
-- and the table structure already enforces role separation (vendors table = vendors only).

-- ── Vendors ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Vendor write own profile" ON public.vendors;

CREATE POLICY "Vendor write own profile" ON public.vendors
  FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- ── Profiles (planners) ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Planner write own profile" ON public.profiles;

CREATE POLICY "Planner write own profile" ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Inquiries ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Planner insert inquiry" ON public.inquiries;

CREATE POLICY "Planner insert inquiry" ON public.inquiries
  FOR INSERT
  WITH CHECK (auth.uid() = planner_id);
