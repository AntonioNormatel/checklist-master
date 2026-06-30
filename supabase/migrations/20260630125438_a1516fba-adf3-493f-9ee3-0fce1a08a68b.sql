revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.current_role(uuid) from public, anon;
revoke execute on function public.handle_new_user_role() from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.current_role(uuid) to authenticated, service_role;
