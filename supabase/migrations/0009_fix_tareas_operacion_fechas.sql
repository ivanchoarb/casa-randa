-- 0007's trigger used a guessed date mapping (preparación = entrada−1,
-- turnover = entrada) before the real one was verified by clicking through
-- staging's Operación page task by task. The real mapping is: Preparar
-- llegada = día de entrada, Check-out = día de salida, Limpieza = día de
-- salida (Check-out y Limpieza caen el mismo día, no uno después del otro).

create or replace function public.crear_tareas_operacion()
returns trigger
language plpgsql
as $$
begin
  if new.estado in ('confirmada', 'completada')
     and (tg_op = 'INSERT' or old.estado not in ('confirmada', 'completada')) then
    insert into public.tareas_operacion (reserva_id, tipo, fecha)
    values
      (new.id, 'preparacion', new.entrada),
      (new.id, 'turnover', new.salida),
      (new.id, 'limpieza_salida', new.salida)
    on conflict (reserva_id, tipo) do nothing;
  end if;
  return new;
end;
$$;

-- Corrige las 174 tareas del backfill (2026-09-11), creadas con la fecha
-- vieja antes de esta verificación.
update public.tareas_operacion t
set fecha = case t.tipo
  when 'preparacion' then r.entrada
  when 'turnover' then r.salida
  when 'limpieza_salida' then r.salida
end
from public.reservas r
where t.reserva_id = r.id;
