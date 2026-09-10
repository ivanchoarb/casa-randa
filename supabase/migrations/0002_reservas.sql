-- Reservas, solicitudes directas, calendario y tarifas.
-- Ver docs/logica-negocio-y-flujos.md para el flujo completo de cada tabla.

create type public.canal_reserva as enum ('airbnb', 'vrbo', 'directo');
create type public.estado_reserva as enum ('pendiente', 'confirmada', 'completada', 'cancelada');

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  canal public.canal_reserva not null,
  codigo_externo text,                       -- código de Airbnb/Vrbo; null en reservas directas
  huesped_nombre text not null,
  huesped_email text,
  huesped_pais text,
  huesped_ciudad text,
  entrada date not null,
  salida date not null,
  noches integer generated always as (salida - entrada) stored,
  huespedes integer not null default 2,
  tarifa_noche numeric(10, 2) not null,
  bruto numeric(10, 2) not null default 0,
  comision_plataforma numeric(10, 2) not null default 0,
  recibido numeric(10, 2) generated always as (bruto - comision_plataforma) stored,
  comision_marquelda numeric(10, 2) not null default 0,
  comision_ivan numeric(10, 2) not null default 0,
  neto numeric(10, 2) generated always as
    (bruto - comision_plataforma - comision_marquelda - comision_ivan) stored,
  estado public.estado_reserva not null default 'pendiente',
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salida_despues_de_entrada check (salida > entrada),
  constraint huespedes_en_rango check (huespedes between 1 and 16)
);

-- Airbnb/Vrbo reenvían el mismo código al reimportar un CSV; sin este
-- índice único el import "upsert por código, no duplica" (ver
-- Casa Randa Core actual) no se puede replicar con un ON CONFLICT.
create unique index reservas_codigo_externo_unico
  on public.reservas (codigo_externo)
  where codigo_externo is not null;

create index reservas_fechas on public.reservas (entrada, salida);

-- Códigos de descuento: se define aquí (y no junto con el resto de
-- tienda/planificación en 0004) porque las solicitudes de reserva
-- directa la referencian como llave foránea, y una migración no puede
-- referenciar una tabla que todavía no existe.
create table public.codigos_descuento (
  codigo text primary key,
  descuento_pct numeric(5, 2) not null,
  vigente_desde date not null,
  vigente_hasta date not null,
  maximo_usos integer not null default 0,   -- 0 = sin límite
  usos_actuales integer not null default 0,
  notas text,
  created_at timestamptz not null default now(),
  constraint vigencia_valida check (vigente_hasta >= vigente_desde),
  constraint descuento_en_rango check (descuento_pct > 0 and descuento_pct <= 100)
);

create type public.estado_solicitud as enum ('pendiente', 'aprobada', 'rechazada', 'convertida');
create type public.plan_tarifa as enum ('flex', 'nr');
create type public.plan_pago as enum ('30', '100');

create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  telefono text,
  pais text,
  ciudad text,
  entrada date not null,
  salida date not null,
  huespedes integer not null default 2,
  plan_tarifa public.plan_tarifa not null default 'flex',
  plan_pago public.plan_pago not null default '30',
  codigo_descuento text references public.codigos_descuento (codigo),
  notas text,
  consentimiento boolean not null default false,
  consentimiento_politica boolean not null default false,
  estado public.estado_solicitud not null default 'pendiente',
  reserva_id uuid references public.reservas (id),   -- se llena al aprobar+pagar (Flujo 1)
  created_at timestamptz not null default now(),
  constraint salida_despues_de_entrada check (salida > entrada)
);

create type public.fuente_bloqueo as enum ('airbnb', 'vrbo', 'directo');

create table public.bloqueos_calendario (
  id uuid primary key default gen_random_uuid(),
  inicio date not null,
  fin date not null,
  fuente public.fuente_bloqueo not null,
  reserva_id uuid references public.reservas (id),
  -- Clave del defecto D2: un bloqueo "directo" debe sobrevivir a la
  -- resincronización de iCal y entrar en los feeds de salida — por eso
  -- reserva_id existe y por eso el job de sync solo debe reemplazar
  -- filas con fuente airbnb/vrbo, nunca borrar en bloque toda la tabla.
  created_at timestamptz not null default now()
);

create index bloqueos_fechas on public.bloqueos_calendario (inicio, fin);
create index bloqueos_fuente on public.bloqueos_calendario (fuente);

create type public.fuente_tarifa as enum ('pricelabs', 'plana');

create table public.tarifas_diarias (
  fecha date primary key,
  tarifa numeric(10, 2) not null,
  fuente public.fuente_tarifa not null default 'plana',
  estancia_minima integer not null default 2,
  updated_at timestamptz not null default now()
);

create type public.tipo_tarea_operacion as enum ('preparacion', 'turnover', 'limpieza_salida');
create type public.estado_tarea_operacion as enum ('pendiente', 'completada', 'con_novedad');

create table public.tareas_operacion (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas (id) on delete cascade,
  tipo public.tipo_tarea_operacion not null,
  estado public.estado_tarea_operacion not null default 'pendiente',
  fecha date not null,
  notas text,
  created_at timestamptz not null default now()
);

create index tareas_operacion_reserva on public.tareas_operacion (reserva_id);
