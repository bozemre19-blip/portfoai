-- Family Content Schema Updates
-- Adds columns to distinguish family-added content from teacher content

-- Add added_by column to observations table
ALTER TABLE observations ADD COLUMN IF NOT EXISTS added_by TEXT DEFAULT 'teacher' CHECK (added_by IN ('teacher', 'family'));

-- Add added_by column to media table  
ALTER TABLE media ADD COLUMN IF NOT EXISTS added_by TEXT DEFAULT 'teacher' CHECK (added_by IN ('teacher', 'family'));

-- RLS policy: Allow families to insert observations for their linked children
DROP POLICY IF EXISTS "Families can insert observations" ON observations;
CREATE POLICY "Families can insert observations" ON observations
FOR INSERT WITH CHECK (
  added_by = 'family' AND
  EXISTS (SELECT 1 FROM family_child_links WHERE family_user_id = auth.uid() AND child_id = observations.child_id)
);

-- RLS policy: Allow families to read their own observations
DROP POLICY IF EXISTS "Families can read own observations" ON observations;
CREATE POLICY "Families can read own observations" ON observations
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM family_child_links WHERE family_user_id = auth.uid() AND child_id = observations.child_id)
);

-- RLS policy: Allow families to insert media for their linked children
DROP POLICY IF EXISTS "Families can insert media" ON media;
CREATE POLICY "Families can insert media" ON media
FOR INSERT WITH CHECK (
  added_by = 'family' AND
  EXISTS (SELECT 1 FROM family_child_links WHERE family_user_id = auth.uid() AND child_id = media.child_id)
);

-- RLS policy: Allow families to read their own media
DROP POLICY IF EXISTS "Families can read own media" ON media;
CREATE POLICY "Families can read own media" ON media
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM family_child_links WHERE family_user_id = auth.uid() AND child_id = media.child_id)
);

-- Function for teachers to get family-added observations
CREATE OR REPLACE FUNCTION public.get_family_observations(p_child_id UUID)
RETURNS TABLE (
  id UUID,
  child_id UUID,
  user_id UUID,
  note TEXT,
  context TEXT,
  domains TEXT[],
  tags TEXT[],
  created_at TIMESTAMPTZ,
  added_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.child_id, o.user_id, o.note, o.context, o.domains, o.tags, o.created_at, o.added_by
  FROM observations o
  WHERE o.child_id = p_child_id AND o.added_by = 'family'
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for teachers to get family-added media
CREATE OR REPLACE FUNCTION public.get_family_media(p_child_id UUID)
RETURNS TABLE (
  id UUID,
  child_id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  type TEXT,
  storage_path TEXT,
  domain TEXT,
  created_at TIMESTAMPTZ,
  added_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.child_id, m.user_id, m.name, m.description, m.type, m.storage_path, m.domain, m.created_at, m.added_by
  FROM media m
  WHERE m.child_id = p_child_id AND m.added_by = 'family'
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
