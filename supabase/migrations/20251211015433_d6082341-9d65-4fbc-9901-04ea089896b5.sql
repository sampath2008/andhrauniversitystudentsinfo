-- Fix 1: Secure admin_sessions table - deny all public access
DROP POLICY IF EXISTS "Allow all admin session operations" ON admin_sessions;
CREATE POLICY "Deny all public access" ON admin_sessions FOR ALL USING (false);

-- Fix 2: Create student_sessions table for proper session validation
CREATE TABLE public.student_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS and deny all public access (edge functions use service role key)
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all public access" ON student_sessions FOR ALL USING (false);

-- Add index for faster token lookups
CREATE INDEX idx_student_sessions_token ON student_sessions(session_token);
CREATE INDEX idx_student_sessions_student_id ON student_sessions(student_id);

-- Fix 3: Secure students table - deny all public SELECT
CREATE POLICY "Deny public select" ON students FOR SELECT USING (false);

-- Update INSERT policy to deny public inserts (registration goes through edge function)
DROP POLICY IF EXISTS "Allow registration insert only" ON students;
CREATE POLICY "Deny public insert" ON students FOR INSERT WITH CHECK (false);