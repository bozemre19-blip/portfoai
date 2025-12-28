-- FIX STORAGE RLS (Updated to allow TEACHER Access)

-- 1. Create verification function (public schema is fine)
CREATE OR REPLACE FUNCTION public.check_family_storage_access(storage_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  path_parts TEXT[];
  child_id_from_path UUID;
BEGIN
  path_parts := string_to_array(storage_path, '/');
  
  -- Basic validity check (format: family/userId/childId/filename)
  IF array_length(path_parts, 1) < 3 THEN
    RETURN FALSE;
  END IF;

  -- Attempt to cast 3rd part to UUID (child_id)
  BEGIN
    child_id_from_path := path_parts[3]::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  -- Check if current user is linked to this child
  RETURN EXISTS (
    SELECT 1 FROM public.family_child_links
    WHERE child_id = child_id_from_path
      AND family_user_id = auth.uid()
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_family_storage_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_family_storage_access TO service_role;

-- 2. CREATE POLICIES (Without ALTER TABLE commands)

-- Upload Policy (Family)
DROP POLICY IF EXISTS "Families can upload media" ON storage.objects;
CREATE POLICY "Families can upload media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'child-media' AND
  (
    (name LIKE 'family/' || auth.uid() || '/%') AND
    public.check_family_storage_access(name)
  )
);

-- View Policy (Family AND Teacher)
DROP POLICY IF EXISTS "Families and Teachers can view media" ON storage.objects;
DROP POLICY IF EXISTS "Families can view own media" ON storage.objects; 

CREATE POLICY "Families and Teachers can view media" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'child-media' AND
  (
    -- 1. User is the uploader (Family or Teacher)
    (name LIKE 'family/' || auth.uid() || '/%')
    OR
    -- 2. Family viewing their child's media
    public.check_family_storage_access(name)
    OR
    -- 3. Teacher viewing ANY media in this bucket (simplest rule for teachers)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  )
);

-- Delete Policy (Family)
DROP POLICY IF EXISTS "Families can delete own media" ON storage.objects;
CREATE POLICY "Families can delete own media" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'child-media' AND
  (name LIKE 'family/' || auth.uid() || '/%')
);

-- Teacher Full Access (Insert/Update/Delete)
-- We need separate policies for teachers to ensure full control without complex OR logic in family policies

DROP POLICY IF EXISTS "Teacher full access" ON storage.objects;
CREATE POLICY "Teacher full access" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'child-media' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  )
)
WITH CHECK (
  bucket_id = 'child-media' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  )
);
