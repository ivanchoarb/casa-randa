# Auditoría técnica — Casa Randa

Fecha: 2026-09-14. Base revisada: `b9dfc33`, árbol limpio al inicio.

## Alcance y límites

Revisión local de código y migraciones de web/intranet: permisos, usuarios, disponibilidad, iCal, pedidos, check-in y campañas. No se modificó código funcional ni se enviaron correos, pedidos o registros reales. No se consultó la base desplegada en esta auditoría: las políticas SQL descritas son las del repositorio, no una certificación de su estado aplicado. No se ejecutó build de producción ni una prueba integral de navegador. No es una auditoría exhaustiva de infraestructura o dependencias.

## Hallazgos

### 1. [P1] Un error de base de datos se interpreta como disponibilidad libre

Ubicación: `apps/web/src/lib/disponibilidad.ts:26–39`; consumidores: `/api/disponibilidad` y `/api/solicitudes`.

Las consultas descartan `error` y convierten `data: null` en listas vacías. Si falla una consulta por timeout o error SQL, las fechas afectadas se presentan sin conflictos; si luego funciona la inserción, se admite una solicitud que la verificación no pudo validar. Una solicitud no equivale a una reserva confirmada, pero se incumple el bloqueo de solicitudes para fechas ocupadas.

Comprobación: ejecución aislada del TypeScript real con ambas consultas devolviendo `{ data: null, error: ... }`: `buscarConflictos` devuelve `[]` sin excepción.

Corrección: comprobar ambos errores y responder indisponibilidad temporal (503), sin insertar solicitudes mientras no pueda verificarse el calendario.

### 2. [P1] La sincronización iCal puede perder bloqueos al fallar su reemplazo

Ubicación: `apps/intranet/src/app/api/sync/ical/route.ts:45–60`.

Se confirma el DELETE de todos los bloqueos de un canal antes de ejecutar el INSERT. Si la inserción falla, el catch informa el error pero los bloqueos anteriores ya se perdieron. Hay además una ventana entre operaciones en la que otras consultas ven el canal vacío. Las reservas locales pueden cubrir parte de esas fechas, pero no garantizan cubrir todos los bloqueos externos.

Comprobación: revisión de la secuencia de escrituras; no se provocó una pérdida en la base real.

Corrección: reemplazar cada canal mediante una función SQL transaccional, con validación previa del feed. Un error debe conservar el calendario anterior.

### 3. [P2] Dos envíos simultáneos pueden duplicar un correo de campaña

Ubicación: `apps/intranet/src/app/api/marketing/enviar-lote/route.ts:69–91,113–124`.

Cada petición selecciona al primer destinatario pendiente sin reservarlo. Dos pestañas o administradores pueden seleccionar la misma fila y enviar ambos antes de que se marque como enviada. La comprobación separada del límite diario tampoco reserva capacidad; una actualización fallida después de SMTP deja el destinatario pendiente y permite otro envío.

Comprobación: revisión del flujo y esquema de estados de `0020_campanas_marketing.sql`; no se enviaron mensajes de prueba.

Corrección: reclamar destinatario y cupo de forma atómica antes del envío, con estado de procesamiento, recuperación controlada y comprobación de errores posteriores. SMTP y SQL no constituyen una sola transacción: definir expresamente cómo tratar resultados de envío ambiguos.

### 4. [P2] La tienda deja un pedido sin detalle cuando falla el segundo INSERT

Ubicación: `apps/web/src/app/api/tienda/pedido/route.ts:73–85`.

La cabecera con total y estado pendiente se guarda antes de los artículos. Un error al insertar estos devuelve 500, pero conserva el pedido. El cliente ve un fallo y puede reintentar, creando otra cabecera. Esto deja pedidos incompletos susceptibles de confundirse con pedidos pendientes de cobro válidos.

Comprobación: ejecución aislada del endpoint real con una reserva y producto sintéticos; fallo simulado en `pedidos_tienda_items`. Resultado: 500 después de crear una cabecera, sin operación compensatoria.

Corrección: función SQL transaccional para cabecera y artículos, con clave de idempotencia para reintentos.

### 5. [P2] Los códigos cortos autorizan operaciones públicas sin control de intentos en el proyecto

Ubicaciones: `supabase/migrations/0024_codigo_tienda_reservas.sql:32`; `apps/web/src/app/api/checkin/validar-codigo/route.ts:26–41`; `apps/web/src/app/api/checkin/route.ts:49–57`; `apps/web/src/app/api/tienda/pedido/route.ts:43–51`.

El código generado tiene seis caracteres hexadecimales (24 bits). Los validadores públicos distinguen éxito de fracaso; un código válido permite registrar check-ins y pedidos, incluso para reservas completadas, sin caducidad por fecha. No se encontró limitación de intentos en el código ni middleware/proxy que la aplique. Esto facilita descubrir o reutilizar códigos y generar registros o avisos falsos. No permite por sí mismo descargar documentos privados: esa lectura tiene otra autorización.

Comprobación: revisión estática. No se hizo fuerza bruta ni se verificó si un proveedor externo impone límites adicionales.

Corrección: limitar intentos y escrituras, definir vigencia de los códigos y utilizar un token más robusto para autorizar operaciones. Mantener la compatibilidad solicitada con códigos Airbnb/Vrbo con controles equivalentes.

### 6. [P2] Un fallo de correo de bienvenida deja al suscriptor sin posibilidad de reintento

Ubicación: `apps/web/src/app/api/suscribirse/route.ts:45–68`.

Se persiste `consentimiento: true` antes de enviar el cupón. Si SMTP falla, se devuelve 502, pero en el siguiente intento `yaSuscrito` es true y se devuelve éxito sin enviar nada. La interfaz puede afirmar que el correo se envió aunque el usuario nunca lo reciba.

Comprobación: revisión del orden de persistencia, envío y retorno temprano.

Corrección: almacenar por separado el consentimiento y el estado de entrega del correo; permitir reintentos limitados de entregas fallidas sin duplicar las exitosas.

## Comprobaciones realizadas

- TypeScript: `tsc --noEmit --incremental false`, sin errores en web e intranet.
- ESLint: `eslint .`, sin errores en ambas aplicaciones.
- Pruebas de intranet: 11/11 aprobadas, incluyendo permisos Host, CRUD de usuarios y paginación de operación.
- Dos reproducciones aisladas con el código real y dependencias simuladas: disponibilidad ante fallo SQL y pedido ante fallo de detalle. Sin credenciales ni acceso a servicios externos.
- Los permisos por defecto de Host coinciden en `permisos.ts` y la función SQL vigente del repositorio (`0018`). Las pruebas unitarias pasan; falta revalidar las políticas efectivamente desplegadas con sesiones de cada rol.
- El acceso a fotos de identificación verifica sesión y permiso `contabilidad`; la migración crea un bucket privado. No se identificó en estas rutas una descarga anónima directa.

## Pendientes conocidos, separados de los defectos anteriores

El motor público sigue usando `RATE = 520` fijo (`packages/pricing/src/quote.ts:8,58`), no las tarifas diarias de PriceLabs. Está documentado como provisional: falta cerrar esa integración antes de tratar la cotización como precio definitivo. Las pruebas existentes no cubren los nuevos endpoints públicos ni los fallos de consistencia descritos.

Prioridad sugerida: disponibilidad e iCal primero; después transacciones de tienda, concurrencia de campañas y protección de códigos; finalmente recuperación del correo de bienvenida. Añadir regresiones de cada fallo al corregirlo.
