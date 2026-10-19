begin;

create table public.pqrs (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('peticion', 'queja', 'reclamo', 'sugerencia')),
  nombre text not null check (char_length(nombre) between 1 and 80),
  apellido text not null check (char_length(apellido) between 1 and 80),
  email text not null check (char_length(email) <= 254),
  telefono text,
  idioma text not null check (idioma in ('es', 'en')),
  codigo_reserva text,
  reserva_id uuid references public.reservas(id) on delete set null,
  asunto text not null check (char_length(asunto) <= 150),
  mensaje text not null check (char_length(mensaje) <= 4000),
  acepta_tratamiento_datos boolean not null check (acepta_tratamiento_datos),
  estado text not null default 'recibida'
    check (estado in ('recibida', 'en_proceso', 'resuelta', 'archivada'))
);

create index pqrs_email_created_at_idx on public.pqrs (email, created_at desc);

alter table public.pqrs enable row level security;

create policy "intranet_lee_pqrs" on public.pqrs
  for select to authenticated
  using (public.tiene_permiso('contabilidad'));

create policy "intranet_actualiza_pqrs" on public.pqrs
  for update to authenticated
  using (public.tiene_permiso('contabilidad'))
  with check (public.tiene_permiso('contabilidad'));

create or replace function public.registrar_pqrs(
  p_tipo text,
  p_nombre text,
  p_apellido text,
  p_email text,
  p_telefono text,
  p_idioma text,
  p_codigo_reserva text,
  p_reserva_id uuid,
  p_asunto text,
  p_mensaje text,
  p_max_por_email int default 3,
  p_max_global int default 60
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_numero bigint;
begin
  perform pg_advisory_xact_lock(hashtext('pqrs-registro'));

  if (
    select count(*)
    from public.pqrs
    where email = p_email
      and created_at >= now() - interval '1 hour'
  ) >= p_max_por_email then
    return jsonb_build_object('ok', false, 'motivo', 'limite_correo');
  end if;

  if (
    select count(*)
    from public.pqrs
    where created_at >= now() - interval '1 hour'
  ) >= p_max_global then
    return jsonb_build_object('ok', false, 'motivo', 'limite_global');
  end if;

  insert into public.pqrs (
    tipo,
    nombre,
    apellido,
    email,
    telefono,
    idioma,
    codigo_reserva,
    reserva_id,
    asunto,
    mensaje,
    acepta_tratamiento_datos
  )
  values (
    p_tipo,
    p_nombre,
    p_apellido,
    p_email,
    p_telefono,
    p_idioma,
    p_codigo_reserva,
    p_reserva_id,
    p_asunto,
    p_mensaje,
    true
  )
  returning numero into v_numero;

  return jsonb_build_object('ok', true, 'numero', v_numero);
end;
$$;

revoke execute on function public.registrar_pqrs(text, text, text, text, text, text, text, uuid, text, text, int, int)
  from public, anon, authenticated;
grant execute on function public.registrar_pqrs(text, text, text, text, text, text, text, uuid, text, text, int, int)
  to service_role;

notify pgrst, 'reload schema';

commit;
