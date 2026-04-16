-- Allow vendors to update inquiries sent to them (archive, reply, change status).

CREATE POLICY "Vendor update own inquiries"
ON public.inquiries
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT profile_id FROM public.vendors WHERE id = vendor_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT profile_id FROM public.vendors WHERE id = vendor_id
  )
);
