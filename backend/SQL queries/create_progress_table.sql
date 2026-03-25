-- Run this in your Supabase SQL Editor

-- Create the progress table
CREATE TABLE IF NOT EXISTS public.progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, lecture_id) -- Prevent duplicate progress entries
);

-- Turn on RLS
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- Allow students to manage their own progress
CREATE POLICY "Students can manage their own progress"
ON public.progress
FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);
