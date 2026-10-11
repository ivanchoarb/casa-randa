# 009 - pricing: separar fees de Banco General de la lógica de cotización

## Objetivo
`computeQuote` asume las tarifas de Banco General Panama hardcodeadas. Un cliente
que use otro procesador (Stripe, Clip, PayU) necesita sus propios valores.
Hacer `cardFees` un parámetro opcional con los valores BG como default — sin
breaking change, sin migración de DB.

## Archivos a tocar

### `packages/pricing/src/quote.ts`
1. Exportar `CardFeeConfig` interface:
   ```ts
   export interface CardFeeConfig {
     feePct: number;  // porcentaje del monto (ej. 0.035)
     flatFee: number; // cargo fijo por transacción (ej. 0.50)
     taxPct: number;  // impuesto sobre la comisión del procesador (ej. 0.07)
   }
   ```
2. Exportar `BG_FEES: CardFeeConfig` con los valores actuales:
   ```ts
   export const BG_FEES: CardFeeConfig = {
     feePct: BG_CARD_FEE_PCT,
     flatFee: BG_CARD_FEE_FLAT,
     taxPct: BG_ITBMS_ON_FEE,
   };
   ```
3. `grossUpForCardFees` recibe `fees: CardFeeConfig` en vez de usar las constantes globales.
4. `QuoteInput` añade `cardFees?: CardFeeConfig`.
5. `computeQuote` usa `input.cardFees ?? BG_FEES`.

## Criterios de aceptación
- [ ] `BG_CARD_FEE_PCT`, `BG_CARD_FEE_FLAT`, `BG_ITBMS_ON_FEE` siguen exportadas (no breaking)
- [ ] `computeQuote` sin `cardFees` produce el mismo resultado que antes
- [ ] `computeQuote` con `cardFees: { feePct: 0, flatFee: 0, taxPct: 0 }` no añade surcharge

## Fuera de alcance
- No mover `RATE`, `CLEANING`, `TAX` ni otras constantes
- No añadir UI de configuración
- No migración de DB (los fees de BG quedan como default en el código)

## Verificación
```
cd /Users/ivandario/Documents/proyectos/casa-randa
grep -n "BG_CARD_FEE\|BG_ITBMS\|grossUpForCardFees" packages/pricing/src/quote.ts
```
Debe mostrar las constantes exportadas y la función usando el parámetro.

## Resultado
