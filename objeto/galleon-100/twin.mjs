import * as THREE from 'three';
import { attachGalleonPlaylist } from './playlist.mjs';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.querySelector('#keyboard');
const status = document.querySelector('#status');
const feed = document.querySelector('#feed');
const feedOrigin = new URL(feed.src).origin;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#10182b');
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
camera.position.set(2.1, 6.3, 6.9);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, .53);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 13;
controls.maxPolarAngle = Math.PI / 2;
scene.add(new THREE.HemisphereLight('#e0eaff', '#3e4350', 2.7));
const light = new THREE.DirectionalLight('#dce6ff', 2);
light.position.set(2, 6, -3);
scene.add(light);

const chassis = new THREE.MeshStandardMaterial({ color: '#121519', roughness: .78 });
const keycap = new THREE.MeshStandardMaterial({ color: '#272c33', roughness: .72 });
const deck = new THREE.Group();
scene.add(deck);

function box(width, height, depth, material, x, y, z, radius = .04) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 3, radius), material);
  mesh.position.set(x, y, z);
  deck.add(mesh);
  return mesh;
}

box(5.68, .25, 1.96, chassis, 0, 0, 0, .09);
const rest = new THREE.MeshStandardMaterial({ color: '#17161a', roughness: .93 });
const trim = new THREE.MeshStandardMaterial({ color: '#34333b', roughness: .65 });
box(5.65, .15, 1.21, rest, 0, -.041, 1.58, .075);
box(.13, .015, .48, trim, 0, .039, 1.93, .006);
box(5.42, .014, .045, trim, -.08, .129, -.894, .006);
box(.92, .035, 1.81, rest, 2.27, .132, .015, .017);

const legend = document.createElement('canvas');
legend.width = 2048;
legend.height = 1152;
const ink = legend.getContext('2d');
const legendWidth = 5.7, legendDepth = 3.22, legendCenter = .62;
function lettering(text, x, z, size, angle = 0, color = '#e7ecf5') {
  ink.save();
  ink.translate((x / legendWidth + .5) * legend.width, ((z - legendCenter) / legendDepth + .5) * legend.height);
  ink.rotate(angle);
  ink.font = '600 ' + size + 'px system-ui';
  ink.fillStyle = color;
  ink.textAlign = 'center';
  ink.textBaseline = 'middle';
  ink.fillText(text, 0, 0);
  ink.restore();
}
lettering('C O R S A I R', -.04, -.9, 25);
lettering('C O R S A I R', 0, 1.93, 23, -Math.PI / 2);

const rgb = ['#5f397b', '#50428f', '#255f9a', '#186f91', '#27806e'].map(color =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .22, roughness: .6 }));
const pitch = .233, left = -2.72;
function key(label, unit, z, units = 1, rowSpan = .224) {
  const width = units * pitch - .018;
  const x = left + (unit + units / 2) * pitch;
  box(width + .015, .035, rowSpan + .009, rgb[Math.min(4, Math.floor(unit / 3.3))], x, .144, z, .01);
  box(width, .105, rowSpan, keycap, x, .194, z, .026);
  if (label) lettering(label, x, z - .011, label.length > 3 ? 15 : 21);
}
function row(z, keys, start = 0) {
  let unit = start;
  for (const entry of keys) {
    const [label, width] = Array.isArray(entry) ? entry : [entry, 1];
    key(label, unit, z, width);
    unit += width;
  }
}
key('ESC', 0, -.715);
for (let i = 0; i < 12; i++) key('F' + (i + 1), 1.55 + i + Math.floor(i / 4) * .65, -.715);
row(-.428, ['º', '1!', '2”', '3·', '4$', '5%', '6&', '7/', '8(', '9)', '0=', '’?', '¡¿', ['←', 2]]);
row(-.171, [['TAB', 1.5], 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '^', '+']);
row(.086, [['CAPS', 1.75], 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ', '´', 'Ç']);
key('', 13.5, -.171, 1.5);
key('ENTER', 13.75, .086, 1.25);
box(.27, .093, .086, keycap, left + 14.375 * pitch, .2, -.042, .008);
row(.343, [['SHIFT', 1.25], '<>', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',;', '.:', '-_', ['SHIFT', 2.75]]);
row(.600, [['CTRL', 1.25], ['⊞', 1.25], ['ALT', 1.25], ['', 6.25], ['ALT GR', 1.25], ['FN', 1.25], ['▤', 1.25], ['CTRL', 1.25]]);
row(-.715, ['IMPR', 'BLOQ', 'PAUSA'], 15.6);
row(-.428, ['INS', 'INIC', 'PG↑'], 15.6);
row(-.171, ['SUPR', 'FIN', 'PG↓'], 15.6);
key('↑', 16.6, .343);
row(.6, ['←', '↓', '→'], 15.6);

const dialMaterial = new THREE.MeshStandardMaterial({ color: '#2b2b34', roughness: .7, metalness: .35 });
const dialRing = new THREE.MeshBasicMaterial({ color: '#b8c8fc' });
for (const x of [2.085, 2.56]) {
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.103, .106, .096, 36), dialMaterial);
  dial.position.set(x, .225, -.744);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.115, .009, 8, 40), dialRing);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, .167, -.744);
  deck.add(dial, ring);
}

const labels = new THREE.CanvasTexture(legend);
labels.colorSpace = THREE.SRGBColorSpace;
const labelMaterial = new THREE.MeshBasicMaterial({ map: labels, transparent: true, depthWrite: false, alphaTest: .03 });
for (const [y, min, max] of [[.249, -.85, .75], [.136, -.98, -.86], [.05, 1.69, 2.17]]) {
  const geometry = new THREE.PlaneGeometry(legendWidth, max - min);
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) {
    const z = max - uv.getY(i) * (max - min);
    uv.setY(i, .5 - (z - legendCenter) / legendDepth);
  }
  const surface = new THREE.Mesh(geometry, labelMaterial);
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(0, y, (min + max) / 2);
  deck.add(surface);
}

function screen(width, depth, x, z, pixelWidth, pixelHeight) {
  box(width + .07, .10, depth + .07, keycap, x, .17, z);
  const pixels = document.createElement('canvas');
  pixels.width = pixelWidth;
  pixels.height = pixelHeight;
  const texture = new THREE.CanvasTexture(pixels);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ map: texture }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, .225, z);
  deck.add(mesh);
  return { pixels, texture, context: pixels.getContext('2d') };
}

const lcd = screen(.8, .418, 2.27, -.392, 720, 384);
const keys = Array.from({ length: 12 }, (_, index) =>
  screen(.208, .208, 2.02 + (index % 3) * .25, -.047 + Math.floor(index / 3) * .245, 160, 160));

for (const display of [lcd, ...keys]) {
  display.context.fillStyle = '#000';
  display.context.fillRect(0, 0, display.pixels.width, display.pixels.height);
  display.texture.needsUpdate = true;
}

const subscribe = attachGalleonPlaylist(feed, document.querySelector('#importer'), status);
feed.addEventListener('load', subscribe);
let lastFrame = 0;
const statusTimer = setInterval(() => {
  if (Date.now() - lastFrame > 3000) {
    status.textContent = 'Esperando la señal de Admira TV';
    subscribe();
  }
}, 1500);
window.addEventListener('pagehide', () => clearInterval(statusTimer), { once: true });

window.addEventListener('message', event => {
  if (event.origin !== feedOrigin || event.source !== feed.contentWindow || event.data?.type !== 'admira:galleon:frame') return;
  const { landscape, portrait, playing, ready } = event.data;
  if (!(landscape instanceof ImageBitmap) || !(portrait instanceof ImageBitmap)) return;
  try {
    if (landscape.width !== 720 || landscape.height !== 384 || portrait.width !== 480 || portrait.height !== 640) return;
    lcd.context.drawImage(landscape, 0, 0);
    lcd.texture.needsUpdate = true;
    keys.forEach(({ context, texture }, index) => {
      context.drawImage(portrait, index % 3 * 160, Math.floor(index / 3) * 160, 160, 160, 0, 0, 160, 160);
      texture.needsUpdate = true;
    });
    lastFrame = Date.now();
    status.textContent = ready?.landscape && ready?.portrait ? 'Emitiendo en la pantalla superior y en las 12 teclas'
      : playing ? 'Cargando la otra orientación…' : 'Cargando la playlist de prueba…';
  } finally {
    landscape.close();
    portrait.close();
  }
});

function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
new ResizeObserver(resize).observe(canvas);
resize();
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
