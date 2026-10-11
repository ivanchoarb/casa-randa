-- Valores operativos que cambian entre clientes sin requerir un redespliegue.
begin;

create table public.configuracion_cliente (
  clave text primary key,
  valor text not null,
  descripcion text
);

insert into public.configuracion_cliente (clave, valor, descripcion) values
  ('comision_marquelda_tasa', '0.10', 'Tasa decimal aplicada a lo recibido para la comisión de Marquelda.'),
  ('comision_ivan_tasa', '0.09', 'Tasa decimal aplicada a lo recibido para la comisión de Iván.'),
  ('responsables_preparacion', '["Marquelda","Iván"]', 'Responsables disponibles para preparar llegadas, en JSON.'),
  ('responsables_turnover', '["Marquelda","Iván"]', 'Responsables disponibles para check-out, en JSON.'),
  ('responsables_limpieza_salida', '["Dayra"]', 'Responsables disponibles para limpieza, en JSON.'),
  ('persona_anticipos_comision', 'ivan', 'Persona cuya comisión admite anticipos en Contabilidad.');

alter table public.configuracion_cliente enable row level security;

create policy configuracion_lee_intranet on public.configuracion_cliente
  for select to authenticated
  using (public.tiene_permiso('operacion') or public.tiene_permiso('contabilidad'));

notify pgrst, 'reload schema';

commit;
