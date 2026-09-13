"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import type { Producto } from "@/lib/tienda";

const CLAVE_SESION = "cr_tienda_codigo_validado";
const RETRASO_POPUP_MS = 5000;

const TODOS = "__todos__";
const OTROS = "__otros__";
type Orden = "sugeridos" | "precio-asc" | "precio-desc" | "nombre";
const OPCIONES_ORDEN: { valor: Orden; es: string; en: string }[] = [
  { valor: "sugeridos", es: "Sugeridos", en: "Suggested" },
  { valor: "precio-asc", es: "Precio: menor a mayor", en: "Price: low to high" },
  { valor: "precio-desc", es: "Precio: mayor a menor", en: "Price: high to low" },
  { valor: "nombre", es: "Nombre A-Z", en: "Name A-Z" },
];

function leerCodigoGuardado(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(CLAVE_SESION);
  } catch {
    return null;
  }
}

/**
 * `productos_tienda` (a diferencia de `@casa-randa/data`) no tiene nombre/
 * descripción bilingües todavía — solo texto en español, tal como está
 * cargado hoy en la base real. Se muestra tal cual en los dos idiomas del
 * sitio en vez de inventar una traducción al inglés que nadie escribió.
 */
export function ShopSections({ productos }: { productos: Producto[] }) {
  const { lang, money } = useLanguage();

  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [categoriaActiva, setCategoriaActiva] = useState<string>(TODOS);
  const [orden, setOrden] = useState<Orden>("sugeridos");
  const [popupAbierto, setPopupAbierto] = useState(false);

  // Categorías presentes en el catálogo real, con su conteo — nada
  // hardcodeado, así que una categoría nueva agregada desde la intranet
  // aparece sola la próxima vez que se cargue esta página. "Otros" agrupa
  // los productos sin categoría asignada (los 3 originales, por ahora).
  const categorias = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const p of productos) {
      const clave = p.categoria?.trim() || OTROS;
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }
    const reales = Array.from(conteo.entries())
      .filter(([clave]) => clave !== OTROS)
      .sort((a, b) => a[0].localeCompare(b[0], "es"));
    const otros = conteo.get(OTROS);
    return [...reales, ...(otros ? ([[OTROS, otros]] as [string, number][]) : [])];
  }, [productos]);

  const productosVisibles = useMemo(() => {
    const filtrados =
      categoriaActiva === TODOS
        ? productos
        : productos.filter((p) => (p.categoria?.trim() || OTROS) === categoriaActiva);
    const copia = [...filtrados];
    if (orden === "precio-asc") copia.sort((a, b) => a.precio - b.precio);
    else if (orden === "precio-desc") copia.sort((a, b) => b.precio - a.precio);
    else if (orden === "nombre") copia.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    // "sugeridos" conserva el orden en que llegó `productos` (created_at,
    // ver obtenerProductosDisponibles en lib/tienda.ts) — no se reordena.
    return copia;
  }, [productos, categoriaActiva, orden]);
  // El código validado se recuerda por pestaña (sessionStorage, no
  // localStorage) — así no hace falta volver a escribirlo si navegan a
  // otra sección y regresan, pero tampoco queda guardado para siempre en
  // un equipo compartido. Se lee en el inicializador de useState (no en
  // un efecto) para no disparar un setState síncrono dentro de un efecto.
  const [validado, setValidado] = useState(() => !!leerCodigoGuardado());
  const [codigo, setCodigo] = useState(() => leerCodigoGuardado() ?? "");
  const [validando, setValidando] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    if (validado) return;
    const t = setTimeout(() => setPopupAbierto(true), RETRASO_POPUP_MS);
    return () => clearTimeout(t);
  }, [validado]);

  function cambiarCantidad(id: string, delta: number) {
    setCantidades((prev) => {
      const actual = prev[id] ?? 0;
      const nueva = Math.max(0, actual + delta);
      const copia = { ...prev };
      if (nueva === 0) delete copia[id];
      else copia[id] = nueva;
      return copia;
    });
  }

  const items = Object.entries(cantidades)
    .map(([id, cantidad]) => ({ producto: productos.find((p) => p.id === id), cantidad }))
    .filter((it): it is { producto: Producto; cantidad: number } => !!it.producto);
  const total = items.reduce((sum, it) => sum + it.producto.precio * it.cantidad, 0);

  async function validarCodigo(e: FormEvent) {
    e.preventDefault();
    setErrorCodigo(null);
    setValidando(true);
    try {
      const res = await fetch("/api/tienda/validar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error");
      const normalizado = codigo.trim().toUpperCase();
      setCodigo(normalizado);
      setValidado(true);
      setPopupAbierto(false);
      try {
        sessionStorage.setItem(CLAVE_SESION, normalizado);
      } catch {
        // no crítico
      }
    } catch (err) {
      setErrorCodigo(
        err instanceof Error
          ? err.message
          : lang === "es"
            ? "No se pudo validar el código."
            : "Couldn't validate the code.",
      );
    } finally {
      setValidando(false);
    }
  }

  async function enviarPedido() {
    if (!validado) {
      setPopupAbierto(true);
      return;
    }
    if (items.length === 0) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const res = await fetch("/api/tienda/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo,
          items: items.map((it) => ({ productoId: it.producto.id, cantidad: it.cantidad })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error");
      setEnviado(true);
      setCantidades({});
    } catch (err) {
      setErrorEnvio(
        err instanceof Error
          ? err.message
          : lang === "es"
            ? "No se pudo enviar el pedido."
            : "Couldn't send the order.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
    <div className="bg-white">
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      {productos.length === 0 ? (
        <p className="text-sm text-[var(--ink-2)]">
          {lang === "es" ? "El catálogo no está disponible en este momento." : "The catalog isn't available right now."}
        </p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
          <aside>
            <h2 className="font-[var(--font-display)] text-xs font-semibold tracking-wide text-[var(--ink-2)] uppercase">
              {lang === "es" ? "Categorías" : "Categories"}
            </h2>
            <nav className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:items-start lg:gap-1">
              <button
                type="button"
                onClick={() => setCategoriaActiva(TODOS)}
                className={`rounded-[1px] px-3 py-1.5 text-left text-sm transition-colors lg:w-full ${
                  categoriaActiva === TODOS
                    ? "bg-[var(--caoba)] text-white"
                    : "border border-[var(--ink)]/15 text-[var(--ink)] hover:border-[var(--caoba)]/50"
                }`}
              >
                {lang === "es" ? "Todos" : "All"} ({productos.length})
              </button>
              {categorias.map(([clave, cuenta]) => (
                <button
                  key={clave}
                  type="button"
                  onClick={() => setCategoriaActiva(clave)}
                  className={`rounded-[1px] px-3 py-1.5 text-left text-sm capitalize transition-colors lg:w-full ${
                    categoriaActiva === clave
                      ? "bg-[var(--caoba)] text-white"
                      : "border border-[var(--ink)]/15 text-[var(--ink)] hover:border-[var(--caoba)]/50"
                  }`}
                >
                  {clave === OTROS ? (lang === "es" ? "Otros" : "Other") : clave} ({cuenta})
                </button>
              ))}
            </nav>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--ink-2)]">
                {productosVisibles.length} {lang === "es" ? "productos" : "products"}
              </p>
              <label className="flex items-center gap-2 text-sm text-[var(--ink-2)]">
                {lang === "es" ? "Ordenar por" : "Sort by"}
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value as Orden)}
                  className="rounded-[1px] border border-[var(--ink)]/25 bg-white px-2 py-1.5 text-sm text-[var(--ink)]"
                >
                  {OPCIONES_ORDEN.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {lang === "es" ? o.es : o.en}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {productosVisibles.length === 0 ? (
              <p className="mt-6 text-sm text-[var(--ink-2)]">
                {lang === "es" ? "No hay productos en esta categoría." : "No products in this category."}
              </p>
            ) : (
              <Reveal className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3" threshold={0.01}>
                {productosVisibles.map((p) => {
                  const cantidad = cantidades[p.id] ?? 0;
                  return (
                    <div key={p.id} className="border border-[var(--ink)]/10 bg-white">
                      {p.imagen_url && (
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                          <Image
                            src={p.imagen_url}
                            alt={p.nombre}
                            fill
                            sizes="(max-width: 640px) 100vw, 33vw"
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-[var(--font-display)] text-base font-semibold">{p.nombre}</h3>
                          <span className="font-[var(--font-display)] font-semibold tabular-nums text-[var(--caoba)]">
                            {money(p.precio)}
                          </span>
                        </div>
                        {p.descripcion && <p className="mt-2 text-sm text-[var(--ink-2)]">{p.descripcion}</p>}
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => cambiarCantidad(p.id, -1)}
                            disabled={cantidad === 0}
                            aria-label={lang === "es" ? "Quitar una unidad" : "Remove one"}
                            className="h-8 w-8 border border-[var(--ink)]/25 font-[var(--font-display)] text-sm transition-colors hover:border-[var(--caoba)] disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-[var(--font-display)] tabular-nums">{cantidad}</span>
                          <button
                            type="button"
                            onClick={() => cambiarCantidad(p.id, 1)}
                            aria-label={lang === "es" ? "Agregar una unidad" : "Add one"}
                            className="h-8 w-8 border border-[var(--ink)]/25 font-[var(--font-display)] text-sm transition-colors hover:border-[var(--caoba)]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Reveal>
            )}
          </div>
        </div>
      )}

      <Reveal
        delayMs={100}
        className="mt-14 border-t-4 border-[var(--lamp-fill)] bg-[var(--night)] px-6 py-8 text-[var(--on-dark)] sm:px-10"
      >
        {enviado ? (
          <div className="text-center">
            <h2 className="font-[var(--font-display)] text-xl font-bold">{lang === "es" ? "¡Pedido recibido!" : "Order received!"}</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--on-dark-2)]">
              {lang === "es"
                ? "Le contactaremos para coordinar el pago antes de su llegada."
                : "We'll reach out to arrange payment before your arrival."}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-[var(--font-display)] text-xl font-bold">{lang === "es" ? "Su pedido" : "Your order"}</h2>
            {items.length === 0 ? (
              <p className="mx-auto mt-3 max-w-xl text-[var(--on-dark-2)]">
                {lang === "es"
                  ? "Elija productos arriba con el + para armar su pedido."
                  : "Pick products above with + to build your order."}
              </p>
            ) : (
              <>
                <dl className="mt-4 space-y-1 text-left text-sm">
                  {items.map((it) => (
                    <div key={it.producto.id} className="flex items-center justify-between gap-3">
                      <dt className="text-[var(--on-dark-2)]">
                        {it.cantidad} × {it.producto.nombre}
                      </dt>
                      <dd className="m-0 font-[var(--font-display)] tabular-nums">{money(it.producto.precio * it.cantidad)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--on-dark-2)]/30 pt-3">
                  <span className="font-[var(--font-display)] font-bold">{lang === "es" ? "Total" : "Total"}</span>
                  <span className="font-[var(--font-display)] text-lg font-bold text-[var(--lamp-fill)] tabular-nums">
                    {money(total)}
                  </span>
                </div>
              </>
            )}

            {validado && (
              <p className="mt-4 text-xs text-[var(--on-dark-2)]">
                {lang === "es" ? "Reserva verificada" : "Reservation verified"} · {codigo}
              </p>
            )}

            {errorEnvio && <p className="mt-3 text-sm text-[var(--caoba)]">{errorEnvio}</p>}

            <button
              type="button"
              onClick={() => void enviarPedido()}
              disabled={items.length === 0 || enviando}
              className="mt-5 inline-flex w-full items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[#f0ce86] disabled:opacity-50"
            >
              {enviando
                ? lang === "es"
                  ? "Enviando…"
                  : "Sending…"
                : validado
                  ? lang === "es"
                    ? "Enviar pedido"
                    : "Send order"
                  : lang === "es"
                    ? "Escribir código de reserva"
                    : "Enter reservation code"}
            </button>
          </div>
        )}
      </Reveal>
    </div>
    </div>

      {popupAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === "es" ? "Escriba su código de reserva" : "Enter your reservation code"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/60 px-4"
          onClick={() => setPopupAbierto(false)}
        >
          <div
            className="relative w-full max-w-md border-t-4 border-[var(--lamp-fill)] bg-[var(--night)] px-7 py-8 text-[var(--on-dark)] shadow-[0_18px_40px_-28px_rgba(20,33,26,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPopupAbierto(false)}
              aria-label={lang === "es" ? "Cerrar" : "Close"}
              className="absolute top-3 right-3 font-[var(--font-display)] text-xl leading-none text-[var(--on-dark-2)] hover:text-[var(--on-dark)]"
            >
              ×
            </button>

            <p className="font-[var(--font-display)] text-xs tracking-wide text-[var(--lamp-fill)] uppercase">
              {lang === "es" ? "Para huéspedes con reserva" : "For guests with a reservation"}
            </p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold text-[var(--on-dark)]">
              {lang === "es" ? "¿Ya tiene su reserva?" : "Already have a reservation?"}
            </h2>
            <p className="mt-2 text-sm text-[var(--on-dark-2)]">
              {lang === "es"
                ? "Escriba el código de reserva que le compartimos al confirmar su estadía para desbloquear la compra."
                : "Enter the reservation code we shared when your stay was confirmed to unlock checkout."}
            </p>

            <form onSubmit={validarCodigo} className="mt-5 flex flex-col gap-3">
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder={lang === "es" ? "Código de reserva" : "Reservation code"}
                required
                className="rounded-[1px] border border-[var(--on-dark-2)]/30 bg-[var(--ground)] px-3 py-2 font-[var(--font-display)] text-sm tracking-widest text-[var(--ink)] uppercase transition-[border-color,box-shadow] duration-200 outline-none focus:border-[var(--lamp-fill)] focus:ring-2 focus:ring-[var(--lamp-fill)]/30"
              />
              {errorCodigo && <p className="text-xs text-[var(--caoba)]">{errorCodigo}</p>}
              <button
                type="submit"
                disabled={validando}
                className="inline-flex w-full items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[#f0ce86] disabled:opacity-60"
              >
                {validando ? (lang === "es" ? "Validando…" : "Validating…") : lang === "es" ? "Desbloquear compra" : "Unlock checkout"}
              </button>
              <button
                type="button"
                onClick={() => setPopupAbierto(false)}
                className="text-center text-xs text-[var(--on-dark-2)] underline"
              >
                {lang === "es" ? "Solo estoy mirando" : "Just browsing"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
