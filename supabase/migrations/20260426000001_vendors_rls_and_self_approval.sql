-- Enable RLS on vendors table (was missing entirely).
-- Also prevent vendors from self-approving by setting is_verified on their own row.

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read vendor listings.
-- Without this, enabling RLS would break /vendors and /vendor/:id for all visitors.
CREATE POLICY "Public read vendors" ON public.vendors
  FOR SELECT
  USING (true);

-- Prevent vendors from changing is_verified on their own row.
-- Only service_role (admin) can flip this flag.
CREATE OR REPLACE FUNCTION public.prevent_vendor_self_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
      NEW.is_verified := OLD.is_verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_vendor_self_approval ON public.vendors;
CREATE TRIGGER prevent_vendor_self_approval
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_vendor_self_approval();
