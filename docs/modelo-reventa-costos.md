# Reventa de Casa Randa (web + intranet) a otras viviendas de renta corta

Fecha: 2026-10-05 (actualizado con PriceLabs y proyección a 12 meses). Borrador de estimación, **no es una cotización**. Los precios de terceros son los que conozco hoy y deben verificarse antes de ofrecer algo a un cliente.

## 1. Qué se vendería
- **Sitio público** (`apps/web`): casa, cotizador, solicitud de reserva, tienda, check-in, guía local, bilingüe ES/EN.
- **Intranet** (`apps/intranet`): reservas, calendario iCal Airbnb/Vrbo, operación, contabilidad, marketing, cotizaciones PDF.
- **Servicio mensual**: Claude administra, corrige y mejora (flujo Claude + Codex ya montado).

## 2. Estado real del producto (afecta al costo de arrancar)
Hoy es de **un solo cliente**, no un producto multi-cliente:
- Datos de la casa, fotos, textos y dirección fijos en `packages/data` y `apps/web/public`.
- Reglas de negocio propias: comisiones 10 % Marquelda / 9 % Iván, tarifa base 520 USD, 14 huéspedes incluidos, Panamá (ITBMS, países, textos).
- Integraciones propias: PriceLabs, SMTP Dongee, Supabase y Vercel de Ivan.

Dos caminos:
| | A. Una instalación por cliente (copia) | B. Multi-cliente (un solo sistema) |
|---|---|---|
| Trabajo previo | Bajo: parametrizar datos y reglas (marca, tarifas, comisiones, textos) | Alto: `tenant_id` en todas las tablas, RLS, dominios por cliente |
| Costo mensual de infraestructura | Alto por cliente | Compartido |
| Riesgo | Mantener N copias a la vez | Un error afecta a todos |
| Recomendación | **Empezar aquí** con 1-3 clientes | Solo si hay 5+ clientes |

## 3. Costos mensuales (camino A, por cliente)
| Concepto | Costo aprox. | Nota |
|---|---|---|
| Vercel Pro | 20 USD | El plan gratuito no permite uso comercial |
| Supabase Pro (un proyecto por cliente) | 25 USD | El gratuito se pausa por inactividad |
| Dominio | ~1 USD (≈12 USD/año) | Puede pagarlo el cliente |
| Correo transaccional (SMTP) | 0-10 USD | Según proveedor |
| **Infraestructura por cliente** | **≈ 46-56 USD** | |

Costos fijos del lado de Ivan:
| Concepto | Costo | Nota |
|---|---|---|
| Claude Max (el plan de 100 USD) | 100 USD/mes | Un solo límite compartido con todo lo demás que hagas con Claude |
| Codex / ChatGPT (opcional) | 0-20 USD/mes | Solo si se sigue delegando tareas grandes |

Los costos de Airbnb/Vrbo y WhatsApp Business los paga el cliente con su propia cuenta.

### PriceLabs (tarifas dinámicas)
La integración (`/api/sync/pricelabs`) necesita una cuenta de PriceLabs **por propiedad** con su clave de API. Precio de referencia que conozco: **≈ 20 USD/mes por propiedad** (menos para propiedades adicionales en la misma cuenta). **Verificar** el precio actual y si el acceso a la API está incluido o hay que solicitarlo a PriceLabs; sin API la web no puede leer tarifas reales.

Dos formas de manejarlo:
| | 1. El cliente paga su propia cuenta (recomendado) | 2. Ivan lo paga y lo cobra |
|---|---|---|
| Costo para Ivan | 0 | ≈ 20 USD/mes por cliente |
| Cobro al cliente | Directo a PriceLabs | Incluido en la mensualidad o como línea aparte |
| Riesgo | Cliente debe dar su clave de API | Ivan asume impagos y el vínculo contractual |

Si la opción 2 es la elegida, sumar ≈ 20 USD al costo por cliente (infraestructura pasaría a ≈ 66-76 USD) y subir la mensualidad en la misma cantidad, o cobrarla aparte.

## 4. Costo total y margen mensual
Supuestos: infraestructura 50 USD por cliente, costos fijos 120 USD (Claude Max 100 + Codex 20), PriceLabs pagado por el cliente, mensualidad 120 USD.

| Clientes | Costo mensual total | Costo por cliente | Ingreso mensual | Ganancia mensual |
|---|---|---|---|---|
| 1 | 170 | 170 | 120 | **-50** |
| 2 | 220 | 110 | 240 | 20 |
| 3 | 270 | 90 | 360 | 90 |
| 5 | 370 | 74 | 600 | 230 |
| 10 | 620 | 62 | 1.200 | 580 |

El punto de equilibrio mensual está en 2 clientes. Si Ivan paga PriceLabs (≈ 20 USD/cliente) y no lo repercute, la ganancia baja 20 USD por cliente; lo sano es subir la mensualidad a 140 USD o cobrarlo aparte.

## 5. Cobro al cliente (propuesta a discutir)
- **Instalación única:** 1.500-3.000 USD (marca, fotos, textos, tarifas, dominio, conexión iCal, capacitación). Cubre las horas de adaptar la copia.
- **Mensualidad:** 100-150 USD con alojamiento, correcciones y mejoras pequeñas incluidos.
- **Mejoras grandes** (funciones nuevas): se cotizan aparte.

## 5b. Proyección a 12 meses
Supuestos: instalación única de 2.000 USD por cliente (se cobra al entrar), mensualidad 120 USD desde el mes en que entra, costos fijos 120 USD desde el mes 1 (el mes 1 se dedica a parametrizar el producto), infraestructura 50 USD por cliente. **No incluye** impuestos, comisiones de cobro, tu tiempo ni imprevistos.

| Escenario | Clientes al mes 12 | Ingreso por instalaciones | Ingreso por mensualidades | Costos totales | Ganancia acumulada 12 meses |
|---|---|---|---|---|---|
| Pesimista (1 cliente cada 3 meses) | 4 | 8.000 | 2.640 | 2.540 | **8.100** |
| Base (1 cliente cada 2 meses) | 6 | 12.000 | 4.320 | 3.240 | **13.080** |
| Optimista (1 cliente al mes desde el mes 2) | 10 | 20.000 | 7.800 | 4.690 | **23.110** |

Lectura:
- **Casi toda la ganancia del primer año viene de las instalaciones**, no de las mensualidades. Las mensualidades solo empiezan a pesar de verdad pasados 6-8 clientes.
- Si la instalación se cobra a la mitad (1.000 USD), el escenario base baja a unos 7.100 USD de ganancia en el año, y el pesimista a unos 4.100.
- Si Ivan paga PriceLabs sin repercutirlo, el escenario base baja de 13.080 a 12.360 USD.
- Mes 1 a 2: la caja es negativa (−120 a −240 USD) hasta que entre la primera instalación. Conviene tener un cliente piloto comprometido antes de empezar.
- La instalación debe cubrir horas reales de trabajo (marca, fotos, textos, dominio, iCal, capacitación). Hay que medirlas con el piloto: si cada instalación lleva 40 h, 2.000 USD son 50 USD/h antes de gastos.

## 6. Riesgos a decidir antes de vender
- **Capacidad de Claude Max:** nadie conoce hoy cuántos clientes aguanta un solo límite de 100 USD. Hay que medirlo con los dos primeros clientes antes de prometer plazos.
- **Datos personales:** la intranet guarda fotos de pasaportes y datos de huéspedes. Cada cliente es responsable de sus datos; hace falta contrato, política de privacidad y copias de seguridad.
- **Cuenta y propiedad:** definir si el cliente es dueño de su proyecto de Supabase/Vercel (recomendado) o si lo es Ivan.
- **Soporte:** acordar horario y tiempos de respuesta; Claude no atiende por sí solo si algo cae de noche.
- **Licencias y terceros:** revisar términos de PriceLabs, Airbnb y Vrbo al usar sus datos para otros dueños.

## 7. Próximos pasos
1. Elegir camino A o B (se recomienda A).
2. Listar todo lo específico de Casa Randa que habría que parametrizar (una auditoría de `packages/data`, comisiones y textos).
3. Hacer una prueba piloto con un segundo cliente real, midiendo horas y tokens.
4. Fijar precio final con los datos del piloto.
