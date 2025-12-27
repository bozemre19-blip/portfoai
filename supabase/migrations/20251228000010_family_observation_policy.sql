-- Allow family users to view shared observations for children they are linked to
-- First drop existing policy if it exists
DROP POLICY IF EXISTS "Family can view shared observations" ON public.observations;

-- Create policy for family users to view shared observations
-- Family users can view observations where:
-- 1. The observation is shared (shared_with_family = true)
-- 2. The child is linked to this family user via family_child_links table
CREATE POLICY "Family can view shared observations"
  ON public.observations FOR SELECT
  USING (
    shared_with_family = true
    AND EXISTS (
      SELECT 1 FROM public.family_child_links fcl
      WHERE fcl.child_id = observations.child_id
      AND fcl.family_user_id = auth.uid()
    )
  );
