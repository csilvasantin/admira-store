import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dir = new URL("./", import.meta.url);
const registry = JSON.parse(await readFile(new URL("galaxia.json", dir), "utf8"));
const manifest = JSON.parse(await readFile(new URL("manifest.json", dir), "utf8"));
const mcpPage = await readFile(new URL("index.html", dir), "utf8");
const helpPage = await readFile(new URL("../help/index.html", dir), "utf8");

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
