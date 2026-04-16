-- Vendor approval: in-app notification + email when is_verified flips to true.
--
-- SETUP REQUIRED (run once in your Supabase SQL editor):
--   ALTER DATABASE postgres SET app.supabase_url = 'https://<project-ref>.supabase.co';
--   ALTER DATABASE postgres SET app.supabase_anon_key = '<your-anon-key>';
--
-- The anon key is safe to store here — it's already public in your frontend bundle.

-- ── 1. Add vendor_approved to allowed notification types ─────────────────────
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('new_inquiry', 'inquiry_reply', 'vendor_approved'));

-- ── 2. Trigger function ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_vendor_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text;
  v_anon_key     text;
BEGIN
  -- Only fire when is_verified transitions from non-true to true
  IF (OLD.is_verified IS DISTINCT FROM TRUE) AND NEW.is_verified = TRUE THEN

    -- In-app notification
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.profile_id,
      'vendor_approved',
      'Your listing is live! 🎉',
      'Your Pallaki vendor profile has been approved and is now visible to families.'
    );

    -- Email via edge function (requires app.supabase_url + app.supabase_anon_key to be set)
    v_supabase_url := current_setting('app.supabase_url', true);
    v_anon_key     := current_setting('app.supabase_anon_key', true);

    IF v_supabase_url IS NOT NULL AND v_anon_key IS NOT NULL AND NEW.email IS NOT NULL THEN
      PERFORM net.http_post(
        url     := v_supabase_url || '/functions/v1/send-notification-email',
        body    := jsonb_build_object(
                     'type',           'vendor_approved',
                     'recipientEmail', NEW.email,
                     'recipientName',  NEW.name
                   )::text,
        headers := jsonb_build_object(
                     'Content-Type',  'application/json',
                     'Authorization', 'Bearer ' || v_anon_key
                   )
      );
    END IF;

  END IF;
  RETURN NEW;
END;
$$;

-- ── 3. Attach trigger ─────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_notify_vendor_approved ON public.vendors;

CREATE TRIGGER trg_notify_vendor_approved
  AFTER UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.notify_vendor_approved();
