# Escalabilidad de una página como Casa Randa — documento para continuar en otro chat

Fecha: 2026-10-05. Pégalo (o pide leer este archivo) al empezar el otro chat. Complementa a [modelo-reventa-costos.md](modelo-reventa-costos.md), que tiene las tablas completas de costos y proyección.

## Objetivo
Vender el sitio web y la intranet de Casa Randa a otros dueños de viviendas de renta corta, con Claude (plan Max de 100 USD) administrando, corrigiendo y mejorando cada instalación. Hay que decidir cómo escalar sin que el trabajo y los costos se disparen.

## Qué es el producto hoy
- Monorepo pnpm + Turborepo: `apps/web` (sitio público, Next.js), `apps/intranet` (Next.js + Refine + Supabase), `packages/data` y `packages/pricing`.
- Sitio: casa, cotizador, solicitud de reserva, tienda, check-in de huéspedes, guía local, ES/EN.
- Intranet: reservas, calendario iCal Airbnb/Vrbo, operación, contabilidad, marketing, cotizaciones PDF, tienda, Qué hacer.
- Integraciones: Supabase, Vercel, PriceLabs (tarifas), SMTP (Dongee), WhatsApp (pendiente de credenciales).

## Límite principal: hoy es de un solo cliente
Lo específico de Casa Randa que habría que parametrizar:
- Datos de la casa, fotos, textos y dirección (`packages/data`, `apps/web/public`).
- Reglas de negocio: comisiones 10 % Marquelda / 9 % Iván, tarifa base 520 USD, 14 huéspedes incluidos, ITBMS y países de Panamá.
- Cuentas propias: PriceLabs, SMTP, Supabase, Vercel, iCal de Airbnb/Vrbo.

## Decisión recomendada hasta ahora
**Camino A: una instalación por cliente** (copia con su propio Supabase y Vercel). Pasar a un sistema multi-cliente (`tenant_id` en todas las tablas, RLS, dominios por cliente) solo si hay 5 o más clientes.

## Cifras de referencia (a verificar antes de ofrecer algo)
- Infraestructura por cliente: ≈ 46-56 USD/mes (Vercel Pro 20, Supabase Pro 25, dominio y correo).
- Fijos de Ivan: Claude Max 100 USD + Codex ≈ 20 USD (opcional).
- PriceLabs: ≈ 20 USD/mes por propiedad; confirmar si el acceso a la API está incluido. Recomendado que lo pague el cliente.
- Propuesta de cobro: instalación 1.500-3.000 USD; mensualidad 100-150 USD.
- Equilibrio mensual: 2 clientes (con 120 USD/mes cada uno).
- Proyección a 12 meses (instalación 2.000 USD, mensualidad 120 USD): pesimista 8.100 USD, base 13.080 USD, optimista 23.110 USD de ganancia acumulada. Casi todo viene de las instalaciones.

## Aprendizajes del flujo Claude + Codex (afectan al costo de mantener clientes)
- Codex solo trabaja cuando se le llama (`/codex:rescue` o `/ship`); no hay nada automático.
- En dos tareas pequeñas de hoy no hubo ahorro: la tarea 002 (arreglo de lint de 4 líneas) costó a Codex ≈ 604.000 tokens totales y la terminó Claude.
- Regla propuesta: delegar a Codex solo tareas de unas 100 líneas o más, o de varios archivos; los cambios pequeños los hace Claude directo. (Falta escribirla en `~/.claude/CLAUDE.md`.)
- Cuántos clientes aguanta un solo plan Max de 100 USD **no está medido**.

## Riesgos abiertos
- Capacidad del plan de Claude con varios clientes a la vez.
- Datos personales (fotos de pasaportes y datos de huéspedes): contrato, política de privacidad, copias de seguridad.
- Quién es dueño de las cuentas de Supabase/Vercel (recomendado: el cliente).
- Soporte fuera de horario: Claude no atiende solo.
- Términos de PriceLabs, Airbnb y Vrbo al usar sus datos para otros dueños.

## Preguntas sin responder
1. ¿Clientes solo de Panamá o también de otros países (impuestos, idioma, moneda)?
2. ¿Cuántos clientes se esperan en los primeros meses y hay un piloto comprometido?
3. ¿Precio final de la instalación y de la mensualidad?
4. ¿PriceLabs lo paga el cliente o Ivan?
5. ¿Cuántas horas lleva realmente instalar un cliente? (medirlo con el piloto)

## Pasos siguientes propuestos
1. Auditar todo lo específico de Casa Randa y listar qué hay que parametrizar (marca, tarifas, comisiones, textos, países/impuestos).
2. Diseñar el "kit de cliente": un archivo de configuración por cliente en vez de constantes en el código.
3. Probar con un segundo cliente real, midiendo horas y tokens.
4. Fijar precios con los datos del piloto y redactar contrato y política de privacidad.

## Prompt para empezar el otro chat
> Lee `docs/escalabilidad-casa-randa-handoff.md` y `docs/modelo-reventa-costos.md`. Quiero hacer el paso 1: auditar el repositorio y listar todo lo específico de Casa Randa que habría que parametrizar para vender una copia a otro dueño de vivienda de renta corta, con una estimación de esfuerzo por área. No cambies código todavía.
