-- Fix notify_vendor_approved to hardcode supabase_url and anon_key
-- since ALTER DATABASE is not permitted on Supabase hosted projects.

CREATE OR REPLACE FUNCTION public.notify_vendor_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text := 'https://cktdcsssprxemrcczcdv.supabase.co';
  v_anon_key     text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdGRjc3NzcHJ4ZW1yY2N6Y2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODE2NDcsImV4cCI6MjA5MDM1NzY0N30.EiNYNHaI8ZNyv2Dr_KTPj_CplFLJv80fqXY5MRsZloI';
BEGIN
  IF (OLD.is_verified IS DISTINCT FROM TRUE) AND NEW.is_verified = TRUE THEN

    -- In-app notification
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.profile_id,
      'vendor_approved',
      'Your listing is live! 🎉',
      'Your Pallaki vendor profile has been approved and is now visible to families.'
    );

    -- Email via edge function
    IF NEW.email IS NOT NULL THEN
      PERFORM net.http_post(
        url     := v_supabase_url || '/functions/v1/send-notification-email',
        body    := jsonb_build_object(
                     'type',           'vendor_approved',
                     'recipientEmail', NEW.email,
                     'recipientName',  NEW.name
                   ),
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
