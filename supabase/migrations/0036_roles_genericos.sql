-- Reemplaza nombres propios de Casa Randa por roles genéricos en la configuración.
-- Los clientes nuevos ven "Host 1", "Host 2" y "Personal Aseo" como valores por defecto.
begin;

update public.configuracion_cliente set
  valor = '["Host 1","Host 2"]',
  descripcion = 'Responsables disponibles para preparar llegadas, en JSON.'
where clave = 'responsables_preparacion';

update public.configuracion_cliente set
  valor = '["Host 1","Host 2"]',
  descripcion = 'Responsables disponibles para check-out, en JSON.'
where clave = 'responsables_turnover';

update public.configuracion_cliente set
  valor = '["Personal Aseo"]',
  descripcion = 'Responsables disponibles para limpieza, en JSON.'
where clave = 'responsables_limpieza_salida';

commit;
