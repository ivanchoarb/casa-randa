-- URLs de iCal por propiedad: cada cliente configura sus canales desde la UI.
-- Fallback a env vars en el sync route para instalaciones existentes.

alter table public.propiedades
  add column if not exists ical_airbnb  text,
  add column if not exists ical_vrbo    text,
  add column if not exists ical_booking text;

-- Booking.com como canal adicional de bloqueos
alter type public.fuente_bloqueo add value if not exists 'booking';

-- Los administradores (permiso "usuarios") pueden actualizar la configuración
-- de su propiedad desde la pantalla de Configuración.
create policy propiedades_actualiza_admin on public.propiedades
  for update to authenticated
  using  (public.tiene_permiso('usuarios'))
  with check (public.tiene_permiso('usuarios'));
