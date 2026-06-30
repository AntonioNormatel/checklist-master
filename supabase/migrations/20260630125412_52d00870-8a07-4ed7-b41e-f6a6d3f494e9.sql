-- 1. Enum de papéis
create type public.app_role as enum ('admin','supervisor','planejador','executante');

-- 2. Tabela user_roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null default 'executante',
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

-- 3. Função has_role security definer
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role and approved = true
  )
$$;

-- 4. Função utilitária: papel atual aprovado do usuário (prioridade admin > supervisor > planejador > executante)
create or replace function public.current_role(_user_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
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

-- 5. Policies de user_roles
create policy "Usuario ve seu proprio papel" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Admin ve todos os papeis" on public.user_roles
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admin gerencia papeis" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 6. Trigger: novo usuario vira executante NAO aprovado
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role, approved)
  values (
    new.id,
    'executante',
    -- auto-aprova o admin inicial
    case when lower(new.email) = 'antonio.pedro@normatel.com.br' then true else false end
  )
  on conflict (user_id, role) do nothing;

  -- garante papel admin para o e-mail bootstrap
  if lower(new.email) = 'antonio.pedro@normatel.com.br' then
    insert into public.user_roles (user_id, role, approved)
    values (new.id, 'admin', true)
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_role on auth.users;
create trigger on_auth_user_created_role
after insert on auth.users
for each row execute function public.handle_new_user_role();

-- 7. Bootstrap: se o usuario antonio.pedro ja existe, garante admin aprovado
insert into public.user_roles (user_id, role, approved)
select id, 'admin'::public.app_role, true from auth.users
where lower(email) = 'antonio.pedro@normatel.com.br'
on conflict (user_id, role) do update set approved = true;

insert into public.user_roles (user_id, role, approved)
select id, 'executante'::public.app_role, true from auth.users
where lower(email) = 'antonio.pedro@normatel.com.br'
on conflict (user_id, role) do update set approved = true;

-- 8. Atualizar policies dos checklists para suportar puxar entre todos + papeis
drop policy if exists "Usuarios atualizam seus checklists" on public.checklists;
drop policy if exists "Usuarios criam seus checklists" on public.checklists;
drop policy if exists "Usuarios leem seus checklists" on public.checklists;
drop policy if exists "Usuarios removem seus checklists" on public.checklists;

-- Todos autenticados aprovados podem ler (puxar) qualquer checklist
create policy "Autenticados leem checklists" on public.checklists
  for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'supervisor')
    or public.has_role(auth.uid(), 'planejador')
    or public.has_role(auth.uid(), 'executante')
  );

-- Inserir: qualquer papel aprovado, sempre com user_id = auth.uid()
create policy "Autenticados criam checklists" on public.checklists
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'supervisor')
      or public.has_role(auth.uid(), 'planejador')
      or public.has_role(auth.uid(), 'executante')
    )
  );

-- Atualizar: executante só os próprios; admin/supervisor/planejador qualquer
create policy "Editar checklists conforme papel" on public.checklists
  for update to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'supervisor')
    or public.has_role(auth.uid(), 'planejador')
    or (public.has_role(auth.uid(), 'executante') and auth.uid() = user_id)
  )
  with check (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'supervisor')
    or public.has_role(auth.uid(), 'planejador')
    or (public.has_role(auth.uid(), 'executante') and auth.uid() = user_id)
  );

-- Apagar: somente admin
create policy "Apenas admin apaga checklists" on public.checklists
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
