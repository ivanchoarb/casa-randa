type EntradaGasto<TCategoria extends string> = {
  fecha: string;
  categoria: TCategoria;
  concepto: string;
  proveedor: string;
  valor: string;
  medioPago: string;
};

export function valoresGasto<TCategoria extends string>(entrada: EntradaGasto<TCategoria>) {
  const concepto = entrada.concepto.trim();
  const valor = Number(entrada.valor);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.fecha)) {
    return { ok: false as const, error: "La fecha es obligatoria y debe tener formato YYYY-MM-DD." };
  }
  if (!concepto) {
    return { ok: false as const, error: "El concepto es obligatorio." };
  }
  if (concepto.length > 200) {
    return { ok: false as const, error: "El concepto no puede superar los 200 caracteres." };
  }
  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false as const, error: "El valor debe ser un número mayor que 0." };
  }

  return {
    ok: true as const,
    values: {
      fecha: entrada.fecha,
      categoria: entrada.categoria,
      concepto,
      proveedor: entrada.proveedor.trim() || null,
      valor,
      medio_pago: entrada.medioPago.trim() || null,
    },
  };
}
