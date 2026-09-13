-- Código corto que identifica cada reserva para desbloquear compras en la
-- tienda (apps/web /tienda) — decisión de Ivan 2026-09-13: "solo se puede
-- comprar con el número de reserva que se debe generar cada vez que
-- alguien reserve". `pedidos_tienda.reserva_id` ya exigía una reserva real
-- desde 0004_tienda_y_planificacion.sql ("no hay compras sin reserva
-- confirmada"); lo que faltaba era un código corto y typeable para que el
-- huésped lo escriba — `reservas.id` es un UUID de 36 caracteres, inviable
-- para escribir a mano.
--
-- Un trigger genera el código solo (6 caracteres hexadecimales en
-- mayúscula, sin colisión) en cada INSERT nuevo, sin depender de que cada
-- lugar que crea una reserva (importador CSV, alta manual futura, etc.) se
-- acuerde de generarlo — igual al patrón ya usado para
-- tareas_operacion en 0007_tareas_operacion_trigger.sql. Backfill para las
-- reservas reales ya existentes.
alter table public.reservas add column codigo_tienda text;

create or replace function public.generar_codigo_tienda()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidato text;
  intentos int := 0;
begin
  if new.codigo_tienda is not null then
    return new;
  end if;
  loop
    candidato := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.reservas where codigo_tienda = candidato);
    intentos := intentos + 1;
    if intentos > 20 then
      raise exception 'No se pudo generar un código de tienda único después de % intentos', intentos;
    end if;
  end loop;
  new.codigo_tienda := candidato;
  return new;
end;
$$;

create trigger reservas_genera_codigo_tienda
  before insert on public.reservas
  for each row execute function public.generar_codigo_tienda();

-- Backfill: mismo algoritmo, para las reservas reales que ya existían
-- antes de este trigger.
do $$
declare
  r record;
  candidato text;
  intentos int;
begin
  for r in select id from public.reservas where codigo_tienda is null loop
    intentos := 0;
    loop
      candidato := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      exit when not exists (select 1 from public.reservas where codigo_tienda = candidato);
      intentos := intentos + 1;
      if intentos > 20 then
        raise exception 'No se pudo generar un código de tienda único (backfill) después de % intentos', intentos;
      end if;
    end loop;
    update public.reservas set codigo_tienda = candidato where id = r.id;
  end loop;
end $$;

alter table public.reservas alter column codigo_tienda set not null;
create unique index reservas_codigo_tienda_unico on public.reservas (codigo_tienda);

notify pgrst, 'reload schema';
