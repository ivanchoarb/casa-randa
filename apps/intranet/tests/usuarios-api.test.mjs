import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code = fs.readFileSync(new URL('../src/lib/usuarios-api.ts', import.meta.url), 'utf8');
const ctx = { exports: {}, Response };
vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, ctx);
const actorId = '11111111-1111-1111-1111-111111111111';
const targetId = '22222222-2222-2222-2222-222222222222';
const valid = { id: targetId, nombre: 'Prueba', email: 'test@example.invalid', rol: 'empleado', password: 'only-synthetic-123' };
function setup(role = 'administrador', profileFailure = false) {
  const calls = [];
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: actorId } } }), admin: {
      createUser: async v => { calls.push(['create', v]); return { data: { user: { id: targetId } } }; },
      getUserById: async () => ({ data: { user: { id: targetId, email: 'old@example.invalid', user_metadata: { nombre: 'Antes' } } } }),
      updateUserById: async (id, v) => { calls.push(['authUpdate', id, v]); return {}; },
      deleteUser: async id => { calls.push(['delete', id]); return {}; },
    } },
    from: () => {
      let updating = false, selectedId;
      const q = { select: () => q, eq: (_, id) => { selectedId = id; return q; }, update: v => { updating = true; calls.push(['profile', v]); return q; },
        single: async () => updating ? { data: { id: targetId }, error: profileFailure ? {} : null } : { data: { rol: selectedId === actorId ? role : 'empleado' } } };
      return q;
    },
  };
  return { calls, handle: ctx.exports.usuariosHandler(() => db) };
}
const req = (method, body, token = true) => new Request('http://localhost/api/usuarios', { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer test' } : {}) }, body: JSON.stringify(body) });
test('rejects missing session and non-admin roles for every mutation', async () => {
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    assert.equal((await setup().handle(req(method, valid, false))).status, 401);
    for (const role of ['empleado', 'dueño']) {
      const s = setup(role); assert.equal((await s.handle(req(method, valid))).status, 403); assert.equal(s.calls.length, 0);
    }
  }
});
test('prevents self deletion, self demotion and invalid input', async () => {
  const s = setup();
  assert.equal((await s.handle(req('DELETE', { id: actorId }))).status, 409);
  assert.equal((await s.handle(req('PATCH', { ...valid, id: actorId }))).status, 409);
  assert.equal((await s.handle(req('POST', { ...valid, rol: 'root' }))).status, 400);
  assert.equal((await s.handle(req('POST', { ...valid, password: 'short' }))).status, 400);
  assert.equal(s.calls.length, 0);
});
test('creates account and assigns the profile role', async () => {
  const s = setup(); assert.equal((await s.handle(req('POST', valid))).status, 201);
  assert.deepEqual(s.calls.map(c => c[0]), ['create', 'profile']);
});
test('edits auth and profile; deletion removes the auth account', async () => {
  const s = setup(); assert.equal((await s.handle(req('PATCH', valid))).status, 200);
  assert.deepEqual(s.calls.map(c => c[0]), ['authUpdate', 'profile']);
  assert.equal((await s.handle(req('DELETE', { id: targetId }))).status, 200);
  assert.equal(s.calls.at(-1)[0], 'delete');
});
test('compensates a failed profile write after create and edit', async () => {
  const c = setup('administrador', true); assert.equal((await c.handle(req('POST', valid))).status, 500);
  assert.equal(c.calls.at(-1)[0], 'delete');
  const e = setup('administrador', true); assert.equal((await e.handle(req('PATCH', valid))).status, 500);
  assert.equal(e.calls.at(-1)[2].email, 'old@example.invalid');
});
