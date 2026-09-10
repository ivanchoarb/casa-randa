export default function InicioPage() {
  const tarjetas = [
    { titulo: "Reserva en curso", valor: "—", nota: "Sin datos — conectar Supabase" },
    { titulo: "Ingresos del mes", valor: "—", nota: "Después de comisión de plataforma" },
    { titulo: "Ingresos acumulados", valor: "—", nota: "Acumulado del año" },
    { titulo: "Saldo neto del propietario", valor: "—", nota: "Después de comisiones y gastos" },
  ];

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Resumen ejecutivo</p>
      <h1 className="mt-1 text-2xl font-bold">Hoy en Casa Randa</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Este panel replica la estructura del resumen ejecutivo de la intranet actual (Reservas,
        Ingresos, Comisiones, Saldo del propietario), pero todavía no está conectado a un proyecto
        de Supabase real — por eso las cifras están vacías en vez de inventadas. Ver{" "}
        <code>supabase/README.md</code> para completar las credenciales.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.titulo} className="rounded-xl border border-line bg-panel p-5">
            <p className="text-xs font-medium tracking-wide text-ink-2 uppercase">{t.titulo}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{t.valor}</p>
            <p className="mt-1 text-xs text-ink-2">{t.nota}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
