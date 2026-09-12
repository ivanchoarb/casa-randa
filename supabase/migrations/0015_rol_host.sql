-- Añade el rol solicitado sin ampliar las políticas de autorización existentes.
-- El alcance específico de Host se debe acordar antes de ampliar permisos.
alter type public.rol_usuario add value if not exists 'host';
