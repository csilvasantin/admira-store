import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dir = new URL("./", import.meta.url);
const registry = JSON.parse(await readFile(new URL("galaxia.json", dir), "utf8"));
const manifest = JSON.parse(await readFile(new URL("manifest.json", dir), "utf8"));
const mcpPage = await readFile(new URL("index.html", dir), "utf8");
const helpPage = await readFile(new URL("../help/index.html", dir), "utf8");
const llms = await readFile(new URL("llms.txt", dir), "utf8");

test("el registro conecta los cinco elementos operativos sin IDs duplicados", () => {
  const ids = registry.servers.map((server) => server.id);
  for (const id of ["pixeria", "xpaceos", "admira-tv", "yokup", "admira-live"])
    assert.ok(ids.includes(id), `falta ${id}`);
  assert.equal(new Set(ids).size, ids.length);
  for (const server of registry.servers) assert.match(server.endpoint, /^https:\/\//);
});

test("el relevo conserva identificadores y un flujo comprobable", () => {
  for (const id of ["asset_id", "twin_id", "screen_id", "circuit_id", "scene_id", "project_id", "mission_id", "persona_machine"])
    assert.ok(registry.shared_identifiers[id], `falta ${id}`);
  const flow = registry.flows.find((item) => item.id === "create-operate-broadcast-prove");
  assert.ok(flow);
  assert.match(flow.steps.join(" "), /search_stock/);
  assert.match(flow.steps.join(" "), /yokup_task_update/);
});

test("manifest, página MCP y ayuda humana anuncian el mismo contrato v2.2", () => {
  assert.equal(manifest.server.version, "2.2.0");
  assert.equal(manifest.server.tool_count, 16);
  assert.ok(manifest.tools.some((tool) => tool.name === "galaxy"));
  assert.ok(manifest.resources.some((resource) => resource.uri === "xpaceos://galaxy"));
  assert.match(mcpPage, /16 en v2\.2\.0/);
  assert.match(mcpPage, /xpaceos:\/\/galaxy/);
  assert.match(helpPage, /id="galaxia"/);
  assert.match(helpPage, /'sg\.h':'Connect the Admira Galaxy'/);
});

test("el directorio XpaceOS enumera las mismas herramientas registradas que el manifest", () => {
  const xpaceos = registry.servers.find((server) => server.id === "xpaceos");
  assert.deepEqual(xpaceos.tools, manifest.tools.map((tool) => tool.name));
  assert.equal(manifest.server.tool_count, manifest.tools.length);
  assert.equal(new Set(xpaceos.tools).size, xpaceos.tools.length);
});

test("el catálogo funcional se descubre por HTTP sin inventar herramientas ni recursos MCP", () => {
  const xpaceos = registry.servers.find((server) => server.id === "xpaceos");
  assert.deepEqual(xpaceos.static_catalog, manifest.static_catalog);
  assert.equal(manifest.static_catalog.url, "https://www.xpaceos.com/mcp/funcionalidades.json");
  assert.equal(manifest.static_catalog.docs, "https://www.xpaceos.com/help/funcionalidades/");
  assert.equal(manifest.static_catalog.schema_version, "1.0");
  assert.equal(manifest.static_catalog.delivery, "static-http");
  assert.equal(manifest.static_catalog.number_format, "01.-");
  assert.match("XP-F01", new RegExp(manifest.static_catalog.id_pattern));
  assert.equal(manifest.resources.length, 4);
  assert.equal(manifest.tools.length, 16);
  assert.ok(!manifest.resources.some((resource) => resource.uri === "xpaceos://funcionalidades"));
  assert.ok(!manifest.tools.some((tool) => tool.name === "funcionalidades"));
  assert.match(mcpPage, /href="\/mcp\/funcionalidades\.json"/);
  assert.match(mcpPage, /href="\/help\/funcionalidades\/"/);
  assert.ok(llms.includes(manifest.static_catalog.url));
  assert.ok(llms.includes(manifest.static_catalog.docs));
  assert.match(llms, /guía embebida/);
});
