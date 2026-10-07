import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/xpace-shell.js', import.meta.url), 'utf8');
const loader = source.slice(source.indexOf('  function suiteExperto() {'), source.indexOf('  function start() {'));
assert.ok(loader.includes('doc.head.appendChild(js)'), 'exercise the actual shell loader');
const base = 'https://www.admiranext.com/suite/experto';
function page(url, {iframe = false, existing} = {}) {
  const location = new URL(url), nodes = existing ? [existing] : [], handlers = [];
  const root = {self:{}}; root.top = iframe ? {} : root.self;
  const doc = {
    querySelector: () => nodes.find(n => n.src?.startsWith(base + '.js')),
    createElement: tag => ({tag, attrs:{}, setAttribute(k, v) {this.attrs[k] = v;}}),
    addEventListener: (...args) => handlers.push(args),
    head: {appendChild: n => nodes.push(n)}
  };
  const context = vm.createContext({root, doc, location, URLSearchParams,
    parts:{expert:{classList:{contains: () => false}}}, setPanel() {},
    MutationObserver:class {observe() {}}, fetch() {throw Error('bootstrap cannot make API calls');}});
  return {nodes, handlers, run: () => vm.runInContext(loader + '\nsuiteExperto();', context),
    engines: () => nodes.filter(n => n.tag === 'script' || n.src)};
}

test('exact Store and XpaceOS hosts select the fixed walkthrough engine and retain the CLI', () => {
  for (const host of ['admira.store','www.admira.store','xpaceos.com','www.xpaceos.com']) {
    const p = page(`https://${host}/admira-xp/?ax_demo=store&marca=starbucks`); p.run();
    const [engine] = p.engines(); assert.equal(p.engines().length, 1);
    assert.equal(engine.src, base + '.js?v=20261007-native-demo-control-1');
    assert.equal(engine.attrs['data-admira-demo-engine'], '');
    assert.equal(engine.attrs['data-pata'], host.replace(/^www\./, ''));
    assert.equal(engine.attrs['data-input'], '#xsCli'); assert.equal(engine.attrs['data-log'], '#xsLog');
    assert.equal(engine.attrs['data-form'], '#xsCliForm'); assert.equal(engine.defer, true);
    assert.equal(p.nodes.find(n => n.tag === 'link').href, base + '.css?v=20261005-experto-idioma-1');
  }
});

test('normal visits and mismatched platform or host retain the old engine', () => {
  for (const url of ['https://www.admira.store/', 'https://www.admira.store/?ax_demo=biz',
    'https://www.admira.store/?ax_demo=store-other', 'https://sub.admira.store/?ax_demo=store',
    'https://admira.store.evil.example/?ax_demo=store', 'https://www.admira.app/?ax_demo=store']) {
    const p = page(url); p.run(); const [engine] = p.engines();
    assert.equal(engine.src, base + '.js?v=20261005-experto-idioma-1', url);
    assert.equal(engine.attrs['data-admira-demo-engine'], undefined);
  }
});

test('repeated mounts and preexisting engines do not add a second script or handlers', () => {
  const p = page('https://www.admira.store/?ax_demo=store'); p.run();
  const count = p.nodes.length, handlers = p.handlers.length; p.run();
  assert.equal(p.engines().length, 1); assert.equal(p.nodes.length, count); assert.equal(p.handlers.length, handlers);
  for (const pin of ['20261005-experto-idioma-1','20261007-native-demo-control-1']) {
    const existing = {src:base + '.js?v=' + pin};
    const p = page('https://www.admira.store/?ax_demo=store', {existing}); p.run();
    assert.deepEqual(p.nodes, [existing]); assert.equal(p.handlers.length, 0);
  }
});

test('embedded shell remains isolated', () => {
  for (const options of [{iframe:true}, {}]) {
    const p = page('https://www.admira.store/?ax_demo=store&embed=1', options); p.run();
    assert.equal(p.nodes.length, 0);
  }
  const p = page('https://www.admira.store/?ax_demo=store', {iframe:true}); p.run();
  assert.equal(p.nodes.length, 0);
});

test('both native entry pages invalidate cached shell code, and next seal carries the change', () => {
  for (const file of ['index.html','admira-xp/index.html']) {
    const html = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.ok(html.includes('/assets/xpace-shell.js?v=20261007-native-demo-control-1'), file);
    assert.ok(!html.includes('/assets/xpace-shell.js?v=20261007-kiosko-1'), file);
  }
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const seal = html.match(/name="admiranext-version" content="([^"]+)"/)[1];
  const news = JSON.parse(readFileSync(new URL('../novedades.json', import.meta.url), 'utf8'));
  assert.match(seal, /^v\.07\.10\.2026\.r26\./); assert.ok(news[seal].length >= 2);
});
