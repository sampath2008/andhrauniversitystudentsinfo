-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Allow public read for login verification" ON public.students;
DROP POLICY IF EXISTS "Allow public insert for registration" ON public.students;
DROP POLICY IF EXISTS "Allow public update" ON public.students;

-- Create restrictive RLS policies
-- Only allow INSERT for new registrations (required for public registration)
CREATE POLICY "Allow registration insert only"
ON public.students
FOR INSERT
WITH CHECK (true);

-- Deny all direct SELECT/UPDATE/DELETE - operations go through Edge Functions with service role
-- No SELECT policy = no direct reads allowed
-- No UPDATE policy = no direct updates allowed
-- No DELETE policy = no direct deletes allowed