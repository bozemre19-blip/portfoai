-- FIX: Allow family users to view children they are linked to
-- This fixes the issue where FamilyDashboard shows "Henüz bağlı çocuk yok" 
-- even after successfully claiming an invite

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Family can view linked children" ON public.children;

-- Allow family users to SELECT children they are linked to via family_child_links
CREATE POLICY "Family can view linked children"
  ON public.children FOR SELECT
  USING (
    id IN (
      SELECT child_id FROM public.family_child_links
      WHERE family_user_id = auth.uid() 
        AND status = 'approved'
    )
  );
