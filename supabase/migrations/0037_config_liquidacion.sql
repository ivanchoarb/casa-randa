insert into public.configuracion_cliente (clave, valor, descripcion) values
  ('nombre_propiedad', 'Casa Randa', 'Nombre de la propiedad para documentos.'),
  ('slogan_propiedad', 'Diablo Heights, Ancón · Ciudad de Panamá · randahome.com', 'Tagline o dirección para el encabezado del Excel.'),
  ('nombre_host1', 'Marquelda', 'Nombre del host principal para liquidaciones.'),
  ('rol_host1', 'Recepción de huéspedes y coordinación en sitio', 'Rol del host principal en el Excel de liquidación.')
on conflict (clave) do nothing;
