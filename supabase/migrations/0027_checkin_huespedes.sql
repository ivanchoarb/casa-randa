-- Registro de huéspedes antes de llegar ("check-in"), a pedido de Iván —
-- reemplaza el formulario externo de forms.app (share.forms.app/dianaparrado/
-- guest-registration-casa-randa) con uno propio, bilingüe, en apps/web.
--
-- Igual que pedidos_tienda: ligado a una reserva real vía codigo_tienda (el
-- mismo código de 6 caracteres que ya desbloquea la tienda), nunca abierto a
-- cualquiera. reserva_id se re-deriva server-side del código en
-- /api/checkin (apps/web) — el navegador nunca manda un reserva_id directo.
create table public.checkins_huesped (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas (id),
  nombre text not null,
  apellido text not null,
  pais_origen text not null,
  numero_id text,
  documento_ruta text, -- ruta dentro del bucket privado "documentos-checkin", no una URL pública
  email text not null,
  telefono text not null,
  acepta_terminos boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.checkins_huesped enable row level security;

-- Mismo permiso que ya gatea /tienda y la tabla reservas cruda
-- (0016_permisos_por_usuario.sql) — una foto de identificación es dato
-- todavía más sensible que lo que ya requiere "contabilidad" hoy, así que
-- no tiene sentido abrirlo a un permiso más amplio como "reservas".
create policy "intranet_lee_checkins" on public.checkins_huesped
  for select to authenticated using (public.tiene_permiso('contabilidad'));

-- Bucket privado — a propósito SIN policies de storage.objects para
-- "authenticated" ni "anon": tanto la subida (desde apps/web, anónima, al
-- enviar el formulario) como la lectura (desde apps/intranet, generando
-- una signed URL) pasan por el cliente de servicio de cada app, nunca por
-- el navegador directo. Con RLS habilitado (ya lo está a nivel de tabla en
-- todo el proyecto Supabase) y cero policies para este bucket, queda
-- denegado por defecto para cualquiera que no sea el rol de servicio —
-- la manera más simple de no exponer documentos de identidad a nadie.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos-checkin', 'documentos-checkin', false, 10485760)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
