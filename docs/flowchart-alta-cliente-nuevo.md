# Flowchart: qué se necesita para dar de alta a un cliente nuevo (web + intranet)

Fecha: 2026-10-05. Camino A de `docs/modelo-reventa-costos.md`: una instalación (copia) por cliente. Las rutas y nombres salen del repo actual; la lista de cosas específicas de Casa Randa sigue pendiente de auditar (paso 2 de ese documento), así que el bloque 3 es una primera lista, no definitiva.

```mermaid
flowchart TD
    subgraph P1["1. Antes de empezar (lo aporta el cliente)"]
        A1["Contrato, privacidad, soporte"]
        A2["Datos de la propiedad<br/>habitaciones, reglas, dirección, fotos, textos ES/EN"]
        A3["Reglas de negocio<br/>tarifa base, huéspedes incluidos, impuestos, comisiones"]
        A4["Accesos<br/>URL iCal Airbnb/Vrbo, cuenta PriceLabs + API key"]
        A5["Marca: logo, colores, dominio"]
    end

    subgraph P2["2. Cuentas e infraestructura (a nombre del cliente)"]
        B1["Copia del repositorio (GitHub)"]
        B2["Supabase Pro<br/>un proyecto"]
        B3["Vercel Pro<br/>dos proyectos: web e intranet"]
        B4["Dominio + DNS"]
        B5["Correo SMTP transaccional<br/>buzón booking@"]
    end

    subgraph P3["3. Parametrizar el código"]
        C1["packages/data<br/>casa, habitaciones, distancias, dirección"]
        C2["packages/pricing<br/>tarifa base, huéspedes incluidos, extra por huésped, mínimo de noches"]
        C3["Comisiones y liquidación<br/>importar-reservas, contabilidad, Excel"]
        C4["Textos y SEO<br/>JsonLd, llms.txt, sitemap, metadatos ES/EN"]
        C5["Marca<br/>tokens de globals.css, logo, fuentes"]
        C6["Países, moneda, impuestos y correos<br/>plantillas de bienvenida y solicitud"]
    end

    subgraph P4["4. Base de datos y almacenamiento"]
        D1["Aplicar migraciones 0001 a la última"]
        D2["Crear buckets<br/>imagenes-correo, imagenes-tienda, imagenes-guia, cotizaciones, documentos-checkin"]
        D3["Primer usuario administrador<br/>roles y permisos"]
    end

    subgraph P5["5. Variables de entorno (web e intranet)"]
        E1["Supabase: URL, anon key, service role, DATABASE_URL"]
        E2["Sync: SYNC_SECRET, CRON_SECRET, ICAL_EXPORT_KEY"]
        E3["Calendarios y tarifas: AIRBNB_ICAL_URL, VRBO_ICAL_URL, PRICELABS_*"]
        E4["Correo: SMTP_HOST, PORT, USER, PASS"]
        E5["Opcional: WhatsApp Cloud API, NEXT_PUBLIC_INTRANET_URL"]
    end

    subgraph P6["6. Contenido y datos iniciales"]
        F1["Fotos optimizadas en apps/web/public/images"]
        F2["Guía local: lugares en Qué hacer"]
        F3["Catálogo de la tienda + cupón de bienvenida"]
        F4["Reservas históricas y contactos<br/>importar CSV/Excel"]
    end

    subgraph P7["7. Integraciones"]
        G1["Sync iCal entrada<br/>cron diario en Vercel"]
        G2["Feed iCal de salida hacia Airbnb/Vrbo"]
        G3["Sync PriceLabs<br/>manual o programado"]
    end

    subgraph P8["8. Pruebas y lanzamiento"]
        H1["Probar flujos<br/>solicitud, disponibilidad, tienda, check-in, cotización por correo"]
        H2["Dominio, HTTPS y SEO<br/>hreflang, sitemap, robots"]
        H3["Políticas de privacidad y consentimientos"]
        H4["Copias de seguridad de la base"]
    end

    subgraph P9["9. Entrega y operación"]
        I1["Capacitación al cliente"]
        I2["Soporte y mejoras mensuales"]
    end

    P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9

    A2 -.-> C1
    A3 -.-> C2
    A3 -.-> C3
    A4 -.-> E3
    A5 -.-> C5
    A5 -.-> B4
    B2 -.-> D1
    B3 -.-> E1
    B5 -.-> E4
```

## Lectura rápida
- Línea continua: el orden de las fases. Línea punteada: qué dato de una fase alimenta a cuál.
- Lo que el cliente debe tener antes de que empiece el trabajo: contrato, datos de la casa, accesos a Airbnb/Vrbo y PriceLabs, dominio. Sin eso, las fases 3 y 7 se bloquean.
- Lo más largo suele ser la fase 3 (parametrizar) y la 6 (fotos y textos); conviene medir las horas reales en el piloto.
