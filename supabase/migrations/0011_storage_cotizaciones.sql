-- Bucket privado "cotizaciones" (creado vía Storage API, no DDL, el
-- 2026-09-12) para el enlace de descarga que "Enviar por WhatsApp" incluye
-- en el mensaje — WhatsApp no admite adjuntar un archivo en un enlace
-- wa.me, así que el PDF se sube aquí y se comparte con una signed URL con
-- vencimiento, no con el bucket completo expuesto públicamente.
--
-- Reutiliza es_intranet() (0006_rls.sql): cualquier usuario de la
-- intranet logueado puede subir y leer cotizaciones — Cotizaciones no
-- está restringido a "gestor" como contabilidad, así que su storage
-- tampoco debería estarlo.

create policy "intranet_sube_cotizaciones"
  on storage.objects for insert
  with check (bucket_id = 'cotizaciones' and public.es_intranet());

create policy "intranet_lee_cotizaciones"
  on storage.objects for select
  using (bucket_id = 'cotizaciones' and public.es_intranet());

create policy "intranet_borra_cotizaciones"
  on storage.objects for delete
  using (bucket_id = 'cotizaciones' and public.es_intranet());
