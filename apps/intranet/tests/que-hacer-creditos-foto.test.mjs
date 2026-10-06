import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";
import { dataProvider } from "@refinedev/supabase";

const source = fs.readFileSync(
  path.join(import.meta.dirname, "../src/app/(app)/que-hacer/page.tsx"),
  "utf8",
);
const ast = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const functionNames = new Set(["borradorVacio", "desdeLugar", "valoresDeBorrador"]);
const snippets = [];

for (const node of ast.statements) {
  if (
    ts.isVariableStatement(node) &&
    node.declarationList.declarations.some((declaration) => declaration.name.getText(ast) === "CAMPOS")
  ) {
    snippets.push(node.getText(ast));
  }
  if (ts.isFunctionDeclaration(node) && node.name && functionNames.has(node.name.text)) {
    snippets.push(node.getText(ast));
  }
}

assert.equal(snippets.length, 4, "the real draft helpers and CAMPOS must be extractable from the page");
const transpiled = ts.transpileModule(snippets.join("\n"), {
  compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { borradorVacio, desdeLugar, valoresDeBorrador } = vm.runInNewContext(
  `${transpiled}\n({ borradorVacio, desdeLugar, valoresDeBorrador })`,
);

test("create and update preserve empty and populated photo credits", async () => {
  const requests = [];
  const client = createClient("https://example.invalid", "test", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (url, init = {}) => {
        const body = JSON.parse(init.body);
        requests.push({ url: new URL(url), method: init.method, body });
        return new Response(JSON.stringify([{ id: "lugar-1", ...body }]), {
          headers: { "content-type": "application/json", "content-range": "0-0/1" },
        });
      },
    },
  });
  const provider = dataProvider(client);
  const draft = borradorVacio();

  assert.ok(Object.hasOwn(draft, "creditos_foto"));
  assert.equal(draft.creditos_foto, "");

  await provider.create({
    resource: "lugares_guia",
    variables: valoresDeBorrador(draft, []),
  });
  assert.equal(requests[0].url.pathname, "/rest/v1/lugares_guia");
  assert.equal(requests[0].method, "POST");
  assert.equal(requests[0].body.creditos_foto, "");

  draft.creditos_foto = "Foto: Autor, CC BY-SA 4.0";
  await provider.update({
    resource: "lugares_guia",
    id: "lugar-1",
    variables: valoresDeBorrador(draft, []),
  });
  assert.equal(requests[1].method, "PATCH");
  assert.equal(requests[1].body.creditos_foto, "Foto: Autor, CC BY-SA 4.0");

  draft.creditos_foto = "";
  await provider.update({
    resource: "lugares_guia",
    id: "lugar-1",
    variables: valoresDeBorrador(draft, []),
  });
  assert.equal(requests[2].method, "PATCH");
  assert.equal(requests[2].body.creditos_foto, "");

  assert.equal(desdeLugar({ ...draft, creditos_foto: null }).creditos_foto, "");
  assert.equal(desdeLugar({ ...draft, creditos_foto: undefined }).creditos_foto, "");
});
