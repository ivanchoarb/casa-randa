-- Envío de correo a la audiencia de Marketing desde booking@randahome.com
-- (el mismo SMTP transaccional de Dongee), uno a uno y con un límite diario
-- configurable — no un blast — para no arriesgar la reputación de esa
-- cuenta, que también manda cotizaciones y activación de cuentas. Ver
-- CLAUDE.md para el porqué del diseño (sin disparador automático todavía:
-- la intranet no está desplegada en ningún servidor, así que por ahora el
-- envío se dispara a mano desde la UI, un correo por click).
begin;

create type public.estado_campana_marketing as enum ('activa', 'pausada', 'completada');
create type public.estado_envio_campana as enum ('pendiente', 'enviado', 'fallido');

create table public.campanas_marketing (
  id uuid primary key default gen_random_uuid(),
  asunto text not null,
  cuerpo_html text not null,
  limite_diario integer not null default 40,
  estado public.estado_campana_marketing not null default 'activa',
  creado_por uuid references public.perfiles (id),
  created_at timestamptz not null default now(),
  constraint limite_diario_positivo check (limite_diario > 0)
);

-- Snapshot de la audiencia al crear la campaña, no una vista en vivo de
-- solicitudes/contactos_marketing: así una campaña ya en curso no cambia de
-- destinatarios si alguien nuevo se registra o alguien retira su
-- consentimiento a medio envío (la baja sí se respeta — ver
-- api/marketing/baja/route.ts, que apaga el pendiente si existe).
create table public.campana_destinatarios (
  id uuid primary key default gen_random_uuid(),
  campana_id uuid not null references public.campanas_marketing (id) on delete cascade,
  nombre text not null,
  email text not null,
  estado public.estado_envio_campana not null default 'pendiente',
  enviado_en timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (campana_id, email)
);
create index campana_destinatarios_pendientes on public.campana_destinatarios (campana_id, estado);

alter table public.campanas_marketing enable row level security;
alter table public.campana_destinatarios enable row level security;

create policy "marketing_gestiona_campanas" on public.campanas_marketing
  for all to authenticated using (public.tiene_permiso('marketing')) with check (public.tiene_permiso('marketing'));
create policy "marketing_gestiona_destinatarios" on public.campana_destinatarios
  for all to authenticated using (public.tiene_permiso('marketing')) with check (public.tiene_permiso('marketing'));

notify pgrst, 'reload schema';
commit;
