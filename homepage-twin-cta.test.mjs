import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const home = await readFile(new URL("./index.html", import.meta.url), "utf8");
const twin = await readFile(new URL("./admira-xp/index.html", import.meta.url), "utf8");

test("los CTA Try the twin abren directamente el gemelo Xtanco", () => {
  const directUrl = "/admira-xp/?autostart=xtanco&amp;from=portada";
  assert.match(home, new RegExp(`<a href="${directUrl.replace(/[?&]/g, "\\$&")}" class="live"[^>]+data-i18n="nav\\.demo"`));
  assert.match(home, new RegExp(`<a class="cta event" href="${directUrl.replace(/[?&]/g, "\\$&")}"[^>]+data-i18n="hero\\.tryCta"`));
  assert.doesNotMatch(home, /href="#prueba"[^>]+data-i18n="nav\.demo"/);
  assert.doesNotMatch(home, /href="#prueba"[^>]+data-i18n="hero\.tryCta"/);
});

test("el destino reconoce autostart y entra sin pasar por el selector", () => {
  assert.match(twin, /_qs\.get\('autostart'\)/);
  assert.match(twin, /quickStartXtanco\(_ci,_ed\)/);
});
