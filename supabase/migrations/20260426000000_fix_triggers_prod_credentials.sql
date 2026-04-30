-- Fix notify_vendor_approved and notify_new_message to use prod Supabase credentials.
-- Previous migrations (20260423000000, 20260424000000) hardcoded staging credentials.

CREATE OR REPLACE FUNCTION public.notify_vendor_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text := 'https://negouqixwnmecgjwxkko.supabase.co';
  v_anon_key     text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ291cWl4d25tZWNnand4a2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MjQzMDAsImV4cCI6MjA5MDUwMDMwMH0.Eg6SCW9v3hWX4zDeWrqiWDhzK7mBmg_04dXkVapaX1c';
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

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url    text := 'https://negouqixwnmecgjwxkko.supabase.co';
  v_anon_key        text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ291cWl4d25tZWNnand4a2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MjQzMDAsImV4cCI6MjA5MDUwMDMwMH0.Eg6SCW9v3hWX4zDeWrqiWDhzK7mBmg_04dXkVapaX1c';
  v_recipient_email text;
  v_recipient_name  text;
  v_sender_name     text;
  v_link            text;
BEGIN
  IF NEW.sender_role = 'planner' THEN
    SELECT email, name INTO v_recipient_email, v_recipient_name
      FROM public.vendors WHERE id = NEW.vendor_id;
    SELECT name INTO v_sender_name
      FROM public.profiles WHERE id = NEW.planner_id;
    v_link := 'https://pallaki.us/analytics';

  ELSIF NEW.sender_role = 'vendor' THEN
    SELECT email, name INTO v_recipient_email, v_recipient_name
      FROM public.profiles WHERE id = NEW.planner_id;
    SELECT name INTO v_sender_name
      FROM public.vendors WHERE id = NEW.vendor_id;
    v_link := 'https://pallaki.us/conversations';
  END IF;

  IF v_recipient_email IS NOT NULL THEN
    PERFORM net.http_post(
      url     := v_supabase_url || '/functions/v1/send-notification-email',
      body    := jsonb_build_object(
                   'type',           'new_message',
                   'recipientEmail', v_recipient_email,
                   'recipientName',  v_recipient_name,
                   'actorName',      v_sender_name,
                   'messageBody',    NEW.body,
                   'link',           v_link
                 ),
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer ' || v_anon_key
                 )
    );
  END IF;

  RETURN NEW;
END;
$$;
