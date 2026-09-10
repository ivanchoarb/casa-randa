export default function CalendarioPage() {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Disponibilidad</p>
      <h1 className="mt-1 text-2xl font-bold">Calendario y disponibilidad</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink-2">
        Todavía no implementado. Va a mostrar los bloqueos de <code>bloqueos_calendario</code>{" "}
        (Airbnb, Vrbo y directos) y el estado de la última sincronización — ver &ldquo;Flujo
        2&rdquo; en <code>docs/logica-negocio-y-flujos.md</code>. El job de sync en sí (Fase 2)
        todavía no existe.
      </p>
    </div>
  );
}
