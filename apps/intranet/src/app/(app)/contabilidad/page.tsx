export default function ContabilidadPage() {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Finanzas</p>
      <h1 className="mt-1 text-2xl font-bold">Contabilidad y liquidaciones</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink-2">
        Todavía no implementado a propósito: es el módulo de mayor riesgo del proyecto (reparto de
        comisiones Marquelda/Iván, anticipos, import de CSV de Airbnb/Vrbo) y la Fase 4 del plan
        dice que se construye a mano, con pruebas, no con un generador CRUD — ver
        &ldquo;Fase 4&rdquo; en <code>docs/arquitectura-migracion.md</code>. Las tablas ya existen
        (<code>gastos</code>, <code>anticipos_comision</code>) en{" "}
        <code>supabase/migrations/0003_contabilidad.sql</code>.
      </p>
    </div>
  );
}
