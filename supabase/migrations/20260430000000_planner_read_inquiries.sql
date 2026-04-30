-- Allow planners to read their own inquiries.
-- Previously only INSERT was allowed; SELECT was missing so usePlannerThreads
-- and usePlannerInquiries always returned empty arrays.

CREATE POLICY "Planner read own inquiries" ON public.inquiries
  FOR SELECT
  USING (auth.uid() = planner_id);
