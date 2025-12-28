-- FIX STORAGE RLS: Allow families to upload/read media in child-media bucket

-- 1. Create a secure verification function (if not exists)
-- This ensures we can check if a user is a linked family member
CREATE OR REPLACE FUNCTION public.check_family_storage_access(storage_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  path_parts TEXT[];
  child_id_from_path UUID;
BEGIN
  -- Expected path format: "family/[user_id]/[child_id]/[filename]"
  -- OR "teacher/[user_id]/[child_id]/[filename]"
  -- We extract child_id (3rd segment, index 3 because postgres arrays are 1-based, but string_to_array split logic)
  
  path_parts := string_to_array(storage_path, '/');
  
  -- Basic validity check
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


-- 2. ENABLE RLS ON OBJECTS (Storage)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. DROP EXISTING BLOCKING POLICIES (if generic ones exist that might conflict)
-- We won't drop everything blindly, but define specific allow policies.

-- 4. INSERT POLICY (Upload)
-- Allow families to upload if they are linked to the child in the path
CREATE POLICY "Families can upload media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'child-media' AND
  (
    -- Allow upload if path starts with "family/[user_id]/..."
    (name LIKE 'family/' || auth.uid() || '/%') AND
    public.check_family_storage_access(name)
  )
);

-- 5. SELECT POLICY (View)
-- Allow viewing if shared or added by self
CREATE POLICY "Families can view own media" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'child-media' AND
  (
    -- Can view own uploads
    (name LIKE 'family/' || auth.uid() || '/%')
    OR
    -- Can view any file for their child (even teacher uploaded)
    public.check_family_storage_access(name)
  )
);

-- 6. DELETE POLICY
CREATE POLICY "Families can delete own media" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'child-media' AND
  (name LIKE 'family/' || auth.uid() || '/%')
);

-- 7. TEACHER POLICIES (Ensure teachers retain access)
CREATE POLICY "Teachers have full access to child-media" ON storage.objects
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
