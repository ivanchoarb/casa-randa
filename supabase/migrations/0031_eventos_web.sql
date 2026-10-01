-- Métricas de la web pública: visitas y clicks al código de descuento, para
-- medir las campañas. Los eventos los escribe apps/web (service role, vía
-- /api/eventos) — nadie con la anon key puede insertar ni leer. La intranet
-- los lee con el permiso `marketing`.
begin;

create table public.eventos_web (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('visita', 'click_codigo', 'codigo_aplicado', 'click_cta')),
  ruta text not null,
  visitante_id text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  idioma text,
  dispositivo text
);
create index eventos_web_created_at on public.eventos_web (created_at desc);
create index eventos_web_tipo_created_at on public.eventos_web (tipo, created_at desc);

alter table public.eventos_web enable row level security;
create policy "marketing_lee_eventos_web" on public.eventos_web
  for select to authenticated using (public.tiene_permiso('marketing'));

-- Resumen ya agregado para la página /metricas. security invoker: corre con
-- los permisos de quien llama, así que sin el permiso `marketing` todo da 0.
create or replace function public.resumen_metricas_web(p_dias integer default 30)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with ev as (
    select *,
      (created_at at time zone 'America/Panama')::date as dia,
      case
        when utm_campaign is not null then 'Campaña: ' || utm_campaign
        when referrer is not null then substring(referrer from '^https?://([^/]+)')
        else 'Directo'
      end as origen
    from public.eventos_web
    where created_at >= now() - make_interval(days => greatest(p_dias, 1))
  )
  select jsonb_build_object(
    'totales', jsonb_build_object(
      'visitas', (select count(*) from ev where tipo = 'visita'),
      'visitantes', (select count(distinct visitante_id) from ev where tipo = 'visita'),
      'visitas_regreso', (select count(*) from ev where tipo = 'visita' and ruta = '/regreso'),
      'clicks_codigo', (select count(*) from ev where tipo = 'click_codigo'),
      'codigos_aplicados', (select count(*) from ev where tipo = 'codigo_aplicado'),
      'clicks_cta', (select count(*) from ev where tipo = 'click_cta'),
      'solicitudes_con_codigo', (
        select count(*) from public.solicitudes
        where codigo_descuento is not null and created_at >= now() - make_interval(days => greatest(p_dias, 1))
      )
    ),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', dia, 'visitas', visitas, 'clicks_codigo', clicks) order by dia)
      from (
        select dia, count(*) filter (where tipo = 'visita') as visitas, count(*) filter (where tipo = 'click_codigo') as clicks
        from ev group by dia
      ) d
    ), '[]'::jsonb),
    'por_pagina', coalesce((
      select jsonb_agg(jsonb_build_object('ruta', ruta, 'visitas', n) order by n desc)
      from (select ruta, count(*) as n from ev where tipo = 'visita' group by ruta order by n desc limit 10) p
    ), '[]'::jsonb),
    'por_origen', coalesce((
      select jsonb_agg(jsonb_build_object('origen', origen, 'visitas', visitas, 'clicks_codigo', clicks) order by visitas desc)
      from (
        select origen, count(*) filter (where tipo = 'visita') as visitas, count(*) filter (where tipo = 'click_codigo') as clicks
        from ev group by origen order by 2 desc limit 10
      ) o
    ), '[]'::jsonb)
  );
$$;
revoke execute on function public.resumen_metricas_web(integer) from anon, authenticated, public;
grant execute on function public.resumen_metricas_web(integer) to authenticated;

notify pgrst, 'reload schema';
commit;
