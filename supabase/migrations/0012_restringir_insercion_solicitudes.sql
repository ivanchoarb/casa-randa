-- Hallazgo de Codex (docs/coordinacion-agentes.md, punto 2, 2026-09-12):
-- "publico_crea_solicitud" (0006_rls.sql) usaba `with check (true)` — con
-- la anon key, cualquiera podía insertar en `solicitudes` con CUALQUIER
-- valor en cualquier columna, no solo lo que manda el formulario público
-- (QuoteCalculator en apps/web). En concreto: nada impedía mandar
-- `estado: 'aprobada'` (saltarse la revisión del administrador) o un
-- `reserva_id` inventado (aparentar que ya está ligada a una reserva
-- real). El insert real del sitio (apps/web/src/lib/supabase-client.ts)
-- nunca manda esos dos campos — deja que la base use sus defaults
-- ('pendiente' y null) — así que restringir la policy a exigir
-- exactamente eso no le quita nada al formulario legítimo.
drop policy "publico_crea_solicitud" on public.solicitudes;

create policy "publico_crea_solicitud" on public.solicitudes
  for insert
  with check (estado = 'pendiente' and reserva_id is null);
