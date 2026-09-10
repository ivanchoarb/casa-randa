-- Gastos, anticipos de comisión y conciliación bancaria.
-- Esta es la parte de mayor riesgo del proyecto (ver docs/arquitectura-migracion.md,
-- Fase 4) — se construye con cuidado, no se genera con un framework CRUD.

create type public.categoria_gasto as enum (
  'reparacion', 'fumigacion', 'limpieza', 'mantenimiento',
  'servicios_publicos', 'insumos', 'honorarios', 'otros'
);

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  categoria public.categoria_gasto not null,
  concepto text not null,
  proveedor text,
  valor numeric(10, 2) not null,
  medio_pago text,
  notas text,
  created_at timestamptz not null default now()
);

create index gastos_fecha on public.gastos (fecha);

create type public.persona_comision as enum ('marquelda', 'ivan');

create table public.anticipos_comision (
  id uuid primary key default gen_random_uuid(),
  persona public.persona_comision not null,
  fecha date not null,
  valor numeric(10, 2) not null,
  referencia text,
  motivo text,
  notas text,
  created_at timestamptz not null default now()
);

create index anticipos_persona_fecha on public.anticipos_comision (persona, fecha);

-- Movimiento bancario esperado: el lado "esperado" se puede crear solo
-- (poll a la API de historial de PagueloFacil/Yappy, ver
-- docs/logica-negocio-y-flujos.md → "Conciliación bancaria"); el lado
-- "banco" (valor_recibido, confirmado) sigue siendo manual porque no
-- hay integración con Banco General.
create type public.origen_movimiento as enum ('paguelofacil', 'yappy', 'manual');
create type public.estado_conciliacion as enum ('pendiente', 'conciliado', 'diferencia');

create table public.movimientos_bancarios (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  descripcion text not null,
  referencia_bancaria text,
  valor_esperado numeric(10, 2) not null,
  valor_recibido numeric(10, 2),             -- null hasta que alguien lo confirma a mano
  reserva_id uuid references public.reservas (id),
  gasto_id uuid references public.gastos (id),
  origen public.origen_movimiento not null default 'manual',
  estado public.estado_conciliacion not null default 'pendiente',
  created_at timestamptz not null default now(),
  constraint un_solo_relacionado check (
    (reserva_id is not null)::int + (gasto_id is not null)::int <= 1
  )
);

create index movimientos_estado on public.movimientos_bancarios (estado);
create index movimientos_reserva on public.movimientos_bancarios (reserva_id);
