-- Fix: remove UPDATE auth.users from handle_new_user trigger.
-- Updating auth.users from within an auth.users trigger conflicts with
-- Supabase's internal auth processing and causes a 500 on signup.
-- user_type is already in raw_user_meta_data from the client signUp call.

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
