-- Create a SECURITY DEFINER function to safely get linked children for family users
-- This bypasses RLS safely by checking the calling user's ID against family_child_links

CREATE OR REPLACE FUNCTION public.get_family_linked_children()
RETURNS SETOF public.children
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.* 
  FROM public.children c
  INNER JOIN public.family_child_links fcl ON fcl.child_id = c.id
  WHERE fcl.family_user_id = auth.uid()
    AND fcl.status = 'approved';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_family_linked_children() TO authenticated;
