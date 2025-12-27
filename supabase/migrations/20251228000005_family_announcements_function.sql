-- Create a SECURITY DEFINER function to safely get announcements for family users
-- This bypasses RLS safely by checking the calling user's linked children

CREATE OR REPLACE FUNCTION public.get_family_announcements()
RETURNS SETOF public.announcements
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get class-wide announcements for classrooms where user has linked children
  SELECT a.* 
  FROM public.announcements a
  WHERE a.child_id IS NULL
    AND a.classroom IN (
      SELECT c.classroom FROM public.children c
      INNER JOIN public.family_child_links fcl ON fcl.child_id = c.id
      WHERE fcl.family_user_id = auth.uid()
        AND fcl.status = 'approved'
        AND c.classroom IS NOT NULL
    )
  
  UNION ALL
  
  -- Get child-specific announcements for user's linked children
  SELECT a.*
  FROM public.announcements a
  INNER JOIN public.family_child_links fcl ON fcl.child_id = a.child_id
  WHERE a.child_id IS NOT NULL
    AND fcl.family_user_id = auth.uid()
    AND fcl.status = 'approved'
  
  ORDER BY pinned DESC, created_at DESC
  LIMIT 20;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_family_announcements() TO authenticated;
