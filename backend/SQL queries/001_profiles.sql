-- Migration 001: Create profiles table
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'student'
                CHECK (role IN ('master', 'teacher', 'student')),
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy: service role can do everything (for backend API)
CREATE POLICY "Service role full access"
    ON public.profiles FOR ALL
    USING (true)
    WITH CHECK (true);
