-- Separate planner and vendor data into distinct tables
-- profiles → planners only
-- vendors → vendors only (add email for signup)

-- Add email to vendors so it can be captured at signup
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS email text;

-- profiles is now planners-only: drop old constraint, add new one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Set all existing vendor rows in profiles to be cleaned up (keep planners)
-- Safe to do since vendors have their own table
DELETE FROM public.profiles WHERE user_type = 'vendor';

-- Lock profiles to planners only
ALTER TABLE public.profiles ALTER COLUMN user_type SET DEFAULT 'planner';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_planner_only CHECK (user_type = 'planner');

-- RLS: profiles table is planners only
DROP POLICY IF EXISTS "Planner own inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Own profile" ON public.profiles;

CREATE POLICY "Own profile" ON public.profiles
  USING (auth.uid() = id);

-- Allow planners to insert their own profile row on signup
DROP POLICY IF EXISTS "Planner insert profile" ON public.profiles;
CREATE POLICY "Planner insert profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow vendors to insert their own row in vendors on signup
DROP POLICY IF EXISTS "Vendor signup insert" ON public.vendors;
CREATE POLICY "Vendor signup insert" ON public.vendors
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
