import * as THREE from 'three';
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
const phone = new THREE.Group();
const left = new THREE.Group();
const right = new THREE.Group();
phone.add(left, right);
scene.add(phone);

function rounded(group, dimensions, position, material, radius) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...dimensions, 3, radius), material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

// Escala 1:100. Mitades del chasis de 129,9 × 154,9 mm y perfil de 6,1 mm abierto.
const width = .6495, height = 1.549, depth = .061, gap = .009;
for (const [group, sign] of [[left, -1], [right, 1]]) {
  const x = sign * (width / 2 + gap / 2);
  rounded(group, [width, height, depth], [x, 0, 0], body, .026);
  rounded(group, [width - .022, height - .024, .009], [x, 0, .031], glass, .004);
  const texture = wallpaper.clone();
  texture.repeat.x = .5;
  texture.offset.x = sign < 0 ? 0 : .5;
  texture.needsUpdate = true;
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(width - .052, height - .056), new THREE.MeshBasicMaterial({ map: texture }));
  surface.position.set(x, 0, .036);
  group.add(surface);
}

const cover = new THREE.Mesh(new THREE.PlaneGeometry(width - .079, height - .084), new THREE.MeshBasicMaterial({ map: wallpaper }));
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
  left.rotation.y = (value - 180) * Math.PI / 180;
  left.position.z = (180 - value) / 180 * depth * 1.1;
  phone.position.x = -.27 * (180 - value) / 180;
}
angle.addEventListener('input', () => setAngle(Number(angle.value)));
document.querySelector('#fold-close').onclick = () => setAngle(0);
document.querySelector('#fold-open').onclick = () => setAngle(180);
setAngle(180);

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
