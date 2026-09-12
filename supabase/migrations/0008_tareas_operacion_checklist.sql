-- Amplía tareas_operacion para calzar con el módulo real de Operación en
-- staging.randahome.com/intranet/operacion/ (comparado en vivo, click a
-- click, el 2026-09-11): cada tarea tiene un estado "en proceso" que no
-- existe todavía, alguien asignado como responsable, y un checklist propio
-- según el tipo de tarea (distinto en Preparar llegada / Check-out /
-- Limpieza). "Pago registrado" no necesita columna nueva — ya se lee de
-- reservas.recibido vía el join que usa la página.
--
-- Mismo problema que 0007_tareas_operacion_trigger.sql: escrito pero NO
-- aplicado. Esta sesión solo tiene la REST API (vía service_role), no una
-- conexión Postgres directa, y esto es DDL puro.

alter type public.estado_tarea_operacion add value if not exists 'en_proceso' after 'pendiente';

-- Texto libre, no FK a perfiles: quien limpia (p. ej. "Dayra", visto en
-- staging) no necesariamente tiene ni necesita una cuenta de acceso a la
-- intranet — perfiles está atado a auth.users (supabase/migrations/0001),
-- así que forzar el vínculo exigiría crearle un login a cada persona de
-- limpieza solo para poder asignarle una tarea. Si más adelante Ivan
-- quiere reportes por responsable con más estructura, esto se puede
-- migrar a una tabla `personal_operativo` propia.
alter table public.tareas_operacion add column if not exists responsable text;

-- jsonb en vez de una columna por ítem: el checklist real tiene 4 ítems en
-- Preparar llegada, 4 en Check-out y 6 en Limpieza, todos con texto
-- distinto — una columna por ítem forzaría columnas que no aplican a la
-- mayoría de las filas. La app define qué claves usar según `tipo`.
alter table public.tareas_operacion add column if not exists checklist jsonb not null default '{}'::jsonb;
