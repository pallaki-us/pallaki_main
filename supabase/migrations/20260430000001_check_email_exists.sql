-- RPC used by LoginForm to check if an email is registered under a specific role
-- before attempting sign-in, enabling friendly "wrong portal" error messages.

CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text, check_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE lower(u.email) = lower(check_email)
      AND p.user_type = check_type
  );
END;
$$;

-- Callable by unauthenticated visitors (anon) since this is the login page
REVOKE ALL ON FUNCTION public.check_email_exists(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text, text) TO anon, authenticated;
