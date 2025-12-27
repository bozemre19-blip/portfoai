-- Add child_id to announcements for child-specific announcements
-- If child_id is NULL, it's a class-wide announcement
-- If child_id is set, it's a child-specific announcement

ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES public.children(id) ON DELETE CASCADE;

-- Create index for child_id
CREATE INDEX IF NOT EXISTS announcements_child_id_idx ON public.announcements(child_id);

-- Update RLS policy to allow families to view child-specific announcements
DROP POLICY IF EXISTS "Family can view class announcements" ON public.announcements;
DROP POLICY IF EXISTS "Family can view child-specific announcements" ON public.announcements;

-- Families can view class announcements for their children's classrooms
CREATE POLICY "Family can view class announcements"
  ON public.announcements FOR SELECT
  USING (
    child_id IS NULL AND
    classroom IN (
      SELECT c.classroom FROM public.children c
      JOIN public.family_child_links fcl ON fcl.child_id = c.id
      WHERE fcl.family_user_id = auth.uid() 
        AND fcl.status = 'approved'
        AND c.classroom IS NOT NULL
    )
  );

-- Families can view child-specific announcements for their linked children
CREATE POLICY "Family can view child-specific announcements"
  ON public.announcements FOR SELECT
  USING (
    child_id IS NOT NULL AND
    child_id IN (
      SELECT fcl.child_id FROM public.family_child_links fcl
      WHERE fcl.family_user_id = auth.uid() 
        AND fcl.status = 'approved'
    )
  );
