-- Permisos por usuario y proyección de reservas sin datos financieros privados.
-- La vista es SECURITY DEFINER por diseño: toda lectura está filtrada por auth.uid().
begin;
alter table public.perfiles add column if not exists permisos jsonb not null default '{}'::jsonb;
alter table public.perfiles add constraint permisos_objeto check (jsonb_typeof(permisos) = 'object');
create or replace function public.tiene_permiso(clave text)
returns boolean language sql stable security definer set search_path = public
as $$
 select coalesce((select
   case when clave <> all(array['proxima_reserva','ingresos_mes','comision_host','liquidacion_host','reservas','reservas_exportar','calendario','plan_compras','cotizaciones','finanzas_propietario','solicitudes','operacion','contabilidad','conciliacion','analisis_financiero','cuentas_pagar','descuentos','usuarios']) then false
        when clave = 'usuarios' and p.rol <> 'administrador' then false
        when jsonb_typeof(p.permisos -> clave) = 'boolean' then (p.permisos ->> clave)::boolean
        when p.rol = 'administrador' then true
        when p.rol = 'dueño' then clave <> 'usuarios'
        when p.rol = 'host' then clave = any(array['proxima_reserva','ingresos_mes','comision_host','liquidacion_host','reservas','reservas_exportar','calendario','plan_compras','cotizaciones'])
        when p.rol = 'empleado' then clave = any(array['proxima_reserva','reservas','calendario','operacion','cotizaciones'])
        else false end
   from public.perfiles p where p.id = auth.uid()), false);
$$;
-- Evita que se modifiquen roles/permisos saltándose las validaciones de la API.
drop policy if exists admin_gestiona_perfiles on public.perfiles;
drop policy if exists admin_ve_todos_los_perfiles on public.perfiles;
create policy usuarios_lee_perfiles on public.perfiles for select to authenticated using (public.tiene_permiso('usuarios'));
drop policy if exists "intranet_lee_reservas" on public.reservas;
create policy "intranet_lee_reservas" on public.reservas for select to authenticated using (public.tiene_permiso('contabilidad'));
drop policy if exists "gestor_escribe_reservas" on public.reservas;
create policy "gestor_escribe_reservas" on public.reservas for insert to authenticated with check (public.tiene_permiso('contabilidad'));
drop policy if exists "gestor_actualiza_reservas" on public.reservas;
create policy "gestor_actualiza_reservas" on public.reservas for update to authenticated using (public.tiene_permiso('contabilidad')) with check (public.tiene_permiso('contabilidad'));
drop policy if exists "intranet_lee_solicitudes" on public.solicitudes;
create policy "intranet_lee_solicitudes" on public.solicitudes for select to authenticated using (public.tiene_permiso('solicitudes'));
drop policy if exists "gestor_actualiza_solicitudes" on public.solicitudes;
create policy "gestor_actualiza_solicitudes" on public.solicitudes for update to authenticated using (public.tiene_permiso('solicitudes')) with check (public.tiene_permiso('solicitudes'));
drop policy if exists "intranet_lee_tareas" on public.tareas_operacion;
create policy "intranet_lee_tareas" on public.tareas_operacion for select to authenticated using (public.tiene_permiso('operacion'));
drop policy if exists "intranet_actualiza_tareas" on public.tareas_operacion;
create policy "intranet_actualiza_tareas" on public.tareas_operacion for update to authenticated using (public.tiene_permiso('operacion')) with check (public.tiene_permiso('operacion'));
drop policy if exists "gestor_crea_tareas" on public.tareas_operacion;
create policy "gestor_crea_tareas" on public.tareas_operacion for insert to authenticated with check (public.tiene_permiso('operacion'));
drop policy if exists "gestor_gestiona_gastos" on public.gastos;
create policy "gestor_gestiona_gastos" on public.gastos for all to authenticated using (public.tiene_permiso('contabilidad')) with check (public.tiene_permiso('contabilidad'));
drop policy if exists "gestor_gestiona_anticipos" on public.anticipos_comision;
create policy "gestor_gestiona_anticipos" on public.anticipos_comision for all to authenticated using (public.tiene_permiso('contabilidad')) with check (public.tiene_permiso('contabilidad'));
drop policy if exists "gestor_gestiona_movimientos" on public.movimientos_bancarios;
create policy "gestor_gestiona_movimientos" on public.movimientos_bancarios for all to authenticated using (public.tiene_permiso('conciliacion')) with check (public.tiene_permiso('conciliacion'));
drop policy if exists "gestor_gestiona_plan_compras" on public.plan_compras;
create policy "gestor_gestiona_plan_compras" on public.plan_compras for all to authenticated using (public.tiene_permiso('plan_compras')) with check (public.tiene_permiso('plan_compras'));
drop policy if exists "gestor_ve_todos_los_codigos" on public.codigos_descuento;
create policy "gestor_ve_todos_los_codigos" on public.codigos_descuento for select to authenticated using (public.tiene_permiso('descuentos'));
drop policy if exists "gestor_gestiona_codigos" on public.codigos_descuento;
create policy "gestor_gestiona_codigos" on public.codigos_descuento for all to authenticated using (public.tiene_permiso('descuentos')) with check (public.tiene_permiso('descuentos'));
drop policy if exists "intranet_lee_pedidos" on public.pedidos_tienda;
create policy "intranet_lee_pedidos" on public.pedidos_tienda for select to authenticated using (public.tiene_permiso('contabilidad'));
drop policy if exists "intranet_lee_items_pedido" on public.pedidos_tienda_items;
create policy "intranet_lee_items_pedido" on public.pedidos_tienda_items for select to authenticated using (public.tiene_permiso('contabilidad'));
drop policy if exists "gestor_gestiona_catalogo" on public.productos_tienda;
create policy "gestor_gestiona_catalogo" on public.productos_tienda for all to authenticated using (public.tiene_permiso('contabilidad')) with check (public.tiene_permiso('contabilidad'));
create policy cuentas_lee_plan on public.plan_compras for select to authenticated using (public.tiene_permiso('cuentas_pagar'));
drop policy if exists publico_valida_codigo on public.codigos_descuento;
drop policy if exists intranet_sube_cotizaciones on storage.objects;
create policy intranet_sube_cotizaciones on storage.objects for insert to authenticated with check (bucket_id = 'cotizaciones' and public.tiene_permiso('cotizaciones'));
drop policy if exists intranet_lee_cotizaciones on storage.objects;
create policy intranet_lee_cotizaciones on storage.objects for select to authenticated using (bucket_id = 'cotizaciones' and public.tiene_permiso('cotizaciones'));
drop policy if exists intranet_borra_cotizaciones on storage.objects;
create policy intranet_borra_cotizaciones on storage.objects for delete to authenticated using (bucket_id = 'cotizaciones' and public.tiene_permiso('cotizaciones'));
drop policy if exists intranet_actualiza_cotizaciones on storage.objects;
create policy intranet_actualiza_cotizaciones on storage.objects for update to authenticated using (bucket_id = 'cotizaciones' and public.tiene_permiso('cotizaciones')) with check (bucket_id = 'cotizaciones' and public.tiene_permiso('cotizaciones'));
create or replace view public.reservas_acceso with (security_barrier = true) as
select r.id,
r.canal,
r.entrada,
r.salida,
r.noches,
r.estado,
r.created_at,
r.updated_at,
case when ((public.tiene_permiso('reservas') or public.tiene_permiso('reservas_exportar') or public.tiene_permiso('operacion') or public.tiene_permiso('contabilidad')) or (public.tiene_permiso('proxima_reserva') and r.id = (select n.id from public.reservas n where n.estado in ('confirmada','completada') and n.entrada >= current_date order by n.entrada, n.id limit 1)) or (public.tiene_permiso('liquidacion_host') and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date))) then r.huesped_nombre else null end as huesped_nombre,
case when ((public.tiene_permiso('reservas') or public.tiene_permiso('reservas_exportar') or public.tiene_permiso('operacion') or public.tiene_permiso('contabilidad')) or (public.tiene_permiso('proxima_reserva') and r.id = (select n.id from public.reservas n where n.estado in ('confirmada','completada') and n.entrada >= current_date order by n.entrada, n.id limit 1)) or (public.tiene_permiso('liquidacion_host') and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date))) then r.codigo_externo else null end as codigo_externo,
case when public.tiene_permiso('contabilidad') then r.huesped_email else null end as huesped_email,
case when public.tiene_permiso('contabilidad') then r.notas else null end as notas,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) then r.huesped_pais else null end as huesped_pais,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) then r.huesped_ciudad else null end as huesped_ciudad,
case when ((public.tiene_permiso('reservas') or public.tiene_permiso('reservas_exportar') or public.tiene_permiso('operacion') or public.tiene_permiso('contabilidad')) or (public.tiene_permiso('proxima_reserva') and r.id = (select n.id from public.reservas n where n.estado in ('confirmada','completada') and n.entrada >= current_date order by n.entrada, n.id limit 1)) or (public.tiene_permiso('liquidacion_host') and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date))) then r.huespedes else null end as huespedes,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) then r.tarifa_noche else null end as tarifa_noche,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) or (public.tiene_permiso('liquidacion_host') and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date)) then r.bruto else null end as bruto,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) or (public.tiene_permiso('liquidacion_host') and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date)) then r.comision_plataforma else null end as comision_plataforma,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) or ((public.tiene_permiso('liquidacion_host') or public.tiene_permiso('ingresos_mes')) and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date)) then r.recibido else null end as recibido,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) or ((public.tiene_permiso('liquidacion_host') or public.tiene_permiso('comision_host')) and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date)) then r.comision_marquelda else null end as comision_marquelda,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) then r.comision_ivan else null end as comision_ivan,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) then r.neto else null end as neto
from public.reservas r
where auth.uid() is not null and ((public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) or (public.tiene_permiso('reservas') or public.tiene_permiso('reservas_exportar') or public.tiene_permiso('operacion') or public.tiene_permiso('contabilidad')) or (public.tiene_permiso('proxima_reserva') and r.id = (select n.id from public.reservas n where n.estado in ('confirmada','completada') and n.entrada >= current_date order by n.entrada, n.id limit 1)) or ((public.tiene_permiso('liquidacion_host') or public.tiene_permiso('ingresos_mes') or public.tiene_permiso('comision_host')) and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date)));
revoke all on public.reservas_acceso from anon, authenticated;
grant select on public.reservas_acceso to authenticated;
create policy finanzas_lee_gastos on public.gastos for select to authenticated using (public.tiene_permiso('finanzas_propietario'));
alter function public.crear_tareas_operacion() security definer;
alter function public.crear_tareas_operacion() set search_path = public;
notify pgrst, 'reload schema';
commit;
