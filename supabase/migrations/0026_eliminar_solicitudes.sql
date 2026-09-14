-- `solicitudes` tenía policy de update ("gestor_actualiza_solicitudes",
-- 0006_rls.sql) pero ninguna de delete — con RLS habilitado eso bloquea
-- el delete para todo el mundo salvo el rol de servicio. Hallazgo de la
-- auditoría manual de Iván (2026-09-14): "debería poder modificar y
-- eliminar reservas hechas por la página web" — la intranet ya ganó el
-- botón "Eliminar" en Reservas (apps/intranet), pero sin esta policy
-- fallaría con un error de RLS. Mismo criterio que el update: solo
-- administrador/dueño.
create policy "gestor_elimina_solicitudes" on public.solicitudes
  for delete using (public.es_gestor());

notify pgrst, 'reload schema';
