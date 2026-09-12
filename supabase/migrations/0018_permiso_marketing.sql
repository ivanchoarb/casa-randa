-- Nuevo permiso "marketing" para la sección de clientes potenciales
-- (solicitudes con consentimiento de marketing). Solo administrador/dueño lo
-- tienen por defecto (ver HOST_PERMISOS/permisoPorRol en permisos.ts) — datos
-- de contacto de terceros, no se amplía a Host/Empleado sin pedirlo.
begin;

create or replace function public.tiene_permiso(clave text)
returns boolean language sql stable security definer set search_path = public
as $$
 select coalesce((select
   case when clave <> all(array['proxima_reserva','ingresos_mes','comision_host','liquidacion_host','reservas','reservas_exportar','calendario','plan_compras','cotizaciones','finanzas_propietario','solicitudes','operacion','contabilidad','conciliacion','analisis_financiero','cuentas_pagar','descuentos','marketing','usuarios']) then false
        when clave = 'usuarios' and p.rol <> 'administrador' then false
        when jsonb_typeof(p.permisos -> clave) = 'boolean' then (p.permisos ->> clave)::boolean
        when p.rol = 'administrador' then true
        when p.rol = 'dueño' then clave <> 'usuarios'
        when p.rol = 'host' then clave = any(array['proxima_reserva','ingresos_mes','comision_host','liquidacion_host','reservas','reservas_exportar','calendario','plan_compras','cotizaciones'])
        when p.rol = 'empleado' then clave = any(array['proxima_reserva','reservas','calendario','operacion','cotizaciones'])
        else false end
   from public.perfiles p where p.id = auth.uid()), false);
$$;

-- La misma tabla que ya usa Reservas para revisar solicitudes, pero
-- Marketing no necesita el permiso de aprobar/rechazar para poder leerla.
drop policy if exists "intranet_lee_solicitudes" on public.solicitudes;
create policy "intranet_lee_solicitudes" on public.solicitudes for select to authenticated
  using (public.tiene_permiso('solicitudes') or public.tiene_permiso('marketing'));

notify pgrst, 'reload schema';
commit;
