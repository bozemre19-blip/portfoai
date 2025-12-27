-- =============================================
-- Family Portal Schema Extensions
-- =============================================

-- 1. PROFILES TABLE
-- Extends auth.users with application-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'family')) DEFAULT 'teacher',
  first_name TEXT,
  last_name TEXT,
  school_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Auto-update timestamp trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'profiles_set_updated_at'
      AND tgrelid = 'public.profiles'::regclass
  ) THEN
    CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Teachers can view family profiles linked to their children
CREATE POLICY "Teachers can view linked family profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_child_links fcl
      JOIN public.children c ON fcl.child_id = c.id
      WHERE fcl.family_user_id = profiles.id
        AND c.user_id = auth.uid()
    )
  );

-- =============================================
-- 2. FAMILY-CHILD LINKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.family_child_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'parent', -- parent, guardian, grandparent, other
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  invited_by UUID REFERENCES auth.users(id), -- Teacher who created invite
  invite_code TEXT UNIQUE, -- Unique invite code
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  UNIQUE(family_user_id, child_id)
);

CREATE INDEX IF NOT EXISTS family_child_links_family_idx ON public.family_child_links(family_user_id);
CREATE INDEX IF NOT EXISTS family_child_links_child_idx ON public.family_child_links(child_id);
CREATE INDEX IF NOT EXISTS family_child_links_invite_code_idx ON public.family_child_links(invite_code);

-- RLS Policies for family_child_links
ALTER TABLE public.family_child_links ENABLE ROW LEVEL SECURITY;

-- Families can view their own links
CREATE POLICY "Family can view own links"
  ON public.family_child_links FOR SELECT
  USING (auth.uid() = family_user_id);

-- Teachers can view links for their children
CREATE POLICY "Teacher can view links for own children"
  ON public.family_child_links FOR SELECT
  USING (
    child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
  );

-- Teachers can create invites for their children
CREATE POLICY "Teacher can create invites"
  ON public.family_child_links FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
  );

-- Teachers can update (approve/reject) links for their children
CREATE POLICY "Teacher can update links for own children"
  ON public.family_child_links FOR UPDATE
  USING (
    child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
  );

-- Teachers can delete links for their children
CREATE POLICY "Teacher can delete links for own children"
  ON public.family_child_links FOR DELETE
  USING (
    child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
  );

-- Families can claim invites (update their own pending link)
CREATE POLICY "Family can claim invite"
  ON public.family_child_links FOR UPDATE
  USING (
    family_user_id = auth.uid() OR
    (family_user_id IS NULL AND status = 'pending')
  );

-- =============================================
-- 3. VISIBILITY SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.visibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('observation', 'media', 'goal', 'assessment')),
  content_id UUID NOT NULL,
  visible_to_family BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_type, content_id)
);

CREATE INDEX IF NOT EXISTS visibility_content_idx ON public.visibility_settings(content_type, content_id);

-- RLS Policies for visibility_settings
ALTER TABLE public.visibility_settings ENABLE ROW LEVEL SECURITY;

-- Teachers can manage visibility for their own content
CREATE POLICY "Teacher can manage visibility"
  ON public.visibility_settings FOR ALL
  USING (updated_by = auth.uid());

-- =============================================
-- 4. ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id), -- Teacher who wrote it
  classroom TEXT NOT NULL, -- Which class
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ, -- Auto-hide date
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_classroom_idx ON public.announcements(classroom);
CREATE INDEX IF NOT EXISTS announcements_user_idx ON public.announcements(user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'announcements_set_updated_at'
      AND tgrelid = 'public.announcements'::regclass
  ) THEN
    CREATE TRIGGER announcements_set_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- RLS Policies for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own announcements
CREATE POLICY "Teacher can manage own announcements"
  ON public.announcements FOR ALL
  USING (user_id = auth.uid());

-- Families can view announcements for their child's class
CREATE POLICY "Family can view class announcements"
  ON public.announcements FOR SELECT
  USING (
    classroom IN (
      SELECT c.classroom FROM public.children c
      JOIN public.family_child_links fcl ON fcl.child_id = c.id
      WHERE fcl.family_user_id = auth.uid() 
        AND fcl.status = 'approved'
        AND c.classroom IS NOT NULL
    )
  );

-- =============================================
-- 5. MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  child_id UUID REFERENCES public.children(id), -- Related child (optional)
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_child_idx ON public.messages(child_id);

-- RLS Policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert messages as sender
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update (mark as read) received messages
CREATE POLICY "Users can update received messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- =============================================
-- 6. MESSAGE SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.message_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE, -- Teacher
  messaging_enabled BOOLEAN NOT NULL DEFAULT true,
  available_start TIME DEFAULT '08:00', -- Start accepting messages
  available_end TIME DEFAULT '18:00',   -- Stop accepting messages
  available_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday...7=Sunday
  auto_reply_message TEXT, -- Auto-reply when messaging is off
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for message_settings
ALTER TABLE public.message_settings ENABLE ROW LEVEL SECURITY;

-- Users can manage their own settings
CREATE POLICY "Users can manage own message settings"
  ON public.message_settings FOR ALL
  USING (auth.uid() = user_id);

-- Families can view teacher's messaging availability
CREATE POLICY "Family can view teacher message settings"
  ON public.message_settings FOR SELECT
  USING (
    user_id IN (
      SELECT c.user_id FROM public.children c
      JOIN public.family_child_links fcl ON fcl.child_id = c.id
      WHERE fcl.family_user_id = auth.uid() AND fcl.status = 'approved'
    )
  );

-- =============================================
-- HELPER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name, school_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'school_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
