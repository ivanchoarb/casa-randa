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
- **`apps/web/src/components/ui/`** — small reusable primitives (e.g. `LangToggle`).
- **`apps/web/src/components/sections/`** — one component per homepage section (`Hero`, `RoomsTable` exist; the rest — direct-booking quote calculator, neighborhood/distances, reviews, extras, footer — still need to be ported from `legacy-static/index.html`, following the same data-driven pattern). Compose them in `apps/web/src/app/page.tsx`.
- **`apps/web/src/components/JsonLd.tsx`** — schema.org `LodgingBusiness` structured data for search/AI answer engines, rendered server-side. Keep in sync with `@casa-randa/data`.
- **SEO/AIO**: `apps/web/src/app/layout.tsx` carries the Metadata API config (title template, OpenGraph, Twitter card, canonical/hreflang stubs for `/` and `/en`). `apps/web/src/app/sitemap.ts` and `robots.ts` are the Next.js metadata-route equivalents of `sitemap.xml`/`robots.txt`. `apps/web/public/llms.txt` is a plain-language summary for AI crawlers/answer engines — keep it in sync with `@casa-randa/data` too.
- **Design tokens** live in `apps/web/src/app/globals.css` as CSS custom properties consumed via Tailwind v4's `@theme inline` (`--color-ground`, `--color-panel`, `--color-ink`, `--color-caoba`, `--color-lamp-fill`, `--color-night`), light values in `:root` with a `prefers-color-scheme: dark` override — same palette as the original prototype (see its README for the rationale: green siding, white trim, mahogany, amber patio light). Fonts are Archivo (`--font-archivo`, `--font-sans`) for display/UI and Source Serif 4 (`--font-source-serif`, `--font-serif`) for body copy, loaded via `next/font/google` in `layout.tsx` — no external `<link>` tags.
- Images live in `apps/web/public/images/` (moved from the prototype's `img/`) and should be rendered with `next/image`, not `<img>`, for automatic optimization.
- `next.config.ts` sets `transpilePackages: ["@casa-randa/data", "@casa-randa/pricing"]` — required for Next.js to compile the workspace packages' TypeScript source directly (they ship no build step, just `.ts`).

## Architecture — `apps/intranet`

Scaffolded 2026-09-11: Next.js (App Router) + [Refine](https://github.com/refinedev/refine) (`@refinedev/core`, MIT — not the same product as the paid "Refine AI" app generator on `refine.dev/pricing`, see the decisions log in `docs/arquitectura-migracion.md`), backed by Supabase via `@refinedev/supabase`. Auth-gated: unauthenticated visits to any route under `(app)/` redirect to `/login`.

- **`src/lib/supabase-client.ts`** / **`src/lib/auth-provider.ts`** — the Supabase client and a hand-written Refine `AuthProvider` (the `@refinedev/supabase` package ships a data provider but not an auth provider). Needs real credentials in `.env.local` (copy from `.env.example`) — without them the app still builds and runs, but every data call fails; see `supabase/README.md`.
- **`src/app/providers.tsx`** — the `<Refine>` setup: router (`@refinedev/nextjs-router/app`), data provider, auth provider, and one `resource` per module (`reservas`, `bloqueos_calendario`, `tareas_operacion`, `gastos`, `movimientos_bancarios`, `plan_compras`, `perfiles`), matching the tables in `supabase/migrations/`.
- **`src/app/(app)/`** — the protected route group (`layout.tsx` wraps children in `<Authenticated>` + `AppShell`). `reservas/page.tsx` is the one module actually wired to real data (`useTable`) — the reference pattern for the rest. `calendario`, `operacion`, `contabilidad`, `conciliacion`, `analisis`, `usuarios` are intentionally labeled stubs, not generated CRUD — `contabilidad`/`conciliacion` say explicitly why (Fase 4 in `docs/arquitectura-migracion.md`: highest financial risk, built by hand, not with a low-code generator).
- **`src/components/layout/AppShell.tsx`** — sidebar (from Refine's `useMenu()`), identity (`useGetIdentity()`), logout (`useLogout()`).
- Root `layout.tsx` wraps `<Providers>` in `<Suspense>` — required because `@refinedev/nextjs-router`'s `RouteChangeHandler` calls `useSearchParams()` internally, which otherwise breaks static generation of Next's built-in `/_not-found` page.
- Spanish-only, one typeface (Archivo, no Source Serif) — see the comment in its `globals.css`: this is an "Operate" surface (internal tool), not a marketing page, so it doesn't share `apps/web`'s bilingual/serif treatment.
- The exact permissions for the "empleado" role in `supabase/migrations/0006_rls.sql` are a first-pass guess, not confirmed against the real WordPress `portal-de-empleados` role — flagged in `supabase/README.md`.

## Known-incomplete parts

- Only `Hero` and `RoomsTable` are ported from the static prototype. The rest of `legacy-static/index.html` (direct-booking quote calculator UI, neighborhood/distances, reviews, extras, footer) still needs porting — `@casa-randa/pricing` already has the pricing logic ready to wire into a quote-calculator component.
- iCal availability is not wired up.
- Links to the shop, Panama guide, and WhatsApp are still placeholders.
- `RATE` in `@casa-randa/pricing` is a fixed example value, not the real PriceLabs price.
- No `/en` route exists yet — the `alternates.languages` entry in `layout.tsx` points to it in anticipation of real per-locale routing (see the i18n note above).
- 2 of 8 photos in `apps/web/public/images/` are reused across rooms in the original content; several rooms and a comedor-for-14 shot are still missing photography.
- `apps/intranet`: no real Supabase project connected yet (placeholder env vars only); 6 of 7 modules are unbuilt stubs (see above); RLS employee-role permissions are unconfirmed; no CSV import, iCal sync job, or PriceLabs bridge exists yet (those are Fase 2, not started).
