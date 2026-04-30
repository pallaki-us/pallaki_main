-- Fix prevent_vendor_self_approval trigger: the original used
-- current_setting('request.jwt.claim.role') — singular "claim" — which never
-- resolves and returns '' so service_role can never approve vendors via the API.
-- Correct path is 'request.jwt.claims' (plural) with a jsonb cast.

CREATE OR REPLACE FUNCTION public.prevent_vendor_self_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  claims_raw text;
  jwt_role   text;
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    claims_raw := current_setting('request.jwt.claims', true);
    IF claims_raw IS NOT NULL AND claims_raw != '' THEN
      jwt_role := claims_raw::jsonb->>'role';
    END IF;
    IF COALESCE(jwt_role, '') != 'service_role' THEN
      NEW.is_verified := OLD.is_verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
