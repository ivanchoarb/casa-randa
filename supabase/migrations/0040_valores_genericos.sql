-- Reemplaza los valores de seed de Casa Randa por placeholders genéricos.
-- Un cliente nuevo que instale SuperHost verá estos valores y los actualizará
-- en la pantalla de configuración de su propiedad.
-- NOTA: si ya tienes datos reales en `propiedades`, actualízalos en
-- Supabase Dashboard > Table Editor > propiedades después de ejecutar esto.

update public.propiedades set
  nombre               = 'Mi Propiedad',
  slogan               = 'Ciudad · País · tu-sitio.com',
  tagline_cotizacion   = 'Su estadía perfecta',
  descripcion_cotizacion = 'Una propiedad especial para sus huéspedes',
  direccion            = 'Dirección de la propiedad',
  correo_reservas      = 'reservas@tu-propiedad.com',
  web_reservas         = 'www.tu-propiedad.com',
  nombre_host1         = 'Host 1',
  rol_host1            = 'Coordinación y recepción de huéspedes';
