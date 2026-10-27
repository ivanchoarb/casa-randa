// Verificación rápida (sin framework): node --experimental-strip-types src/lib/gasto.check.mts
import assert from "node:assert/strict";
import { valoresGasto } from "./gasto.ts";

const base = {
  fecha: "2026-10-27",
  categoria: "mantenimiento",
  concepto: "Fumigación",
  proveedor: "Proveedor",
  valor: "45.50",
  medioPago: "Transferencia",
};

const valido = valoresGasto(base);
assert.equal(valido.ok, true, "acepta un gasto válido");
assert.deepEqual(
  valido.ok && valido.values,
  {
    fecha: "2026-10-27",
    categoria: "mantenimiento",
    concepto: "Fumigación",
    proveedor: "Proveedor",
    valor: 45.5,
    medio_pago: "Transferencia",
  },
  "devuelve valores listos para Supabase",
);

assert.equal(valoresGasto({ ...base, concepto: "" }).ok, false, "rechaza concepto vacío");
assert.equal(valoresGasto({ ...base, concepto: "   " }).ok, false, "rechaza concepto con espacios");
assert.equal(valoresGasto({ ...base, concepto: "x".repeat(201) }).ok, false, "rechaza concepto de más de 200 caracteres");
assert.equal(valoresGasto({ ...base, valor: "0" }).ok, false, "rechaza valor cero");
assert.equal(valoresGasto({ ...base, valor: "-1" }).ok, false, "rechaza valor negativo");
assert.equal(valoresGasto({ ...base, valor: "NaN" }).ok, false, "rechaza NaN");
assert.equal(valoresGasto({ ...base, valor: "" }).ok, false, "rechaza valor vacío");
assert.equal(valoresGasto({ ...base, fecha: "" }).ok, false, "rechaza fecha vacía");
assert.equal(valoresGasto({ ...base, fecha: "27/10/2026" }).ok, false, "rechaza formato de fecha inválido");

const recortado = valoresGasto({
  ...base,
  concepto: "  Fumigación  ",
  proveedor: "  Proveedor  ",
  medioPago: "  Transferencia  ",
});
assert.equal(recortado.ok, true);
assert.equal(recortado.ok && recortado.values.concepto, "Fumigación", "recorta el concepto");
assert.equal(recortado.ok && recortado.values.proveedor, "Proveedor", "recorta el proveedor");
assert.equal(recortado.ok && recortado.values.medio_pago, "Transferencia", "recorta el medio de pago");

const opcionalesVacios = valoresGasto({
  ...base,
  proveedor: "   ",
  medioPago: "  ",
});
assert.equal(opcionalesVacios.ok, true);
assert.equal(opcionalesVacios.ok && opcionalesVacios.values.proveedor, null, "proveedor vacío queda null");
assert.equal(opcionalesVacios.ok && opcionalesVacios.values.medio_pago, null, "medio de pago vacío queda null");

console.log("gasto: todo bien");
