-- Seguridad a nivel de fila.
--
-- Primer borrador de permisos por rol — administrador/dueño con acceso
-- amplio, empleado limitado a operación, y lo estrictamente necesario
-- expuesto al sitio público (anon) para que la portada funcione sin
-- exponer contabilidad ni datos de huéspedes de otras reservas. Ajustar
-- cuando se confirmen los límites exactos de "empleado" con Ivan — hoy
-- es una suposición razonable, no algo verificado contra el sistema
-- actual (la intranet de WordPress no se inspeccionó con ese rol).

create function public.es_gestor()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.rol_actual() in ('administrador', 'dueño');
$$;

create function public.es_intranet()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.rol_actual() is not null;
$$;

-- perfiles ------------------------------------------------------------
alter table public.perfiles enable row level security;

create policy "ver_propio_perfil" on public.perfiles
  for select using (id = auth.uid());

create policy "admin_ve_todos_los_perfiles" on public.perfiles
  for select using (public.rol_actual() = 'administrador');

create policy "admin_gestiona_perfiles" on public.perfiles
  for update using (public.rol_actual() = 'administrador');

-- reservas, calendario, tarifas, solicitudes, códigos de descuento ----
alter table public.reservas enable row level security;
alter table public.bloqueos_calendario enable row level security;
alter table public.tarifas_diarias enable row level security;
alter table public.solicitudes enable row level security;
alter table public.codigos_descuento enable row level security;
alter table public.tareas_operacion enable row level security;

-- Disponibilidad y tarifa: públicas por diseño — es lo mismo que ya
-- viaja hoy en los feeds iCal de salida hacia Airbnb y Vrbo.
create policy "publico_lee_bloqueos" on public.bloqueos_calendario
  for select using (true);

create policy "publico_lee_tarifas" on public.tarifas_diarias
  for select using (true);

-- Cualquiera puede enviar una solicitud (Flujo 1), pero no leer las de
-- otros — eso sí es dato de contacto de huéspedes.
create policy "publico_crea_solicitud" on public.solicitudes
  for insert with check (true);

create policy "intranet_lee_solicitudes" on public.solicitudes
  for select using (public.es_intranet());

create policy "gestor_actualiza_solicitudes" on public.solicitudes
  for update using (public.es_gestor());

-- Reservas: dato de huésped, solo intranet.
create policy "intranet_lee_reservas" on public.reservas
  for select using (public.es_intranet());

create policy "gestor_escribe_reservas" on public.reservas
  for insert with check (public.es_gestor());

create policy "gestor_actualiza_reservas" on public.reservas
  for update using (public.es_gestor());

-- Tareas de operación: el personal (empleado) las trabaja día a día.
create policy "intranet_lee_tareas" on public.tareas_operacion
  for select using (public.es_intranet());

create policy "intranet_actualiza_tareas" on public.tareas_operacion
  for update using (public.es_intranet());

create policy "gestor_crea_tareas" on public.tareas_operacion
  for insert with check (public.es_gestor());

-- Códigos de descuento: la portada necesita validarlos al cotizar
-- (¿existe, está vigente, le quedan usos?), pero no listarlos todos.
create policy "publico_valida_codigo" on public.codigos_descuento
  for select using (
    vigente_desde <= current_date
    and vigente_hasta >= current_date
    and (maximo_usos = 0 or usos_actuales < maximo_usos)
  );

create policy "gestor_ve_todos_los_codigos" on public.codigos_descuento
  for select using (public.es_gestor());

create policy "gestor_gestiona_codigos" on public.codigos_descuento
  for all using (public.es_gestor());

-- contabilidad y conciliación — sin acceso de "empleado" ni de anon --
alter table public.gastos enable row level security;
alter table public.anticipos_comision enable row level security;
alter table public.movimientos_bancarios enable row level security;
alter table public.plan_compras enable row level security;

create policy "gestor_gestiona_gastos" on public.gastos
  for all using (public.es_gestor());

create policy "gestor_gestiona_anticipos" on public.anticipos_comision
  for all using (public.es_gestor());

create policy "gestor_gestiona_movimientos" on public.movimientos_bancarios
  for all using (public.es_gestor());

create policy "gestor_gestiona_plan_compras" on public.plan_compras
  for all using (public.es_gestor());

-- tienda ---------------------------------------------------------------
alter table public.productos_tienda enable row level security;
alter table public.pedidos_tienda enable row level security;
alter table public.pedidos_tienda_items enable row level security;

create policy "publico_lee_catalogo" on public.productos_tienda
  for select using (disponible = true);

create policy "gestor_gestiona_catalogo" on public.productos_tienda
  for all using (public.es_gestor());

-- Los pedidos no se crean con una policy de "anon insert": el checkout
-- pasa por una función server-side (rol service_role) para que el
-- total se calcule del lado del servidor, no de lo que mande el
-- navegador. Aquí solo se define la lectura para el personal.
create policy "intranet_lee_pedidos" on public.pedidos_tienda
  for select using (public.es_intranet());

create policy "intranet_lee_items_pedido" on public.pedidos_tienda_items
  for select using (public.es_intranet());
