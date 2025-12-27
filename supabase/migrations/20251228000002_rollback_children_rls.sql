-- ROLLBACK: Remove problematic policy that's causing 500 errors
DROP POLICY IF EXISTS "Family can view linked children" ON public.children;
