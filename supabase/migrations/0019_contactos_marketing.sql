-- Base para "clientes que se registren" fuera del flujo de cotización: hoy,
-- contactos subidos a mano desde un CSV/Excel de FormsApp; más adelante,
-- formularios de registro nativos en la página web (Ivan: "quiero que
-- eventualmente la gente se registre en la página web por medio de
-- formularios creados aca"). No se reutiliza `solicitudes` para esto: esa
-- tabla exige entrada/salida (constraint salida_despues_de_entrada) porque
-- modela una solicitud de cotización con fechas concretas, y sus filas
-- alimentan la cola de revisión de Reservas — un contacto de marketing sin
-- fechas de viaje no es una solicitud de reserva y no debería aparecer ahí.
begin;

create type public.fuente_contacto_marketing as enum ('formulario_web', 'importado', 'manual');

create table public.contactos_marketing (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  telefono text,
  pais text,
  ciudad text,
  notas text,
  fuente public.fuente_contacto_marketing not null default 'manual',
  consentimiento boolean not null default false,
  creado_por uuid references public.perfiles (id),
  created_at timestamptz not null default now(),
  constraint contactos_marketing_email_unico unique (email)
);

alter table public.contactos_marketing enable row level security;

create policy "marketing_lee_contactos" on public.contactos_marketing
  for select to authenticated using (public.tiene_permiso('marketing'));
create policy "marketing_gestiona_contactos" on public.contactos_marketing
  for all to authenticated using (public.tiene_permiso('marketing')) with check (public.tiene_permiso('marketing'));

notify pgrst, 'reload schema';
commit;
