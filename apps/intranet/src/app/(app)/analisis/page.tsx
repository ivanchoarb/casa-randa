export default function AnalisisPage() {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">
        Inteligencia del negocio
      </p>
      <h1 className="mt-1 text-2xl font-bold">Análisis y planificación</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink-2">
        Todavía no implementado. Va a mostrar el comparativo año a año y el plan de compras/mejoras
        de la casa (<code>plan_compras</code> — no confundir con la tienda del huésped, ver la nota
        en <code>supabase/migrations/0004_tienda_y_planificacion.sql</code>).
      </p>
    </div>
  );
}
