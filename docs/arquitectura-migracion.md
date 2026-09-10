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
1. **Sitio público** — en marcha, en otra sesión de trabajo (frontend).
2. **Sincronización de calendarios y PriceLabs** — no empezado. Job de iCal (Airbnb ↔ Vrbo, sin bucles) y puente de PriceLabs, corriendo en Railway con cron real, no dependiente de visitas al sitio (el defecto D1 del motor actual). **Bloqueante para reservas reales.**
3. **Intranet — reservas, calendario, operación** — 🟡 en marcha: `apps/intranet` escafoldado (Next.js + Refine + Supabase, login funcionando, rutas protegidas). Solo el módulo de Reservas está conectado a datos reales (`useTable`); Calendario y Operación son esqueletos sin lógica todavía. Ver la sección "Architecture — apps/intranet" en `CLAUDE.md`.
4. **Intranet — contabilidad y conciliación bancaria** — no empezado, a propósito (ver esqueletos marcados en `apps/intranet/src/app/(app)/contabilidad` y `/conciliacion`). Reparto de comisiones, anticipos, importación idempotente de reportes, conciliación contra Banco General. Se construye a mano, con pruebas. **Mayor riesgo financiero.**
5. **Tienda, administrada desde la intranet** — no empezado. Catálogo sobre la misma base de Supabase (tablas ya existen: `productos_tienda`/`pedidos_tienda`), checkout PagueloFacil (principal) con Yappy como opción local, gestión de productos integrada al panel — no una tienda aparte con su propio login.

## Riesgos críticos a vigilar

- **El defecto D2 sigue abierto**: las reservas directas confirmadas hoy no entran al feed de salida de iCal — la sincronización las borra. Activar pagos reales antes de resolver esto en el nuevo motor arriesga overbooking.
- **El checkout necesita soportar dos pasarelas desde el diseño inicial**, no solo una: PagueloFacil (tarjeta, principal) y Yappy (local, secundaria) tienen flujos distintos — botón vs. redirección, moneda, webhook de confirmación — y ambos tocan tanto el cotizador del sitio como la tienda.
- **Migrar datos reales no es solo migrar código**: 69 reservas, gastos por categoría, anticipos de comisión y códigos de descuento activos tienen que exportarse de WordPress antes de apagarlo.
- **WordPress sigue siendo la fuente de verdad del dinero** hasta que la Fase 4 esté probada. No cortar contabilidad y conciliación de un salto.

## Tareas de producción

Marcadas por Ivan el 2026-09-11 como trabajo de ejecución, no decisiones abiertas — listas para hacerse cuando arranque la implementación.

- [ ] Escribir el esquema SQL de Supabase — las entidades ya están mapeadas en [logica-negocio-y-flujos.md](logica-negocio-y-flujos.md), falta convertirlas en tablas.
- [ ] Crear las cuentas de comercio en PagueloFacil y Yappy, obtener credenciales de API para ambas, y confirmar si PagueloFacil notifica por webhook o hay que consultar su API periódicamente.
- [ ] Activar el servicio de SMTP transaccional de Dongee para el envío automático desde `booking@randahome.com`.

## Pendiente

- Publicar este plan como página compartible (Artifact) para la persona técnica que da feedback — ofrecido, no confirmado aún.
