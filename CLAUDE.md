# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static prototype of the new homepage for `randahome.com` (Casa Randa, a 6-bedroom whole-house rental in Diablo Heights, Panamá City), meant to replace the current `staging.randahome.com` homepage. It is a single `index.html` with no build step, no dependencies, no framework, and no server — open `index.html` directly in a browser to work on it. There is no test suite, linter, or package manager in this repo.

## Structure

```
index.html              All markup for the single page
css/casa-randa.css       All design: tokens, typography, layout, light/dark theme
js/casa-randa.js         House data, ES/EN translation, table rendering, and the quote calculator
img/                      8 optimized JPEGs (~1100px, 60–95 kB)
```

Google Fonts (Archivo, Source Serif 4) load from a `<link>` in `index.html`'s `<head>`; the page still works offline, falling back to system fonts.

## Architecture

Everything is driven by one IIFE in `js/casa-randa.js`:

- **Bilingual content, not i18n library**: every translatable element in `index.html` carries a `data-en` attribute holding the English HTML. On load, the script snapshots each element's original (Spanish) innerHTML into a `data-es` attribute, then a `paint()` function swaps `innerHTML` between `data-es`/`data-en` based on the `lang` toggle. New copy must be added as plain Spanish content in the markup plus a matching `data-en="..."` attribute — there's no separate translation file.
- **Data-driven tables**: room details, amenities, distances, review scores, and the direct-vs-platform comparison all live in JS constants at the top of `casa-randa.js` (`ROOMS`, `COMMON_ES`/`COMMON_EN`, `NOT_ES`/`NOT_EN`, `DIST`, `SCORES`, `VS`) and are rendered into empty containers in the HTML (e.g. `#roomsTable`, `#commonList`, `#distList`, `#bars`, `#vsTable`) by `renderTables()`. Edit these constants rather than the HTML to change facts about the house.
- **Quote calculator**: `renderQuote()` implements the actual direct-booking pricing logic — nightly rate × nights, cleaning fee, extra-guest charge past 14 guests, +3%/−5% cancellation adjustment, 10% lodging tax, and 30%/100% payment plan — driven by the constants `RATE`, `CLEANING`, `TAX`, `EXTRA_GUEST`, `FREE_PAX`, `MIN_NIGHTS`, `MAX_PAX`. `RATE` (520 USD) is a placeholder; in production this comes from PriceLabs.
- **Re-render on every state change**: `render()` (= `renderTables()` + `renderQuote()`) reruns on language toggle and on every date/guest/cancellation/payment input change, rather than doing granular DOM updates.
- Date inputs are native `<input type="date">`; a small handler makes clicking anywhere in the field call `showPicker()`.

## Known-incomplete parts (see [LEEME.md](LEEME.md) for the full breakdown)

- iCal availability is not wired up — date fields don't check real availability.
- Links to the shop, Panama guide, and WhatsApp are still `href="#"`.
- `RATE` is a fixed example value, not the real PriceLabs price.
- 2 of 8 photos are reused across rooms; several rooms and the comedor-for-14 shot are still missing.

## Porting target

This prototype is meant to be hand-ported into a WordPress theme (`casa-randa-code-067-date-picker` on staging): `index.html` → `front-page.php` with `data-en` pairs becoming `casa_randa_text(en, es)` calls, CSS/JS enqueued via `functions.php` instead of `<head>` tags, images moved into the theme directory, and `RATE` replaced by a call to the `casa_randa_preview_quote` endpoint. See [LEEME.md](LEEME.md) for the full port checklist.
