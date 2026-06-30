-- Switch has_role and current_role to SECURITY INVOKER so signed-in users cannot execute them with elevated privileges.
-- Authenticated role already has SELECT on public.user_roles, so the functions still work inside RLS policies.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role and approved = true
  )
$$;

CREATE OR REPLACE FUNCTION public."current_role"(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  select role from public.user_roles
  where user_id = _user_id and approved = true
  order by case role
    when 'admin' then 1
    when 'supervisor' then 2
    when 'planejador' then 3
    when 'executante' then 4
  end
  limit 1
$$;
