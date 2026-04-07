-- Ensure election admin writes (especially INSERT on election_candidates)
-- work for members who are granted admin access via exec positions.

CREATE OR REPLACE FUNCTION public.has_exec_position(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND COALESCE(array_length(positions, 1), 0) > 0
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_officer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'officer', 'exec')
  )
  OR public.has_exec_position(_user_id)
$$;

DROP POLICY IF EXISTS "Admin/Officers can manage elections" ON public.elections;
CREATE POLICY "Admin/Officers can manage elections"
ON public.elections
FOR ALL
TO authenticated
USING (public.is_admin_or_officer(auth.uid()))
WITH CHECK (public.is_admin_or_officer(auth.uid()));

DROP POLICY IF EXISTS "Admin/Officers can manage election positions" ON public.election_positions;
CREATE POLICY "Admin/Officers can manage election positions"
ON public.election_positions
FOR ALL
TO authenticated
USING (public.is_admin_or_officer(auth.uid()))
WITH CHECK (public.is_admin_or_officer(auth.uid()));

DROP POLICY IF EXISTS "Admin/Officers can manage election candidates" ON public.election_candidates;
CREATE POLICY "Admin/Officers can manage election candidates"
ON public.election_candidates
FOR ALL
TO authenticated
USING (public.is_admin_or_officer(auth.uid()))
WITH CHECK (public.is_admin_or_officer(auth.uid()));
