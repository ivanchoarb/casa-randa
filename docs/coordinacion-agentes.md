# Coordinación de Codex y Claude

Actualizado: 2026-09-14.

Codex (2026-09-14): instalación de la skill personal `image-enhancer` de
Codex. Alcance: crear `~/.codex/skills/image-enhancer/SKILL.md` y sus metadatos
de interfaz; no se modifican las aplicaciones ni archivos de producción del
repositorio. Completado: skill creada y revisada; frontmatter, metadatos y
archivos requeridos válidos. La validación oficial no pudo ejecutarse porque el
entorno carece de `PyYAML`; se hizo comprobación equivalente con Ruby YAML y
`git diff --check`.

Codex (2026-09-14): elaboración de dos cartas de recomendación en formato Word
para Ana Sofía Arbeláez (C.C. 1.105.372.165), destinadas a acompañar una
solicitud de tarjeta de crédito amparada BBVA. Firmantes: Iván Arbeláez
(C.C. 6.646.564) y Diana Parrado (C.C. 29.363.988). Alcance: nuevos archivos
`docs/cartas-recomendacion/carta_recomendacion_ivan_arbelaez.docx` y
`docs/cartas-recomendacion/carta_recomendacion_diana_parrado.docx`; no se
modifica código ni configuración. Se dejarán campos de contacto y firma para
completar datos que el usuario no proporcionó. Fuente consultada: página
oficial de Tarjeta de Crédito Amparada BBVA Colombia; esa página describe el
producto y su solicitud, pero no presenta la carta como requisito estándar.
Completado: ambos DOCX fueron renderizados a PNG y revisados visualmente en una
página cada uno; se corrigió el borde azul heredado del estilo Title y se
verificó la concordancia de género en la carta de Diana. La auditoría de
accesibilidad no encontró hallazgos. Limitación: no se proporcionaron ciudad,
relación con la persona titular, teléfono o correo, por lo que no se inventaron
esos datos; BBVA indica que la solicitud debe incluir nombre, identificación y
relación del amparado con el titular principal.

## Objetivo actual

El usuario solicita integrar el trabajo de Codex con Claude en este proyecto.
El usuario eligió Claude Code. Contexto compartido y comunicación verificados.
Se encontró el CLI 2.1.266 incluido en Claude Desktop y se completó su autenticación
en el navegador. Codex envió una consulta de lectura y recibió una respuesta
correcta de Claude confirmando la lectura de AGENTS.md y este registro.

## Estado del trabajo

Claude (2026-09-13): catálogo de la tienda pasó a administrarse desde la
intranet y se muestra también en el inicio del sitio público. Alcance:
`supabase/migrations/0025_catalogo_tienda_admin.sql` (columnas sku/categoria/
imagen_url en `productos_tienda` + bucket público `imagenes-tienda` con RLS),
`apps/intranet/src/app/(app)/tienda/page.tsx` (nueva, CRUD completo con subida
de imagen), `apps/web/src/lib/tienda.ts` (query compartida), `apps/web/src/
app/page.tsx` y `components/sections/Extras.tsx` (vitrina de 3 productos en
el inicio, ISR cada 5 min). Detalle completo en CLAUDE.md. Migración ya
aplicada a la base real; producto de prueba creado, verificado en ambos
sitios (inicio y /tienda) y borrado después. `pnpm build`/`pnpm lint` pasan
en ambas apps.

Claude (2026-09-13): `/tienda` (apps/web) pasó de catálogo estático a
pedido real con reserva. Alcance: `supabase/migrations/0024_codigo_tienda_reservas.sql`
(columna `reservas.codigo_tienda` + trigger de generación + backfill de
las 69 reservas reales), `apps/web/src/app/tienda/{page.tsx,ShopSections.tsx}`
(reescritos, catálogo real desde `productos_tienda`), `apps/web/src/app/
api/tienda/{validar-codigo,pedido}/route.ts` (nuevos, service-role). Sin
pasarela de pago — el pedido queda `estado_pago: "pendiente"` y se avisa
por correo a booking@randahome.com para cobro manual, decisión confirmada
con el usuario vía `AskUserQuestion` antes de construir. Detalle completo
en CLAUDE.md (`Known-incomplete` → `apps/web`). Migración ya aplicada a la
base real; pedido de prueba creado, verificado y borrado después — no se
tocó ninguna reserva real. `pnpm build`/`pnpm lint` pasan en apps/web.

Codex (2026-09-13): actualización visual de Halloween autorizada con imagen
generada de personajes y revisión de fotos nuevas. Alcance: halloween.html,
imágenes derivadas nuevas en docs/emails/imagenes y este registro. Originales
HEIC/ZIP preservados; no envío ni publicación.
Terminado: ilustración generada e integrada como JPG en
`imagenes/halloween-dracula-frankenstein.jpg`, con identificación de escena
imaginaria y texto alternativo; se mantiene la foto real del patio. Tres HEIC
(6007, 6021, 6041) dieron previsualizaciones negras al convertir con sips, por lo
que no se incorporaron. Rutas HTML y diff comprobados. Pendiente aprobación del
diseño y condiciones del cupón; no prueba de bandeja ni publicación de imágenes.

Codex (2026-09-13): propuesta HTML de Halloween para aprobación del usuario.
Alcance: `docs/emails/halloween.html` y este registro; conserva fotos ajenas.
Oferta solicitada: 5%; código propuesto `HALLOWEENRANDA5%`, sin activar.
No se inventan actividades incluidas ni disponibilidad; no se envía campaña.
Terminado: concepto «Que el único susto sea quedarte en casa», fotos de fachada
y patio, paleta de marca y CTA a la web. HTML y rutas locales comprobados;
vista previa solicitada en el navegador de Codex. Pendiente aprobación creativa,
vigencia/condiciones y creación del código propuesto; URLs públicas y baja antes
de enviar. Sin prueba en bandeja ni cambios en producción.

Codex (2026-09-13): nuevo correo para huéspedes anteriores anunciando próximas
reservas directas. Alcance: `docs/emails/regreso-reserva-directa.html` y este
registro. Código `COMINGBACKRANDA5%`, vigencia de uso durante octubre de 2026
(próximo octubre según fecha actual). Se reutilizan fotos y paleta del correo
aprobado. Solo redacción HTML; no envío ni configuración del descuento.
Terminado: anuncio en futuro, beneficios respaldados por datos del proyecto
(sin comisión de plataforma y trato con anfitriones), descuento y fechas
explícitas; conserva fotos, dirección y baja. Parseo HTML, referencias de
imágenes, código literal y diff comprobados. Pendiente al integrar: URLs públicas
de imágenes, baja personal, configuración real del cupón y prueba en bandeja.
No se verificó producción ni se activó/desactivó ningún código.

Codex (2026-09-12): ampliación autorizada del correo con fotos existentes.
Alcance: `docs/emails/bienvenida-registro.html`, `docs/emails/imagenes/`,
`docs/emails/README.md` y este registro. Se preparan recursos locales para
previsualización; no publicación ni envío.
Terminado: fotos de fachada y patio inspeccionadas e incorporadas con ancho
adaptable y texto alternativo. Copias locales de 91 KB y 57 KB; rutas existentes
y `git diff --check` verificados. README explica reemplazo de fotos y conversión
a URLs HTTPS antes del envío. Pendiente del integrador: alojar imágenes y probar
en clientes de correo; no verificado contra producción.

Codex (2026-09-12): creación del email HTML de bienvenida solicitado, con
descuento del 5% y código literal `REGISTRO$RANDA5%`. Alcance: nuevo archivo
`docs/emails/bienvenida-registro.html` y este registro. Solo artefacto local;
sin envío, cambios de campañas ni activación del cupón.
Terminado: HTML adaptable de 600 px, colores tomados de globals.css, dirección
del paquete data, asunto y preheader incluidos. Comprobación de parseo HTML,
código literal y `git diff --check` correctos. No verificado en bandejas reales.
Antes de usarlo, quien integre el envío debe sustituir `{{unsubscribe_url}}`
por la baja personal y verificar la activación del descuento. No se inventaron
vencimientos ni restricciones comerciales.

Claude: sección Marketing (`/marketing`, `/marketing/campanas`) construida en
varias tandas el 2026-09-12, a pedido directo del usuario. Archivos nuevos:
`app/(app)/marketing/page.tsx`, `app/(app)/marketing/campanas/page.tsx`,
`lib/importar-contactos.ts`, `app/api/marketing/{enviar-lote,enviar-prueba,
baja}/route.ts`, `app/darse-de-baja/page.tsx`, migraciones 0018-0021. Tocados:
`lib/permisos.ts` (nuevo permiso `marketing`), `components/layout/AppShell.tsx`.
Detalle completo en CLAUDE.md (sección `marketing`). Todas las migraciones ya
aplicadas y verificadas contra la base real (transacciones revertidas, o
campañas/contactos sintéticos creados y borrados después — nunca se tocó
audiencia real, incluidos los ~95 contactos reales que el usuario ya había
importado). `pnpm build`/`pnpm lint` pasan en apps/intranet.

Claude: correo de activación al crear usuario + recuperación/cambio de
contraseña, a pedido directo del usuario (2026-09-12). Archivos nuevos:
`src/lib/mailer.ts`, `src/app/api/usuarios/recuperar/route.ts`,
`src/app/restablecer-password/page.tsx`. Tocados: `src/lib/usuarios-api.ts`
(envía el correo tras crear), `src/app/(app)/usuarios/page.tsx` (panel
"Cambiar mi contraseña" para cualquier usuario), `src/app/login/page.tsx`
(enlace "¿Olvidaste tu contraseña?"), `tests/usuarios-api.test.mjs`. Detalle
completo, incluida la verificación con entrega real de correo, en
"Correo de activación y recuperación de contraseña" en
docs/gestion-usuarios.md. `pnpm build`/`pnpm lint`/`node --test` (11/11)
pasan. Sin commit todavía.

Codex: permisos por usuario terminados en la sesión de ChatGPT, que se quedó sin
créditos antes de hacer commit. Claude retomó (2026-09-12), revisó cada diff y
verificó antes de continuar: catálogo de 18 permisos, excepciones por usuario en
`perfiles.permisos`, función SQL `tiene_permiso()`, reescritura de políticas RLS
en ~10 tablas y `storage.objects`, vista `reservas_acceso` que enmascara columnas
financieras por permiso (migración 0016, ya aplicada). UI: checkboxes por sección
en usuarios/page.tsx, `PermissionGate` bloquea rutas sin acceso, `AppShell`/menú
e Inicio/Reservas/Análisis filtran por permiso, APIs de cotización exigen el
permiso `cotizaciones` en servidor. Ver detalle en docs/gestion-usuarios.md.

Verificación de RLS en vivo (Claude, 2026-09-12) — la prueba de "permisos de base
con fixtures revertidos" que había quedado pendiente: dentro de una transacción
sobre la base real, siempre cerrada con `ROLLBACK`, se simuló `auth.uid()` como
empleado, host (con y sin override de `plan_compras`), dueño y administrador,
más un segundo usuario sintético para aislamiento entre perfiles. Confirmado:
`reservas` cruda bloqueada sin permiso `contabilidad`; `reservas_acceso` enmascara
las columnas financieras para empleado/host y las muestra completas a dueño/admin;
el override por usuario sí revoca un permiso puntual; `perfiles` aísla a cada
usuario no-admin a su propia fila. `pnpm build`/`pnpm lint`/`node --test` (9/9)
pasan. Sin commit todavía.

Roles definidos por el usuario: Dueño, Administrador, Host, Empleado. Host y
Empleado ya tienen su conjunto de permisos por defecto (0015 y 0016 aplicadas y
verificadas); ya no queda pendiente acordar el alcance de Host.

Claude: popup de captura de email con cupón de bienvenida del 5%, a pedido
directo del usuario (2026-09-12). Construido sobre el HTML de Codex
(`docs/emails/bienvenida-registro.html`, ver entradas de Codex arriba) — el
diseño y el copy del correo son suyos, sin modificar; Claude lo hizo enviable
de verdad (imágenes alojadas en Storage, `{{unsubscribe_url}}` real) y le
agregó un párrafo sobre reservar directo sin comisión de plataforma, a pedido
del usuario. Archivos nuevos en `apps/web`: `components/ui/PopupDescuento.tsx`,
`app/api/suscribirse/route.ts`, `app/api/darse-de-baja/route.ts`,
`app/darse-de-baja/page.tsx`, `lib/correo-bienvenida.ts`, `lib/mailer.ts`,
`lib/supabase-admin.ts`. Escribe en `contactos_marketing` (tabla de
`apps/intranet`, ver sección Marketing arriba) vía service role. Cupón real
`REGISTRO$RANDA5%` insertado en `codigos_descuento`; sin mecanismo de canje
en el flujo de reserva todavía. Detalle completo en CLAUDE.md (sección
`apps/web`). Verificado en vivo de extremo a extremo (popup real → correo
real recibido con el cupón y el nuevo párrafo → fila real en
`contactos_marketing`), datos de prueba borrados después. `pnpm build`/
`pnpm lint` pasan en `apps/web`. Sin commit todavía.

Codex: CRUD de usuarios implementado con roles existentes, API restringida a
administradores y confirmación de eliminación. Alcance: usuarios/page.tsx,
api/usuarios, lib/usuarios-api.ts, pruebas y ajuste min-width del AppShell.
Se preservaron los cambios de Operación pendientes. Ver docs/gestion-usuarios.md.

Codex: corrección del historial de Operación implementada (orden por reserva,
paginación de grupos completos y errores de carga), autorizada por el usuario.
Archivos: página de Operación, test de regresión, script test de intranet y
documentación de auditoría/coordinación. No requiere migraciones SQL.

| Tarea | Responsable | Estado | Alcance |
| --- | --- | --- | --- |
| Revisión inicial | Codex | Terminada | Lectura del código y comprobaciones locales; sin correcciones funcionales |
| Contexto compartido | Codex | Preparado | AGENTS.md, enlace en CLAUDE.md y este registro |
| Conexión con Claude Code | Codex y usuario | Verificada | Autenticación y consulta de lectura completadas |
| Corrección puntos 2 y 4 | Claude | Terminada (2026-09-12) | Ver "Correcciones aplicadas" abajo |
| Auditoría posterior a 44b0c28 | Codex | Terminada | Correcciones 2 y 4 coherentes; 1, 3 y 5 abiertos. Evidencia y límites en docs/auditoria-2026-09-12.md; sin cambios funcionales |
| Backfill tareas desalineadas + punto 3 | Claude | Terminada (2026-09-12) | El usuario pidió ambos tras revisar la auditoría. Ver "Correcciones aplicadas" abajo |
| Corrección puntos 1 y 5 | Sin asignar | Parcial | Punto 1 sigue abierto. Punto 5 quedó resuelto como efecto colateral de 0016 (retiró `publico_valida_codigo` sin reemplazo; hoy nada en apps/web consume esa tabla, así que no rompe nada, pero falta una política pública acotada si se construye la validación de códigos) |
| Auditoría posterior a ea2ddf5 | Codex | Terminada | Consulta de vigentes y backfill revisados; nuevo P2 en orden/paginación de Historial. Ver segunda revisión en docs/auditoria-2026-09-12.md |
| Permisos por usuario (roles Host + overrides) | Codex, verificado por Claude | Terminada (2026-09-12) | Migraciones 0015/0016 aplicadas; RLS verificada en vivo con transacción revertida; build/lint/tests OK. Sin commit al terminar la revisión |

## Correcciones aplicadas (Claude, 2026-09-12)

El usuario pidió priorizar los puntos 2 y 4 de los hallazgos de abajo.
Archivos tocados: `supabase/migrations/0012_restringir_insercion_solicitudes.sql`,
`supabase/migrations/0013_resincronizar_tareas_operacion.sql`,
`apps/intranet/src/app/(app)/operacion/page.tsx`. Ambas migraciones ya se
aplicaron a la base real vía `DATABASE_URL`.

- **Punto 2** — la policy `publico_crea_solicitud` pasó de `with check (true)`
  a `with check (estado = 'pendiente' and reserva_id is null)`. Comprobado con
  la anon key real: un insert forzando `estado: 'aprobada'` ahora devuelve 401
  (RLS), y un insert con la forma exacta que manda el formulario público
  (sin `estado` ni `reserva_id`) sigue devolviendo 201 sin cambios.
- **Punto 4a** (tareas no resincronizan fechas) — el trigger
  `crear_tareas_operacion` ahora también dispara en
  `update of entrada, salida` (antes solo `update of estado`), y el insert
  pasó de `on conflict do nothing` a `on conflict ... do update set fecha =
  excluded.fecha`. Comprobado dentro de una transacción con `ROLLBACK`
  (correr las fechas de una reserva real +5 días y confirmar que sus 3
  tareas se movieron igual, sin dejar el cambio aplicado de verdad).
- **Punto 4b** (Operación no excluía canceladas) — `operacion/page.tsx` ahora
  trae `reservas.estado` en el embed y una reserva cancelada se archiva en
  Historial igual que una completada (`grupoCancelado()`), con una etiqueta
  "· Cancelada" visible. No se pudo probar contra un dato real cancelado hoy
  (ninguna de las 11 reservas `cancelada` reales tiene tareas todavía, y el
  modo automático de Claude bloqueó cambiar el estado de una reserva real
  como prueba temporal — correctamente, un fallo a mitad de la prueba habría
  dejado una reserva real marcada cancelada por error). Se verificó la lógica
  de filtrado exacta con datos sintéticos en una prueba aislada, sin tocar la
  base real.

`pnpm build`/`pnpm lint` pasan en `apps/intranet` después de estos cambios.

## Correcciones aplicadas (Claude, 2026-09-12, tras la auditoría de Codex)

El usuario pidió, después de leer `docs/auditoria-2026-09-12.md`: reparar las
tareas desalineadas encontradas y priorizar el punto 3. Archivos tocados:
`supabase/migrations/0014_backfill_tareas_desalineadas.sql`,
`apps/intranet/src/app/(app)/operacion/page.tsx`. La migración ya se aplicó
a la base real vía `DATABASE_URL`.

- **Backfill** — la auditoría señaló que 0013 no repara filas ya
  desalineadas de antes. Comprobado por consulta directa: 12 filas reales
  desalineadas, todas de las reservas "Ambar Sanchez" (0010 corrigió sus
  fechas antes de que existiera el trigger de resync). 0014 las corrige con
  el mismo mapeo de 0009. Confirmado: 0 filas desalineadas después.
- **Punto 3** (paginación de Operación) — la auditoría lo reprodujo con
  datos sintéticos (100 reservas viejas completadas + 1 futura pendiente →
  el corte de 300 filas ordenadas ascendente devolvía 0 vigentes, no 1).
  Se separó en dos `useTable`: "recientes" (`reservas.salida >= desde`,
  filtrado en servidor vía `reservas!inner(...)` en el embed, sin límite de
  filas) alimenta Vigentes; "archivadas" (`reservas.salida < desde`,
  ordenado por salida descendente, `pageSize: 500`) alimenta la mitad vieja
  de Historial. Confirmado en vivo que Postgres/PostgREST sí filtra la fila
  externa por una columna de la relación embebida (no solo el contenido
  anidado). Verificado que Vigentes/Historial renderizan igual que antes
  del cambio (mismas 10 reservas activas, mismo "Tonisha Allen" en
  Historial) — sin regresión.

`pnpm build`/`pnpm lint` pasan en `apps/intranet` después de estos cambios.
No se tocaron los puntos 1 ni 5 — siguen abiertos, sin asignar.

## Hallazgos para contrastar

Son observaciones del código local, no pruebas contra la base desplegada.

1. `apps/intranet/src/app/api/sync/ical/route.ts`: el reemplazo de bloqueos
   ejecuta DELETE e INSERT por separado; un fallo intermedio pierde bloqueos.
2. `supabase/migrations/0006_rls.sql`: la inserción pública de solicitudes usa
   `WITH CHECK (true)` y no restringe estado inicial ni reserva asociada.
3. `apps/intranet/src/app/(app)/operacion/page.tsx`: carga las primeras 300 tareas
   por fecha ascendente y filtra vigentes en cliente; puede excluir tareas nuevas.
4. `supabase/migrations/0009_fix_tareas_operacion_fechas.sql`: las tareas no
   sincronizan fechas ante modificaciones posteriores de la reserva. La pantalla
   de Operación tampoco excluye reservas canceladas por su estado.
5. `supabase/migrations/0006_rls.sql`: la política pública de descuentos permite
   enumerar los códigos vigentes y leer sus columnas, incluidas notas.

Pendientes funcionales ya documentados: precios y disponibilidad reales en la
web, conversión de solicitud a reserva y flujo de pago.

## Validación realizada

- TypeScript (`tsc --noEmit --incremental false`) y ESLint pasan en ambas apps.
- `pnpm lint` no llegó a ejecutar ESLint: pnpm intentó reconciliar dependencias
  y abortó por falta de TTY. Se usaron directamente los ejecutables instalados,
  con el runtime Node disponible en el entorno de Codex.
- No se ejecutó build ni se verificaron políticas en la base desplegada.
- No se encontró una suite automatizada configurada en los package.json.

## Protocolo de entrega

Cada entrega debe indicar tarea, archivos modificados, comprobaciones y resultado,
riesgos pendientes y siguiente responsable. Mantener una sola persona o agente
editando cada conjunto de archivos. Este registro no sustituye mensajes ni confirma
que otro agente esté ejecutando trabajo.

## Comando local

Sesión de coordinación comprobada: `205a2a15-82f1-47f7-8edc-be323cccb8f0`.
Claude confirmó recepción del contexto y resumió riesgos de RLS y sincronización
iCal. No verificó esos hallazgos independientemente ni modificó el proyecto.
La consulta terminó sin errores ni denegaciones de herramientas. En el entorno
restringido de Codex fue necesario autorizar la ejecución externa para acceder a
la sesión de Claude y a la red; dentro del sandbox `auth status` informó que no
había sesión incluso después del login correcto.

Desde la raíz del repositorio:

```bash
bash scripts/claude-code.sh --version
bash scripts/claude-code.sh auth status
bash scripts/claude-code.sh
bash scripts/claude-code.sh --resume 205a2a15-82f1-47f7-8edc-be323cccb8f0
```

El script usa el CLI del PATH, la instalación nativa o la versión más reciente
incluida en Claude Desktop. No instala dependencias ni contiene credenciales.
La instalación de Desktop puede cambiar de estructura; si deja de encontrarse,
usar la instalación oficial del CLI. Las sesiones de ambos agentes son
independientes: los archivos compartidos no sincronizan conversaciones anteriores.

## 2026-09-14 — Codex: auditoría solicitada (en curso)

Alcance: revisión de permisos, endpoints públicos de tienda/check-in, sincronización y comprobaciones locales de ambas aplicaciones. Solo documentación; no se modificará código funcional ni datos reales. Archivos previstos: `docs/auditoria-2026-09-14.md` y este registro.

Cierre de auditoría: informe en `docs/auditoria-2026-09-14.md`, seis hallazgos (dos P1, cuatro P2). TypeScript y ESLint limpios en ambas apps; 11/11 pruebas de intranet aprobadas. Reproducidos aisladamente el fallo abierto de disponibilidad y el pedido sin detalle ante error de inserción. Sin cambios funcionales, envíos ni escrituras en servicios reales; no se verificó despliegue ni build de producción. Siguiente paso: corregir disponibilidad/iCal y añadir regresiones, luego los cuatro P2. Archivos modificados: solo este registro y el informe.

## 2026-09-16 — Claude: rediseño visual de la intranet + microanimaciones (en curso)

Alcance: mejorar el diseño de `apps/intranet` (a pedido de Ivan, skill de diseño de
frontend) y agregar microanimaciones deliberadas. Archivos previstos:
`apps/intranet/src/app/globals.css`, `apps/intranet/src/components/layout/AppShell.tsx`,
`apps/intranet/src/app/(app)/page.tsx` (Inicio). No se tocan datos, RLS, ni lógica de
negocio — solo presentación/CSS/markup. No se toca `apps/web`.

Cierre (Claude, 2026-09-16): rediseño aplicado a `apps/intranet/src/app/globals.css`
(sistema tipográfico con el eje variable de Archivo — `.disp`/`.eyebrow`/`.num` — y
microanimaciones con su bloque `prefers-reduced-motion`), `AppShell.tsx` (marca,
set de iconos de línea propio por sección, indicador de pestaña activa que se
desliza — corregido en el proceso: la primera versión animaba `top`, que la regla
CSS no incluye en `transition`, así que no se movía; se cambió a `transform:
translateY()`, que sí anima — y entrada escalonada de la barra lateral al cargar)
y `(app)/page.tsx` (Inicio: se quitó la grilla de tarjetas idénticas por una
jerarquía real — próxima reserva como hecho principal sin caja, cifras
secundarias en fila tipo libro de cuentas). `pnpm build`/`pnpm lint` limpios.
Verificado en vivo contra el servidor real (puerto 3002, sesión ya autenticada):
capturas de Inicio y Contabilidad, navegación real entre secciones confirmando
que el indicador interpola su posición (no salta), sin errores de consola.
Alcance: solo el shell compartido (se ve en las 12 páginas) y el dashboard de
Inicio como ejemplo — las otras 7 secciones (Reservas, Calendario, Operación,
Contabilidad, Conciliación, Análisis, Usuarios, más Cotizaciones/Marketing/
Tienda/Check-in) siguen con sus tarjetas `rounded-xl border-line` originales;
heredan los tokens/clases nuevas pero no se rediseñaron página por página.
Siguiente paso si se quiere continuar: aplicar el mismo lenguaje (`.eyebrow`/
`.num`/`.btn-press`, filas en vez de tarjetas idénticas donde aplique) al resto.

## 2026-09-24 — Codex: skill `casa-randa-copy` para Claude (completada)

Alcance: crear una skill local para Claude que redacte, revise y prepare cambios
de copy para la web de Casa Randa, Airbnb y Vrbo en español e inglés. Debe
adaptar el mensaje por canal, verificar datos contra el proyecto, revisar fotos
cuando corresponda, mostrar preview y análisis antes de publicar, pedir aprobación
antes de cualquier publicación externa, detenerse ante contradicciones o errores,
y registrar los cambios en este archivo. Archivos previstos: `.claude/skills/
casa-randa-copy/SKILL.md` y este registro. No se modifican todavía las apps,
listados externos, precios, disponibilidad ni políticas reales.

Cierre (Codex, 2026-09-24): skill creada en `.claude/skills/casa-randa-copy/
SKILL.md`. Incluye voz bilingüe, adaptación separada por canal, revisión de
fotos y fuentes, marcadores para datos pendientes, aprobación obligatoria antes
de publicar, manejo de errores, preview web, propuestas de cancelación y
registro detallado de cambios. Validación oficial bloqueada por ausencia de
`PyYAML`; validación equivalente de frontmatter, secciones requeridas y
`git diff --check` completada correctamente. No se editaron apps, listings ni
servicios externos. Siguiente paso: usar la skill en una solicitud real y
ajustar reglas si aparece una necesidad concreta.

## 2026-09-30 — Claude: diagnóstico de error en Calendario y reubicación de Códigos de descuento

Diagnóstico (no resuelto, no replicado del lado del servidor): Ivan reportó
"No se pudo conectar a Supabase todavía" en Calendario y disponibilidad
(`apps/intranet/src/app/(app)/calendario/page.tsx`), persistente tras recargar.
Se descartó una falla real de Supabase o de permisos: el proyecto está
`ACTIVE_HEALTHY`, `bloqueos_calendario` tiene 23 filas reales, su política RLS
es de lectura pública (`publico_lee_bloqueos`, `qual: true`), y una llamada
REST directa con la misma anon key y los mismos parámetros que usa `useTable`
(`select=*&order=inicio.asc&limit=200`, `Prefer: count=exact`) respondió 200 con
los datos correctos. En la misma pantalla, la consulta hermana a
`reservas_acceso` sí cargó bien (15 reservas), lo que descarta una caída general
de conexión o de sesión. Se le pidió a Ivan revisar la pestaña Network del
navegador para capturar el código de estado real de la petición fallida, o
probar en una ventana de incógnito — no llegó respuesta sobre esa comprobación
en esta sesión. **Corrección (2026-10-03): la hipótesis de "fallo de red
puntual" era incorrecta.** La causa real se encontró después: ver la entrada de
2026-10-03 más abajo (sorters compartidos por URL → 400 en `bloqueos_calendario`).

Cambio de UI (verificado en vivo, pendiente de commit/PR): a pedido de Ivan
("Esa opción debe estar en la sección de Marketing"), se movió la sección
"Códigos de descuento" (tabla `codigos_descuento`, formulario de creación
incluido) de `apps/intranet/src/app/(app)/analisis/page.tsx` a
`apps/intranet/src/app/(app)/marketing/page.tsx`, sin cambios de lógica ni de
esquema — mismo componente, mismos campos. `apps/intranet/src/lib/permisos.ts`
se actualizó para que `RUTAS["/marketing"]` incluya el permiso `descuentos`
(antes solo en `RUTAS["/analisis"]`), así que una cuenta con `descuentos` pero
sin `marketing`/`analisis_financiero`/`plan_compras`/`cuentas_pagar` sigue
teniendo una ruta a la que entrar. El permiso en sí no cambió: `descuentos` lo
tienen por defecto administrador y dueño, igual que antes. `tsc --noEmit`
limpio en intranet; verificado en vivo contra el servidor real (puerto 3002,
sesión ya autenticada) — la sección ya no aparece en Análisis, aparece al
final de Marketing con los 3 códigos reales (`COMINGBACKRANDA5%`,
`REGISTRO$RANDA5%`, `FAMILIAPARRADO2026`), sin errores de consola.

Estado en git al cierre de esta sesión: cambios sin commitear, en el árbol de
trabajo sobre la rama local `fix/tienda-usar-fuente-body` (esa rama ya está
mergeada a `main` vía PR #12 — no tiene relación con este cambio, es solo la
rama que había activa). No se abrió PR. Pendiente: crear una rama nueva desde
`main`, commitear estos tres archivos (`analisis/page.tsx`,
`marketing/page.tsx`, `permisos.ts`) y abrir la PR para que Ivan la mergee.

## 2026-10-02 — Claude: guía "Qué hacer" administrable desde la intranet

Pedido de Ivan: la sección "Qué hacer" de la intranet debe listar todos los
lugares de la guía y permitir editarlos, agregarlos y borrarlos. Antes vivían
fijos en `apps/web/src/app/que-hacer-en-panama/places.ts`. Alcance:
`supabase/migrations/0034_lugares_guia.sql` (tabla `lugares_guia`, lectura
pública, escritura con el permiso `marketing`, bucket público `imagenes-guia`;
ya aplicada a la base real con los 5 lugares existentes cargados desde
`places.ts` por script), `apps/web/src/lib/guia.ts` (lectura),
`que-hacer-en-panama/{page,GuideList,[slug]/page,[slug]/PlaceDetail}.tsx` y
`sitemap.ts` (ahora leen de la base con ISR), y en la intranet la página nueva
`(app)/que-hacer/page.tsx` + ítem "Qué hacer" en `AppShell.tsx` (reemplaza el
enlace externo de la PR #21) y ruta en `permisos.ts`. Verificado en vivo:
agregar, ver en la web pública, editar, eliminar; el anon puede leer pero no
escribir; `pnpm build` y `tsc` limpios en ambas apps. No verificado: subir
fotos con el selector de archivos real (no automatizable aquí). Lint: hay un
error previo en `QuoteCalculator.tsx` y otro en `metricas/page.tsx`, ajenos a
este cambio. Quien edite la guía necesita `marketing` (administrador y dueño
por defecto; Host y Empleado no).

## 2026-10-03 — Claude: Calendario incluye reservas, y causa real del error "No se pudo conectar a Supabase"

**Causa real del error del 2026-09-30 en Calendario** (diagnosticada mal entonces
como fallo de red). `providers.tsx` tenía `syncWithLocation: true` global, así
que todas las `useTable` de una página comparten un único `?sorters[0][field]=…`
en la URL: la última en montarse lo pisa y las demás lo leen. En Calendario la
tabla de `reservas_acceso` (ordena por `entrada`) contaminaba la URL y la de
`bloqueos_calendario` (ordena por `inicio`) terminaba pidiendo
`order=entrada.asc` → PostgREST 400 (esa tabla no tiene `entrada`) → mensaje
"No se pudo conectar a Supabase". Recargar no ayudaba porque la URL ya traía el
parámetro. Se vio en la URL de la captura de Ivan
(`/calendario?sorters[0][field]=entrada&sorters[0][order]=asc`) y se reprodujo
con `performance.getEntriesByType('resource')`: el 400 nunca aparecía en
`read_network_requests`. Corrección: `syncWithLocation: false` global; nada en
la intranet comparte estado de tabla por URL (la paginación de Usuarios y
Operación vive en estado interno; Operación ya la tenía desactivada). Las otras
8 páginas con 2+ tablas tenían el mismo riesgo latente. Verificado con la URL
contaminada exacta: carga bien, y un recorrido por las 14 páginas del menú no
dio ninguna respuesta 4xx/5xx ni mensaje de error.

**Calendario ahora incluye reservas.** Solo dibujaba bloqueos del feed iCal; una
reserva que el feed no trae (el de Airbnb llega hasta ~abril de 2027, y una
directa nunca genera bloqueo, defecto D2) no aparecía aunque la web pública sí
la tratara como ocupada. `calendario/page.tsx` lee las reservas confirmadas/
completadas con `salida >= hoy` de `reservas_acceso` (gate `reservas`, igual que
el botón de WhatsApp) y agrega solo las que ningún bloqueo del mismo canal
cubre, marcadas "Reserva · <huésped>", con una nota que dice cuántas son.
Hoy agrega 1: David Benites (11–14 nov 2027). Contador: "N bloqueos y
reservas vigentes".

**Datos (no código):** corrida la sincronización iCal del 2026-10-03: se insertó
David Benites (HMS9RH9KBS), se marcaron canceladas Dwight Gamble (HMYDWW9CNN) y
Sean Warner (HM9HJB2XJY), y 3 estancias ya terminadas (Tonisha Allen, Nestor
Balbi, Naia Salazar) pasaron de `confirmada` a `completada`. Los bloqueos 3–4 oct
2026, 24 feb–3 mar 2027 y 19–25 abr 2027 son `Airbnb (Not available)`, no
reservas. Nada pasa solo una reserva a `completada` al terminar la estancia
(pendiente de decidir si se automatiza).

## 2026-10-03 — Claude: la sincronización iCal corre sola (Vercel Cron)

Pedido de Ivan ("haz que corra sola"). `apps/intranet/vercel.json` agenda
`GET /api/sync/ical` todos los días a las 10:00 UTC (05:00 Panamá). El proyecto
está en el plan **Hobby**, que solo permite un cron por día (y lo dispara dentro
de la hora indicada); más frecuencia exige plan Pro o un scheduler externo
(p. ej. GitHub Actions). Vercel Cron autentica con `Authorization: Bearer
<CRON_SECRET>`, así que `checkSyncSecret()` acepta también `CRON_SECRET` (solo
por cabecera, nunca por query); `SYNC_SECRET` sigue igual. La ruta pasó a
`maxDuration = 60` (el máximo de Hobby) para que un feed lento no la corte.

**Corrección (2026-10-03, mismo día):** la primera versión de esta entrada decía que producción no tenía ninguna variable de la sincronización y que por eso el endpoint siempre respondía 401. **Era falso.** Listé las variables desde la raíz del repo, que está enlazada al proyecto `web`, no a `intranet`; el proyecto `intranet` ya tenía `SYNC_SECRET`, `AIRBNB_ICAL_URL`, `VRBO_ICAL_URL`, `ICAL_EXPORT_KEY` y `PRICELABS_*` desde el 2026-09-22 (el 401 era simplemente una llamada sin credenciales). Por el mismo enlace equivocado, `CRON_SECRET`, `AIRBNB_ICAL_URL` y `VRBO_ICAL_URL` se crearon en `web` por error: ya se borraron de ahí (las variables propias de `web` siguen intactas) y `CRON_SECRET` (aleatoria, sensitive) se creó en `intranet`. Lección: los comandos `vercel env` se corren desde `apps/intranet` o `apps/web`, nunca desde la raíz. Verificado en producción tras redesplegar: sin credenciales → 401; con `CRON_SECRET` en la cabecera → 200, Airbnb 16 bloqueos y Vrbo 7, 1,7 s; el deployment lista el cron `/api/sync/ical` a las `0 10 * * *`. Lo que no se puede probar hasta las 10:00 UTC es que Vercel lo dispare por sí mismo. Pendiente: PriceLabs (`/api/sync/pricelabs`) sigue sin agendar, a
mano. Probado: lógica de `checkSyncSecret` en 10 casos (cerrado sin secretos;
`CRON_SECRET` solo por cabecera; `SYNC_SECRET` por cabecera y query), `tsc` limpio.
