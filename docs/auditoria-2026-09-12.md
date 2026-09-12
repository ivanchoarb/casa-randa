# Auditoría posterior a las correcciones de Claude

Fecha: 2026-09-12. Revisor: Codex. Commit revisado: `44b0c28`.

## Resultado

Las correcciones de los puntos 2 y 4 resuelven los mecanismos identificados en
el código. No se detectaron nuevas regresiones en el alcance revisado. Los puntos
1, 3 y 5 siguen abiertos; el commit y el registro de Claude lo indican expresamente.
Esta auditoría no confirma el estado de la base desplegada.

## Hallazgos que siguen abiertos

### P1: reemplazo de bloqueos sin transacción

`apps/intranet/src/app/api/sync/ical/route.ts:46`: primero se eliminan los bloqueos
del canal y luego se insertan los nuevos. Una inserción fallida deja el canal sin
bloqueos. Lectores concurrentes pueden observar el intervalo vacío. Reemplazar
el conjunto mediante una operación transaccional del servidor de base de datos.

### P1: tareas futuras excluidas por paginación

`apps/intranet/src/app/(app)/operacion/page.tsx:303`: la consulta obtiene las
primeras 300 tareas por fecha ascendente y posteriormente filtra vigentes en el
cliente, sin navegación de páginas. Reproducción sintética: 100 reservas antiguas
con 3 tareas completadas cada una y una reserva futura con 3 tareas pendientes.
La clasificación del conjunto completo devuelve 1 grupo vigente; con las primeras
300 filas devuelve 0. Filtrar las tareas vigentes en servidor y paginar por separado
el historial; evitar además dividir grupos de reserva entre páginas.

### P2: códigos de descuento enumerables

`supabase/migrations/0006_rls.sql:86`: la política pública permite seleccionar
todos los códigos vigentes con usos disponibles, incluidas sus notas. Ninguna de
las migraciones nuevas restringe esa lectura. Una función de validación debería
recibir un código concreto y devolver únicamente los datos necesarios.

## Correcciones revisadas

- `0012_restringir_insercion_solicitudes.sql`: sustituye la política anterior y
  exige estado pendiente y reserva_id nulo. Los defaults del esquema y el insert
  del formulario público son compatibles. No hay otra política INSERT permisiva
  para solicitudes en las migraciones revisadas. Esto no constituye validación
  integral de todos los campos del formulario.
- `0013_resincronizar_tareas_operacion.sql`: dispara al insertar y actualizar
  estado, entrada o salida; para confirmadas/completadas inserta o actualiza la
  fecha según la clave única (reserva_id, tipo). Mantiene estado, notas, responsable
  y checklist de tareas existentes. La migración no contiene un backfill: si
  existieran fechas desalineadas anteriores, no se reparan hasta actualizar la
  reserva. No se comprobó si existen tales filas en la base desplegada.
- Operación: incluye reservas.estado en la consulta, excluye canceladas de
  vigentes y las muestra en historial. La reactivación de un grupo pendiente lo
  devuelve a vigentes si cumple el corte de fecha.

## Evidencia y límites

- TypeScript y ESLint: correctos en web e intranet.
- Prueba aislada con funciones y filtros extraídos del TSX actual: pasan los
  casos confirmada pendiente, cancelada pendiente, confirmada con todas las tareas
  completadas, cancelada con tareas completadas y reactivada pendiente.
- Se reprodujo el fallo de las 300 filas con datos sintéticos y esos mismos filtros.
- Build de intranet: no completado. Turbopack falla al procesar CSS por
  `binding to a port: Operation not permitted`, también después de solicitar una
  ejecución fuera del sandbox. No se atribuye ese fallo a los cambios de Claude.
- No se ejecutaron migraciones ni se escribieron datos en producción. Las pruebas
  sobre la base real descritas por Claude no fueron repetidas por esta auditoría.
- No se hizo una prueba de extremo a extremo en navegador ni una auditoría
  exhaustiva de todos los módulos. Se revisaron el commit, sus dependencias y
  los cinco hallazgos de la revisión anterior.
- Solo se modificó documentación del proyecto durante esta auditoría.

Siguiente paso recomendado: corregir sincronización transaccional y consulta de
tareas vigentes, seguido de restringir la consulta pública de descuentos.

## Segunda revisión: commit ea2ddf5

Revisor: Codex. Revisión del cambio de Operación y migración 0014, sin cambios
funcionales ni acceso a producción.

La consulta de recientes ahora filtra por reservas.salida en servidor mediante
reservas!inner y no aplica el antiguo límite de 300. Se comprobó la URL generada
por las versiones instaladas de @refinedev/supabase y supabase-js usando un fetch
simulado (sin red). La migración 0014 actualiza únicamente fechas desalineadas y
mantiene el mapeo preparación=entrada, turnover/limpieza=salida. No se repitió la
verificación de datos desplegados descrita por Claude.

### P2 nuevo: el orden del historial no se aplica a las filas principales

En operacion/page.tsx:338, el sorter `reservas.salida` se transforma mediante
@refinedev/supabase 6.0.2 en `.order('salida', {foreignTable: 'reservas'})`.
La consulta generada contiene `reservas.order=salida.desc`, `limit=500` y ningún
`order` de nivel superior. Esto ordena la relación embebida, no el conjunto de
tareas que se limita a 500 filas. Por tanto, al superar ese tamaño no hay garantía
de conservar las reservas archivadas más recientes, pese a lo que indica el
comentario. El sort posterior en JavaScript no recupera las filas excluidas.

Usar ordenación de las filas raíz por la fecha relacionada (por ejemplo mediante
una consulta personalizada o vista) y paginación real del historial por reserva,
para no cortar grupos de tareas en el límite de página. La página actual tampoco
ofrece navegación para acceder a las filas posteriores a las primeras 500.

Validación: TypeScript y ESLint de intranet pasan. La captura de consultas con
fetch simulado reproduce el defecto de orden y confirma el filtro de recientes.
No se repitió el build, bloqueado por el entorno en la revisión anterior.
Los hallazgos originales 1 (iCal sin transacción) y 5 (descuentos públicos)
siguen abiertos y no fueron modificados en este commit.

## Corrección del historial por Codex

Autorizada por el usuario después de la segunda revisión. La consulta de historial
ahora usa reservas como recurso raíz y embebe tareas_operacion!inner(*). Ordena
por salida descendente y después id descendente antes de paginar en bloques de
20 reservas, manteniendo todas las tareas de cada reserva juntas. Anterior y
Siguiente permiten recorrer todo el resultado. Las reservas recientes archivadas
se muestran al comienzo de la primera página. La clasificación de archivadas
(canceladas o todas sus tareas completadas) se mantiene; una página de reservas
antiguas que aún no cumplan esa condición muestra un mensaje y permite continuar.

El historial muestra errores y permite reintentar. Guardar una tarea invalida
también las consultas de reservas para actualizar el historial embebido.

Prueba de regresión: tests/operacion-pagination.test.mjs extrae la configuración
actual de la página y la ejecuta con el proveedor Refine/Supabase instalado y
fetch simulado. Comprueba el orden a nivel raíz y recorre 181 reservas (543 tareas),
sin perder ni duplicar reservas ni separar sus tareas. No utiliza datos reales.
Ejecutar desde apps/intranet: `node --test tests/*.test.mjs` (script `test`).
No se aplicaron migraciones ni cambios a la base desplegada. Los pendientes iCal
y descuentos quedan fuera del alcance de esta corrección del historial.
