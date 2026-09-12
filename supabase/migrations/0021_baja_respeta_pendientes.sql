-- Corrige un hueco real encontrado probando 0020: darse de baja apagaba el
-- consentimiento en solicitudes/contactos_marketing, pero un destinatario ya
-- "pendiente" en una campaña activa (creada antes de la baja) seguía
-- mandándose igual, porque enviar-lote nunca revisaba el consentimiento
-- vigente al momento de enviar, solo el snapshot original.
begin;

alter type public.estado_envio_campana add value if not exists 'no_suscrito';

notify pgrst, 'reload schema';
commit;
