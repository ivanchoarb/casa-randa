-- Hallazgo de Codex (docs/coordinacion-agentes.md, punto 4, 2026-09-12):
-- el trigger de 0007/0009 solo se disparaba en `update of estado`, y usaba
-- `on conflict (reserva_id, tipo) do nothing` — así que si se editaban
-- entrada/salida de una reserva YA confirmada (corrección de fechas, por
-- ejemplo), las 3 tareas ya creadas se quedaban con la fecha vieja para
-- siempre, sin ninguna forma de resincronizarlas.
--
-- Corrige ambas partes: el trigger ahora también se dispara cuando
-- cambian entrada/salida, y el insert pasa a "on conflict ... do update"
-- para que una tarea ya existente actualice su fecha en vez de ignorarse.
create or replace function public.crear_tareas_operacion()
returns trigger
language plpgsql
as $$
begin
  if new.estado in ('confirmada', 'completada') then
    insert into public.tareas_operacion (reserva_id, tipo, fecha)
    values
      (new.id, 'preparacion', new.entrada),
      (new.id, 'turnover', new.salida),
      (new.id, 'limpieza_salida', new.salida)
    on conflict (reserva_id, tipo) do update set fecha = excluded.fecha;
  end if;
  return new;
end;
$$;

drop trigger reservas_crear_tareas_operacion on public.reservas;

create trigger reservas_crear_tareas_operacion
  after insert or update of estado, entrada, salida on public.reservas
  for each row execute function public.crear_tareas_operacion();
