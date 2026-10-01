-- Lanzamiento para huéspedes anteriores: (1) el código COMINGBACKRANDA5%
-- existe de verdad y se puede canjear en la cotización de la web, (2) las
-- campañas de correo pueden dirigirse a una sola audiencia por idioma.
begin;

insert into public.codigos_descuento (codigo, descuento_pct, vigente_desde, vigente_hasta, notas)
values ('COMINGBACKRANDA5%', 5, '2026-09-30', '2027-09-30', 'Lanzamiento de la web para huéspedes anteriores (campaña de correo + /regreso).')
on conflict (codigo) do nothing;

-- Se guarda el porcentaje aplicado en la solicitud (no solo el código) para
-- que la intranet recalcule el total sin necesitar leer codigos_descuento,
-- que exige el permiso `descuentos`.
alter table public.solicitudes add column descuento_pct numeric(5, 2);

-- null = toda la audiencia con consentimiento.
alter table public.campanas_marketing
  add column idioma text check (idioma in ('es', 'en'));

notify pgrst, 'reload schema';
commit;
