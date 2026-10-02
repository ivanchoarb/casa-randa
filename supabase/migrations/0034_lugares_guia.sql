-- Guía "Qué hacer en Panamá" administrable desde la intranet (Ivan,
-- 2026-10-02). Hasta ahora los lugares estaban fijos en
-- apps/web/src/app/que-hacer-en-panama/places.ts, así que agregar, editar
-- o quitar uno exigía tocar código y hacer deploy. Pasan a esta tabla; los
-- 5 lugares que ya existían se cargan abajo tal cual, generados desde ese
-- mismo archivo (no transcritos a mano).
begin;

create table public.lugares_guia (
  id uuid primary key default gen_random_uuid(),
  -- Parte de la URL pública (/que-hacer-en-panama/<slug>): solo minúsculas,
  -- números y guiones, y no se edita después de crear para no romper enlaces.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  categoria text not null
    check (categoria in ('ciudad', 'canal', 'playas', 'pueblos', 'gastronomia', 'nocturna')),
  nombre text not null,
  nivel_precio smallint not null default 2 check (nivel_precio between 1 and 3),
  imagenes text[] not null default '{}',
  resumen_es text not null default '',
  resumen_en text not null default '',
  por_que_es text not null default '',
  por_que_en text not null default '',
  distancia_es text not null default '',
  distancia_en text not null default '',
  como_llegar_es text not null default '',
  como_llegar_en text not null default '',
  horario_es text not null default '',
  horario_en text not null default '',
  precio_ref_es text not null default '',
  precio_ref_en text not null default '',
  sitio_oficial text,
  mapa_url text,
  telefono text,
  -- Orden de aparición en la guía: el de carga (created_at ascendente).
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lugares_guia enable row level security;

-- La guía es pública por diseño (se ve sin sesión en la web).
create policy "publico_lee_lugares_guia" on public.lugares_guia
  for select to anon, authenticated using (true);

-- Editar la guía lo hace quien tiene `marketing` (mismo permiso que ya usa
-- Métricas web, 0031): es contenido de cara al huésped, no un dato
-- financiero, y reutilizarlo evita tocar tiene_permiso(), que comparten
-- todas las políticas de la base.
create policy "marketing_gestiona_lugares_guia" on public.lugares_guia
  for all to authenticated
  using (public.tiene_permiso('marketing'))
  with check (public.tiene_permiso('marketing'));

-- Bucket público para las fotos de cada lugar (mismo patrón que
-- imagenes-tienda en 0025).
insert into storage.buckets (id, name, public, file_size_limit)
values ('imagenes-guia', 'imagenes-guia', true, 5242880)
on conflict (id) do nothing;

create policy intranet_sube_imagenes_guia on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagenes-guia' and public.tiene_permiso('marketing'));
create policy intranet_actualiza_imagenes_guia on storage.objects
  for update to authenticated
  using (bucket_id = 'imagenes-guia' and public.tiene_permiso('marketing'))
  with check (bucket_id = 'imagenes-guia' and public.tiene_permiso('marketing'));
create policy intranet_borra_imagenes_guia on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagenes-guia' and public.tiene_permiso('marketing'));

insert into public.lugares_guia
  (slug, categoria, nombre, nivel_precio, imagenes,
   resumen_es, resumen_en, por_que_es, por_que_en, distancia_es, distancia_en,
   como_llegar_es, como_llegar_en, horario_es, horario_en,
   precio_ref_es, precio_ref_en, sitio_oficial, mapa_url, telefono, created_at)
values
  ($g$centro-de-visitantes-de-miraflores$g$, $g$canal$g$, $g$Centro de Visitantes de Miraflores$g$, 2, array[]::text[],
   $g$Observe en primera fila cómo los barcos atraviesan las esclusas del Canal de Panamá y descubra la historia de una de las grandes obras de ingeniería del mundo.$g$, $g$Watch ships cross the Panama Canal locks from a front-row viewpoint and discover the story behind one of the world's great engineering achievements.$g$,
   $g$Miraflores es una visita esencial para entender Panamá. Sus terrazas permiten observar las esclusas en operación y el tránsito de grandes embarcaciones. La entrada incluye la película IMAX sobre la historia y el funcionamiento del Canal. Recomendamos reservar aproximadamente una hora y media y comprobar previamente el horario estimado de tránsito de barcos.$g$, $g$Miraflores is an essential stop for understanding Panama. Its terraces let you watch the locks in operation and large ships in transit. Admission includes the IMAX film on the Canal's history and operation. We recommend setting aside about an hour and a half and checking the estimated ship-transit schedule beforehand.$g$,
   $g$Aproximadamente 10–15 minutos desde Casa Randa, según el tráfico.$g$, $g$About 10–15 minutes from Casa Randa, depending on traffic.$g$,
   $g$La opción más cómoda es taxi o transporte por aplicación. Casa Randa también puede ayudar a coordinar el traslado.$g$, $g$The most convenient option is a taxi or ride-hailing app. Casa Randa can also help coordinate transport.$g$,
   $g$Todos los días. Boletería: 8:00 a. m.–5:00 p. m. Atención: 8:00 a. m.–6:00 p. m.$g$, $g$Every day. Ticket office: 8 a.m.–5 p.m. Open until 6 p.m.$g$,
   $g$Residentes: adultos USD 3.00; menores hasta 18 años gratis. No residentes: adultos USD 17.22; niños de 6 a 12 años USD 7.22; menores de 6 años gratis.$g$, $g$Residents: adults USD 3.00; under 18 free. Non-residents: adults USD 17.22; children 6–12 USD 7.22; under 6 free.$g$,
   $g$https://visitcanaldepanama.com/es/sitios-de-interes/centro-de-visitantes-de-miraflores/$g$, $g$https://maps.google.com/?q=Centro+de+Visitantes+de+Miraflores+Panama$g$, $g$+507 276-8431$g$, now() + interval '0 seconds'),
  ($g$multiplaza-panama$g$, $g$ciudad$g$, $g$Multiplaza Panamá$g$, 2, array[]::text[],
   $g$Compras, gastronomía y entretenimiento en un ambiente moderno, con marcas internacionales, propuestas premium y opciones para toda la familia.$g$, $g$Shopping, dining and entertainment in a modern setting with international brands, premium concepts and family-friendly options.$g$,
   $g$Multiplaza Panamá es una de las mejores opciones de la ciudad para quienes buscan marcas internacionales, moda, tecnología y una experiencia de compras más premium. Reúne más de 350 conceptos, una amplia oferta gastronómica, cine y entretenimiento. Luxury Avenue concentra varias firmas exclusivas, mientras que el resto del centro comercial ofrece alternativas para distintos presupuestos.$g$, $g$Multiplaza Panama is one of the city's best options for international brands, fashion, tech and a more premium shopping experience. It brings together more than 350 stores, a wide dining offer, a cinema and entertainment. Luxury Avenue gathers several exclusive names, while the rest of the mall offers options for different budgets.$g$,
   $g$Aproximadamente 20–30 minutos desde Casa Randa, dependiendo del tráfico.$g$, $g$About 20–30 minutes from Casa Randa, depending on traffic.$g$,
   $g$Recomendamos taxi o transporte por aplicación. La ruta más conveniente normalmente cruza hacia el centro por Avenida Balboa o Corredor Sur, según el tráfico.$g$, $g$We recommend a taxi or ride-hailing app. The most convenient route usually crosses into downtown via Avenida Balboa or Corredor Sur, depending on traffic.$g$,
   $g$Lunes a sábado: 10:00 a. m.–8:00 p. m. Domingos: 11:00 a. m.–7:00 p. m. Algunos restaurantes y servicios pueden tener horarios diferentes.$g$, $g$Monday to Saturday: 10 a.m.–8 p.m. Sundays: 11 a.m.–7 p.m. Some restaurants and services may keep different hours.$g$,
   $g$Entrada gratuita. El costo de compras y consumo varía por establecimiento; incluye numerosas marcas premium. Nivel general: moderado.$g$, $g$Free admission. Shopping and dining costs vary by store, including several premium brands. Overall level: moderate.$g$,
   $g$https://multiplaza.com/panama$g$, $g$https://maps.google.com/?q=Multiplaza+Panama+Via+Israel$g$, $g$+507 833-9991$g$, now() + interval '1 seconds'),
  ($g$albrook-mall-panama$g$, $g$ciudad$g$, $g$Albrook Mall$g$, 1, array[]::text[],
   $g$Compras, gastronomía y entretenimiento en uno de los centros comerciales más completos de Panamá, especialmente práctico para familias y grupos.$g$, $g$Shopping, dining and entertainment at one of Panama's most complete malls, especially convenient for families and groups.$g$,
   $g$Albrook Mall es una opción muy práctica para combinar compras, comida y entretenimiento en una sola salida. Reúne más de 700 comercios, tres áreas de comida, cine, bolos y opciones para diferentes presupuestos. Su sistema de pasillos identificados con animales facilita la orientación.$g$, $g$Albrook Mall is a very practical option for combining shopping, food and entertainment in one outing. It brings together more than 700 stores, three food courts, a cinema, bowling and options for different budgets. Its animal-themed aisle system makes it easy to find your way around.$g$,
   $g$Aproximadamente 5–10 minutos desde Casa Randa, según el tráfico.$g$, $g$About 5–10 minutes from Casa Randa, depending on traffic.$g$,
   $g$Taxi o transporte por aplicación es la alternativa más rápida. También está conectado con la estación Albrook del Metro y la Gran Terminal Nacional de Transporte.$g$, $g$A taxi or ride-hailing app is the fastest option. It's also connected to the Albrook Metro station and the national bus terminal.$g$,
   $g$Lunes a sábado: 10:00 a. m.–8:00 p. m. Domingos: 11:00 a. m.–7:00 p. m. Algunos establecimientos manejan horarios diferentes.$g$, $g$Monday to Saturday: 10 a.m.–8 p.m. Sundays: 11 a.m.–7 p.m. Some stores keep different hours.$g$,
   $g$Entrada gratuita. Compras y consumo según cada establecimiento. Nivel de costo general: económico.$g$, $g$Free admission. Shopping and dining costs vary by store. Overall level: budget-friendly.$g$,
   $g$https://www.albrookmall.com/$g$, $g$https://maps.google.com/?q=Albrook+Mall+Panama$g$, null, now() + interval '2 seconds'),
  ($g$isla-taboga-panama$g$, $g$playas$g$, $g$Isla Taboga$g$, 2, array[]::text[],
   $g$Una escapada de playa, historia y naturaleza a solo 30 minutos en ferry de Ciudad de Panamá, ideal para disfrutar durante el día.$g$, $g$A beach, history and nature escape just 30 minutes by ferry from Panama City, ideal for an easy day trip.$g$,
   $g$Conocida como la Isla de las Flores, Taboga combina playas tranquilas, un pueblo histórico, senderos y vistas hacia la bahía de Panamá. Playa La Restinga y Playa Honda son sus principales zonas de baño; también es posible practicar paddle, snorkeling, pesca y, en temporada, avistamiento de ballenas. Recomendamos salir temprano, llevar protección solar, calzado cómodo, agua y efectivo.$g$, $g$Known as the Island of Flowers, Taboga combines quiet beaches, a historic village, trails and views over the Bay of Panama. Playa La Restinga and Playa Honda are its main swimming spots; paddleboarding, snorkeling, fishing and, in season, whale watching are also possible. We recommend leaving early and bringing sunscreen, comfortable shoes, water and cash.$g$,
   $g$De Casa Randa a Fuerte Amador: aproximadamente 15–20 minutos por carretera. Ferry a Taboga: aproximadamente 30 minutos.$g$, $g$From Casa Randa to Fuerte Amador: about 15–20 minutes by road. Ferry to Taboga: about 30 minutes.$g$,
   $g$La ruta recomendada es transporte privado o por aplicación desde Casa Randa hasta Taboga Express en Fuerte Amador, Isla Flamenco, y luego ferry rápido. Casa Randa puede ayudar a coordinar la experiencia.$g$, $g$The recommended route is private or ride-hailing transport from Casa Randa to Taboga Express in Fuerte Amador, Isla Flamenco, then the fast ferry. Casa Randa can help coordinate the trip.$g$,
   $g$Los horarios del ferry varían según el día y la temporada. Se recomienda reservar con anticipación y presentarse antes de la hora indicada para el check-in.$g$, $g$Ferry schedules vary by day and season. We recommend booking ahead and arriving before the indicated check-in time.$g$,
   $g$El costo depende del ferry, la fecha y las actividades elegidas. Consulte la tarifa vigente o solicite una experiencia coordinada por Casa Randa.$g$, $g$Cost depends on the ferry, date and chosen activities. Check current fares or request a trip coordinated by Casa Randa.$g$,
   $g$https://tabogaexpress.com/es/boletos/$g$, $g$https://maps.google.com/?q=Isla+Taboga+Panama$g$, $g$+507 6234-8989$g$, now() + interval '3 seconds'),
  ($g$maagoos-fish-tacos-panama$g$, $g$gastronomia$g$, $g$MaaGoo's Fish Tacos & More$g$, 2, array[]::text[],
   $g$Un restaurante informal y lleno de personalidad en Corozal, conocido por sus tacos de pescado fresco, preparaciones ahumadas, ceviches y sabores caribeños. Una excelente opción para comer cerca de Casa Randa y del Canal de Panamá.$g$, $g$A relaxed restaurant full of character in Corozal, known for fresh fish tacos, smoked seafood, ceviche and Caribbean flavors. An excellent dining option near Casa Randa and the Panama Canal.$g$,
   $g$Es una recomendación especial para quienes disfrutan los mariscos frescos y los ambientes relajados. Su especialidad son los tacos de pescado, disponibles en diferentes preparaciones, incluyendo pescado a la parrilla y pescado ahumado. El menú también ofrece ceviche, sopa de pescado, fish nachos, burritos, bowls, guacamole y pollo jerk. El restaurante tiene un ambiente informal, decoración inspirada en la pesca, espacios interiores y exteriores y, en algunas ocasiones, música en vivo.$g$, $g$A special recommendation for anyone who enjoys fresh seafood and a relaxed setting. Its specialty is fish tacos, available grilled or smoked. The menu also offers ceviche, fish soup, fish nachos, burritos, bowls, guacamole and jerk chicken. The restaurant has a casual, fishing-inspired décor, indoor and outdoor seating, and occasional live music.$g$,
   $g$Aproximadamente 5–10 minutos en automóvil desde Casa Randa, dependiendo del tráfico.$g$, $g$About 5–10 minutes by car from Casa Randa, depending on traffic.$g$,
   $g$La forma más cómoda es viajar en automóvil, taxi o transporte por aplicación desde Casa Randa hacia Corozal Oeste. El restaurante se encuentra en One Blue Plaza, locales 1 y 2, cerca de la avenida Omar Torrijos Herrera.$g$, $g$The most convenient way is by car, taxi or ride-hailing app from Casa Randa to Corozal Oeste. The restaurant is at One Blue Plaza, units 1 and 2, near Avenida Omar Torrijos Herrera.$g$,
   $g$Lunes: cerrado. Martes a sábado: 12:00 p. m.–10:00 p. m. Domingo: 12:00 p. m.–9:00 p. m. Confirme el horario directamente con el restaurante antes de visitarlo.$g$, $g$Monday: closed. Tuesday to Saturday: 12–10 p.m. Sunday: 12–9 p.m. Confirm hours directly with the restaurant before visiting.$g$,
   $g$Consumo aproximado de USD 15–30 por persona. Como referencia, dos tacos de pescado cuestan alrededor de USD 11.99 y tres tacos alrededor de USD 15.50. Los precios pueden cambiar.$g$, $g$Approximately USD 15–30 per person. As a reference, two fish tacos cost around USD 11.99 and three around USD 15.50. Prices may change.$g$,
   $g$https://www.facebook.com/maagoosfishtacos/$g$, $g$https://www.google.com/maps/search/?api=1&query=Maagoos+Fish+Tacos+Corozal+Panama$g$, $g$+507 317-6850$g$, now() + interval '4 seconds')
;

notify pgrst, 'reload schema';

commit;
