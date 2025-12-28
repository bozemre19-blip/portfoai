-- NUCLEAR OPTION: Reset all policies for content tables to ensure no conflicts

-- 1. Helper function (ensure it exists and is correct)
CREATE OR REPLACE FUNCTION public.check_family_link(p_child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_child_links
    WHERE child_id = p_child_id
      AND family_user_id = auth.uid()
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_family_link TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_family_link TO service_role;

-- 2. RESET MEDIA POLICIES
DROP POLICY IF EXISTS "Families can insert media" ON media;
DROP POLICY IF EXISTS "Families can delete own media" ON media;
DROP POLICY IF EXISTS "Families can update own media" ON media;
DROP POLICY IF EXISTS "Teacher can insert media" ON media;
DROP POLICY IF EXISTS "Teacher can select media" ON media;
DROP POLICY IF EXISTS "Teacher can update media" ON media;
DROP POLICY IF EXISTS "Teacher can delete media" ON media;

-- Re-create Teacher Policies (assuming teachers own rows via user_id)
CREATE POLICY "Teacher can insert media" ON media FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teacher can select media" ON media FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teacher can update media" ON media FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Teacher can delete media" ON media FOR DELETE USING (auth.uid() = user_id);

-- Re-create Family Policies (using robust function)
CREATE POLICY "Families can insert media" ON media
FOR INSERT WITH CHECK (
  added_by = 'family' AND
  public.check_family_link(child_id)
);

CREATE POLICY "Families can delete own media" ON media
FOR DELETE USING (
  added_by = 'family' AND
  user_id = auth.uid()
);

CREATE POLICY "Families can update own media" ON media
FOR UPDATE USING (
  added_by = 'family' AND
  user_id = auth.uid()
);

CREATE POLICY "Families can view own added media" ON media
FOR SELECT USING (
  added_by = 'family' AND
  user_id = auth.uid()
);

-- 3. RESET OBSERVATION POLICIES
DROP POLICY IF EXISTS "Families can insert observations" ON observations;
DROP POLICY IF EXISTS "Families can read own observations" ON observations;
DROP POLICY IF EXISTS "Families can delete own observations" ON observations;
DROP POLICY IF EXISTS "Families can update own observations" ON observations;
DROP POLICY IF EXISTS "Teacher can insert observations" ON observations;
DROP POLICY IF EXISTS "Teacher can select observations" ON observations;
DROP POLICY IF EXISTS "Teacher can update observations" ON observations;
DROP POLICY IF EXISTS "Teacher can delete observations" ON observations;

-- Re-create Teacher Policies
CREATE POLICY "Teacher can insert observations" ON observations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teacher can select observations" ON observations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teacher can update observations" ON observations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Teacher can delete observations" ON observations FOR DELETE USING (auth.uid() = user_id);

-- Re-create Family Policies
CREATE POLICY "Families can insert observations" ON observations
FOR INSERT WITH CHECK (
  added_by = 'family' AND
  public.check_family_link(child_id)
);

CREATE POLICY "Families can delete own observations" ON observations
FOR DELETE USING (
  added_by = 'family' AND
  user_id = auth.uid()
);

CREATE POLICY "Families can update own observations" ON observations
FOR UPDATE USING (
  added_by = 'family' AND
  user_id = auth.uid()
);

CREATE POLICY "Families can view own added observations" ON observations
FOR SELECT USING (
  added_by = 'family' AND
  user_id = auth.uid()
);
