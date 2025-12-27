-- Messages table for teacher-family communication
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,  -- Groups messages in same conversation
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_child_idx ON public.messages(child_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view messages where they are sender or receiver
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Users can update messages where they are the receiver (for marking as read)
CREATE POLICY "Receivers can update messages"
  ON public.messages FOR UPDATE
  USING (
    receiver_id = auth.uid()
  );

-- Helper function to generate conversation_id from two user IDs (always same order)
CREATE OR REPLACE FUNCTION public.get_conversation_id(user1 UUID, user2 UUID, child UUID)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN user1 < user2 THEN md5(user1::text || user2::text || child::text)::uuid
    ELSE md5(user2::text || user1::text || child::text)::uuid
  END;
$$;
