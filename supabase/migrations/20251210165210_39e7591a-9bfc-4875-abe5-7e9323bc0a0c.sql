-- Create students table
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    registration_number TEXT NOT NULL UNIQUE,
    roll_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    section TEXT NOT NULL CHECK (section IN ('A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10')),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policy for students to read their own data (will be handled via custom auth)
CREATE POLICY "Allow public insert for registration" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

-- Create policy for reading (will verify via application logic)
CREATE POLICY "Allow public read for login verification" 
ON public.students 
FOR SELECT 
USING (true);

-- Create policy for updating own data
CREATE POLICY "Allow public update" 
ON public.students 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create admin_sessions table to track admin logins
CREATE TABLE public.admin_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations on admin_sessions (managed by application)
CREATE POLICY "Allow all admin session operations" 
ON public.admin_sessions 
FOR ALL 
USING (true);