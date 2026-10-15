-- Crédito de autor de las fotos de un lugar de la guía (licencias CC exigen
-- atribución). Texto libre, una línea; vacío = no se muestra.
alter table public.lugares_guia
  add column if not exists creditos_foto text not null default '';
