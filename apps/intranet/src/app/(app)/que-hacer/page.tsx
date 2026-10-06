"use client";

import { useState } from "react";
import { useCreate, useDelete, useTable, useUpdate } from "@refinedev/core";
import { supabaseClient } from "@/lib/supabase-client";

type Categoria = "ciudad" | "canal" | "playas" | "pueblos" | "gastronomia" | "nocturna";

// Las mismas 6 categorías que el CHECK de lugares_guia (0034) y que
// CATEGORIES en apps/web/src/app/que-hacer-en-panama/places.ts.
const CATEGORIAS: { key: Categoria; label: string }[] = [
  { key: "ciudad", label: "Ciudad de Panamá" },
  { key: "canal", label: "Canal y naturaleza" },
  { key: "playas", label: "Playas" },
  { key: "pueblos", label: "Pueblos y escapadas" },
  { key: "gastronomia", label: "Gastronomía" },
  { key: "nocturna", label: "Vida nocturna" },
];

// Cada texto del lugar existe en español e inglés (columnas `<base>_es` y
// `<base>_en`): la web pública cambia de idioma sin traducir nada sola.
const CAMPOS = [
  { base: "resumen", label: "Resumen (tarjeta y encabezado)", filas: 2 },
  { base: "por_que", label: "Por qué lo recomendamos", filas: 4 },
  { base: "distancia", label: "Distancia desde la casa", filas: 2 },
  { base: "como_llegar", label: "Cómo llegar", filas: 2 },
  { base: "horario", label: "Horario", filas: 2 },
  { base: "precio_ref", label: "Precio de referencia", filas: 2 },
] as const;
type Base = (typeof CAMPOS)[number]["base"];
type ClaveTexto = `${Base}_${"es" | "en"}`;

interface Lugar extends Record<ClaveTexto, string> {
  id: string;
  slug: string;
  categoria: Categoria;
  nombre: string;
  nivel_precio: 1 | 2 | 3;
  imagenes: string[];
  creditos_foto: string;
  sitio_oficial: string | null;
  mapa_url: string | null;
  telefono: string | null;
}

type Borrador = Record<ClaveTexto, string> & {
  slug: string;
  categoria: Categoria;
  nombre: string;
  nivel_precio: 1 | 2 | 3;
  creditos_foto: string;
  sitio_oficial: string;
  mapa_url: string;
  telefono: string;
};

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const BUCKET = "imagenes-guia";

// Misma lógica que NEXT_PUBLIC_INTRANET_URL en el footer de apps/web, a la
// inversa: en dev apunta al sitio local, en producción al dominio real.
const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://randahome.com");

const slugificar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function borradorVacio(): Borrador {
  const textos = Object.fromEntries(
    CAMPOS.flatMap((c) => [`${c.base}_es`, `${c.base}_en`].map((k) => [k, ""])),
  ) as Record<ClaveTexto, string>;
  return { ...textos, slug: "", categoria: "ciudad", nombre: "", nivel_precio: 2, creditos_foto: "", sitio_oficial: "", mapa_url: "", telefono: "" };
}

function desdeLugar(l: Lugar): Borrador {
  const b = borradorVacio();
  for (const c of CAMPOS) {
    b[`${c.base}_es`] = l[`${c.base}_es`];
    b[`${c.base}_en`] = l[`${c.base}_en`];
  }
  return {
    ...b,
    slug: l.slug,
    categoria: l.categoria,
    nombre: l.nombre,
    nivel_precio: l.nivel_precio,
    creditos_foto: l.creditos_foto ?? "",
    sitio_oficial: l.sitio_oficial ?? "",
    mapa_url: l.mapa_url ?? "",
    telefono: l.telefono ?? "",
  };
}

// Sube a imagenes-guia (bucket público, 0034) con la sesión de quien edita
// la guía — mismo patrón que subirImagenProducto() en tienda/page.tsx.
async function subirImagen(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const ruta = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseClient.storage.from(BUCKET).upload(ruta, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return supabaseClient.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

// Best-effort: si falla, queda un archivo huérfano en el bucket, nada más.
async function borrarImagenes(urls: string[]) {
  const rutas = urls.map((u) => u.split(`/${BUCKET}/`)[1]).filter(Boolean);
  if (rutas.length > 0) await supabaseClient.storage.from(BUCKET).remove(rutas);
}

function mensajeDeError(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return m.includes("lugares_guia_slug_key") || m.includes("duplicate key")
    ? "Ya existe un lugar con esa dirección (slug). Cámbiala para que sea única."
    : m;
}

function FormularioLugar({
  inicial,
  imagenesIniciales,
  nuevo,
  textoBoton,
  onGuardar,
  onCancelar,
  onEliminar,
}: {
  inicial: Borrador;
  imagenesIniciales: string[];
  nuevo: boolean;
  textoBoton: string;
  onGuardar: (b: Borrador, imagenes: string[]) => Promise<void>;
  onCancelar: () => void;
  onEliminar?: () => void;
}) {
  const [b, setB] = useState(inicial);
  const [imagenes, setImagenes] = useState(imagenesIniciales);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [slugManual, setSlugManual] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Borrador>(k: K, v: Borrador[K]) {
    setB((prev) => ({ ...prev, [k]: v }));
  }

  function cambiarNombre(nombre: string) {
    setB((prev) => ({ ...prev, nombre, slug: nuevo && !slugManual ? slugificar(nombre) : prev.slug }));
  }

  async function guardar() {
    setError(null);
    if (!b.nombre.trim()) return setError("Falta el nombre del lugar.");
    if (!SLUG_RE.test(b.slug)) return setError("La dirección (slug) solo admite minúsculas, números y guiones.");
    setGuardando(true);
    try {
      const subidas: string[] = [];
      for (const f of archivos) subidas.push(await subirImagen(f));
      await onGuardar(b, [...imagenes, ...subidas]);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-ink-2">
        Nombre
        <input value={b.nombre} onChange={(e) => cambiarNombre(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
      </label>
      <label className="text-xs text-ink-2">
        Dirección en la web (slug)
        <input
          value={b.slug}
          readOnly={!nuevo}
          onChange={(e) => {
            setSlugManual(true);
            set("slug", e.target.value);
          }}
          className={`${inputClass} mt-1 block w-full ${nuevo ? "" : "opacity-60"}`}
        />
        <span className="mt-1 block">
          {nuevo ? "Se arma sola con el nombre." : "No se cambia después de crear, para no romper enlaces."} Quedará en
          /que-hacer-en-panama/{b.slug || "…"}
        </span>
      </label>
      <label className="text-xs text-ink-2">
        Categoría
        <select value={b.categoria} onChange={(e) => set("categoria", e.target.value as Categoria)} className={`${inputClass} mt-1 block w-full`}>
          {CATEGORIAS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-ink-2">
        Nivel de precio
        <select
          value={b.nivel_precio}
          onChange={(e) => set("nivel_precio", Number(e.target.value) as 1 | 2 | 3)}
          className={`${inputClass} mt-1 block w-full`}
        >
          <option value={1}>$ (económico)</option>
          <option value={2}>$$ (medio)</option>
          <option value={3}>$$$ (alto)</option>
        </select>
      </label>

      <p className="text-xs text-ink-2 sm:col-span-2">
        Completa español e inglés: un bloque que quede vacío en un idioma no se muestra en ese idioma del sitio.
      </p>
      {CAMPOS.map((c) => (
        <div key={c.base} className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
          {(["es", "en"] as const).map((lang) => (
            <label key={lang} className="text-xs text-ink-2">
              {c.label} — {lang === "es" ? "Español" : "English"}
              <textarea
                value={b[`${c.base}_${lang}`]}
                onChange={(e) => set(`${c.base}_${lang}`, e.target.value)}
                rows={c.filas}
                className={`${inputClass} mt-1 block w-full`}
              />
            </label>
          ))}
        </div>
      ))}

      <label className="text-xs text-ink-2">
        Sitio oficial (opcional)
        <input value={b.sitio_oficial} onChange={(e) => set("sitio_oficial", e.target.value)} placeholder="https://" className={`${inputClass} mt-1 block w-full`} />
      </label>
      <label className="text-xs text-ink-2">
        Enlace al mapa (opcional)
        <input value={b.mapa_url} onChange={(e) => set("mapa_url", e.target.value)} placeholder="https://maps.google.com/…" className={`${inputClass} mt-1 block w-full`} />
      </label>
      <label className="text-xs text-ink-2">
        Teléfono (opcional)
        <input value={b.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+507 …" className={`${inputClass} mt-1 block w-full`} />
      </label>

      <label className="text-xs text-ink-2 sm:col-span-2">
        Crédito de las fotos (opcional; obligatorio si la licencia lo pide)
        <input value={b.creditos_foto} onChange={(e) => set("creditos_foto", e.target.value)} placeholder="Foto: Autor, CC BY-SA 4.0, vía Wikimedia Commons" className={`${inputClass} mt-1 block w-full`} />
      </label>

      <div className="text-xs text-ink-2 sm:col-span-2">
        Fotos (la primera es la portada)
        {(imagenes.length > 0 || archivos.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imagenes.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- panel interno, no vale la pena next/image acá */}
                <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => setImagenes((prev) => prev.filter((u) => u !== url))}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-caoba text-xs leading-5 text-panel"
                >
                  ×
                </button>
              </div>
            ))}
            {archivos.map((f, i) => (
              <span key={`${f.name}-${i}`} className="flex items-center gap-1 rounded bg-panel-2 px-2 py-1">
                {f.name}
                <button type="button" aria-label="Quitar archivo" onClick={() => setArchivos((prev) => prev.filter((_, j) => j !== i))} className="text-caoba">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const nuevos = Array.from(e.target.files ?? []);
            if (nuevos.length) setArchivos((prev) => [...prev, ...nuevos]);
            e.target.value = "";
          }}
          className="mt-2 block w-full text-sm"
        />
      </div>

      {error && <p className="text-sm text-caoba sm:col-span-2">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={guardando}
          className="rounded-md bg-caoba px-4 py-2 text-sm font-semibold text-panel disabled:opacity-50"
        >
          {guardando ? "Guardando…" : textoBoton}
        </button>
        <button type="button" onClick={onCancelar} disabled={guardando} className="rounded-md border border-line px-4 py-2 text-sm">
          Cancelar
        </button>
        {onEliminar && (
          <button type="button" onClick={onEliminar} disabled={guardando} className="ml-auto text-sm font-medium text-caoba hover:underline">
            Eliminar lugar
          </button>
        )}
      </div>
    </div>
  );
}

function valoresDeBorrador(b: Borrador, imagenes: string[]) {
  return {
    ...b,
    nombre: b.nombre.trim(),
    imagenes,
    sitio_oficial: b.sitio_oficial.trim() || null,
    mapa_url: b.mapa_url.trim() || null,
    telefono: b.telefono.trim() || null,
  };
}

function LugarItem({ lugar }: { lugar: Lugar }) {
  const { mutateAsync: actualizar } = useUpdate<Lugar>();
  const { mutateAsync: eliminar } = useDelete<Lugar>();
  const [editando, setEditando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const categoria = CATEGORIAS.find((c) => c.key === lugar.categoria)?.label ?? lugar.categoria;

  async function guardar(b: Borrador, imagenes: string[]) {
    await actualizar({
      resource: "lugares_guia",
      id: lugar.id,
      values: { ...valoresDeBorrador(b, imagenes), slug: lugar.slug, updated_at: new Date().toISOString() },
    });
    await borrarImagenes(lugar.imagenes.filter((u) => !imagenes.includes(u)));
    setEditando(false);
  }

  async function borrar() {
    if (!window.confirm(`¿Eliminar "${lugar.nombre}" de la guía? Dejará de verse en la web.`)) return;
    setErrorEliminar(null);
    try {
      await eliminar({ resource: "lugares_guia", id: lugar.id });
      await borrarImagenes(lugar.imagenes);
    } catch (e) {
      setErrorEliminar(mensajeDeError(e));
    }
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <button type="button" onClick={() => setEditando(!editando)} className="flex min-w-[14rem] flex-1 items-center gap-3 text-left">
          {lugar.imagenes[0] ? (
            // eslint-disable-next-line @next/next/no-img-element -- panel interno, no vale la pena next/image acá
            <img src={lugar.imagenes[0]} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded bg-panel-2" />
          )}
          <div className="min-w-0">
            <p className="font-medium break-words">{lugar.nombre}</p>
            <p className="text-xs text-ink-2">
              {categoria} · {"$".repeat(lugar.nivel_precio)}
              {lugar.imagenes.length === 0 ? " · sin fotos" : ` · ${lugar.imagenes.length} foto${lugar.imagenes.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </button>
        <a
          href={`${WEB_URL}/que-hacer-en-panama/${lugar.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-caoba hover:underline"
        >
          Ver en el sitio ↗
        </a>
      </div>
      {errorEliminar && <p className="mt-3 text-sm text-caoba">{errorEliminar}</p>}

      {editando && (
        <div className="mt-4 border-t border-line pt-4">
          <FormularioLugar
            inicial={desdeLugar(lugar)}
            imagenesIniciales={lugar.imagenes}
            nuevo={false}
            textoBoton="Guardar cambios"
            onGuardar={guardar}
            onCancelar={() => setEditando(false)}
            onEliminar={() => void borrar()}
          />
        </div>
      )}
    </div>
  );
}

// La guía pública "Qué hacer en Panamá" (apps/web, /que-hacer-en-panama) lee
// estos mismos lugares de `lugares_guia`; lo que se guarda aquí se ve en la
// web en unos minutos (ISR de 5 min), sin hacer deploy.
export default function QueHacerPage() {
  const { result, tableQuery } = useTable<Lugar>({
    resource: "lugares_guia",
    sorters: { initial: [{ field: "created_at", order: "asc" }] },
    pagination: { mode: "off" },
  });
  const { mutateAsync: crear } = useCreate<Lugar>();
  const [agregando, setAgregando] = useState(false);

  const lugares = result.data ?? [];

  async function agregar(b: Borrador, imagenes: string[]) {
    await crear({ resource: "lugares_guia", values: valoresDeBorrador(b, imagenes) });
    setAgregando(false);
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Contenido web</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Qué hacer en Panamá</h1>
        <a
          href={`${WEB_URL}/que-hacer-en-panama`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-caoba hover:underline"
        >
          Ver la guía en el sitio ↗
        </a>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Los lugares que recomendamos a los huéspedes. Lo que agregues, edites o elimines aquí se ve en la guía
        pública en unos minutos.
      </p>

      {tableQuery.isError && (
        <p className="mt-6 text-sm text-caoba">
          No se pudo leer la guía. Revisa la conexión a Supabase e inténtalo de nuevo.
        </p>
      )}

      <div className="mt-6">
        {agregando ? (
          <div className="rounded-lg border border-line bg-panel p-4">
            <h2 className="mb-3 text-sm font-semibold">Agregar lugar</h2>
            <FormularioLugar
              inicial={borradorVacio()}
              imagenesIniciales={[]}
              nuevo
              textoBoton="Agregar lugar"
              onGuardar={agregar}
              onCancelar={() => setAgregando(false)}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setAgregando(true)} className="rounded-md bg-caoba px-4 py-2 text-sm font-semibold text-panel">
            Agregar lugar
          </button>
        )}
      </div>

      {!tableQuery.isLoading && !tableQuery.isError && lugares.length === 0 && (
        <p className="mt-6 text-sm text-ink-2">Todavía no hay lugares en la guía.</p>
      )}

      <div className="mt-6 space-y-3">
        {lugares.map((l) => (
          <LugarItem key={l.id} lugar={l} />
        ))}
      </div>
    </div>
  );
}
