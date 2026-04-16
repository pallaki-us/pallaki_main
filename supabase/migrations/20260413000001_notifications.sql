-- Notifications system for vendors (new inquiry) and planners (vendor reply).

CREATE TABLE IF NOT EXISTS public.notifications (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('new_inquiry', 'inquiry_reply')),
  title       text NOT NULL,
  body        text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  inquiry_id  uuid REFERENCES public.inquiries(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Only DB triggers (SECURITY DEFINER) can insert
CREATE POLICY "Service insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ── Trigger: notify vendor on new inquiry ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_vendor_new_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_planner_name text;
BEGIN
  SELECT profile_id INTO v_profile_id FROM public.vendors WHERE id = NEW.vendor_id;
  SELECT name INTO v_planner_name FROM public.profiles WHERE id = NEW.planner_id;

  IF v_profile_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, inquiry_id)
    VALUES (
      v_profile_id,
      'new_inquiry',
      'New Inquiry Received',
      COALESCE(v_planner_name, 'A family') || ' sent you an inquiry.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_vendor_new_inquiry
  AFTER INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_vendor_new_inquiry();

-- ── Trigger: notify planner when vendor replies ───────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_planner_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_name text;
BEGIN
  -- Only fire when vendor_reply transitions from NULL to a value
  IF OLD.vendor_reply IS NULL AND NEW.vendor_reply IS NOT NULL THEN
    SELECT name INTO v_vendor_name FROM public.vendors WHERE id = NEW.vendor_id;

    INSERT INTO public.notifications (user_id, type, title, body, inquiry_id)
    VALUES (
      NEW.planner_id,
      'inquiry_reply',
      'Vendor Replied',
      COALESCE(v_vendor_name, 'A vendor') || ' replied to your inquiry.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_planner_on_reply
  AFTER UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_planner_on_reply();
