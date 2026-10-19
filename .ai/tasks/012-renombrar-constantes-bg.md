# 012 - Renombrar constantes BG_* a nombres genéricos en packages/pricing

## Objetivo
BG_CARD_FEE_PCT, BG_CARD_FEE_FLAT, BG_ITBMS_ON_FEE y BG_FEES hacen referencia
explícita a Banco General de Panamá. SuperHost se usará en Colombia, México y
cualquier país — el procesador de pago lo elige el cliente. Renombrar a nombres
neutros; el comment del JSDoc actualizado para explicar el patrón sin mencionar BG.

## Cambios en packages/pricing/src/quote.ts
- BG_CARD_FEE_PCT  → DEFAULT_CARD_FEE_PCT
- BG_CARD_FEE_FLAT → DEFAULT_CARD_FEE_FLAT
- BG_ITBMS_ON_FEE  → DEFAULT_CARD_FEE_TAX
- BG_FEES          → DEFAULT_FEES
- Comentario JSDoc actualizado: sin mencionar "Banco General" ni "ITBMS" (impuesto específico de Panamá)

## Criterios de aceptación
- [ ] grep "BG_" packages/pricing/src/quote.ts devuelve vacío
- [ ] Las 4 constantes siguen exportadas con los nuevos nombres
- [ ] DEFAULT_FEES sigue siendo el fallback en computeQuote

## Verificación
grep "BG_" packages/pricing/src/quote.ts

## Resultado
