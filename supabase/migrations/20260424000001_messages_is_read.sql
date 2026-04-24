ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

CREATE POLICY "planner_update_messages" ON public.messages
  FOR UPDATE USING (auth.uid() = planner_id)
  WITH CHECK (auth.uid() = planner_id);

CREATE POLICY "vendor_update_messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() IN (SELECT profile_id FROM public.vendors WHERE id = vendor_id)
  )
  WITH CHECK (
    auth.uid() IN (SELECT profile_id FROM public.vendors WHERE id = vendor_id)
  );
