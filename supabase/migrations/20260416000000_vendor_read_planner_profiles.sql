-- Allow vendors to read basic profile info (name, email) for planners
-- who have sent them an inquiry. Needed so vendor dashboard can show planner names.
CREATE POLICY "Vendor read planner profiles" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.vendors v ON v.id = i.vendor_id
      WHERE i.planner_id = profiles.id
        AND v.profile_id = auth.uid()
    )
  );
