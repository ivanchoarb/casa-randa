-- Genera las 3 tareas de operación (preparación, turnover, limpieza de
-- salida) automáticamente cuando una reserva pasa a confirmada/completada,
-- en vez de depender de que la aplicación se acuerde de crearlas.
--
-- Escrito el 2026-09-11 pero NO aplicado todavía a la base real: esta
-- sesión solo tiene la REST API (vía service_role), no una conexión
-- Postgres directa, y crear un trigger requiere DDL que la REST API no
-- expone. Mientras tanto, apps/intranet/src/lib/tareas-operacion.ts hace
-- lo mismo desde la aplicación (en el import de CSV y en un backfill de
-- una sola vez) — este archivo es la versión correcta para cuando alguien
-- con acceso a `psql` o al SQL Editor de Supabase lo pueda aplicar. Una
-- vez aplicado, el código de app puede quedar (es idempotente, no duplica
-- filas) o simplificarse a solo el backfill.
--
-- El mapeo de fechas (preparación = día antes de entrada, turnover = día
-- de entrada, limpieza de salida = día de salida) es una interpretación
-- razonable del flujo real de un turnover de alquiler vacacional — no una
-- réplica verificada del código PHP de WordPress, que no está disponible.

create unique index if not exists tareas_operacion_reserva_tipo_unico
  on public.tareas_operacion (reserva_id, tipo);

create function public.crear_tareas_operacion()
returns trigger
language plpgsql
as $$
begin
  if new.estado in ('confirmada', 'completada')
     and (tg_op = 'INSERT' or old.estado not in ('confirmada', 'completada')) then
    insert into public.tareas_operacion (reserva_id, tipo, fecha)
    values
      (new.id, 'preparacion', new.entrada - interval '1 day'),
      (new.id, 'turnover', new.entrada),
      (new.id, 'limpieza_salida', new.salida)
    on conflict (reserva_id, tipo) do nothing;
  end if;
  return new;
end;
$$;

create trigger reservas_crear_tareas_operacion
  after insert or update of estado on public.reservas
  for each row execute function public.crear_tareas_operacion();
