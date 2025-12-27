-- Add 'read' column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for read status
CREATE INDEX IF NOT EXISTS messages_read_idx ON public.messages(read);
