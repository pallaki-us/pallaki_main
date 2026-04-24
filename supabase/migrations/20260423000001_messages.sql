-- Real-time chat messages between planners and vendors.
-- Each thread is identified by (vendor_id, planner_id).

CREATE TABLE public.messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id   UUID        REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  planner_id  UUID        NOT NULL,
  sender_id   UUID        NOT NULL,
  sender_role TEXT        NOT NULL CHECK (sender_role IN ('planner', 'vendor')),
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planner_read_messages" ON public.messages
  FOR SELECT USING (auth.uid() = planner_id);

CREATE POLICY "planner_insert_messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = planner_id AND sender_role = 'planner');

CREATE POLICY "vendor_read_messages" ON public.messages
  FOR SELECT USING (
    auth.uid() IN (SELECT profile_id FROM public.vendors WHERE id = vendor_id)
  );

CREATE POLICY "vendor_insert_messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT profile_id FROM public.vendors WHERE id = vendor_id)
    AND sender_role = 'vendor'
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
