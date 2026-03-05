-- Add status column to attendance for Present/Excused/Unexcused tracking
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'present';

-- Update existing records: is_excused = true -> 'excused', else 'present'
UPDATE public.attendance SET status = CASE WHEN is_excused THEN 'excused' ELSE 'present' END;