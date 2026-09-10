-- Perfiles de usuario: extiende auth.users con el rol de la intranet.
-- Roles calcados de los tres paneles que ya existen en WordPress:
-- panel-del-administrador, panel-del-dueno, portal-de-empleados.

create extension if not exists "pgcrypto";

create type public.rol_usuario as enum ('administrador', 'dueño', 'empleado');

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol public.rol_usuario not null default 'empleado',
  created_at timestamptz not null default now()
);

comment on table public.perfiles is
  'Uno por usuario de auth.users. El rol decide qué ve cada quien en la intranet (ver políticas RLS en 0005_rls.sql).';

-- Crea el perfil automáticamente cuando alguien se registra en auth.users.
-- El rol por defecto es 'empleado'; un administrador lo sube a mano después.
create function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- Helper que las políticas RLS usan para leer el rol del usuario actual
-- sin recursión (security definer evita que la política de perfiles
-- se autoconsulte).
create function public.rol_actual()
returns public.rol_usuario
language sql
security definer set search_path = public
stable
as $$
  select rol from public.perfiles where id = auth.uid();
$$;
