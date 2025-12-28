-- Add messaging_hours column to profiles table for teachers
-- Format: { enabled: boolean, manual_override: boolean, days: [0-6], start_time: "HH:MM", end_time: "HH:MM" }
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS messaging_hours JSONB DEFAULT '{"enabled": false, "manual_override": null, "days": [1,2,3,4,5], "start_time": "09:00", "end_time": "17:00"}'::jsonb;

-- Add scheduled_at and delivered columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT true;

-- Create index for finding undelivered scheduled messages
CREATE INDEX IF NOT EXISTS messages_scheduled_idx 
ON public.messages(scheduled_at, delivered) 
WHERE delivered = false;

-- Function to check if teacher is currently available
CREATE OR REPLACE FUNCTION public.is_teacher_available(teacher_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    hours JSONB;
    current_day INTEGER;
    current_time TIME;
    start_t TIME;
    end_t TIME;
BEGIN
    -- Get teacher's messaging hours
    SELECT messaging_hours INTO hours FROM public.profiles WHERE id = teacher_id;
    
    -- If no settings or not enabled, always available
    IF hours IS NULL OR NOT (hours->>'enabled')::boolean THEN
        RETURN true;
    END IF;
    
    -- Check manual override (teacher can force on/off)
    IF hours->>'manual_override' = 'true' THEN
        RETURN true;
    ELSIF hours->>'manual_override' = 'false' THEN
        RETURN false;
    END IF;
    
    -- Get current day (0=Sunday, 1=Monday, etc.) and time
    current_day := EXTRACT(DOW FROM NOW());
    current_time := (NOW() AT TIME ZONE 'Europe/Istanbul')::TIME;
    
    -- Check if current day is in allowed days
    IF NOT hours->'days' ? current_day::text THEN
        RETURN false;
    END IF;
    
    -- Check if current time is within allowed hours
    start_t := (hours->>'start_time')::TIME;
    end_t := (hours->>'end_time')::TIME;
    
    RETURN current_time >= start_t AND current_time <= end_t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_teacher_available(UUID) TO authenticated;
