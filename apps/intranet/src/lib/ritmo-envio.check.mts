// Verificación rápida (sin framework): node --experimental-strip-types src/lib/ritmo-envio.check.mts
import assert from "node:assert/strict";
import { esperaNecesaria, esErrorTransitorio } from "./ritmo-envio.ts";

const ahora = Date.parse("2026-10-01T16:00:00Z");
const hace = (s: number) => new Date(ahora - s * 1000).toISOString();

assert.equal(esperaNecesaria([], ahora, 20, 15), null, "sin envíos previos se puede enviar");
assert.deepEqual(esperaNecesaria([hace(5)], ahora, 20, 15), { motivo: "espaciado", esperarSegundos: 15 }, "5 s desde el último: faltan 15");
assert.equal(esperaNecesaria([hace(25)], ahora, 20, 15), null, "25 s desde el último: ya se puede");
// 15 envíos en la última hora: el cupo se libera cuando el más antiguo de ellos cumple 1 h
const quince = Array.from({ length: 15 }, (_, i) => hace(3000 + i * 10)); // entre 50 y 52,3 min atrás
const e = esperaNecesaria(quince, ahora, 20, 15);
assert.equal(e?.motivo, "tope_hora");
assert.equal(e?.esperarSegundos, 3600 - (3000 + 14 * 10), "espera hasta que el 15.º más reciente cumpla 1 h");
assert.equal(esperaNecesaria([hace(4000)], ahora, 20, 1), null, "un envío de hace más de 1 h no cuenta para el tope");
assert.equal(esErrorTransitorio(new Error("550-5.5.1 You have sent too much mail. Try again later")), true);
assert.equal(esErrorTransitorio(Object.assign(new Error("x"), { responseCode: 451 })), true);
assert.equal(esErrorTransitorio(new Error("550 5.1.1 User unknown")), false);
console.log("ritmo-envio: todo bien");
