-- =============================================
-- Media Sharing with Family
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add shared_with_family column to media table
ALTER TABLE public.media 
ADD COLUMN IF NOT EXISTS shared_with_family BOOLEAN DEFAULT false;

-- 2. Index for efficient family queries
CREATE INDEX IF NOT EXISTS media_shared_family_idx 
ON public.media(child_id, shared_with_family) 
WHERE shared_with_family = true;

-- 3. RPC Function: Get shared media for family members
CREATE OR REPLACE FUNCTION public.get_family_shared_media()
RETURNS TABLE (
  id UUID,
  child_id UUID,
  child_name TEXT,
  name TEXT,
  description TEXT,
  domain TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.child_id,
    c.first_name || ' ' || c.last_name as child_name,
    m.name,
    m.description,
    m.domain,
    m.storage_path,
    m.created_at
  FROM public.media m
  JOIN public.children c ON m.child_id = c.id
  JOIN public.family_child_links fcl ON fcl.child_id = c.id
  WHERE fcl.family_user_id = auth.uid()
    AND fcl.status = 'approved'
    AND m.shared_with_family = true
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_family_shared_media() TO authenticated;

-- 5. RLS Policy: Allow families to view shared media storage paths
-- (They can already access via RPC, but this allows signed URL generation)
CREATE POLICY "Family can view shared media"
  ON public.media FOR SELECT
  USING (
    shared_with_family = true 
    AND child_id IN (
      SELECT fcl.child_id 
      FROM public.family_child_links fcl 
      WHERE fcl.family_user_id = auth.uid() 
        AND fcl.status = 'approved'
    )
  );
