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
