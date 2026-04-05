-- ─────────────────────────────────────────────────────────
-- 1. Create doubts table
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doubts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read doubts for a published course or their own course
CREATE POLICY "Anyone can view doubts" 
    ON public.doubts FOR SELECT 
    USING (true);

-- Policy: Authenticated users can create doubts if enrolled
CREATE POLICY "Students can create doubts" 
    ON public.doubts FOR INSERT 
    WITH CHECK (auth.uid() = student_id);

-- Policy: Only doubt owner or course teacher can update doubt (resolve)
CREATE POLICY "Doubt owner or teacher can update" 
    ON public.doubts FOR UPDATE 
    USING (
        auth.uid() = student_id 
        OR 
        auth.uid() IN (SELECT teacher_id FROM public.courses WHERE id = course_id)
    );

-- Policy: Only doubt owner or course teacher can delete doubt
CREATE POLICY "Doubt owner or teacher can delete" 
    ON public.doubts FOR DELETE 
    USING (
        auth.uid() = student_id 
        OR 
        auth.uid() IN (SELECT teacher_id FROM public.courses WHERE id = course_id)
    );


-- ─────────────────────────────────────────────────────────
-- 2. Create doubt_replies table
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doubt_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.doubt_replies ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read doubt replies
CREATE POLICY "Anyone can view doubt replies" 
    ON public.doubt_replies FOR SELECT 
    USING (true);

-- Policy: Authenticated users can create replies
CREATE POLICY "Authenticated users can create replies" 
    ON public.doubt_replies FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy: Only reply owner can update their reply
CREATE POLICY "Reply owner can update" 
    ON public.doubt_replies FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy: Only reply owner or course teacher can delete reply
CREATE POLICY "Reply owner or teacher can delete" 
    ON public.doubt_replies FOR DELETE 
    USING (
        auth.uid() = user_id 
        OR 
        auth.uid() IN (
            SELECT c.teacher_id FROM public.courses c
            JOIN public.doubts d ON d.course_id = c.id
            WHERE d.id = doubt_id
        )
    );
