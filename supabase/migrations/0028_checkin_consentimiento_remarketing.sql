-- Iván: al terminar /check-in debe pedirse un consentimiento explícito
-- para usar los datos del huésped en remarketing, aparte de los
-- términos y condiciones generales — mismo criterio que ya usa esta
-- base (solicitudes.consentimiento vs. consentimiento_politica: dos
-- casillas separadas, no una sola que las mezcle) en vez de asumir que
-- aceptar los términos ya cubre el uso en marketing.
alter table public.checkins_huesped
  add column acepta_remarketing boolean not null default false;

notify pgrst, 'reload schema';
