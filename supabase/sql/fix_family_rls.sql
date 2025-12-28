-- Fix RLS policies for family content

-- 1. Ensure families can see their own links in family_child_links
-- This is CRITICAL for the EXISTS clause in observations/media INSERT policies to work.
-- Without this, the policy cannot verify the link exists.
DROP POLICY IF EXISTS "Families can view own links" ON family_child_links;
CREATE POLICY "Families can view own links" ON family_child_links
FOR SELECT USING (family_user_id = auth.uid());

-- 2. Add missing UPDATE/DELETE policies for observations
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

-- 3. Add missing UPDATE/DELETE policies for media
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
