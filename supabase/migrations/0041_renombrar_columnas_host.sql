ALTER TABLE public.reservas
  ADD COLUMN comision_host1 numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN comision_host2 numeric(10,2) NOT NULL DEFAULT 0;

UPDATE public.reservas
  SET comision_host1 = comision_marquelda,
      comision_host2 = comision_ivan;

-- La vista reservas_acceso depende de neto, comision_marquelda y comision_ivan;
-- hay que droparla antes de cualquier DROP COLUMN y recrearla al final.
DROP VIEW IF EXISTS public.reservas_acceso;

ALTER TABLE public.reservas DROP COLUMN neto;
ALTER TABLE public.reservas
  ADD COLUMN neto numeric(10,2) GENERATED ALWAYS AS
    (bruto - comision_plataforma - comision_host1 - comision_host2) STORED;

ALTER TABLE public.reservas
  DROP COLUMN comision_marquelda,
  DROP COLUMN comision_ivan;

-- Recrear la vista con las columnas renombradas (fuente: 0016_permisos_por_usuario.sql)
CREATE OR REPLACE VIEW public.reservas_acceso WITH (security_barrier = true) AS
SELECT r.id,
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
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) or ((public.tiene_permiso('liquidacion_host') or public.tiene_permiso('comision_host')) and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date)) then r.comision_host1 else null end as comision_host1,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) then r.comision_host2 else null end as comision_host2,
case when (public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) then r.neto else null end as neto
FROM public.reservas r
WHERE auth.uid() is not null and ((public.tiene_permiso('contabilidad') or public.tiene_permiso('finanzas_propietario') or public.tiene_permiso('analisis_financiero')) or (public.tiene_permiso('reservas') or public.tiene_permiso('reservas_exportar') or public.tiene_permiso('operacion') or public.tiene_permiso('contabilidad')) or (public.tiene_permiso('proxima_reserva') and r.id = (select n.id from public.reservas n where n.estado in ('confirmada','completada') and n.entrada >= current_date order by n.entrada, n.id limit 1)) or ((public.tiene_permiso('liquidacion_host') or public.tiene_permiso('ingresos_mes') or public.tiene_permiso('comision_host')) and (r.entrada >= date_trunc('month', current_date)::date and r.entrada < (date_trunc('month', current_date) + interval '1 month')::date)));
REVOKE ALL ON public.reservas_acceso FROM anon, authenticated;
GRANT SELECT ON public.reservas_acceso TO authenticated;
NOTIFY pgrst, 'reload schema';

ALTER TYPE public.persona_comision RENAME VALUE 'marquelda' TO 'host1';
ALTER TYPE public.persona_comision RENAME VALUE 'ivan' TO 'host2';

UPDATE public.configuracion_cliente
  SET clave = 'comision_host1_tasa'
  WHERE clave = 'comision_marquelda_tasa';

UPDATE public.configuracion_cliente
  SET clave = 'comision_host2_tasa'
  WHERE clave = 'comision_ivan_tasa';

UPDATE public.configuracion_cliente
  SET valor = 'host2'
  WHERE clave = 'persona_anticipos_comision' AND valor = 'ivan';

UPDATE public.configuracion_cliente
  SET valor = 'host1'
  WHERE clave = 'persona_anticipos_comision' AND valor = 'marquelda';
