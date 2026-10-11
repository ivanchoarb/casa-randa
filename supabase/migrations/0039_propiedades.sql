create table public.propiedades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slogan text,
  tagline_cotizacion text,
  descripcion_cotizacion text,
  direccion text,
  correo_reservas text,
  web_reservas text,
  nombre_host1 text,
  rol_host1 text,
  created_at timestamptz default now()
);

insert into public.propiedades (
  nombre, slogan, tagline_cotizacion, descripcion_cotizacion,
  direccion, correo_reservas, web_reservas, nombre_host1, rol_host1
)
values (
  (select valor from public.configuracion_cliente where clave = 'nombre_propiedad'),
  (select valor from public.configuracion_cliente where clave = 'slogan_propiedad'),
  (select valor from public.configuracion_cliente where clave = 'tagline_cotizacion'),
  (select valor from public.configuracion_cliente where clave = 'descripcion_cotizacion'),
  (select valor from public.configuracion_cliente where clave = 'direccion_propiedad'),
  (select valor from public.configuracion_cliente where clave = 'correo_reservas'),
  (select valor from public.configuracion_cliente where clave = 'web_reservas'),
  (select valor from public.configuracion_cliente where clave = 'nombre_host1'),
  (select valor from public.configuracion_cliente where clave = 'rol_host1')
);

alter table public.propiedades enable row level security;
create policy propiedades_lee_intranet on public.propiedades
  for select to authenticated
  using (public.tiene_permiso('operacion') or public.tiene_permiso('contabilidad'));
