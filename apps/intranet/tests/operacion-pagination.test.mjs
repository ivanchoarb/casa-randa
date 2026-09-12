import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';
import { dataProvider } from '@refinedev/supabase';

// Exercise the actual page configuration through the installed data provider.
const source = fs.readFileSync(path.join(import.meta.dirname, '../src/app/(app)/operacion/page.tsx'), 'utf8');
const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let configText;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useTable' &&
      node.typeArguments?.[0]?.getText(ast) === 'ReservaConTareas') configText = node.arguments[0].getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(configText, 'history must page complete reservations');
const config = vm.runInNewContext(`(${configText})`, { RESERVA_EMBED: 'salida,estado', desde: '2026-09-09' });

test('history orders root rows and pages beyond 500 tasks without splitting reservations', async () => {
  const rows = Array.from({ length: 181 }, (_, id) => ({
    id: String(id).padStart(4, '0'), salida: '2026-08-01', estado: 'completada',
    tareas_operacion: Array.from({ length: 3 }, (_, tipo) => ({ id: `${id}-${tipo}`, reserva_id: String(id).padStart(4, '0') })),
  }));
  const client = createClient('https://example.invalid', 'test', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url) => {
      const query = new URL(url);
      assert.equal(query.pathname, '/rest/v1/reservas');
      assert.equal(query.searchParams.get('order'), 'salida.desc,id.desc');
      assert.equal(query.searchParams.get('reservas.order'), null);
      assert.equal(query.searchParams.get('salida'), 'lt.2026-09-09');
      assert.match(query.searchParams.get('select'), /tareas_operacion!inner\(\*\)/);
      const offset = Number(query.searchParams.get('offset'));
      const limit = Number(query.searchParams.get('limit'));
      const sorted = [...rows].sort((a, b) => b.id.localeCompare(a.id));
      return new Response(JSON.stringify(sorted.slice(offset, offset + limit)), {
        headers: { 'content-type': 'application/json', 'content-range': `${offset}-${Math.min(offset + limit, rows.length) - 1}/${rows.length}` },
      });
    } },
  });
  const provider = dataProvider(client);
  const received = [];
  for (let currentPage = 1; currentPage <= Math.ceil(rows.length / config.pagination.pageSize); currentPage++) {
    const result = await provider.getList({ resource: config.resource, meta: config.meta,
      sorters: config.sorters.permanent, filters: config.filters.permanent,
      pagination: { ...config.pagination, currentPage } });
    assert.equal(result.total, rows.length);
    for (const row of result.data) assert.equal(row.tareas_operacion.length, 3);
    received.push(...result.data);
  }
  assert.equal(received.length, 181);
  assert.equal(new Set(received.map(row => row.id)).size, 181);
  assert.equal(received[0].id, '0180');
  assert.equal(received.at(-1).id, '0000');
  assert.equal(received.flatMap(row => row.tareas_operacion).length, 543);
});
