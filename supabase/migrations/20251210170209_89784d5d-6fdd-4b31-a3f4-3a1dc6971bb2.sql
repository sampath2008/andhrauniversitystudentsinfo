-- Add password column to store plain password for admin viewing
ALTER TABLE public.students ADD COLUMN password TEXT;