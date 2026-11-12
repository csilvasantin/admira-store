import * as THREE from 'three';
import { attachGalleonPlaylist } from '../galleon-100/playlist.mjs?v=20261112-fold5';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.querySelector('#fold5');
const angle = document.querySelector('#fold-angle');
const angleValue = document.querySelector('#fold-value');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101c32');
const camera = new THREE.PerspectiveCamera(34, 1, .01, 20);
camera.position.set(.9, .35, 3.5);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 1.8;
controls.maxDistance = 6;
scene.add(new THREE.HemisphereLight('#f0f6ff', '#323754', 3));
const light = new THREE.DirectionalLight('#dceaff', 2.8);
light.position.set(2, 3, 4);
scene.add(light);

const body = new THREE.MeshStandardMaterial({ color: '#353d4e', metalness: .68, roughness: .3 });
const glass = new THREE.MeshStandardMaterial({ color: '#070b11', metalness: .24, roughness: .22 });
const cameraMetal = new THREE.MeshStandardMaterial({ color: '#151c2b', metalness: .62, roughness: .24 });

function displayTexture() {
  const pixels = document.createElement('canvas');
  pixels.width = 1024;
  pixels.height = 1224;
  const ctx = pixels.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 1024, 1224);
  base.addColorStop(0, '#111c43');
  base.addColorStop(.46, '#3d4a8b');
  base.addColorStop(1, '#111628');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 1224);
  for (let index = 0; index < 13; index++) {
    ctx.strokeStyle = index % 2 ? '#b7c8ff44' : '#84c9f244';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(540, 595 + index * 13, 532 - index * 12, 290 - index * 9, -.7, 0, Math.PI * 2);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(pixels);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const wallpaper = displayTexture();
const coverDisplay = document.createElement('canvas');
coverDisplay.width = 480;
coverDisplay.height = 1240;
const coverTexture = new THREE.CanvasTexture(coverDisplay);
coverTexture.colorSpace = THREE.SRGBColorSpace;
const interiorTextures = [];
const phone = new THREE.Group();
const hinge = new THREE.Group();
const left = new THREE.Group();
const right = new THREE.Group();
const orientation = new THREE.Group();
hinge.add(left);
phone.add(hinge, right);
orientation.add(phone);
scene.add(orientation);

function rounded(group, dimensions, position, material, radius) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...dimensions, 3, radius), material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

// Escala 1:100. Mitades del chasis de 129,9 × 154,9 mm y perfil de 6,1 mm abierto.
const height = 1.549, depth = .061, gap = .009;
const width = (1.299 - gap) / 2;
// Pivot just beyond the inner glass so the two inner screens face each other when shut.
hinge.position.z = .038;
left.position.z = -hinge.position.z;
for (const [group, sign] of [[left, -1], [right, 1]]) {
  const x = sign * (width / 2 + gap / 2);
  rounded(group, [width, height, depth], [x, 0, 0], body, .026);
  rounded(group, [width - .022, height - .024, .009], [x, 0, .031], glass, .004);
  const texture = wallpaper.clone();
  interiorTextures.push(texture);
  texture.repeat.x = .5;
  texture.offset.x = sign < 0 ? 0 : .5;
  texture.needsUpdate = true;
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(width - .052, height - .056), new THREE.MeshBasicMaterial({ map: texture }));
  surface.position.set(x, 0, .036);
  group.add(surface);
}

const coverMaterial = new THREE.MeshBasicMaterial({ map: wallpaper });
const cover = new THREE.Mesh(new THREE.PlaneGeometry(width - .079, height - .084), coverMaterial);
cover.rotation.y = Math.PI;
cover.position.set(-(width + gap) / 2, 0, -.036);
left.add(cover);
rounded(right, [.16, .43, .028], [.53, .455, -.035], body, .014);
for (const y of [.59, .455, .32]) {
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(.043, .049, .024, 32), cameraMetal);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(.53, y, -.057);
  right.add(lens);
}

function setAngle(value) {
  angle.value = String(value);
  angleValue.value = value + '°';
  const rotation = THREE.MathUtils.degToRad(180 - value);
  hinge.rotation.y = rotation;
  const outsideEdge = width + gap / 2;
  const leftEdge = Math.min(-outsideEdge * Math.cos(rotation), -gap / 2 * Math.cos(rotation));
  phone.position.x = -(outsideEdge + leftEdge) / 2;
}
angle.addEventListener('input', () => setAngle(Number(angle.value)));
document.querySelector('#fold-close').onclick = () => setAngle(0);
document.querySelector('#fold-open').onclick = () => setAngle(180);
setAngle(180);

const orientationButtons = document.querySelectorAll('[data-fold-orientation]');
for (const button of orientationButtons) {
  button.addEventListener('click', () => {
    orientation.rotation.z = button.dataset.foldOrientation === 'landscape' ? Math.PI / 2 : 0;
    for (const option of orientationButtons) option.setAttribute('aria-pressed', String(option === button));
  });
}

const feed = document.querySelector('#feed');
const importer = document.querySelector('#importer');
const status = document.querySelector('#status');
const origin = new URL(feed.src).origin;
const subscribe = attachGalleonPlaylist(feed, importer, status, {
  storageKey: 'admira-fold5-playlist-v1',
  loadingMessage: 'Cargando las pantallas del Fold5…',
});
feed.addEventListener('load', subscribe);
let lastFrame = 0;
const watchdog = setInterval(() => {
  if (Date.now() - lastFrame > 3000) {
    if (status.textContent !== 'Esperando la señal de Admira TV') status.textContent = 'Esperando la señal de Admira TV';
    subscribe();
  }
}, 1500);
window.addEventListener('pagehide', () => clearInterval(watchdog), { once: true });

function drawScreen(surface, frame) {
  const context = surface.getContext('2d');
  const scale = Math.min(surface.width / frame.width, surface.height / frame.height);
  const width = frame.width * scale;
  const height = frame.height * scale;
  context.fillStyle = '#050810';
  context.fillRect(0, 0, surface.width, surface.height);
  context.drawImage(frame, (surface.width - width) / 2, (surface.height - height) / 2, width, height);
}

window.addEventListener('message', event => {
  if (event.origin !== origin || event.source !== feed.contentWindow || event.data?.type !== 'admira:galleon:frame') return;
  const { landscape, portrait, ready } = event.data;
  if (!(landscape instanceof ImageBitmap) || !(portrait instanceof ImageBitmap)) return;
  try {
    if (landscape.width !== 720 || landscape.height !== 384 || portrait.width !== 480 || portrait.height !== 640) return;
    lastFrame = Date.now();
    if (ready?.landscape) {
      drawScreen(wallpaper.image, landscape);
      interiorTextures.forEach(texture => { texture.needsUpdate = true; });
    }
    if (ready?.portrait) {
      drawScreen(coverDisplay, portrait);
      coverTexture.needsUpdate = true;
      coverMaterial.map = coverTexture;
    }
    const message = ready?.landscape && ready?.portrait ? 'Emitiendo en la pantalla interior y en la cubierta'
      : 'Cargando las pantallas del Fold5…';
    if (status.textContent !== message) status.textContent = message;
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
