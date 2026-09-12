-- Ivan: "primer nombre y apellido", "el arrival y el departure" (en
-- contactos_marketing, que hoy no los tiene), y país ya existe en ambas
-- tablas pero el formulario público nunca lo pedía — se corrige aparte en
-- QuoteCalculator.tsx. Todo nullable: filas ya existentes (formulario viejo
-- de una sola casilla "Nombre", importaciones sin esas columnas) no tienen
-- de dónde sacar el dato, y no se inventa retroactivamente.
begin;

alter table public.solicitudes add column if not exists apellido text;

alter table public.contactos_marketing add column if not exists apellido text;
alter table public.contactos_marketing add column if not exists entrada date;
alter table public.contactos_marketing add column if not exists salida date;

notify pgrst, 'reload schema';
commit;
