# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The replacement for `staging.randahome.com` (Casa Randa, a 6-bedroom whole-house rental in Diablo Heights, Panamá City) — currently a WordPress site + WooCommerce store + a custom intranet. This repo is a **pnpm + Turborepo monorepo** replacing all of it: the public site now, an intranet app to come. See [docs/arquitectura-migracion.md](docs/arquitectura-migracion.md) (stack) and [docs/logica-negocio-y-flujos.md](docs/logica-negocio-y-flujos.md) (entities, end-to-end flows, integration map, including the full workflow diagram) for the full plan — this file only covers how the code here is organized.

The original static HTML/CSS/JS prototype — still the source of truth for content, copy, and the design token values not yet ported — lives untouched in [legacy-static/](legacy-static/) (see its own [LEEME.md](legacy-static/LEEME.md)).

## Repo layout

```
apps/
  web/            The public site (Next.js, App Router) — what was the whole repo before it became a monorepo
  intranet/       Reservations/accounting/ops back office — scaffolded (Next.js + Refine + Supabase), see below
packages/
  data/           @casa-randa/data — house facts (ROOMS, DIST, SCORES, VS, ADDRESS, ...) and their types, shared by every app
  pricing/        @casa-randa/pricing — the direct-booking pricing engine (computeQuote), shared by every app
docs/             Architecture, business logic, and decision-log Markdown (see "Documentation practice" below)
legacy-static/    The original static prototype, kept as reference until fully ported
```

**Working on just the site?** Everything under `apps/web/` behaves like a normal standalone Next.js app — `src/app`, `src/components`, `src/app/globals.css`, etc. all live there now (moved from the repo root on 2026-09-11 when this became a monorepo). It imports shared facts/pricing from `@casa-randa/data` and `@casa-randa/pricing` instead of local `src/data`/`src/lib/quote.ts` — those packages moved out from under `apps/web/src`.

## Commands

Run from the repo root — `turbo` fans these out to whichever app(s) they apply to:

```bash
pnpm dev          # starts every app's dev server (apps/web on :3000)
pnpm build        # production build, all apps
pnpm start        # run the production build(s)
pnpm lint         # eslint, all apps
```

To target just one app: `pnpm --filter @casa-randa/web dev` (this is what `.claude/launch.json` uses for the preview server).

Requires Node.js (installed here via nvm — run `. ~/.nvm/nvm.sh` first in a new shell if `node`/`pnpm` aren't found) and pnpm (via corepack: `corepack enable && corepack prepare pnpm@latest --activate`).

There is no test suite yet.

## Documentation practice

Decisions and plans get written to a Markdown file in [docs/](docs/), not left to live only in chat history. When a session produces a real plan, architecture decision, or analysis worth remembering, save it there (topic-named file, dated inside the doc) instead of treating the conversation as the record. [docs/arquitectura-migracion.md](docs/arquitectura-migracion.md) (which tools, and the running decisions log) and [docs/logica-negocio-y-flujos.md](docs/logica-negocio-y-flujos.md) (how they connect — entities, end-to-end flows, integration map, workflow diagram) are the first of these.

## Architecture — `apps/web` (the public site)

- **`@casa-randa/data`** (`packages/data/src/`) — all facts about the house as typed constants (`ROOMS`, `COMMON_ES`/`COMMON_EN`, `NOT_ES`/`NOT_EN`, `DIST`, `SCORES`, `VS`, `ADDRESS`) plus their types (`house.ts`, `types.ts`), ported 1:1 from the prototype's `js/casa-randa.js`. Edit these, not JSX, to change facts about the property. Shared with `apps/intranet` once that exists — that's why it's a package and not `apps/web/src/data`.
- **`@casa-randa/pricing`** (`packages/pricing/src/quote.ts`) — the direct-booking pricing engine (`computeQuote`), ported from the prototype's `renderQuote()` into pure, typed, DOM-free functions. `RATE` (520 USD/night) is a placeholder; production value comes from PriceLabs (see `docs/logica-negocio-y-flujos.md`).
- **`apps/web/src/lib/i18n/LanguageProvider.tsx`** — bilingual ES/EN state via React context (`useLanguage()` → `{ lang, setLang, t, money }`), replacing the prototype's `data-en`/`data-es` attribute-swap pattern. Bilingual strings are typed as `{ es, en }` pairs (`Bilingual` from `@casa-randa/data`); use `t(pair)` to resolve one for the current language. Web-only — the intranet is Spanish-only, not shared. This is a lightweight scaffold — if the site grows into real per-language routing/SEO, migrate to `next-intl` rather than extending this context indefinitely.
- **`apps/web/src/lib/booking/BookingProvider.tsx`** — React context sharing check-in/out/pax/cancellation/payment-plan state between `AvailabilityBar` (in the hero) and `QuoteCalculator` (further down the page), mirroring the prototype's behavior where editing the top fields updates the quote below. Wraps the whole page in `app/page.tsx`.
- **`apps/web/src/components/ui/`** — `LangToggle`, `SiteHeader`, `SiteFooter`, `PaxSelect` (the 2–16 guests `<select>`, shared by the hero and the quote calculator).
- **`apps/web/src/components/sections/`** — one component per homepage section, all ported from `legacy-static/index.html` now: `Hero`, `AvailabilityBar`, `House` (wraps `RoomsTable` + amenities), `QuoteCalculator` (the direct-booking cotizador, reads `computeQuote` from `@casa-randa/pricing`), `Neighborhood`, `Reviews`, `Extras`. Composed in `apps/web/src/app/page.tsx`.
- **`apps/web/src/components/JsonLd.tsx`** — schema.org `LodgingBusiness` structured data for search/AI answer engines, rendered server-side. Keep in sync with `@casa-randa/data`.
- **SEO/AIO**: `apps/web/src/app/layout.tsx` carries the Metadata API config (title template, OpenGraph, Twitter card, canonical/hreflang stubs for `/` and `/en`). `apps/web/src/app/sitemap.ts` and `robots.ts` are the Next.js metadata-route equivalents of `sitemap.xml`/`robots.txt`. `apps/web/public/llms.txt` is a plain-language summary for AI crawlers/answer engines — keep it in sync with `@casa-randa/data` too.
- **Design tokens** live in `apps/web/src/app/globals.css` as CSS custom properties consumed via Tailwind v4's `@theme inline`: `--ground`/`--panel`/`--ink`/`--ink-2`/`--caoba` flip under `prefers-color-scheme: dark`; `--lamp-fill`, `--night`, `--night-2`, `--on-dark`, `--on-dark-2` do **not** — they're for surfaces that stay dark in both themes (hero, availability bar, quote ticket, reviews, footer), so text on those surfaces should use `--on-dark`/`--on-dark-2`, never `--ink`. Same palette as the original prototype (see its README for the rationale: green siding, white trim, mahogany, amber patio light). Fonts are Archivo (`--font-archivo`, `--font-sans`) for display/UI and Source Serif 4 (`--font-source-serif`, `--font-serif`) for body copy, loaded via `next/font/google` in `layout.tsx` — no external `<link>` tags.
- **Scroll/entrance motion** (bottom of `globals.css`) is CSS-only and progressively enhanced: hero parallax and the gallery zoom use `animation-timeline: scroll()` gated behind `@supports`, the hero's entrance is a staggered `animation-delay` sequence, and the review score bars are toggled via a `.is-filled` class flipped from React on intersection (see `Reviews.tsx`). Everything is wrapped in `@media (prefers-reduced-motion: no-preference)` with a matching `reduce` block that hard-disables it — don't add a new animation without both halves.
- Images live in `apps/web/public/images/` (moved from the prototype's `img/`) and should be rendered with `next/image`, not `<img>`, for automatic optimization.
- `next.config.ts` sets `transpilePackages: ["@casa-randa/data", "@casa-randa/pricing"]` — required for Next.js to compile the workspace packages' TypeScript source directly (they ship no build step, just `.ts`).

## Architecture — `apps/intranet`

Scaffolded 2026-09-11: Next.js (App Router) + [Refine](https://github.com/refinedev/refine) (`@refinedev/core`, MIT — not the same product as the paid "Refine AI" app generator on `refine.dev/pricing`, see the decisions log in `docs/arquitectura-migracion.md`), backed by Supabase via `@refinedev/supabase`. Auth-gated: unauthenticated visits to any route under `(app)/` redirect to `/login`. **All 7 sidebar modules are wired to real data as of 2026-09-11**, connected to and verified against an actual Supabase project (`apps/intranet/.env.local`, gitignored — not committed).

- **`src/lib/supabase-client.ts`** / **`src/lib/auth-provider.ts`** — the Supabase client and a hand-written Refine `AuthProvider` (the `@refinedev/supabase` package ships a data provider but not an auth provider). Needs real credentials in `.env.local` (copy from `.env.example`) — without them the app still builds and runs, but every data call fails; see `supabase/README.md`.
- **`src/app/providers.tsx`** — the `<Refine>` setup: router (`@refinedev/nextjs-router/app`), data provider, auth provider, and one `resource` per module (`reservas`, `bloqueos_calendario`, `tareas_operacion`, `gastos`, `movimientos_bancarios`, `plan_compras`, `perfiles`), matching the tables in `supabase/migrations/`.
- **`src/app/(app)/`** — the protected route group (`layout.tsx` wraps children in `<Authenticated>` + `AppShell`). All 7 modules read/write real data:
  - `reservas` — `useTable` on `reservas`, the reference pattern for the rest.
  - The `Inicio` dashboard (`(app)/page.tsx`, outside the 7 sidebar modules) computes reserva en curso / ingresos del mes / ingresos acumulados / saldo neto del propietario the same way `contabilidad` does, so the two never disagree.
  - `calendario` groups `bloqueos_calendario` by month, source badge per row.
  - `operacion` pulls `tareas_operacion` joined with its `reservas` row via `meta: { select: "*, reservas(...)" }` (confirmed `@refinedev/supabase` passes `meta.select` straight to `supabase-js`'s `.select()` — read `node_modules/@refinedev/supabase/dist/index.mjs` before relying on it) and groups by reserva into a "X/3 listas" checklist.
  - `usuarios` lists `perfiles` and lets an `administrador` change anyone's role inline (`useUpdate`); a non-admin only sees their own row (RLS `ver_propio_perfil`) — that's expected, not a bug. Needed adding an `email` column to `perfiles` (`supabase/migrations/0001_perfiles.sql`) because `auth.users` isn't queryable via PostgREST.
  - `analisis` covers `plan_compras` (the house's own procurement — capex, not the guest store) and `codigos_descuento`, each with an inline create form (`useCreate`). The year-over-year comparative stats from the real WordPress screen need actual reservation data to aggregate, so that part is deferred rather than faked.
  - `contabilidad` (Fase 4, built last, by hand — highest financial risk): summary cards computed client-side from `reservas`/`gastos` (ingreso neto del año, comisión del mes por persona by month of `entrada`, saldo neto del propietario), `anticipos_comision` CRUD (Iván only — see below), `gastos` CRUD, and a filterable financial view of `reservas`. Deliberately **not** built: emailing liquidaciones (needs the Dongee SMTP wiring from Fase 0) and Airbnb/Vrbo CSV import (no real sample export to verify the column format against — noted in the page instead of guessed at).
  - **2026-09-11: real production data imported, and a real calc bug fixed, by diffing against the live legacy screen** (`staging.randahome.com/intranet/contabilidad/` and `/intranet/`, still running WordPress). Scraped and transcribed the 69 real reservas (10 upcoming, 48 past, 11 cancelled), 2 `gastos`, and 2 `anticipos_comision` shown there, validated the transcription by reproducing every total staging displays (September commissions, annual accumulated, owner's balance — 9 independent figures, all exact) before inserting anything via the service-role client. In the process found that "Ingresos netos acumulados" must sum `reservas.recibido` (`bruto - comision_plataforma`, a generated column that already existed in the schema) — **not** `neto` (which also subtracts `comision_marquelda`/`comision_ivan`). Both `contabilidad` and `Inicio` were summing `neto`, which double-subtracted those commissions from the owner's balance; fixed in both places (`ResumenFinanciero` in `contabilidad/page.tsx`, and `(app)/page.tsx`) since they're required to never disagree. Six summary cards now match staging's layout (ingresos acumulados, comisión del mes × 2 personas, comisión acumulada del año × 2 personas, saldo del propietario), plus the `N reservas registradas` line. `anticipos_comision` on staging only tracks Iván (Marquelda takes no advances) and has a year selector — the UI now matches that (schema still supports both personas). Six of staging's same-day "Ambar Sanchez" direct-transfer rows had `entrada = salida`, which fails `reservas`' `salida_despues_de_entrada` check constraint; imported with `salida` bumped by one day (financial fields untouched) rather than dropped or left unconstrained.
  - `conciliacion`: register a bank deposit against an unmatched confirmed/completed `reserva` (auto-excluded from the picker once matched); estado (`conciliado`/`diferencia`) is computed by comparing the entered amount to the reserva's `neto`. Verified live against the real Supabase project: a $920/$920 match correctly produced `conciliado` with $0 difference. Real bank-arrival confirmation and all Airbnb/Vrbo-sourced reconciliation stay manual by design (no Banco General API, see `docs/logica-negocio-y-flujos.md`).
  - **API note for `@refinedev/core` 5.x**: `useCreate`/`useUpdate`/`useDelete` return `{ mutate, mutateAsync, mutation }`, *not* a flat `{ mutate, isPending, ... }` like older Refine versions — the loading/error state lives at `mutation.isPending` etc. (`definitions/types/index.d.mts`). Caught this via `pnpm build`'s type check, not assumption.
- **`src/components/layout/AppShell.tsx`** — sidebar (from Refine's `useMenu()`), identity (`useGetIdentity()`), logout (`useLogout()`).
- **`src/app/api/sync/ical`, `src/app/api/ical/[canal]`, `src/app/api/sync/pricelabs`** — Fase 2's background jobs, as plain Next.js Route Handlers rather than a separate service, so any scheduler (Vercel Cron, an external cron, a manual `curl`) can trigger them over HTTP. `lib/supabase-admin.ts` is a **service-role** Supabase client (bypasses RLS) — separate from `lib/supabase-client.ts`'s anon client, and server-only (never import it from a `"use client"` file). `lib/sync-auth.ts` gates the `/api/sync/*` routes behind `SYNC_SECRET` (`Authorization: Bearer` or `?secret=`); the outbound `/api/ical/[canal]` feed is gated behind `ICAL_EXPORT_KEY` in the URL instead, since Airbnb/Vrbo need to fetch it as a plain calendar-subscription link. The iCal sync only ever deletes+reinserts rows for the `fuente` it just fetched — it never touches `fuente="directo"` rows, which is the actual fix for defecto D2 (see `docs/logica-negocio-y-flujos.md`), not just a description of it. **The PriceLabs response parsing in `api/sync/pricelabs/route.ts` is an unverified guess** (`listings[0].data[]`) — no real API key was available to test against; it logs the raw response on a shape mismatch instead of failing silently, but should be corrected against a real response before being trusted.
- Root `layout.tsx` wraps `<Providers>` in `<Suspense>` — required because `@refinedev/nextjs-router`'s `RouteChangeHandler` calls `useSearchParams()` internally, which otherwise breaks static generation of Next's built-in `/_not-found` page.
- Spanish-only, one typeface (Archivo, no Source Serif) — see the comment in its `globals.css`: this is an "Operate" surface (internal tool), not a marketing page, so it doesn't share `apps/web`'s bilingual/serif treatment.
- The exact permissions for the "empleado" role in `supabase/migrations/0006_rls.sql` are a first-pass guess, not confirmed against the real WordPress `portal-de-empleados` role — flagged in `supabase/README.md`.

## Known-incomplete parts

`apps/web` — the homepage is now fully ported (all sections from `legacy-static/index.html` exist), but nothing on it talks to a backend yet:

- **No real availability or dynamic pricing.** `AvailabilityBar` and `QuoteCalculator` are pure client-side UI state (`BookingProvider`) — they don't read `bloqueos_calendario` or `tarifas_diarias` from Supabase, so a guest can "cotizar" dates that are already booked. `QuoteCalculator` still computes off the flat `RATE` (520 USD/night) placeholder in `@casa-randa/pricing`, not a real PriceLabs rate.
- **The direct-booking request doesn't submit anywhere.** "Solicitar estas fechas" in `QuoteCalculator` is still `href="#"` — it doesn't create a `Solicitud` row or hit any endpoint. This is the actual gap between "site looks done" and "Flujo 1 in `docs/logica-negocio-y-flujos.md` works."
- Links to the shop, Panama guide, and WhatsApp are still placeholders.
- No `/en` route exists yet — the `alternates.languages` entry in `layout.tsx` points to it in anticipation of real per-locale routing (see the i18n note above).
- 2 of 8 photos in `apps/web/public/images/` are reused across rooms in the original content; several rooms and a comedor-for-14 shot are still missing photography.

`apps/intranet` — connected to a real Supabase project and all 7 modules verified working (2026-09-11), but:

- No liquidación email sending, no Airbnb/Vrbo CSV import (see the `contabilidad` note above).
- RLS employee-role permissions in `supabase/migrations/0006_rls.sql` are an unconfirmed first pass.
- The Fase 2 iCal sync and PriceLabs bridge are coded (`apps/intranet/src/app/api/sync/ical`, `api/ical/[canal]`, `api/sync/pricelabs`) but can't run live yet — need `SUPABASE_SERVICE_ROLE_KEY`, `AIRBNB_ICAL_URL`, `VRBO_ICAL_URL`, `PRICELABS_API_KEY`/`PRICELABS_LISTING_ID` in `apps/intranet/.env.local` (see `.env.example` there) plus a scheduler to actually call them periodically once deployed. Until then `bloqueos_calendario`/`tarifas_diarias` only ever have what's entered by hand, which is what `apps/web`'s availability/pricing gap above is waiting on.
