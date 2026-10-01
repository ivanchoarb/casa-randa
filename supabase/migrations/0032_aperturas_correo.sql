-- Seguimiento de aperturas de las campañas de correo: cada correo lleva una
-- imagen invisible de 1x1 (apps/web /api/p?d=<destinatario>) que, al cargarse,
-- guarda un evento `apertura_correo`. Es una cifra orientativa: Gmail y Apple
-- Mail cargan las imágenes por adelantado y quien las bloquea no cuenta.
begin;

alter table public.eventos_web drop constraint eventos_web_tipo_check;
alter table public.eventos_web add constraint eventos_web_tipo_check
  check (tipo in ('visita', 'click_codigo', 'codigo_aplicado', 'click_cta', 'apertura_correo'));
alter table public.eventos_web
  add column destinatario_id uuid references public.campana_destinatarios (id) on delete set null;
create index eventos_web_destinatario on public.eventos_web (destinatario_id) where destinatario_id is not null;

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
      'aperturas_correo', (select count(distinct destinatario_id) from ev where tipo = 'apertura_correo'),
      'solicitudes_con_codigo', (
        select count(*) from public.solicitudes
        where codigo_descuento is not null and created_at >= now() - make_interval(days => greatest(p_dias, 1))
      )
    ),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', dia, 'visitas', visitas, 'clicks_codigo', clicks) order by dia)
      from (
        select dia, count(*) filter (where tipo = 'visita') as visitas, count(*) filter (where tipo = 'click_codigo') as clicks
        from ev where tipo <> 'apertura_correo' group by dia
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
        from ev where tipo in ('visita', 'click_codigo') group by origen order by 2 desc limit 10
      ) o
    ), '[]'::jsonb),
    -- Totales de cada campaña de correo (de siempre, no solo del período).
    'campanas', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'asunto', c.asunto, 'enviados', coalesce(s.enviados, 0),
                                           'abiertos', coalesce(a.abiertos, 0)) order by c.created_at desc)
      from (select * from public.campanas_marketing order by created_at desc limit 10) c
      left join (
        select campana_id, count(*) filter (where estado = 'enviado') as enviados
        from public.campana_destinatarios group by campana_id
      ) s on s.campana_id = c.id
      left join (
        select d.campana_id, count(distinct e.destinatario_id) as abiertos
        from public.eventos_web e join public.campana_destinatarios d on d.id = e.destinatario_id
        where e.tipo = 'apertura_correo' group by d.campana_id
      ) a on a.campana_id = c.id
    ), '[]'::jsonb)
  );
$$;
revoke execute on function public.resumen_metricas_web(integer) from anon, authenticated, public;
grant execute on function public.resumen_metricas_web(integer) to authenticated;

notify pgrst, 'reload schema';
commit;
