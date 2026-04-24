-- Trigger: notify the recipient by email whenever a new chat message is inserted.
-- If sender_role = 'planner'  → email the vendor  (look up vendors.email)
-- If sender_role = 'vendor'   → email the planner (look up profiles.email)

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url   text := 'https://cktdcsssprxemrcczcdv.supabase.co';
  v_anon_key       text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdGRjc3NzcHJ4ZW1yY2N6Y2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODE2NDcsImV4cCI6MjA5MDM1NzY0N30.EiNYNHaI8ZNyv2Dr_KTPj_CplFLJv80fqXY5MRsZloI';
  v_recipient_email text;
  v_recipient_name  text;
  v_sender_name     text;
  v_link            text;
BEGIN
  IF NEW.sender_role = 'planner' THEN
    -- Planner sent a message → notify the vendor
    SELECT email, name INTO v_recipient_email, v_recipient_name
      FROM public.vendors WHERE id = NEW.vendor_id;
    SELECT name INTO v_sender_name
      FROM public.profiles WHERE id = NEW.planner_id;
    v_link := 'https://pallaki.com/analytics';

  ELSIF NEW.sender_role = 'vendor' THEN
    -- Vendor sent a message → notify the planner
    SELECT email, name INTO v_recipient_email, v_recipient_name
      FROM public.profiles WHERE id = NEW.planner_id;
    SELECT name INTO v_sender_name
      FROM public.vendors WHERE id = NEW.vendor_id;
    v_link := 'https://pallaki.com/conversations';
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
                 )::text,
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer ' || v_anon_key
                 )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
