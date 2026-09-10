-- Catálogo inicial de la tienda (ver legacy-static/LEEME.md:
-- "Elija el vino, el café y el desayuno antes de viajar").
-- Ajustar precios reales antes de lanzar — estos son de ejemplo.

insert into public.productos_tienda (nombre, descripcion, precio, disponible) values
  ('Botella de vino', 'Selección de la casa, blanco o tinto, esperando en la cocina a su llegada.', 25.00, true),
  ('Café panameño', 'Libra de café de altura, molido o en grano.', 15.00, true),
  ('Desayuno para el grupo', 'Desayuno completo servido la primera mañana, para hasta 16 personas.', 120.00, true);
