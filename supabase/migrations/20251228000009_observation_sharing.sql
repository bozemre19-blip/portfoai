-- Add shared_with_family column to observations table
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS shared_with_family BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for shared observations
CREATE INDEX IF NOT EXISTS observations_shared_idx ON public.observations(shared_with_family);
