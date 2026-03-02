-- Ensure Jacob Tartabini has developer privileges for profile/position management
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'developer'::public.app_role
FROM auth.users AS au
WHERE lower(au.email) = 'jacobtart8@gmail.com'
   OR lower(coalesce(au.raw_user_meta_data ->> 'full_name', '')) = 'jacob tartabini'
ON CONFLICT (user_id, role) DO NOTHING;
