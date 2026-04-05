-- Run this in your Supabase SQL Editor
-- Creates quizzes, questions, and quiz_attempts tables

-- ==========================================
-- 1. Quizzes table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Everyone can view quizzes for published courses
CREATE POLICY "Quizzes are viewable if course is published" ON public.quizzes
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = quizzes.course_id AND courses.is_published = true
        )
    );

-- ==========================================
-- 2. Questions table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    created_by_ai BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Everyone can view questions for quizzes in published courses
CREATE POLICY "Questions are viewable if parent quiz is viewable" ON public.questions
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            JOIN public.courses ON courses.id = quizzes.course_id
            WHERE quizzes.id = questions.quiz_id AND courses.is_published = true
        )
    );

-- ==========================================
-- 3. Quiz attempts table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Students can view their own attempts
CREATE POLICY "Students can view their own quiz attempts" ON public.quiz_attempts
    FOR SELECT
    USING (auth.uid() = student_id);

-- Students can insert their own attempts
CREATE POLICY "Students can submit quiz attempts" ON public.quiz_attempts
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Teachers can view attempts for quizzes in their courses
CREATE POLICY "Teachers can view attempts for their course quizzes" ON public.quiz_attempts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            JOIN public.courses ON courses.id = quizzes.course_id
            WHERE quizzes.id = quiz_attempts.quiz_id AND courses.teacher_id = auth.uid()
        )
    );
