# Arquitectura Casa Randa — plan de migración fuera de WordPress

> Documentado el 2026-09-10. Registra el análisis y las decisiones de esa sesión de trabajo — no vive solo en el chat, por convención del proyecto (ver [CLAUDE.md](../CLAUDE.md)).
>
> Este documento cubre **qué herramientas usamos**. Para **cómo se conecta todo** — entidades, flujos de principio a fin, mapa de integraciones — ver [logica-negocio-y-flujos.md](logica-negocio-y-flujos.md).

## Decisiones aprobadas por Ivan

| Fecha | Decisión | Detalle |
|---|---|---|
| 2026-09-11 | Framework de panel: **Refine** ([github.com/refinedev/refine](https://github.com/refinedev/refine)) | Aprobado tras confirmar que el precio de $0.99–$20/mes visible en `refine.dev/pricing` es de "Refine AI" (un generador de apps aparte), no del framework — ver nota en la tabla de stack. |
| 2026-09-11 | Pasarela de pago: **PagueloFacil principal, Yappy secundaria** | Yappy solo sirve para pagos locales de personas con cuenta en Panamá (residentes) — no cubre a huéspedes internacionales, que son la mayoría de las reservas. PagueloFacil, que sí procesa tarjeta internacional, queda como la ruta principal del checkout; Yappy se ofrece además para quien paga desde Panamá. |
| 2026-09-11 | Correo: se usan las cuentas existentes en **Dongee** (`booking@`, `purchases@`, `info@randahome.com`) | No se crea proveedor nuevo. Detalle completo, incluyendo a qué flujo mapea cada dirección, en [logica-negocio-y-flujos.md](logica-negocio-y-flujos.md#correo-electrónico--aprobado-2026-09-11). |
| 2026-09-11 | Conciliación bancaria: **no se integra la API de Banco General** | Se usa en su lugar el historial de transacciones de PagueloFacil/Yappy para automatizar el lado "esperado"; la confirmación real del depósito en el banco y toda la conciliación de Airbnb/Vrbo se mantienen manuales. Detalle en [logica-negocio-y-flujos.md](logica-negocio-y-flujos.md#conciliación-bancaria--qué-sí-se-puede-automatizar-sin-la-api-del-banco). |
| 2026-09-11 | Tienda: **compra solo con reserva confirmada** | `Pedido de tienda.reserva_id` es obligatorio; no hay compras anónimas. |
| 2026-09-11 | Diagrama de flujo completo: **revisado y aprobado** | Mermaid en [logica-negocio-y-flujos.md](logica-negocio-y-flujos.md#diagrama-completo-verificado-que-renderiza-sin-errores) — cubre huésped, canales OTA, pasarelas, jobs de fondo, datos en Supabase, intranet y correo en un solo diagrama. |
| 2026-09-10 | Guía "Qué hacer en Panamá": contenido real portado desde `staging.randahome.com` (WordPress), no reescrito | `staging.randahome.com/que-hacer-en-panama/` ya tenía 5 lugares reales investigados (nombre, categoría, calificación "Randa Points", nivel de precio, por qué se recomienda, distancia, cómo llegar, horario, precio de referencia, sitio oficial, mapa, teléfono), bilingüe ES/EN, con páginas de detalle vía `?lugar=slug`. Se portó tal cual a `apps/web/src/app/que-hacer-en-panama/places.ts`, con rutas reales `/que-hacer-en-panama/[slug]` en vez del query-param de WordPress (mejor para SEO). Faltan por portar 2 categorías que en staging siguen vacías: Pueblos y escapadas, Vida nocturna. |
| 2026-09-10 | CTA "Solicitar experiencia": por ahora es un `mailto:` a `booking@randahome.com`, no un formulario | En staging es un botón que no expone su destino real (no se probó por no arriesgar un envío real en su entorno). Sin definición de este flujo en Supabase todavía, se optó por lo honesto y funcional — igual que la tienda, no simular un backend que no existe. Pendiente decidir si esto genera una fila en Supabase (tabla de leads/solicitudes) o se queda en correo/WhatsApp directo. |

## Contexto

`staging.randahome.com` corre hoy sobre WordPress: sitio público (tema `casa-randa-code-067-date-picker`), tienda (WooCommerce) e intranet operativa (plugin `Casa Randa Core` + `Casa Randa Puente`). La intención es migrar las tres piezas a un stack propio, hosteado en Vercel y/o Railway, sin WordPress.

## Lo verificado en vivo, no asumido

El 10/09/2026 se recorrió `staging.randahome.com/intranet/` (sesión ya autenticada) para confirmar qué hay realmente detrás del resumen de backend, no solo leerlo. Esto es más que un "back-office" típico — es un sistema financiero en producción:

- **Contabilidad**: 69 reservas registradas, con reparto de comisión entre dos personas (Marquelda, anfitriona local; Iván, propietario), liquidaciones mensuales exportables, anticipos de comisión con saldo pendiente calculado, e importación de CSV de Airbnb/Vrbo que actualiza por código sin duplicar. Ingreso neto acumulado 2026: USD 42,825.99.
- **Conciliación bancaria**: cruce manual entre depósitos de Banco General y reservas esperadas (hoy sin importación automática del estado de cuenta).
- **Operación**: 33 tareas de check-in/check-out/limpieza generadas automáticamente a partir de las reservas activas.
- **Análisis y planificación**: comparativo año a año, plan anual de compras/reparaciones con prioridad y estado, códigos de descuento con vigencia y cupo de usos.
- **Calendario**: 12 bloqueos sincronizados desde Airbnb, con sincronización reciente — el motor de iCal descrito en la documentación del backend sí está corriendo.

**Conclusión:** esto no es una migración de contenido, es una migración de un sistema que ya mueve dinero real. La contabilidad y la conciliación bancaria son el tramo de mayor riesgo de todo el plan.

## Son tres sistemas, no una migración

| Sistema | Qué hace | Naturaleza | Riesgo si se hace mal |
|---|---|---|---|
| Sitio público | Portada, disponibilidad, cotizador de reserva directa | Contenido + UI, sin estado que perder | Bajo — ya en marcha en Next.js |
| Tienda | Vino, café, desayuno y extras que el huésped compra antes de llegar | Catálogo pequeño + checkout, sin inventario complejo | Medio — dinero real, bajo volumen |
| Intranet | Reservas, calendario, operación, contabilidad, conciliación, análisis | Mini-ERP con lógica financiera real | Alto — errores mueven mal el dinero de comisiones |

Tratarlas como una sola migración es la forma más común de estancarse a mitad de camino.

## Stack recomendado, capa por capa

| Capa | Elección | Por qué |
|---|---|---|
| Frontend | Next.js en monorepo (Turborepo): apps `web` (sitio + tienda pública) e `intranet` (privada) | Comparten un paquete de datos/tipos/lógica de precio, para que el cotizador y las tarifas nunca se desincronicen entre el sitio y la intranet. Ya es la base del sitio actual. |
| Datos | Supabase | Postgres real (necesario para contabilidad y conciliación), autenticación con roles integrada (administrador / dueño / empleado, igual a los tres paneles que ya existen en WordPress), seguridad a nivel de fila. |
| Contenido editorial | Sanity — opcional | Solo para copy que alguien sin acceso a código necesite editar (guía de Panamá, fotos). Nunca para reservas, precios ni contabilidad — eso vive en Supabase. |
| Tienda | Catálogo propio sobre Supabase + checkout (Stripe Checkout / Yappy) | El catálogo real es pequeño. Un motor de comercio completo como Medusa exige servidor Node persistente + Redis + su propia base — sobrecostoso para esto. Reevaluar Medusa solo si el catálogo crece a variantes, stock por ubicación o múltiples canales. |
| Panel de administración | Framework Refine (`@refinedev/core`, npm) para reservas / operación / planificación | Framework React open source, licencia MIT, self-hosted dentro del monorepo — acelera las pantallas CRUD de listado/edición. La contabilidad queda fuera: se construye y se prueba a mano. **Ojo con la confusión de nombres** (verificado 2026-09-11): `refine.dev/pricing` muestra $0.99–$20/mes, pero es el precio de "Refine AI", un generador de apps por lenguaje natural — un producto aparte. El framework en sí es gratis, confirmado en el [`LICENSE`](https://github.com/refinedev/refine/blob/main/LICENSE) del repo. Existe una "Enterprise Edition" con algunos paquetes fuera del núcleo MIT (Okta, algo de devtools, multi-tenencia) que no necesitamos — la intranet es de un solo tenant. |
| Calendarios (iCal) | `node-ical` + `ics` para sincronizar · `react-day-picker` en el sitio · FullCalendar en la intranet | Mismo patrón que ya corre en WordPress: traer los dos feeds de entrada, fusionar rangos, publicar un feed de salida por canal que excluye su propia fuente para no generar bucles. |
| Tarifa dinámica | PriceLabs API, cacheada en una tabla | Job diario que llama a `listing_prices`, guarda fecha→tarifa en Supabase; el cotizador la lee en vez de usar la tarifa plana de respaldo. Igual contrato que `cri_pricelabs_quote_rates` hoy (ok/lodging/extra_guests, o caída silenciosa a la tarifa plana). |
| Jobs de fondo | Railway | Sincronización de iCal, consulta diaria a PriceLabs y cualquier proceso con estado o de larga duración, donde una función serverless de Vercel se queda corta. |
| Pagos | **PagueloFacil (principal) · Yappy (secundaria)** — aprobado 2026-09-11 | PagueloFacil procesa tarjeta internacional, necesaria porque la mayoría de los huéspedes no son residentes en Panamá. Yappy es de Banco General — el banco donde ya concilian hoy —, con botón de pago integrable y comisión de 1% + ITBMS, pero solo funciona para quien tiene cuenta/Yappy en Panamá, así que queda como opción adicional para pagos locales (tienda, huéspedes o proveedores panameños), no como ruta principal del checkout. |

### Sobre Stripe

Verificado por búsqueda al momento de escribir este documento: Stripe no opera directo para negocios domiciliados en Panamá. Exige abrir una LLC en Estados Unidos y cobrar a través de ella — un desvío contrario a "el dinero debe llegar a Panamá". Descartado para este caso salvo que se decida abrir esa entidad.

## Herramientas propuestas por Ivan, con veredicto

| Herramienta | Para qué se propuso | Veredicto |
|---|---|---|
| Supabase | Base de datos | **Usar** como fuente única de verdad para las tres apps |
| Sanity | CMS | **Con matiz** — solo contenido editorial, nunca datos transaccionales |
| Stripe | Pasarela de pago | **No usar** sin entidad en EE. UU. — no liquida directo a Panamá |
| PagueloFacil | Pasarela de pago | **Usar, principal** — aprobado 2026-09-11, procesa tarjeta internacional |
| Yappy | Pasarela de pago | **Usar, secundaria** — aprobado 2026-09-11, solo pagos locales (residentes en Panamá) |
| Medusa | Motor de tienda | **Esperar** — el catálogo actual no lo justifica; reevaluar si crece |
| CMS open source genérico | Contenido / intranet | **No usar** para la intranet — la lógica financiera no es "contenido" |
| Refine (`@refinedev/core`) | Framework de panel de administración | **Usar** — aprobado 2026-09-11, MIT y gratis; no confundir con "Refine AI", el generador de apps de pago |

## Fases (orden de dependencia, no de prioridad de negocio)

Cada fase debe correr en paralelo a WordPress antes de apagar la pieza equivalente allá.

0. **Fundaciones compartidas** — 🟡 en marcha (2026-09-11): monorepo Next.js hecho (`apps/web` + `apps/intranet` + `packages/data`/`packages/pricing`), esquema de Supabase escrito (`supabase/migrations/`, ver `docs/logica-negocio-y-flujos.md`) pero **no aplicado a un proyecto real todavía** — no hay Supabase CLI/Docker en esta máquina para probarlo en vivo. Falta: crear el proyecto de Supabase real, aplicar las migraciones, y conectar el cotizador a `tarifas_diarias` en vez de la constante fija.
1. **Sitio público** — 🟡 diseño y maquetado completos (2026-09-11, en la sesión de frontend en paralelo): las 7 secciones de `legacy-static/index.html` ya están portadas, con animación de scroll y entrada cuidadas. Falta la mitad que la conecta con datos reales: disponibilidad y tarifa dinámica desde Supabase (hoy son estado de UI sin backend), y que "Solicitar estas fechas" realmente cree una `Solicitud` — ver "Known-incomplete parts" en `CLAUDE.md`. Bloqueado en parte por la Fase 2 (sync + PriceLabs) y la Fase 0 (proyecto de Supabase real).
2. **Sincronización de calendarios y PriceLabs** — ✅ **corriendo en vivo** (2026-09-11). `apps/intranet/src/app/api/sync/ical` (Airbnb ↔ Vrbo, sin bucles — arregla D2 de raíz, no solo lo documenta) trajo 13 bloqueos reales de Airbnb y 7 de Vrbo, confirmados en `bloqueos_calendario`. `apps/intranet/src/app/api/ical/[canal]` (el feed de salida que cada canal importa) también verificado. `apps/intranet/src/app/api/sync/pricelabs` trajo **541 tarifas diarias reales** a `tarifas_diarias` — la forma de la respuesta de PriceLabs que se había adivinado sin poder probarla (`{listings:[{data:[...]}]}`) resultó ser un array directo (`[{id, pms, data:[...]}]`); se corrigió al correr el primer sync real en vez de confiar en la suposición. Falta todavía resolver dónde corre el cron real (D1: hoy nada dispara los syncs solo) — se implementó como rutas de Next.js precisamente para que cualquier programador de tareas (Vercel Cron una vez desplegado, o un cron externo simple) pueda golpearlas por HTTP; no exige Railway específicamente.
3. **Intranet — reservas, calendario, operación** — ✅ completo, y además se adelantaron Usuarios y Análisis/planificación (fuera de esta fase en el plan original, pero del mismo perfil de bajo riesgo). El dashboard `Inicio` se ajustó el 2026-09-11 para calzar tarjeta por tarjeta contra `staging.randahome.com/intranet/` (comparado en vivo): "Próxima reserva" en vez de "reserva en curso", tarjeta de comisión de Marquelda, y un botón "Descargar liquidación" que genera el mismo Excel que produce staging (formato verificado desarmando un export real, no adivinado) — ver `CLAUDE.md` → `apps/intranet`.
4. **Intranet — contabilidad y conciliación bancaria** — ✅ completo (2026-09-11). Reparto de comisiones, anticipos con saldo pendiente (solo Iván — Marquelda no toma adelantos, igual que en staging), gastos, y conciliación bancaria contra reservas — construido a mano y **verificado en vivo** contra el proyecto real de Supabase, no solo compilado: se insertó una reserva de prueba, se registró un depósito desde el formulario real, y se confirmó que la lógica de comparación ("¿coincide lo recibido con lo esperado?") marca correctamente "Conciliado" o "Diferencia" antes de borrar los datos de prueba. **Todos los 7 módulos de la intranet ya leen y escriben datos reales** contra un proyecto de Supabase real — ver la sección "Architecture — apps/intranet" en `CLAUDE.md`.
   - **Los 69 datos reales de producción ya están migrados** (reservas, gastos, anticipos) — no solo el código, los números reales de staging, verificados cifra por cifra antes de insertarlos.
   - **Import de CSV/XLSX agregado** (2026-09-11), pero solo para el "formato Casa Randa" (mismas columnas que el propio export de Contabilidad, verificado real). Los reportes crudos que Airbnb/Vrbo exportan desde su panel de anfitrión siguen sin soporte — no hay un archivo de muestra real para verificar ese formato distinto.
   - Fuera de alcance a propósito, no por descuido: envío de liquidaciones por correo (falta conectar el SMTP de Dongee).
5. **Tienda, administrada desde la intranet** — no empezado. Catálogo sobre la misma base de Supabase (tablas ya existen: `productos_tienda`/`pedidos_tienda`), checkout PagueloFacil (principal) con Yappy como opción local, gestión de productos integrada al panel — no una tienda aparte con su propio login.

## Riesgos críticos a vigilar

- **El defecto D2 sigue abierto — confirmado como bloqueante duro, no solo teórico**: las reservas directas confirmadas hoy no entran al feed de salida de iCal — la sincronización las borra. [resumen-intervencion-anuncios.md](resumen-intervencion-anuncios.md) (§5, "Antes de lanzar a producción") lo verificó contra el sistema en vivo: *"El motor reescribe la lista de fechas ocupadas con lo que traen Airbnb y Vrbo... el día que actives cobros, hay doble reserva garantizada."* Activar pagos reales antes de resolver esto en el nuevo motor no es un riesgo — es una garantía de overbooking.
- **El checkout necesita soportar dos pasarelas desde el diseño inicial**, no solo una: PagueloFacil (tarjeta, principal) y Yappy (local, secundaria) tienen flujos distintos — botón vs. redirección, moneda, webhook de confirmación — y ambos tocan tanto el cotizador del sitio como la tienda.
- **Migrar datos reales no es solo migrar código**: las 69 reservas, gastos, anticipos de comisión, plan de compras y códigos de descuento activos ya se exportaron de staging y están en el Supabase nuevo (2026-09-11/12, verificado cifra por cifra). El plan de compras y los códigos de descuento se migraron en una segunda pasada — construir la pantalla que los muestra no había traído los datos reales que ya existían.
- **WordPress sigue siendo la fuente de verdad del dinero** hasta que la Fase 4 esté probada. No cortar contabilidad y conciliación de un salto.

## Tareas de producción

Marcadas por Ivan el 2026-09-11 como trabajo de ejecución, no decisiones abiertas — listas para hacerse cuando arranque la implementación.

- [x] Escribir el esquema SQL de Supabase — hecho y **aplicado a un proyecto real** el 2026-09-11 (6 migraciones + seed, RLS activo en las 14 tablas). Ver `supabase/README.md`.
- [ ] Crear las cuentas de comercio en PagueloFacil y Yappy, obtener credenciales de API para ambas, y confirmar si PagueloFacil notifica por webhook o hay que consultar su API periódicamente.
- [ ] Activar el servicio de SMTP transaccional de Dongee para el envío automático desde `booking@randahome.com` — bloquea el envío de liquidaciones desde Contabilidad.
- [ ] Ivan va a crear su propio usuario administrador en la intranet y borrar la cuenta de prueba (`admin@casarandaintranet.test`) que se usó para verificar los módulos.
- [x] `service_role key` de Supabase — agregada y **verificada en vivo** el 2026-09-11 (el feed de salida respondió 200 con un calendario vacío contra el proyecto real). Al pegarla la primera vez, la llave era de otro proyecto de Supabase (`zvhpcgdtgnhwocbangyy`, no `wrroflxjgljwdhfijemc`) — se detectó decodificando el JWT antes de guardarla, no se usó a ciegas.
- [x] URLs de iCal de Airbnb y Vrbo — agregadas el 2026-09-11 y **sincronizadas en vivo**: `/api/sync/ical` trajo 13 bloqueos reales de Airbnb y 7 de Vrbo, verificados directo en `bloqueos_calendario`.
- [x] API key + listing id de PriceLabs — agregadas el 2026-09-11 y **sincronizadas en vivo**: `/api/sync/pricelabs` trajo 541 tarifas diarias reales a `tarifas_diarias`. De paso se corrigió el parseo de la respuesta (era un array directo, no `{listings:[...]}` como se había supuesto sin poder probarlo).
- [ ] Decidir cómo se dispara el sync en producción de forma periódica (Vercel Cron una vez desplegado es la opción más simple; no depende de tener Railway ya montado).
- [x] Importar los datos reales de producción (reservas, gastos, anticipos de comisión) desde `staging.randahome.com/intranet/contabilidad/` al Supabase nuevo — hecho el 2026-09-11: 69 reservas, 2 gastos, 2 anticipos, transcritos y validados cifra por cifra contra los 9 totales que muestra staging antes de insertarlos. De paso se encontró y corrigió un bug real: "Ingresos netos acumulados" debía sumar `reservas.recibido` (bruto − comisión de plataforma), no `neto` (que además resta las comisiones de Marquelda/Iván) — `neto` ahí restaba esas comisiones dos veces en el saldo del propietario. Corregido en `contabilidad` e `Inicio` (que están obligados a no contradecirse). Ver el detalle en `CLAUDE.md` → Arquitectura `apps/intranet`.

## Pendiente

- Publicar este plan como página compartible (Artifact) para la persona técnica que da feedback — ofrecido, no confirmado aún.
