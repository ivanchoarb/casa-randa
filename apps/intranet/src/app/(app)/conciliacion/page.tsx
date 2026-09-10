export default function ConciliacionPage() {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Banco General</p>
      <h1 className="mt-1 text-2xl font-bold">Conciliación bancaria</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink-2">
        Todavía no implementado — mismo motivo que Contabilidad (Fase 4, alto riesgo). Va a cruzar{" "}
        <code>movimientos_bancarios</code> contra reservas: el lado &ldquo;esperado&rdquo; se
        puede llenar solo desde el historial de PagueloFacil/Yappy, pero confirmar que el dinero
        llegó al banco se mantiene manual — ver &ldquo;Conciliación bancaria&rdquo; en{" "}
        <code>docs/logica-negocio-y-flujos.md</code>.
      </p>
    </div>
  );
}
