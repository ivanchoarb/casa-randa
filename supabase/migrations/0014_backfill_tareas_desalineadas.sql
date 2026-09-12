-- Hallazgo de la auditoría de Codex (docs/auditoria-2026-09-12.md): 0013
-- corrige el trigger hacia adelante, pero no repara filas ya desalineadas
-- de antes. Verificado por consulta directa el 2026-09-12: 12 tareas de
-- las reservas "Ambar Sanchez" (uso de día, sin pernoctar — corregidas en
-- 0010_permitir_reservas_sin_pernoctar.sql) quedaron con la fecha vieja,
-- porque esa corrección de entrada/salida pasó antes de que existiera el
-- trigger de resincronización. Mismo mapeo que 0009 (preparación=entrada,
-- turnover/limpieza_salida=salida).
update public.tareas_operacion t
set fecha = case t.tipo
  when 'preparacion' then r.entrada
  when 'turnover' then r.salida
  when 'limpieza_salida' then r.salida
end
from public.reservas r
where t.reserva_id = r.id
  and (
    (t.tipo = 'preparacion' and t.fecha <> r.entrada)
    or (t.tipo in ('turnover', 'limpieza_salida') and t.fecha <> r.salida)
  );
