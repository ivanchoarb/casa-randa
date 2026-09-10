# Casa Randa — lógica de negocio, flujos e integraciones

> Documentado el 2026-09-11. Complementa [arquitectura-migracion.md](arquitectura-migracion.md) (qué herramientas usamos) con **cómo se conecta todo**: las entidades, los flujos de principio a fin, y el mapa de integraciones externas. Sin esto, el esquema de Supabase de la Fase 0 no se puede escribir con confianza.

## Entidades (modelo de negocio, no el SQL todavía)

| Entidad | Campos clave | Notas |
|---|---|---|
| **Reserva** | canal (Airbnb/Vrbo/Directo), código externo, huésped, entrada, salida, noches, huéspedes, tarifa, bruto, comisión plataforma, recibido, comisión Marquelda, comisión Iván, neto, estado | El registro central. Todo lo demás cuelga de una reserva. |
| **Solicitud** (reserva directa antes de pagar) | datos del formulario, plan de tarifa, plan de pago, código de descuento, estado | Se **convierte en Reserva** cuando se aprueba y se confirma el pago — no antes. |
| **Bloqueo de calendario** | inicio, fin, fuente (Airbnb/Vrbo/Directo), reserva_id | La pieza que hoy falla (defecto D2): un bloqueo de fuente Directo debe sobrevivir a la resincronización y aparecer en los feeds de salida. |
| **Tarifa diaria** | fecha, tarifa, fuente (PriceLabs/plana), estancia mínima | La cotización la lee, no la inventa. |
| **Gasto** | fecha, categoría, concepto, proveedor, valor, medio de pago | Igual a lo que ya existe en Contabilidad. |
| **Anticipo de comisión** | persona (Marquelda/Iván), fecha, valor, referencia, motivo | Se descuenta contra la comisión acumulada del año. |
| **Movimiento bancario** | fecha, descripción, referencia, valor recibido, reserva/gasto relacionado, estado | Alimenta Conciliación bancaria. |
| **Tarea de operación** | reserva_id, tipo (preparación / turnover / limpieza de salida), estado | Se genera sola a partir de la Reserva — hoy ya son 3 tareas por estadía. |
| **Código de descuento** | código, % descuento, vigencia, máximo de usos, usos actuales | Aplica sobre la Solicitud antes de confirmar el pago. |
| **Plan de compras/mejoras** | año, categoría, concepto, proveedor, cotización, fecha programada, prioridad, estado | Alimenta Análisis y planificación. |
| **Producto de tienda** | nombre, descripción, precio, disponibilidad | Vino, café, desayuno, extras. |
| **Pedido de tienda** | reserva_id (opcional), productos, total, estado de pago, pasarela | Vinculado a una Reserva cuando existe, para que Operación sepa qué surtir. |
| **Usuario** | nombre, email, rol (administrador / dueño / empleado) | Mapea los tres paneles que ya existen en WordPress. |

## Flujo 1 — Reserva directa (la más nueva, la que no existe hoy en producción)

```
Huésped ve disponibilidad          lee blocked_ranges + daily_rates
        │
Cotiza en el sitio                 computeQuote() con tarifa dinámica
        │
Envía solicitud                    crea Solicitud, estado "pendiente"
        │
Aparece en Intranet → Reservas     como ya se ve hoy ("Solicitudes recientes")
        │
Administrador aprueba
        │
Se genera link de pago             PagueloFacil (tarjeta) o Yappy (Panamá)
        │
Webhook confirma el pago    ───▶   Solicitud → Reserva confirmada (canal="Directo")
        │                                   │
        │                                   ├──▶ blocked_range (source="Directo", reserva_id)
        │                                   │      → entra al feed de salida iCal
        │                                   │        hacia Airbnb Y Vrbo (arregla D2)
        │                                   │
        │                                   ├──▶ 3 tareas de Operación auto-generadas
        │                                   │
        │                                   └──▶ asiento de Contabilidad
        │                                          (bruto, comisión Marquelda, comisión Iván, neto)
        │
Llega el depósito a Banco General
        │
Conciliación bancaria (manual)     se cruza contra la Reserva
        │
Cierre de mes                      liquidación Marquelda / Iván
```

**Lo único genuinamente nuevo respecto a hoy**: los pasos de solicitud→pago→confirmación. Todo lo que sigue después de "Reserva confirmada" ya existe y funciona en la intranet actual para reservas de Airbnb/Vrbo — solo hay que dispararlo también desde un pago directo.

## Flujo 2 — Reserva por Airbnb o Vrbo (ya funciona hoy, se mantiene igual)

```
Huésped reserva en la plataforma           (fuera de nuestro control)
        │
Job de sync trae el iCal                   cada N minutos/horas, Airbnb y Vrbo por separado
        │
blocked_ranges se actualiza                source = "Airbnb" o "Vrbo"
        │
Feed de salida se regenera                 el feed que ve Vrbo excluye lo propio de Vrbo,
                                            el que ve Airbnb excluye lo propio de Airbnb
                                            (evita el bucle de eco — el diseño actual ya es correcto)
        │
Admin importa CSV del reporte              upsert por código externo, no duplica
        │
Reserva + asiento de Contabilidad          igual que en el flujo directo
        │
Tareas de Operación auto-generadas
        │
Conciliación + cierre de mes
```

## Flujo 3 — Tienda (compra de extras antes de llegar)

```
Huésped con reserva confirmada entra a la tienda
        │
Elige productos (vino, café, desayuno)
        │
Paga (PagueloFacil principal, Yappy si es de Panamá)
        │
Pedido queda vinculado a la Reserva        para que el staff sepa qué preparar
        │
Aparece en Operación                       ("surtir despensa" antes del check-in)
        │
Ingreso entra a Contabilidad               como línea separada del alojamiento,
                                            para no distorsionar el cálculo de comisión de hospedaje
```

## Mapa de integraciones externas

| Integración | Dirección | Qué mueve | Estado |
|---|---|---|---|
| iCal Airbnb | Entrada | Fechas bloqueadas por reservas de Airbnb | Ya funciona hoy |
| iCal Vrbo | Entrada | Fechas bloqueadas por reservas de Vrbo | Ya funciona hoy |
| Feed iCal de salida → Airbnb | Salida | Bloqueos de Vrbo + directos, sin los de Airbnb | Existe, pero sin las reservas directas (D2) |
| Feed iCal de salida → Vrbo | Salida | Bloqueos de Airbnb + directos, sin los de Vrbo | Existe, pero sin las reservas directas (D2) |
| PriceLabs API (`listing_prices`) | Entrada | Tarifa por fecha | Ya funciona hoy vía Casa Randa Puente |
| PagueloFacil | Salida/entrada | Cobro + webhook de confirmación | Por integrar — pasarela principal aprobada |
| Yappy | Salida/entrada | Cobro + webhook de confirmación | Por integrar — pasarela secundaria aprobada |
| Banco General | — | Depósitos reales | **Sin API** — sigue siendo conciliación manual o CSV, igual que hoy |
| Email transaccional | Salida | Solicitudes, liquidaciones, confirmaciones | **Sin decidir el proveedor** (Resend / Postmark / SES — pendiente) |
| WhatsApp (Host Ivan) | — | Contacto con huéspedes | Mencionado en el sitio actual, no evaluado todavía |

## Lo que todavía es una pregunta abierta

- **Proveedor de email transaccional** — no evaluado aún.
- **¿Se automatiza la conciliación bancaria?** Banco General no tiene una API pública conocida; lo más realista a corto plazo es mantener el import de CSV manual que ya está planeado en la intranet actual, no inventar una integración que no existe.
- **¿Se puede comprar en la tienda sin tener una reserva confirmada?** Afecta si `Pedido de tienda.reserva_id` es obligatorio o no.
- **Todo el negocio opera en USD** — no se ha visto ninguna necesidad de multi-moneda; se asume que se mantiene así.

## Cómo se usa este documento

El esquema de Supabase (pendiente en `arquitectura-migracion.md`) se deriva directamente de la tabla de entidades de arriba. Antes de escribirlo, conviene cerrar las preguntas abiertas de la sección anterior — especialmente la del proveedor de email, porque condiciona cómo se notifica cada paso de los flujos 1 y 2.
