# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The new homepage for `randahome.com` (Casa Randa, a 6-bedroom whole-house rental in Diablo Heights, Panamá City). It's a Next.js (App Router) + React + TypeScript project, built with pnpm.

The original static HTML/CSS/JS prototype — the source of truth for content, copy, pricing logic, and the design token values — lives untouched in [legacy-static/](legacy-static/) (see its own [LEEME.md](legacy-static/LEEME.md)). Port content and logic out of it section by section rather than starting from scratch; don't delete it until the Next.js version covers everything it does.

## Commands

```bash
pnpm dev          # start the dev server (localhost:3000)
pnpm build         # production build
pnpm start         # run the production build
pnpm lint          # eslint
```

Requires Node.js (installed here via nvm — run `. ~/.nvm/nvm.sh` first in a new shell if `node`/`pnpm` aren't found) and pnpm (via corepack: `corepack enable && corepack prepare pnpm@latest --activate`).

There is no test suite yet.

## Architecture

- **`src/data/house.ts`** — all facts about the house as typed constants (`ROOMS`, `COMMON_ES`/`COMMON_EN`, `NOT_ES`/`NOT_EN`, `DIST`, `SCORES`, `VS`, `ADDRESS`), ported 1:1 from the prototype's `js/casa-randa.js`. Edit these, not JSX, to change facts about the property.
- **`src/lib/quote.ts`** — the direct-booking pricing engine (`computeQuote`), ported from the prototype's `renderQuote()` into pure, typed, DOM-free functions. `RATE` (520 USD/night) is a placeholder; production value comes from PriceLabs (see the porting notes below).
- **`src/lib/i18n/LanguageProvider.tsx`** — bilingual ES/EN state via React context (`useLanguage()` → `{ lang, setLang, t, money }`), replacing the prototype's `data-en`/`data-es` attribute-swap pattern. Bilingual strings are typed as `{ es, en }` pairs (`Bilingual` in `src/types/house.ts`); use `t(pair)` to resolve one for the current language. This is a lightweight scaffold — if the site grows into real per-language routing/SEO, migrate to `next-intl` rather than extending this context indefinitely.
- **`src/components/ui/`** — small reusable primitives (e.g. `LangToggle`).
- **`src/components/sections/`** — one component per homepage section (`Hero`, `RoomsTable` exist; the rest — direct-booking quote calculator, neighborhood/distances, reviews, extras, footer — still need to be ported from `legacy-static/index.html`, following the same data-driven pattern). Compose them in `src/app/page.tsx`.
- **`src/components/JsonLd.tsx`** — schema.org `LodgingBusiness` structured data for search/AI answer engines, rendered server-side. Keep in sync with `src/data/house.ts`.
- **SEO/AIO**: `src/app/layout.tsx` carries the Metadata API config (title template, OpenGraph, Twitter card, canonical/hreflang stubs for `/` and `/en`). `src/app/sitemap.ts` and `src/app/robots.ts` are the Next.js metadata-route equivalents of `sitemap.xml`/`robots.txt`. `public/llms.txt` is a plain-language summary for AI crawlers/answer engines — keep it in sync with `src/data/house.ts` too.
- **Design tokens** live in `src/app/globals.css` as CSS custom properties consumed via Tailwind v4's `@theme inline` (`--color-ground`, `--color-panel`, `--color-ink`, `--color-caoba`, `--color-lamp-fill`, `--color-night`), light values in `:root` with a `prefers-color-scheme: dark` override — same palette as the original prototype (see its README for the rationale: green siding, white trim, mahogany, amber patio light). Fonts are Archivo (`--font-archivo`, `--font-sans`) for display/UI and Source Serif 4 (`--font-source-serif`, `--font-serif`) for body copy, loaded via `next/font/google` in `layout.tsx` — no external `<link>` tags.
- Images live in `public/images/` (moved from the prototype's `img/`) and should be rendered with `next/image`, not `<img>`, for automatic optimization.

## Known-incomplete parts

- Only `Hero` and `RoomsTable` are ported from the static prototype. The rest of `legacy-static/index.html` (direct-booking quote calculator UI, neighborhood/distances, reviews, extras, footer) still needs porting — `src/lib/quote.ts` already has the pricing logic ready to wire into a quote-calculator component.
- iCal availability is not wired up.
- Links to the shop, Panama guide, and WhatsApp are still placeholders.
- `RATE` in `src/lib/quote.ts` is a fixed example value, not the real PriceLabs price.
- No `/en` route exists yet — the `alternates.languages` entry in `layout.tsx` points to it in anticipation of real per-locale routing (see the i18n note above).
- 2 of 8 photos in `public/images/` are reused across rooms in the original content; several rooms and a comedor-for-14 shot are still missing photography.

## Porting target (unchanged from the prototype)

This is itself meant to be hand-ported into a WordPress theme (`casa-randa-code-067-date-picker` on staging) once finished: bilingual pairs become `casa_randa_text(en, es)` calls in `front-page.php`, and the `RATE` constant is replaced by a call to the `casa_randa_preview_quote` endpoint. See [legacy-static/LEEME.md](legacy-static/LEEME.md) for the full original port checklist.
