# Flowchart: sitio público, Supabase e intranet

Fecha: 2026-10-05. Mapa de cómo se conectan las páginas de `apps/web`, la base de datos y los módulos de `apps/intranet`. Detalle de cada pieza en `CLAUDE.md` y `docs/logica-negocio-y-flujos.md`.

```mermaid
flowchart TD
    V([Huésped / visitante])

    subgraph WEB["Sitio público (apps/web)"]
        H["Inicio /<br/>casa, cotizador, solicitar fechas, popup cupón 5%"]
        EN["/en<br/>home en inglés"]
        T["/tienda<br/>catálogo, pedir con código"]
        C["/check-in<br/>registro con código + ID"]
        Q["/que-hacer-en-panama<br/>guía + página por lugar"]
    end

    V --> H & EN & T & C & Q

    DB[("Supabase<br/>Postgres + RLS, Storage, Auth<br/>solicitudes, reservas, pedidos_tienda,<br/>checkins_huesped, lugares_guia")]

    H -->|solicitud + cupón| DB
    EN --> DB
    T -->|pedido| DB
    C -->|registro + foto ID| DB
    Q -->|lee lugares| DB

    ICAL["iCal Airbnb / Vrbo"] <-->|sync diario| DB
    PL["PriceLabs"] -->|tarifas diarias| DB
    DB -->|correos| SMTP["Correo SMTP booking@"]
    DB -.->|enlace| WA["WhatsApp wa.me"]

    DB --> LOGIN["Intranet: login<br/>roles y permisos"]

    subgraph INTRA["Intranet (apps/intranet)"]
        direction TB
        subgraph LIGADOS["Ligados a la web"]
            RES["Reservas<br/>por estado + solicitudes web"]
            MKT["Marketing<br/>contactos, campañas, bajas"]
            TIE["Tienda<br/>catálogo y fotos"]
            CHK["Check-in<br/>registros + ID"]
            QH["Qué hacer<br/>alta/edición de lugares"]
            MET["Métricas web"]
        end
        subgraph INTERNOS["Solo internos"]
            INI["Inicio<br/>KPIs, próxima reserva"]
            CAL["Calendario<br/>bloqueos iCal"]
            OPE["Operación<br/>tareas por reserva"]
            CON["Contabilidad<br/>gastos, anticipos, importar"]
            CNC["Conciliación<br/>depósitos vs reservas"]
            ANA["Análisis<br/>compras, cupones, comparativo"]
            COT["Cotizaciones<br/>PDF, correo, WhatsApp"]
            USU["Usuarios<br/>roles, permisos, contraseña"]
        end
    end

    LOGIN --> LIGADOS & INTERNOS

    H -.->|"solicitud llega a"| RES
    T -.->|"pedido por correo"| TIE
    C -.->|"registro llega a"| CHK
    Q -.->|"editado en"| QH
    COT --> SMTP
    COT -.-> WA
```

## Lectura rápida
- Línea continua: flujo de datos. Línea punteada: relación con un módulo o un enlace externo.
- La web nunca habla con la intranet directamente: ambas leen y escriben en Supabase.
- No aparecen las rutas auxiliares: `/darse-de-baja`, `/restablecer-password` y `/que-hacer-en-panama/[slug]`.
