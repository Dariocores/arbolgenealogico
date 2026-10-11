-- ============================================================================
-- Árbol Genealógico — esquema de backend con licencia manual
-- Ejecutar completo en Supabase → SQL Editor.
--
-- Modelo: cada persona usuaria tiene un perfil con una licencia que vos
-- (admin) activás/desactivás a mano. Mientras la licencia no esté vigente,
-- las políticas RLS le impiden leer o escribir sus árboles.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Perfiles (1:1 con auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  license_active boolean not null default false,
  license_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Árboles (un registro por árbol; data = JSON serializado de la app)
-- ---------------------------------------------------------------------------
create table if not exists public.trees (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Mi árbol',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trees_owner_idx on public.trees (owner_id);

-- ---------------------------------------------------------------------------
-- 3. Funciones auxiliares
-- ---------------------------------------------------------------------------

-- ¿La licencia de esta persona está vigente?
create or replace function public.has_active_license(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.license_active
      and (p.license_until is null or p.license_until > now())
  );
$$;

-- ¿Es admin?
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- Mantener updated_at al día.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_trees on public.trees;
create trigger touch_trees
  before update on public.trees
  for each row execute function public.touch_updated_at();

-- Crear el perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trees enable row level security;

-- Perfiles: cada persona ve el suyo; el admin ve y edita todos.
-- (Nadie puede auto-asignarse admin ni activarse la licencia: no hay política
--  de UPDATE para el propio usuario.)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select
  using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Árboles: solo el dueño con licencia vigente (o un admin) puede ver/editar.
drop policy if exists trees_select on public.trees;
create policy trees_select on public.trees
  for select
  using (
    public.is_admin(auth.uid())
    or (owner_id = auth.uid() and public.has_active_license(auth.uid()))
  );

drop policy if exists trees_insert on public.trees;
create policy trees_insert on public.trees
  for insert
  with check (owner_id = auth.uid() and public.has_active_license(auth.uid()));

drop policy if exists trees_update on public.trees;
create policy trees_update on public.trees
  for update
  using (owner_id = auth.uid() and public.has_active_license(auth.uid()))
  with check (owner_id = auth.uid() and public.has_active_license(auth.uid()));

drop policy if exists trees_delete on public.trees;
create policy trees_delete on public.trees
  for delete
  using (owner_id = auth.uid() or public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. Administración de licencias (solo admin)
-- ---------------------------------------------------------------------------

-- Activa la licencia por N meses (por defecto 1). Suma al vencimiento actual
-- si todavía no venció.
create or replace function public.grant_license(user_email text, months integer default 1)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  update public.profiles
     set license_active = true,
         license_until = greatest(coalesce(license_until, now()), now())
                         + make_interval(months => months)
   where email = user_email;
end;
$$;

-- Corta la licencia (suspensión inmediata).
create or replace function public.revoke_license(user_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  update public.profiles
     set license_active = false
   where email = user_email;
end;
$$;

revoke all on function public.grant_license(text, integer) from public;
revoke all on function public.revoke_license(text) from public;
grant execute on function public.grant_license(text, integer) to authenticated;
grant execute on function public.revoke_license(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Primer admin
-- Después de registrar tu propia cuenta, ejecutá:
--
--   update public.profiles
--      set role = 'admin', license_active = true
--    where email = 'tu-correo@ejemplo.com';
--
-- Luego, para habilitar a alguien por un mes desde la consola SQL:
--   select public.grant_license('cliente@ejemplo.com', 1);
-- Y para cortarle el servicio:
--   select public.revoke_license('cliente@ejemplo.com');
-- ---------------------------------------------------------------------------
