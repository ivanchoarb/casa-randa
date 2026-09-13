"use client";

import { useState } from "react";
import { useCreate, useDelete, useTable, useUpdate } from "@refinedev/core";
import { supabaseClient } from "@/lib/supabase-client";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  sku: string | null;
  categoria: string | null;
  imagen_url: string | null;
  created_at: string;
}

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";
const money = (n: number) => `USD ${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Sube a un bucket público (imagenes-tienda, creado en
// 0025_catalogo_tienda_admin.sql) con la sesión de quien esté armando el
// catálogo — mismo patrón que subirCotizacionPDF() en lib/cotizacion.ts,
// pero con getPublicUrl() en vez de un enlace firmado, porque las fotos
// de producto sí deben verse en el sitio público sin sesión.
async function subirImagenProducto(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const ruta = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseClient.storage
    .from("imagenes-tienda")
    .upload(ruta, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  const { data } = supabaseClient.storage.from("imagenes-tienda").getPublicUrl(ruta);
  return data.publicUrl;
}

// El catálogo de la tienda (nombre/precio/descripción ya existían desde
// 0004_tienda_y_planificacion.sql; SKU/categoría/imagen se agregaron el
// 2026-09-13 a pedido de Ivan, junto con esta pantalla — antes solo se
// podía editar a mano en Supabase). apps/web lee estos mismos productos
// en /tienda y en la sección "Llegue a una casa ya surtida" del inicio.
export default function TiendaPage() {
  const { result, tableQuery } = useTable<Producto>({
    resource: "productos_tienda",
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
    pagination: { mode: "off" },
  });
  const { mutate: crear, mutation: creando } = useCreate<Producto>();

  const productos = result.data ?? [];
  const categoriasExistentes = Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))) as string[];

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [sku, setSku] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregar() {
    if (!nombre.trim() || !precio) return;
    setError(null);
    setSubiendo(true);
    try {
      let imagen_url: string | null = null;
      if (imagenFile) imagen_url = await subirImagenProducto(imagenFile);
      crear(
        {
          resource: "productos_tienda",
          values: {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            precio: Number(precio),
            sku: sku.trim() || null,
            categoria: categoria.trim() || null,
            imagen_url,
            disponible: true,
          },
        },
        {
          onSuccess: () => {
            setNombre("");
            setDescripcion("");
            setPrecio("");
            setSku("");
            setCategoria("");
            setImagenFile(null);
          },
          onError: (e) => setError(e.message),
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Ventas directas</p>
      <h1 className="mt-1 text-2xl font-bold">Catálogo de la tienda</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Productos que ve el huésped en la web pública (inicio y /tienda), disponibles para pedir
        una vez que tenga su reserva confirmada y su código de reserva.
      </p>

      {tableQuery.isError && (
        <p className="mt-6 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code>.
        </p>
      )}

      <div className="mt-6 rounded-lg border border-line bg-panel p-4">
        <h2 className="text-sm font-semibold">Agregar producto</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-ink-2">
            Título
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Precio (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2 sm:col-span-2">
            Descripción
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2">
            SKU
            <input value={sku} onChange={(e) => setSku(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Categoría
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              list="categorias-existentes"
              className={`${inputClass} mt-1 block w-full`}
            />
            <datalist id="categorias-existentes">
              {categoriasExistentes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="text-xs text-ink-2 sm:col-span-2">
            Imagen (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagenFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-caoba">{error}</p>}
        <button
          type="button"
          onClick={() => void agregar()}
          disabled={!nombre.trim() || !precio || subiendo || creando.isPending}
          className="mt-4 rounded-md bg-caoba px-4 py-2 text-sm font-semibold text-panel disabled:opacity-50"
        >
          {subiendo || creando.isPending ? "Guardando…" : "Agregar producto"}
        </button>
      </div>

      {!tableQuery.isLoading && productos.length === 0 && (
        <p className="mt-6 text-sm text-ink-2">Todavía no hay productos en el catálogo.</p>
      )}

      <div className="mt-6 space-y-3">
        {productos.map((p) => (
          <ProductoItem key={p.id} producto={p} categoriasExistentes={categoriasExistentes} />
        ))}
      </div>
    </div>
  );
}

function ProductoItem({ producto, categoriasExistentes }: { producto: Producto; categoriasExistentes: string[] }) {
  const { mutate: actualizar, mutation: actualizando } = useUpdate<Producto>();
  const { mutate: eliminar, mutation: eliminando } = useDelete<Producto>();
  const [editando, setEditando] = useState(false);

  const [nombre, setNombre] = useState(producto.nombre);
  const [descripcion, setDescripcion] = useState(producto.descripcion ?? "");
  const [precio, setPrecio] = useState(producto.precio.toString());
  const [sku, setSku] = useState(producto.sku ?? "");
  const [categoria, setCategoria] = useState(producto.categoria ?? "");
  const [disponible, setDisponible] = useState(producto.disponible);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    setSubiendo(true);
    try {
      let imagen_url = producto.imagen_url;
      if (imagenFile) imagen_url = await subirImagenProducto(imagenFile);
      actualizar(
        {
          resource: "productos_tienda",
          id: producto.id,
          values: {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            precio: Number(precio),
            sku: sku.trim() || null,
            categoria: categoria.trim() || null,
            imagen_url,
            disponible,
          },
        },
        {
          onSuccess: () => setEditando(false),
          onError: (e) => setError(e.message),
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  function eliminarProducto() {
    if (!window.confirm(`¿Eliminar "${producto.nombre}" del catálogo?`)) return;
    eliminar(
      { resource: "productos_tienda", id: producto.id },
      {
        onError: (e) =>
          setError(
            e.message.includes("foreign key")
              ? "No se puede eliminar: ya tiene pedidos asociados. Márcalo como no disponible en su lugar."
              : e.message,
          ),
      },
    );
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-4 text-sm">
      <button type="button" onClick={() => setEditando(!editando)} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          {producto.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- panel interno, no vale la pena next/image acá
            <img src={producto.imagen_url} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="h-10 w-10 rounded bg-panel-2" />
          )}
          <div>
            <p className="font-medium">{producto.nombre}</p>
            <p className="text-xs text-ink-2">
              {money(producto.precio)}
              {producto.categoria ? ` · ${producto.categoria}` : ""}
              {producto.sku ? ` · SKU ${producto.sku}` : ""}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            producto.disponible ? "bg-good-bg text-good" : "bg-panel-2 text-ink-2"
          }`}
        >
          {producto.disponible ? "Disponible" : "No disponible"}
        </span>
      </button>

      {editando && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <label className="text-xs text-ink-2">
            Título
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Precio (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2 sm:col-span-2">
            Descripción
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2">
            SKU
            <input value={sku} onChange={(e) => setSku(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Categoría
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              list={`categorias-${producto.id}`}
              className={`${inputClass} mt-1 block w-full`}
            />
            <datalist id={`categorias-${producto.id}`}>
              {categoriasExistentes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="flex items-center gap-2 text-xs text-ink-2">
            <input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} />
            Disponible para la venta
          </label>
          <label className="text-xs text-ink-2 sm:col-span-2">
            {producto.imagen_url ? "Reemplazar imagen" : "Imagen"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagenFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </label>

          {error && <p className="text-sm text-caoba sm:col-span-2">{error}</p>}

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={subiendo || actualizando.isPending}
              className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-50"
            >
              {subiendo || actualizando.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={eliminarProducto}
              disabled={eliminando.isPending}
              className="rounded-md border border-line px-4 py-1.5 text-sm text-caoba disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
