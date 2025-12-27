-- FIX: Allow anyone to view and claim pending invites by invite_code
-- This fixes the issue where family users can't claim invite codes

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Anyone can view pending invites by code" ON public.family_child_links;
DROP POLICY IF EXISTS "Anyone can claim pending invite" ON public.family_child_links;

-- Allow anyone to SELECT pending invites that haven't been claimed yet (by invite_code)
CREATE POLICY "Anyone can view pending invites by code"
  ON public.family_child_links FOR SELECT
  USING (
    status = 'pending' AND 
    family_user_id IS NULL AND 
    invite_code IS NOT NULL
  );

-- Allow any authenticated user to claim (UPDATE) a pending invite
CREATE POLICY "Anyone can claim pending invite"
  ON public.family_child_links FOR UPDATE
  USING (
    status = 'pending' AND 
    family_user_id IS NULL
  )
  WITH CHECK (
    family_user_id = auth.uid() AND
    status = 'approved'
  );
