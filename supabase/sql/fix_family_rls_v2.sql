-- Robust fix for Family RLS issues using Security Definer function

-- 1. Helper function to check links securely (bypassing RLS on family_child_links)
-- This ensures the check works regardless of RLS policies on the link table itself.
CREATE OR REPLACE FUNCTION public.check_family_link(p_child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_child_links
    WHERE child_id = p_child_id
      AND family_user_id = auth.uid()
      AND status = 'approved' -- Enforce approved status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_family_link TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_family_link TO service_role;

-- 2. Update Media INSERT Policy
DROP POLICY IF EXISTS "Families can insert media" ON media;
CREATE POLICY "Families can insert media" ON media
FOR INSERT WITH CHECK (
  added_by = 'family' AND
  public.check_family_link(child_id)
);

-- 3. Update Observations INSERT Policy (for consistency/robustness)
DROP POLICY IF EXISTS "Families can insert observations" ON observations;
CREATE POLICY "Families can insert observations" ON observations
FOR INSERT WITH CHECK (
  added_by = 'family' AND
  public.check_family_link(child_id)
);

-- 4. Ensure Update/Delete policies exist (from previous fix)
-- For Media
DROP POLICY IF EXISTS "Families can delete own media" ON media;
CREATE POLICY "Families can delete own media" ON media
FOR DELETE USING (
  added_by = 'family' AND
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Families can update own media" ON media;
CREATE POLICY "Families can update own media" ON media
FOR UPDATE USING (
  added_by = 'family' AND
  user_id = auth.uid()
);

-- For Observations
DROP POLICY IF EXISTS "Families can delete own observations" ON observations;
CREATE POLICY "Families can delete own observations" ON observations
FOR DELETE USING (
  added_by = 'family' AND
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Families can update own observations" ON observations;
CREATE POLICY "Families can update own observations" ON observations
FOR UPDATE USING (
  added_by = 'family' AND
  user_id = auth.uid()
);
