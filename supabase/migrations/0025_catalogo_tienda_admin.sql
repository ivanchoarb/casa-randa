-- Campos de catálogo que faltaban en productos_tienda para administrarlo
-- de verdad desde la intranet (Ivan, 2026-09-13): SKU, categoría e imagen,
-- además de nombre/descripción/precio que ya existían desde
-- 0004_tienda_y_planificacion.sql.
alter table public.productos_tienda
  add column sku text,
  add column categoria text,
  add column imagen_url text;

-- Parcial (no todos los productos van a tener SKU desde el día uno) —
-- mismo patrón que reservas_codigo_externo_unico en 0002_reservas.sql.
create unique index productos_tienda_sku_unico
  on public.productos_tienda (sku)
  where sku is not null;

-- Bucket público para fotos de producto — se crea acá, en migración SQL
-- (no con la Storage API a mano como imagenes-correo), porque hace falta
-- de todas formas escribir las policies de RLS de storage.objects abajo,
-- así que ya no cuesta nada crear el bucket en el mismo lugar.
insert into storage.buckets (id, name, public, file_size_limit)
values ('imagenes-tienda', 'imagenes-tienda', true, 5242880)
on conflict (id) do nothing;

create policy intranet_sube_imagenes_tienda on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagenes-tienda' and public.tiene_permiso('contabilidad'));
create policy intranet_actualiza_imagenes_tienda on storage.objects
  for update to authenticated
  using (bucket_id = 'imagenes-tienda' and public.tiene_permiso('contabilidad'))
  with check (bucket_id = 'imagenes-tienda' and public.tiene_permiso('contabilidad'));
create policy intranet_borra_imagenes_tienda on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagenes-tienda' and public.tiene_permiso('contabilidad'));

notify pgrst, 'reload schema';
