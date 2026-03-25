-- Run this in your Supabase SQL Editor

-- Create the enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_id) -- Prevent duplicate enrollments
);

-- Turn on RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Allow students to insert their own enrollments
CREATE POLICY "Students can enroll themselves"
ON public.enrollments
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Allow users to see their own enrollments
CREATE POLICY "Users can view their own enrollments"
ON public.enrollments
FOR SELECT
USING (auth.uid() = student_id);

-- Allow teachers to see enrollments for their courses
CREATE POLICY "Teachers can view enrollments for their courses"
ON public.enrollments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.courses
        WHERE courses.id = enrollments.course_id
        AND courses.teacher_id = auth.uid()
    )
);

-- Allow masters to see all enrollments (assume masters bypass RLS or have specific role logic, but here's a standard one)
-- Assuming master role is checked at API level or via auth.jwt()
-- (If you already have a master policy, you can omit this or adapt it)
