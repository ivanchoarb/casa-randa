insert into public.configuracion_cliente (clave, valor, descripcion) values
  ('tagline_cotizacion', 'Su estadía en Panamá', 'Título principal del PDF de cotización.'),
  ('descripcion_cotizacion', 'Una casa tropical privada en Diablo Heights', 'Subtítulo descriptivo en el encabezado del PDF.'),
  ('direccion_propiedad', 'Calle Hecker 5624, Diablo Heights, Ancón, Panamá', 'Dirección física para el pie del PDF.'),
  ('correo_reservas', 'booking@randahome.com', 'Correo de contacto para reservas, en el pie del PDF.'),
  ('web_reservas', 'www.randahome.com', 'Sitio web en el pie del PDF.')
on conflict (clave) do nothing;
