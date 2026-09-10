-- Tienda (compra de extras) y plan de compras/mejoras de la casa.
-- Ojo: son cosas distintas aunque el nombre se parezca —
-- productos_tienda/pedidos_tienda es lo que compra el HUÉSPED;
-- plan_compras es lo que compra LA CASA (muebles, equipo). No mezclar
-- ni en el código ni al enviar el correo de confirmación (ver
-- docs/logica-negocio-y-flujos.md → "Correo electrónico").

create table public.productos_tienda (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10, 2) not null,
  disponible boolean not null default true,
  created_at timestamptz not null default now()
);

create type public.estado_pago_pedido as enum ('pendiente', 'pagado', 'fallido', 'reembolsado');
create type public.pasarela_pago as enum ('paguelofacil', 'yappy');

create table public.pedidos_tienda (
  id uuid primary key default gen_random_uuid(),
  -- Obligatorio: decidido 2026-09-11, no hay compras sin reserva confirmada.
  reserva_id uuid not null references public.reservas (id),
  total numeric(10, 2) not null default 0,
  estado_pago public.estado_pago_pedido not null default 'pendiente',
  pasarela public.pasarela_pago,
  created_at timestamptz not null default now()
);

create index pedidos_tienda_reserva on public.pedidos_tienda (reserva_id);

create table public.pedidos_tienda_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_tienda (id) on delete cascade,
  producto_id uuid not null references public.productos_tienda (id),
  cantidad integer not null default 1,
  precio_unitario numeric(10, 2) not null,
  constraint cantidad_positiva check (cantidad > 0)
);

create index pedidos_tienda_items_pedido on public.pedidos_tienda_items (pedido_id);

create type public.categoria_capex as enum (
  'mejora', 'reparacion', 'mantenimiento_preventivo', 'compra_equipo', 'decoracion'
);
create type public.prioridad_capex as enum ('alta', 'media', 'baja');
create type public.estado_capex as enum ('programada', 'cotizada', 'aprobada', 'realizada');

create table public.plan_compras (
  id uuid primary key default gen_random_uuid(),
  anio integer not null,
  categoria public.categoria_capex not null,
  concepto text not null,
  proveedor text,
  cotizacion_usd numeric(10, 2),
  fecha_programada date,
  prioridad public.prioridad_capex not null default 'media',
  estado public.estado_capex not null default 'programada',
  enlace_cotizacion text,
  notas text,
  created_at timestamptz not null default now()
);

create index plan_compras_anio on public.plan_compras (anio);
