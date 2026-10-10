// Exporta cada tabla del esquema public de Supabase a un JSON (solo lectura).
// Uso: pnpm db:export [carpeta-destino]
// Lee DATABASE_URL de apps/intranet/.env.local. No incluye Storage ni auth.users.
import pg from "pg";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL (usa: pnpm db:export)");

const hoy = new Date().toISOString().slice(0, 10);
const destino = process.argv[2] ?? join("..", "casa-randa-archivos", "backups", `db-${hoy}`);
mkdirSync(destino, { recursive: true });

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query("begin read only");
  const { rows: tablas } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1",
  );
  const resumen = {};
  for (const { table_name } of tablas) {
    const { rows } = await client.query(`select * from public."${table_name}"`);
    writeFileSync(join(destino, `${table_name}.json`), JSON.stringify(rows, null, 1));
    resumen[table_name] = rows.length;
  }
  writeFileSync(join(destino, "_resumen.json"), JSON.stringify({ fecha: new Date().toISOString(), filas: resumen }, null, 2));
  console.log(`${tablas.length} tablas en ${destino}`);
  console.table(resumen);
} finally {
  await client.end();
}
