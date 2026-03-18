-- SQL script to create lectures table and RLS policies in Supabase

CREATE TABLE public.lectures (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view lectures for published courses
-- (Assuming we check if course is published in API, but let's make a broad select policy for now
-- since the API relies on Service Role or checks ownership itself, but for public reads...)
CREATE POLICY "Lectures are viewable by everyone if course is published" ON public.lectures
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = lectures.course_id AND courses.is_published = true
        )
    );

-- We'll handle mutations (insert, update, delete) via the backend API using the Service Role, 
-- which bypasses RLS. So we don't strictly need insert/update/delete policies for authenticated users 
-- unless they interact with Supabase directly from the frontend.
