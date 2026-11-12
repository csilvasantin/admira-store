import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.querySelector('#keyboard');
const status = document.querySelector('#status');
const feed = document.querySelector('#feed');
const feedOrigin = new URL(feed.src).origin;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#10182b');
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
camera.position.set(3.3, 5.3, 5.7);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const controls = new OrbitControls(camera, canvas);
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

box(5.6, .25, 1.92, chassis, 0, 0, 0, .09);
for (let row = 0; row < 6; row += 1) {
  const count = row === 5 ? 12 : 17;
  for (let col = 0; col < count; col += 1) {
    const space = row === 5 && col === 4;
    const x = -2.61 + col * .25 + (row === 5 && col > 4 ? 1.1 : 0);
    box(space ? 1.25 : .215, .12, .21, keycap, x + (space ? .5 : 0), .18, -.74 + row * .29);
  }
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

const lcd = screen(1.1, .59, 2.13, -.56, 720, 384);
const keys = Array.from({ length: 12 }, (_, index) =>
  screen(.208, .208, 1.88 + (index % 3) * .25, -.05 + Math.floor(index / 3) * .245, 160, 160));

for (const display of [lcd, ...keys]) {
  display.context.fillStyle = '#000';
  display.context.fillRect(0, 0, display.pixels.width, display.pixels.height);
  display.texture.needsUpdate = true;
}

function subscribe() {
  feed.contentWindow?.postMessage({ type: 'admira:galleon:subscribe' }, feedOrigin);
}
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
  const { landscape, portrait } = event.data;
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
    status.textContent = 'Señal de playout de Admira TV';
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
