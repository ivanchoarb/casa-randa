-- Cotizaciones (apps/intranet) podía generar una cotización para fechas ya
-- ocupadas por una reserva confirmada/completada: la página solo consultaba
-- bloqueos_calendario, que trae Airbnb/Vrbo vía iCal pero nunca se llena con
-- reservas directas/CSV (nada las inserta ahí, ver 0002_reservas.sql).
-- reservas_acceso tampoco sirve para esto: sus filas dependen de permisos
-- financieros que alguien con solo el permiso "cotizaciones" (p. ej. un Host)
-- no tiene, así que devolvería 0 filas para ese usuario.
--
-- Disponibilidad ya es pública por diseño en este proyecto (ver el comentario
-- de publico_lee_bloqueos en 0006_rls.sql — es lo mismo que ya viaja en los
-- feeds iCal de salida). Esta vista aplica el mismo criterio: solo
-- entrada/salida de reservas confirmada/completada, ninguna columna
-- financiera ni de huésped. Igual que reservas_acceso, la vista es propiedad
-- de un rol que no está sujeto al RLS de reservas (ver comentario de esa
-- vista en 0016), así que el filtro por estado de abajo es el único control
-- de fila real.
create or replace view public.reservas_fechas_ocupadas as
select entrada, salida
from public.reservas
where estado in ('confirmada', 'completada');

revoke all on public.reservas_fechas_ocupadas from anon, authenticated;
grant select on public.reservas_fechas_ocupadas to authenticated;

notify pgrst, 'reload schema';
