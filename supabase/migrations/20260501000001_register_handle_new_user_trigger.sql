-- The handle_new_user() function has existed since 20260410 but was never
-- attached to auth.users as a trigger. Without this, signing up does NOT
-- create a vendors or profiles row automatically — data only lands in the
-- table if the vendor completes the onboarding form.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
