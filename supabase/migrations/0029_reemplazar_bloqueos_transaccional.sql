-- Hallazgo de auditoría (Codex, docs/auditoria-2026-09-14.md, punto 2):
-- apps/intranet/src/app/api/sync/ical/route.ts hacía el reemplazo de
-- bloqueos de un canal como dos llamadas REST separadas (DELETE, luego
-- INSERT). Si el INSERT fallaba después de que el DELETE ya se aplicó
-- (una fecha mal formada, un timeout, lo que sea), los bloqueos previos
-- de ese canal quedaban borrados de verdad y nunca se restauraban — el
-- catch de la ruta solo informa el error, no revierte nada. Esta función
-- hace las dos operaciones dentro de una sola transacción de Postgres:
-- si el INSERT falla, todo el cuerpo de la función se revierte, DELETE
-- incluido, y el canal queda exactamente como estaba antes de llamarla.
create or replace function public.reemplazar_bloqueos_canal(p_fuente public.fuente_bloqueo, p_bloqueos jsonb)
returns void
language plpgsql
as $$
begin
  delete from public.bloqueos_calendario where fuente = p_fuente;

  insert into public.bloqueos_calendario (inicio, fin, fuente)
  select (b->>'inicio')::date, (b->>'fin')::date, p_fuente
  from jsonb_array_elements(p_bloqueos) as b;
end;
$$;

-- Nadie más que el rol de servicio (el job de sincronización) debe poder
-- reescribir el calendario completo de un canal. `revoke ... from public`
-- no alcanza en este proyecto: comprobado contra la base real que Supabase
-- ya tenía default privileges que le dan EXECUTE directo a `anon` y
-- `authenticated` sobre toda función nueva (para que PostgREST la exponga
-- como RPC sin configuración manual) — un grant directo a un rol no se
-- revoca revocando de PUBLIC, hay que nombrar cada rol.
revoke execute on function public.reemplazar_bloqueos_canal(public.fuente_bloqueo, jsonb) from anon, authenticated, public;

notify pgrst, 'reload schema';
