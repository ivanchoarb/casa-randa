-- Para que `[APELLIDO]` funcione en la personalización de campañas
-- (mailer.ts), igual que `[NOMBRE]` — el snapshot de audiencia
-- (campanas/page.tsx) ahora también copia el apellido de la fuente.
begin;

alter table public.campana_destinatarios add column if not exists apellido text;

notify pgrst, 'reload schema';
commit;
