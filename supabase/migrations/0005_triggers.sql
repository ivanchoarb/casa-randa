-- Mantiene updated_at al día en las tablas que lo tienen.

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reservas_set_updated_at
  before update on public.reservas
  for each row execute function public.set_updated_at();

create trigger tarifas_diarias_set_updated_at
  before update on public.tarifas_diarias
  for each row execute function public.set_updated_at();
