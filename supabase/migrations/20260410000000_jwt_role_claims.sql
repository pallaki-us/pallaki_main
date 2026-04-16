-- JWT Role Claims: stamp user_type into app_metadata at signup
-- This is server-side only — client cannot modify raw_app_meta_data

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_type text;
BEGIN
  user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'planner');

  -- Stamp role into app_metadata (JWT claim, not client-writable)
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('user_type', user_type)
  WHERE id = new.id;

  -- Atomically create the right profile row
  IF user_type = 'vendor' THEN
    INSERT INTO public.vendors (profile_id, name, email)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'name',
      new.email
    )
    ON CONFLICT (profile_id) DO UPDATE
      SET name = EXCLUDED.name,
          email = EXCLUDED.email;
  ELSE
    INSERT INTO public.profiles (id, name, user_type, email)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'name',
      'planner',
      new.email
    )
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name;
  END IF;

  RETURN new;
END;
$$;

-- ── RLS: Inquiries — only planners can send ──────────────────────────────────
DROP POLICY IF EXISTS "Planner own inquiries" ON public.inquiries;

CREATE POLICY "Planner read own inquiries" ON public.inquiries
  FOR SELECT USING (auth.uid() = planner_id);

CREATE POLICY "Planner insert inquiry" ON public.inquiries
  FOR INSERT WITH CHECK (
    auth.uid() = planner_id
    AND (auth.jwt() ->> 'user_type') = 'planner'
  );

CREATE POLICY "Vendor read own inquiries" ON public.inquiries
  FOR SELECT USING (
    auth.uid() IN (
      SELECT profile_id FROM public.vendors WHERE id = vendor_id
    )
  );

-- ── RLS: Profiles — planners only ───────────────────────────────────────────
DROP POLICY IF EXISTS "Own profile" ON public.profiles;
DROP POLICY IF EXISTS "Planner insert profile" ON public.profiles;

CREATE POLICY "Planner read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Planner write own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (auth.jwt() ->> 'user_type') = 'planner'
  );

-- ── RLS: Vendors — vendors only ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Vendor owner write" ON public.vendors;
DROP POLICY IF EXISTS "Vendor signup insert" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can upsert own profile" ON public.vendors;

CREATE POLICY "Vendor read own profile" ON public.vendors
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Vendor write own profile" ON public.vendors
  FOR ALL USING (auth.uid() = profile_id)
  WITH CHECK (
    auth.uid() = profile_id
    AND (auth.jwt() ->> 'user_type') = 'vendor'
  );
