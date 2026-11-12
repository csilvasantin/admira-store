// Casa Creel · Hotel por dentro. Recorrido en primera persona, suites que giran
// entre 1959 y el Upside Down, y la noche de las cuatro campanadas.
import * as THREE from '/portaventura/store/hawkins/three.module.min.js';

const $ = id => document.getElementById(id);
const canvas = $('casa'), loading = $('cargando'), toast = $('aviso');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Plano (metros; x este, z sur) ----------
const ROOMS = {
  vestibulo: {name: 'Vestíbulo', r: [-4, 0, 4, 8], h: 3.6, wall: '#7a5a3f', accent: '#a9875a', floor: '#4a3020'},
  salon: {name: 'Salón del reloj', r: [-12, 0, -4, 8], h: 3.4, wall: '#5d3a3a', accent: '#a26d55', floor: '#3d2618'},
  recepcion: {name: 'Recepción · Radio WSQK', r: [4, 0, 12, 8], h: 3.4, wall: '#405446', accent: '#86a07a', floor: '#3a2a1c'},
  pasillo: {name: 'Pasillo de las suites', r: [-2, -12, 2, 0], h: 3.2, wall: '#6b5440', accent: '#b2905e', floor: '#40291b'},
  s1: {name: 'Suite I · Virginia', r: [-10, -6, -2, 0], h: 3.2, wall: '#6f4b5c', accent: '#c294a2', floor: '#3f2a20', chime: 1, side: -1},
  s2: {name: 'Suite II · Alice', r: [2, -6, 10, 0], h: 3.2, wall: '#3f5a6b', accent: '#8fb4c4', floor: '#3f2a20', chime: 2, side: 1},
  s3: {name: 'Suite III · Victor', r: [-10, -12, -2, -6], h: 3.2, wall: '#5b5a38', accent: '#b7b07a', floor: '#3f2a20', chime: 3, side: -1},
  s4: {name: 'Suite IV · Henry', r: [2, -12, 10, -6], h: 3.2, wall: '#4b3f5e', accent: '#9a8ac0', floor: '#3f2a20', chime: 4, side: 1},
  atico: {name: 'Ático · El portal', r: [-4, -19, 4, -12], h: 2.8, wall: '#4a3b2e', accent: '#7a6248', floor: '#33241a'},
};
const DOORS = [
  {x: -4, a: 3, b: 5}, {x: 4, a: 3, b: 5}, {z: 0, a: -1, b: 1},
  {x: -2, a: -4, b: -2}, {x: 2, a: -4, b: -2}, {x: -2, a: -10, b: -8}, {x: 2, a: -10, b: -8},
  {z: -12, a: -1, b: 1},
];
const SUITES = ['s1', 's2', 's3', 's4'];
const ORDER = ['vestibulo', 'salon', 'recepcion', 'pasillo', ...SUITES, 'atico'];
const CHIMES = [
  {hour: 0, word: 'UNA', text: 'Primera campanada. Las luces parpadean y la Suite I cruza al Otro Lado.'},
  {hour: 1, word: 'RADIO', text: 'Segunda campanada. La radio WSQK se enciende sola y la Suite II se da la vuelta.'},
  {hour: 2, word: 'RELOJ', text: 'Tercera campanada. El reloj de pie marca la hora de Victor: la Suite III gira.'},
  {hour: 3, word: 'CORRE', text: 'Cuarta campanada. Toda la casa cruza y el portal del ático se abre.'},
];

// ---------- Utilidades ----------
const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(11370);
const lerp = (a, b, t) => a + (b - a) * t;
function tex(draw, w = 256, h = 256, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 4;
  return t;
}
const wallpaper = (base, accent) => tex((g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.fillStyle = accent; g.globalAlpha = .28;
  for (let x = 0; x < w; x += 64) g.fillRect(x + 28, 0, 8, h);
  g.globalAlpha = .35;
  for (let y = 32; y < h; y += 128) for (let x = 0; x < w; x += 64) {
    g.beginPath(); g.ellipse(x + 32 - 32 * ((y / 128) % 2), y, 10, 16, 0, 0, 7); g.fill();
  }
  g.globalAlpha = 1; g.fillStyle = '#00000055'; g.fillRect(0, h - 40, w, 40);
}, 256, 256, [1, 1]);
const upsideWall = seed => tex((g, w, h) => {
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#3a0c18'; g.lineWidth = 5;
  for (let i = 0; i < 9; i++) {
    g.beginPath(); let x = (i * 61 + seed * 37) % w, y = h;
    g.moveTo(x, y);
    while (y > 0) { x += (rnd() - .5) * 40; y -= 20 + rnd() * 20; g.lineTo(x, y); }
    g.stroke();
  }
  g.fillStyle = '#ff2d4a22'; for (let i = 0; i < 40; i++) g.fillRect(rnd() * w, rnd() * h, 2, 2);
}, 256, 256, [1, 1]);
const planks = color => tex((g, w, h) => {
  g.fillStyle = color; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) {
    g.fillStyle = `rgba(0,0,0,${.12 + rnd() * .18})`; g.fillRect(0, y, w, 30);
    g.fillStyle = '#00000088'; g.fillRect(0, y + 30, w, 2); g.fillRect((y * 7) % w, y, 2, 30);
  }
}, 256, 256, [2, 2]);
const ashFloor = tex((g, w, h) => {
  g.fillStyle = '#121620'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) { g.fillStyle = rnd() > .8 ? '#5b1424' : '#2a3140'; g.fillRect(rnd() * w, rnd() * h, 3, 3); }
}, 256, 256, [2, 2]);
const windowTex = up => tex((g, w, h) => {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, up ? '#2a0610' : '#0a1838'); grd.addColorStop(1, up ? '#7a1020' : '#1f3c5c');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  if (up) { g.strokeStyle = '#ff6a7a'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * .6, 0); g.lineTo(w * .5, h * .3); g.lineTo(w * .62, h * .4); g.lineTo(w * .45, h * .7); g.stroke(); }
  else { g.fillStyle = '#f4eccf'; g.beginPath(); g.arc(w * .7, h * .25, 16, 0, 7); g.fill(); g.fillStyle = '#ffffff'; for (let i = 0; i < 30; i++) g.fillRect(rnd() * w, rnd() * h * .6, 1.5, 1.5); }
  g.fillStyle = up ? '#14060a' : '#0c1a14'; g.beginPath(); g.moveTo(0, h);
  for (let x = 0; x <= w; x += 16) g.lineTo(x, h * .75 - Math.sin(x * .05) * 10 - rnd() * 14); g.lineTo(w, h); g.fill();
  g.strokeStyle = '#2b1a10'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
}, 128, 160);

// ---------- Escena ----------
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias: true}); }
catch (error) { loading.textContent = 'Tu navegador no puede mostrar la casa en 3D.'; throw error; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#05060a');
scene.fog = new THREE.Fog('#05060a', 10, 30);
const camera = new THREE.PerspectiveCamera(72, 1, .05, 80);
const hemi = new THREE.HemisphereLight('#ffe7c4', '#1a1010', .55);
scene.add(hemi);

const box = (w, h, d, color, opts = {}) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({color, roughness: .8, ...opts}));
const obstacles = [];
function place(mesh, x, y, z, room, solid) {
  mesh.position.set(x, y, z); room.group.add(mesh);
  if (solid) {
    const p = mesh.geometry.parameters, s = mesh.scale;
    const hw = (p.width ?? p.radiusTop * 2 ?? 1) * s.x / 2, hd = (p.depth ?? p.radiusTop * 2 ?? 1) * s.z / 2;
    const rot = Math.abs(Math.sin(mesh.rotation.y)) > .5;
    obstacles.push([x - (rot ? hd : hw), z - (rot ? hw : hd), x + (rot ? hd : hw), z + (rot ? hw : hd)]);
  }
  return mesh;
}

for (const [id, room] of Object.entries(ROOMS)) {
  room.id = id;
  room.group = new THREE.Group(); scene.add(room.group);
  room.warm = new THREE.Group(); room.up = new THREE.Group(); room.up.visible = false;
  room.group.add(room.warm, room.up);
  room.t = 0; room.target = 0; room.flicker = 0;
  room.tex = {warm: wallpaper(room.wall, room.accent), up: upsideWall(id.length + room.r[0]), floorWarm: planks(room.floor)};
  room.mat = {
    wall: new THREE.MeshStandardMaterial({map: room.tex.warm, roughness: .9}),
    floor: new THREE.MeshStandardMaterial({map: room.tex.floorWarm, roughness: .75}),
    ceil: new THREE.MeshStandardMaterial({color: '#e8d6b8', roughness: 1}),
    trim: new THREE.MeshStandardMaterial({color: '#2e1a10', roughness: .6}),
  };
  const [x0, z0, x1, z1] = room.r, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, h = room.h;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), room.mat.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); room.group.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), room.mat.ceil);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, h, cz); room.group.add(ceil);
  // Paredes interiores con huecos de puerta.
  const inset = .05;
  const edges = [
    {axis: 'z', at: z0 + inset, from: x0, to: x1, rot: 0, line: z0},
    {axis: 'z', at: z1 - inset, from: x0, to: x1, rot: Math.PI, line: z1},
    {axis: 'x', at: x0 + inset, from: z0, to: z1, rot: Math.PI / 2, line: x0},
    {axis: 'x', at: x1 - inset, from: z0, to: z1, rot: -Math.PI / 2, line: x1},
  ];
  for (const e of edges) {
    const gaps = DOORS.filter(dr => (e.axis === 'z' ? dr.z : dr.x) === e.line && dr.a >= e.from && dr.b <= e.to).sort((a, b) => a.a - b.a);
    let cursor = e.from;
    const segment = (a, b, y0, y1) => {
      if (b - a < .01) return;
      const len = b - a, mat = room.mat.wall.clone(); mat.map = room.tex.warm.clone(); mat.map.needsUpdate = true;
      mat.map.repeat.set(len / 2.5, (y1 - y0) / 3.2); mat.map.offset.y = y0 / 3.2;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, y1 - y0), mat);
      m.rotation.y = e.rot; const mid = (a + b) / 2;
      if (e.axis === 'z') m.position.set(mid, (y0 + y1) / 2, e.at); else m.position.set(e.at, (y0 + y1) / 2, mid);
      m.userData.repeat = [len / 2.5, (y1 - y0) / 3.2, y0 / 3.2];
      room.group.add(m); (room.walls ||= []).push(m);
      // Zócalo
      if (y0 === 0) {
        const skirt = new THREE.Mesh(new THREE.BoxGeometry(e.axis === 'z' ? len : .04, .18, e.axis === 'z' ? .04 : len), room.mat.trim);
        if (e.axis === 'z') skirt.position.set(mid, .09, e.at); else skirt.position.set(e.at, .09, mid);
        room.group.add(skirt);
      }
    };
    for (const g of gaps) {
      segment(cursor, g.a, 0, h); segment(g.a, g.b, 2.4, h);
      for (const j of [g.a, g.b]) {
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(e.axis === 'z' ? .14 : .32, 2.5, e.axis === 'z' ? .32 : .14), room.mat.trim);
        if (e.axis === 'z') jamb.position.set(j, 1.25, e.line); else jamb.position.set(e.line, 1.25, j);
        room.group.add(jamb);
      }
      cursor = g.b;
    }
    segment(cursor, e.to, 0, h);
  }
  // Luz de la estancia y lámpara de techo.
  room.light = new THREE.PointLight('#ffc98a', 14, 16, 1.6);
  room.light.position.set(cx, h - .5, cz); room.group.add(room.light);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.35, .3, 16, 1, true), new THREE.MeshStandardMaterial({color: '#f6d7a0', emissive: '#ffb860', emissiveIntensity: 1.2, side: THREE.DoubleSide}));
  shade.position.set(cx, h - .45, cz); room.group.add(shade); room.shade = shade;
  // Upside Down: lianas y ceniza.
  for (let i = 0; i < 14; i++) {
    const len = 1 + rnd() * 2.2;
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(.03, .06, len, 5), new THREE.MeshStandardMaterial({color: '#2a0d14', roughness: 1}));
    const onX = rnd() > .5;
    const px = onX ? (rnd() > .5 ? x0 + .12 : x1 - .12) : lerp(x0 + .3, x1 - .3, rnd());
    const pz = onX ? lerp(z0 + .3, z1 - .3, rnd()) : (rnd() > .5 ? z0 + .12 : z1 - .12);
    vine.position.set(px, h - len / 2 + .1, pz); vine.rotation.z = (rnd() - .5) * .6; vine.rotation.x = (rnd() - .5) * .6;
    room.up.add(vine);
  }
  const ashGeo = new THREE.BufferGeometry(), ash = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) ash.set([lerp(x0, x1, rnd()), rnd() * h, lerp(z0, z1, rnd())], i * 3);
  ashGeo.setAttribute('position', new THREE.BufferAttribute(ash, 3));
  room.ash = new THREE.Points(ashGeo, new THREE.PointsMaterial({color: '#c9c3d6', size: .028, transparent: true, opacity: .8}));
  room.up.add(room.ash);
  const fill = new THREE.PointLight('#3a7bff', 0, 12, 1.4); fill.position.set(cx, .6, cz); room.up.add(fill); room.fill = fill;
}

// ---------- Mobiliario ----------
const R = ROOMS;
const wood = '#4d2c19', dark = '#22140c', brass = '#b8893c';
// Vestíbulo: escalera, alfombra, puerta principal y araña.
for (let i = 0; i < 9; i++) place(box(1.6, .2 + i * .3, .34, wood), -3.1, (.2 + i * .3) / 2, 6.8 - i * .34, R.vestibulo);
obstacles.push([-3.95, 3.7, -2.25, 7.1]);
place(box(.06, 2.9, 3.2, dark), -2.3, 1.4, 5.3, R.vestibulo);
place(box(2.4, .02, 4.6, '#6e1d22'), 0, .011, 4, R.vestibulo);
place(box(1.8, 2.6, .12, '#3a2012'), 0, 1.3, 7.92, R.vestibulo);
place(box(.12, .12, .12, brass, {metalness: .8}), .6, 1.2, 7.84, R.vestibulo);
const chandelier = place(new THREE.Mesh(new THREE.TorusGeometry(.6, .05, 8, 24), new THREE.MeshStandardMaterial({color: brass, metalness: .7, roughness: .3})), 0, 2.9, 4, R.vestibulo);
chandelier.rotation.x = Math.PI / 2;
place(box(.9, .9, .5, wood), 3.3, .45, 1, R.vestibulo, true);

// Salón del reloj.
const clock = new THREE.Group(); clock.position.set(-11.55, 0, 4); clock.scale.setScalar(1.3); R.salon.group.add(clock);
const clockLight = new THREE.SpotLight('#ffd9a0', 18, 9, .5, .6, 1.4); clockLight.position.set(-7, 3.2, 4); clockLight.target.position.set(-11.6, 2.2, 4); R.salon.group.add(clockLight, clockLight.target);
for (const [w, h, d, c, y] of [[.7, 2.4, .5, '#3b1d10', 1.2], [.8, .3, .55, '#2a140b', 2.5]]) { const m = box(w, h, d, c); m.position.y = y; clock.add(m); }
const face = new THREE.Mesh(new THREE.CircleGeometry(.27, 32), new THREE.MeshStandardMaterial({color: '#f3e7c9', emissive: '#8a7448', emissiveIntensity: .8}));
face.position.set(.36, 2.05, 0); face.rotation.y = Math.PI / 2; clock.add(face);
const hand = (len, w) => { const g = new THREE.Group(); const m = box(.01, len, w, '#111'); m.position.y = len / 2; g.add(m); g.position.set(.37, 2.05, 0); g.rotation.order = 'YXZ'; clock.add(g); return g; };
const hourHand = hand(.14, .025), minHand = hand(.22, .015);
const pendulum = new THREE.Group(); pendulum.position.set(.38, 1.7, 0); clock.add(pendulum);
const bob = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .02, 20), new THREE.MeshStandardMaterial({color: brass, metalness: .9, roughness: .25}));
bob.rotation.z = Math.PI / 2; bob.position.y = -.8; pendulum.add(bob);
obstacles.push([-12, 3.5, -10.9, 4.5]);
place(box(2.6, .5, 1, '#5a1f24'), -8, .25, 7.2, R.salon, true);
place(box(2.6, .7, .25, '#5a1f24'), -8, .6, 7.6, R.salon);
place(box(1.2, .45, .7, wood), -8, .23, 5.6, R.salon, true);
const fire = place(box(1.6, 1.2, .5, '#3a3030'), -8, .6, .3, R.salon);
const flame = place(new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshBasicMaterial({color: '#ff8a2a'})), -8, .4, .56, R.salon);
const fireLight = new THREE.PointLight('#ff7a2a', 6, 8, 1.6); fireLight.position.set(-8, .6, 1.2); R.salon.warm.add(fireLight);
obstacles.push([-8.8, 0, -7.2, .6]);

// Recepción: mostrador, radio y pared de luces.
place(box(3, 1.1, .7, wood), 7, .55, 3, R.recepcion, true);
const radio = place(box(.7, .4, .35, '#3d2a1a'), 6.4, 1.3, 3, R.recepcion);
const dial = place(new THREE.Mesh(new THREE.PlaneGeometry(.4, .14), new THREE.MeshStandardMaterial({color: '#2a2010', emissive: '#ffb347', emissiveIntensity: .2})), 6.4, 1.33, 3.18, R.recepcion);
const radioLight = new THREE.PointLight('#ffb347', 0, 4, 2); radioLight.position.set(6.4, 1.6, 3.6); R.recepcion.group.add(radioLight);
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const rows = [LETTERS.slice(0, 9), LETTERS.slice(9, 18), LETTERS.slice(18)];
const lettersTex = tex((g, w, h) => {
  g.fillStyle = '#d9c9a0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#00000014'; for (let y = 0; y < h; y += 24) g.fillRect(0, y, w, 12);
  g.fillStyle = '#141010'; g.font = 'bold 74px Georgia'; g.textAlign = 'center';
  rows.forEach((row, r) => [...row].forEach((ch, i) => g.fillText(ch, (i + .5) * w / 9 + (r === 2 ? w / 18 : 0), 150 + r * 170)));
}, 1024, 512);
const board = place(new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.6), new THREE.MeshStandardMaterial({map: lettersTex, roughness: 1})), 11.93, 1.75, 4, R.recepcion);
board.rotation.y = -Math.PI / 2;
const bulbColors = ['#ff3b3b', '#ffd23b', '#3bff7a', '#3b9bff', '#ff6bd1'];
const bulbs = {};
rows.forEach((row, r) => [...row].forEach((ch, i) => {
  const u = (i + .5) / 9 + (r === 2 ? 1 / 18 : 0);
  const color = bulbColors[(r * 9 + i) % bulbColors.length];
  const mat = new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: .08});
  const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), mat);
  b.position.set(11.85, 1.75 + 1.3 - (55 + r * 170) / 512 * 2.6, 4 + 3.2 - u * 6.4);
  R.recepcion.group.add(b); bulbs[ch] = b;
}));
const wire = place(new THREE.Mesh(new THREE.BoxGeometry(.015, .015, 6.4), new THREE.MeshBasicMaterial({color: '#1a3a1a'})), 11.87, 2.95, 4, R.recepcion);

// Pasillo: alfombra y apliques.
place(box(1.4, .02, 11.6, '#5b1b26'), 0, .011, -6, R.pasillo);
for (const z of [-2, -6, -10]) for (const x of [-1.9, 1.9]) {
  const s = place(new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshStandardMaterial({color: '#ffe0a8', emissive: '#ffb860', emissiveIntensity: 1.5})), x, 2.1, z, R.pasillo);
  R.pasillo.warm.add(s);
}

// Suites.
const winWarm = windowTex(false), winUp = windowTex(true);
for (const id of SUITES) {
  const room = R[id], [x0, z0, x1, z1] = room.r, side = room.side, cz = (z0 + z1) / 2;
  const outer = side < 0 ? x0 : x1, wallX = outer - side * .3;
  // Cama con cabecero contra la pared exterior.
  const bedX = outer - side * 1.25;
  place(box(2.1, .45, 1.7, wood), bedX, .22, cz, room, true);
  place(box(2, .2, 1.6, '#efe3cf'), bedX, .55, cz, room);
  place(box(.12, 1.3, 1.8, '#3a1f10'), outer - side * .18, .65, cz, room);
  place(box(.5, .12, 1.5, room.accent), bedX + side * .5, .68, cz, room);
  place(box(.4, .2, .35, '#fff6e6'), outer - side * .55, .72, cz - .45, room); place(box(.4, .2, .35, '#fff6e6'), outer - side * .55, .72, cz + .45, room);
  // Mesilla con lámpara y walkie.
  place(box(.5, .55, .5, wood), outer - side * .35, .27, cz + 1.3, room, true);
  const lamp = place(new THREE.Mesh(new THREE.ConeGeometry(.18, .25, 14, 1, true), new THREE.MeshStandardMaterial({color: '#f3d9a6', emissive: '#ffb860', emissiveIntensity: 1.1, side: THREE.DoubleSide})), outer - side * .35, .85, cz + 1.3, room);
  room.lamp = lamp;
  place(box(.07, .18, .04, '#1a1a1a'), outer - side * .3, .64, cz + 1.18, room);
  // Ventana en la pared exterior.
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.6), new THREE.MeshBasicMaterial({map: winWarm}));
  win.position.set(outer - side * .07, 1.8, z0 + 1.4); win.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  room.group.add(win); room.window = win;
  // Armario y baúl.
  place(box(1.4, 2.2, .6, '#3b2213'), (x0 + x1) / 2 + side * .6, 1.1, z0 + .4, room, true);
  place(box(1.1, .5, .55, '#5a3820'), (x0 + x1) / 2, .25, z1 - .45, room, true);
  // Placa de la puerta.
  const label = tex((g, w, h) => { g.fillStyle = '#2b1a10'; g.fillRect(0, 0, w, h); g.fillStyle = brass; g.font = 'bold 54px Georgia'; g.textAlign = 'center'; g.fillText(['I', 'II', 'III', 'IV'][room.chime - 1], w / 2, 70); }, 128, 96);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(.35, .26), new THREE.MeshBasicMaterial({map: label}));
  const doorZ = room.chime <= 2 ? -3 : -9;
  plate.position.set(side * 1.93, 2.65, doorZ); plate.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  R.pasillo.group.add(plate);
}

// Ático: baúles, caballito y portal.
for (const [x, z, w] of [[-3, -17.5, 1.2], [2.8, -16, .9], [-2.6, -13.2, .8], [3, -13.4, 1]]) place(box(w, w * .7, w * .8, '#4a3320'), x, w * .35, z, R.atico, true);
const portalTex = tex((g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
  grd.addColorStop(0, '#fff2f0'); grd.addColorStop(.25, '#ff3b4a'); grd.addColorStop(.6, '#5c0a18'); grd.addColorStop(1, '#00000000');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#2a040a'; g.lineWidth = 6;
  for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(w / 2, h / 2); const a = i / 10 * 6.28; g.quadraticCurveTo(w / 2 + Math.cos(a + .6) * 70, h / 2 + Math.sin(a + .6) * 70, w / 2 + Math.cos(a) * 130, h / 2 + Math.sin(a) * 130); g.stroke(); }
}, 256, 256);
const portal = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshBasicMaterial({map: portalTex, transparent: true, depthWrite: false}));
portal.position.set(0, 1.4, -18.9); portal.scale.setScalar(.001); R.atico.group.add(portal);
const portalLight = new THREE.PointLight('#ff2a3a', 0, 10, 1.4); portalLight.position.set(0, 1.4, -17.8); R.atico.group.add(portalLight);
const crack = place(box(.06, 2.2, .02, '#16040a'), 0, 1.4, -18.94, R.atico);

// ---------- Movimiento ----------
const player = {x: 0, z: 6.8, yaw: 0, pitch: -.04};
const walkable = (x, z) => {
  const r = .3;
  for (const o of obstacles) if (x > o[0] - r && x < o[2] + r && z > o[1] - r && z < o[3] + r) return false;
  for (const room of Object.values(ROOMS)) { const [x0, z0, x1, z1] = room.r; if (x > x0 + r && x < x1 - r && z > z0 + r && z < z1 - r) return true; }
  for (const d of DOORS) {
    if (d.x !== undefined && Math.abs(x - d.x) <= .5 && z > d.a + r && z < d.b - r) return true;
    if (d.z !== undefined && Math.abs(z - d.z) <= .5 && x > d.a + r && x < d.b - r) return true;
  }
  return false;
};
const roomAt = (x, z) => ORDER.find(id => { const [x0, z0, x1, z1] = ROOMS[id].r; return x >= x0 && x <= x1 && z >= z0 && z <= z1; });
const keys = new Set();
addEventListener('keydown', e => {
  if (e.target.closest('input,select,textarea')) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'q', 'e'].includes(k)) { keys.add(k); if (document.activeElement === canvas) e.preventDefault(); }
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
let drag;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); drag = {x: e.clientX, y: e.clientY}; canvas.focus(); });
canvas.addEventListener('pointermove', e => {
  if (!drag) return;
  player.yaw -= (e.clientX - drag.x) * .005; player.pitch = Math.max(-1.1, Math.min(1.1, player.pitch - (e.clientY - drag.y) * .004));
  drag = {x: e.clientX, y: e.clientY};
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('lostpointercapture', () => { drag = null; });
document.querySelectorAll('[data-move]').forEach(b => {
  const k = b.dataset.move;
  const on = e => { e.preventDefault(); keys.add(k); }, off = () => keys.delete(k);
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
});

// Teletransporte a cada estancia.
const SPAWN = {
  vestibulo: [0, 6.8, 0], salon: [-5, 4, Math.PI / 2], recepcion: [5, 4, -Math.PI / 2], pasillo: [0, -.8, 0],
  s1: [-3, -3, Math.PI / 2], s2: [3, -3, -Math.PI / 2], s3: [-3, -9, Math.PI / 2], s4: [3, -9, -Math.PI / 2], atico: [0, -12.8, 0],
};
function goTo(id) { const [x, z, yaw] = SPAWN[id]; Object.assign(player, {x, z, yaw, pitch: -.04}); }

// ---------- Estado de la noche ----------
const state = {minutes: 23 * 60, running: false, speed: 0, rung: 0, sound: false};
const fmt = m => { const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60); return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };
let toastTimer;
function say(text) { toast.textContent = text; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 6000); }

function setRoom(id, up, silent) {
  const room = ROOMS[id]; room.target = up ? 1 : 0; room.flicker = reduced ? 0 : 1.6;
  if (!silent && SUITES.includes(id)) say(`${room.name} ${up ? 'cruza al Upside Down' : 'vuelve a 1959'}.`);
  renderPanel();
}
const anyUp = () => Object.values(ROOMS).some(r => r.target);

// Audio sintetizado.
let audio;
function ctx() { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); return audio; }
function bell(count) {
  if (!state.sound) return;
  const a = ctx();
  for (let i = 0; i < count; i++) {
    const t0 = a.currentTime + i * 1.6;
    for (const [f, g] of [[196, .5], [392, .25], [523, .18], [784, .08]]) {
      const o = a.createOscillator(), v = a.createGain();
      o.frequency.value = f; v.gain.setValueAtTime(0, t0); v.gain.linearRampToValueAtTime(g * .5, t0 + .01); v.gain.exponentialRampToValueAtTime(.0001, t0 + 3.4);
      o.connect(v).connect(a.destination); o.start(t0); o.stop(t0 + 3.5);
    }
  }
}
function staticNoise(seconds = 3) {
  if (!state.sound) return;
  const a = ctx(), buffer = a.createBuffer(1, a.sampleRate * seconds, a.sampleRate), data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (.4 + .6 * Math.abs(Math.sin(i / 3000)));
  const src = a.createBufferSource(), filter = a.createBiquadFilter(), v = a.createGain();
  src.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = 1800; v.gain.value = .12;
  src.connect(filter).connect(v).connect(a.destination); src.start();
  const o = a.createOscillator(), og = a.createGain(); o.type = 'square'; o.frequency.value = 440; og.gain.value = 0;
  o.connect(og).connect(a.destination); o.start();
  // Morse corto "SOS" dentro de la estática.
  [0, .2, .4, .8, 1.2, 1.6, 2.0, 2.2, 2.4].forEach((d, i) => { const len = i >= 3 && i <= 5 ? .3 : .1; og.gain.setValueAtTime(.05, a.currentTime + .3 + d); og.gain.setValueAtTime(0, a.currentTime + .3 + d + len); });
  o.stop(a.currentTime + seconds);
}

// Pared de luces: deletrea una palabra.
let spelling = Promise.resolve();
function spell(word) {
  spelling = spelling.then(async () => {
    $('luces-texto').textContent = word;
    for (const ch of word) {
      const b = bulbs[ch]; if (!b) continue;
      b.material.emissiveIntensity = 3.5; await new Promise(r => setTimeout(r, reduced ? 250 : 650));
      b.material.emissiveIntensity = .08; await new Promise(r => setTimeout(r, 120));
    }
  });
}

function ring(n) {
  const c = CHIMES[n - 1];
  state.rung = n;
  bell(n); spell(c.word); say(c.text);
  for (const r of Object.values(ROOMS)) r.flicker = reduced ? 0 : 1.2;
  if (n === 2) { staticNoise(3.2); radioPulse = 4; }
  if (n === 3) clockSwing = 3;
  setRoom(SUITES[n - 1], true, true);
  if (n === 4) for (const id of ORDER) setRoom(id, true, true);
  renderPanel();
}
let radioPulse = 0, clockSwing = 0;

function startNight() {
  dawn(true);
  state.running = true; state.speed = 270 / 75; // 23:00 → 03:30 en 75 s
  say('Empieza la noche en la Casa Creel. Escucha el reloj.');
  renderPanel();
}
function dawn(silent) {
  state.running = false; state.minutes = 23 * 60; state.rung = 0;
  for (const id of ORDER) { ROOMS[id].target = 0; ROOMS[id].flicker = 0; }
  if (!silent) say('Amanece. La casa vuelve a 1959.');
  renderPanel();
}
function jumpTo(n) {
  dawn(true);
  for (let i = 1; i <= n; i++) ring(i);
  state.minutes = 24 * 60 + CHIMES[n - 1].hour * 60;
  state.running = false;
  renderPanel();
}

// ---------- Panel ----------
const listaSuites = $('suites'), listaSalas = $('salas'), campanas = $('campanadas');
listaSalas.innerHTML = ORDER.map(id => `<button type="button" class="chip" data-go="${id}">${ROOMS[id].name}</button>`).join('');
listaSalas.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { goTo(b.dataset.go); canvas.focus(); } });
listaSuites.innerHTML = SUITES.map(id => `<li><span><b>${ROOMS[id].name}</b><small data-era="${id}"></small></span><button type="button" class="chip" data-flip="${id}"></button></li>`).join('');
listaSuites.addEventListener('click', e => { const b = e.target.closest('[data-flip]'); if (b) setRoom(b.dataset.flip, !ROOMS[b.dataset.flip].target); });
campanas.innerHTML = CHIMES.map((c, i) => `<button type="button" class="chip" data-ring="${i + 1}">${i + 1}ª · ${fmt(24 * 60 + c.hour * 60)}</button>`).join('');
campanas.addEventListener('click', e => { const b = e.target.closest('[data-ring]'); if (b) jumpTo(Number(b.dataset.ring)); });
$('noche').addEventListener('click', startNight);
$('amanecer').addEventListener('click', () => dawn());
$('sonido').addEventListener('click', e => { state.sound = !state.sound; e.currentTarget.setAttribute('aria-pressed', state.sound); e.currentTarget.textContent = state.sound ? 'Sonido activado' : 'Activar sonido'; if (state.sound) bell(1); });
$('luces').addEventListener('submit', e => { e.preventDefault(); const v = $('luces-input').value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 14); if (v) { spell(v); goTo('recepcion'); } });

function renderPanel() {
  $('hora').textContent = fmt(state.minutes);
  $('progreso').textContent = `${state.rung} / 4 campanadas`;
  for (const id of SUITES) {
    const up = ROOMS[id].target === 1;
    listaSuites.querySelector(`[data-era="${id}"]`).textContent = up ? 'Upside Down' : '1959';
    const b = listaSuites.querySelector(`[data-flip="${id}"]`);
    b.textContent = up ? 'Volver a 1959' : 'Girar ahora'; b.setAttribute('aria-pressed', up);
  }
  campanas.querySelectorAll('[data-ring]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.ring) <= state.rung));
  $('noche').disabled = state.running;
  document.body.classList.toggle('upside', anyUp());
}

// ---------- Minimapa ----------
const mini = $('plano'), mg = mini.getContext('2d');
const MAP = {x0: -13, z0: -20, x1: 13, z1: 9};
const toMap = (x, z) => [(x - MAP.x0) / (MAP.x1 - MAP.x0) * mini.width, (z - MAP.z0) / (MAP.z1 - MAP.z0) * mini.height];
mini.addEventListener('click', e => {
  const rect = mini.getBoundingClientRect();
  const x = MAP.x0 + (e.clientX - rect.left) / rect.width * (MAP.x1 - MAP.x0), z = MAP.z0 + (e.clientY - rect.top) / rect.height * (MAP.z1 - MAP.z0);
  const id = roomAt(x, z); if (id) goTo(id);
});
function drawMap(current) {
  mg.clearRect(0, 0, mini.width, mini.height);
  for (const id of ORDER) {
    const room = ROOMS[id], [a, b] = toMap(room.r[0], room.r[1]), [c, d] = toMap(room.r[2], room.r[3]);
    mg.fillStyle = room.target ? '#1b2a44' : '#3a2a22'; if (id === current) mg.fillStyle = room.target ? '#2f4f86' : '#6b3f2f';
    mg.fillRect(a + 1, b + 1, c - a - 2, d - b - 2);
  }
  const [px, pz] = toMap(player.x, player.z);
  mg.fillStyle = '#ff624f'; mg.beginPath(); mg.arc(px, pz, 4, 0, 7); mg.fill();
  mg.strokeStyle = '#ff624f'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(px, pz); mg.lineTo(px - Math.sin(player.yaw) * 12, pz - Math.cos(player.yaw) * 12); mg.stroke();
}

// ---------- Bucle ----------
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
}
const warmLight = new THREE.Color('#ffc98a'), upLight = new THREE.Color('#ff3348');
let last = performance.now(), currentRoom;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  resize();
  // Movimiento
  const turn = (keys.has('arrowleft') || keys.has('q') ? 1 : 0) - (keys.has('arrowright') || keys.has('e') ? 1 : 0);
  player.yaw += turn * dt * 1.9;
  const fwd = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
  const strafe = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
  if (fwd || strafe) {
    const sp = 2.8 * dt, sx = -Math.sin(player.yaw), sz = -Math.cos(player.yaw);
    const dx = (sx * fwd - sz * strafe) * sp, dz = (sz * fwd + sx * strafe) * sp;
    if (walkable(player.x + dx, player.z)) player.x += dx;
    if (walkable(player.x, player.z + dz)) player.z += dz;
  }
  const bobY = fwd || strafe ? Math.sin(now / 140) * .025 : 0;
  camera.position.set(player.x, 1.62 + bobY, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');

  // Reloj de la noche
  if (state.running) {
    state.minutes += dt * state.speed * 60 / 60 * 1;
    const next = CHIMES[state.rung];
    if (next && state.minutes >= 24 * 60 + next.hour * 60) ring(state.rung + 1);
    if (state.minutes >= 27.5 * 60) { state.running = false; say('Son las 03:30. La casa entera está al otro lado. Pulsa «Amanecer» para volver a 1959.'); }
    $('hora').textContent = fmt(state.minutes); $('noche').disabled = state.running;
  }
  const mins = state.minutes % 720;
  minHand.rotation.x = -(mins % 60) / 60 * Math.PI * 2;
  hourHand.rotation.x = -mins / 720 * Math.PI * 2;
  clockSwing = Math.max(0, clockSwing - dt);
  pendulum.rotation.x = Math.sin(now / 500) * (reduced ? 0 : .12 + clockSwing * .08);
  face.material.emissiveIntensity = .8 + clockSwing * .8;

  // Estancias: mezcla 1959 ↔ Upside Down
  for (const room of Object.values(ROOMS)) {
    room.t += Math.sign(room.target - room.t) * Math.min(Math.abs(room.target - room.t), dt / 1.4);
    room.flicker = Math.max(0, room.flicker - dt);
    const up = room.t > .5;
    if (room.up.visible !== up) {
      room.up.visible = up; room.warm.visible = !up;
      for (const w of room.walls) { w.material.map = up ? room.tex.up.clone() : room.tex.warm.clone(); const [rx, ry, oy] = w.userData.repeat; w.material.map.repeat.set(rx, ry); w.material.map.offset.y = oy; w.material.map.needsUpdate = true; w.material.needsUpdate = true; }
      room.mat.floor.map = up ? ashFloor : room.tex.floorWarm; room.mat.floor.needsUpdate = true;
      room.mat.ceil.color.set(up ? '#141a24' : '#e8d6b8');
      if (room.window) room.window.material.map = up ? winUp : winWarm;
    }
    const flick = room.flicker > 0 ? (Math.random() > .5 ? 1 : .08) : 1;
    room.light.color.copy(warmLight).lerp(upLight, room.t);
    room.light.intensity = lerp(14, 6, room.t) * flick;
    room.fill.intensity = room.t * 6;
    room.shade.material.emissiveIntensity = lerp(1.2, .15, room.t) * flick;
    if (room.lamp) room.lamp.material.emissiveIntensity = lerp(1.1, 0, room.t) * flick;
    if (up && !reduced) {
      const p = room.ash.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { let y = p.getY(i) + dt * .12; if (y > room.h) y = 0; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(now / 900 + i) * dt * .05); }
      p.needsUpdate = true;
    }
  }
  const allUp = ROOMS.atico.t;
  scene.fog.color.set(allUp > .5 ? '#070b14' : '#05060a');
  hemi.intensity = lerp(.55, .25, ROOMS[roomAt(player.x, player.z) || 'vestibulo'].t);
  hemi.color.set(ROOMS[roomAt(player.x, player.z) || 'vestibulo'].t > .5 ? '#7fa6ff' : '#ffe7c4');
  flame.material.color.setHSL(.07 + Math.sin(now / 90) * .01, 1, .55 + Math.sin(now / 70) * .05);
  fireLight.intensity = 5 + Math.sin(now / 80) * 1.2;
  // Radio
  radioPulse = Math.max(0, radioPulse - dt);
  dial.material.emissiveIntensity = .2 + (radioPulse > 0 ? (Math.random() * 2) : 0);
  radioLight.intensity = radioPulse > 0 ? 2 + Math.random() * 3 : 0;
  // Portal
  const open = state.rung >= 4 ? 1 : 0;
  portal.scale.setScalar(Math.max(.001, lerp(portal.scale.x, open, dt * 1.2)));
  portal.rotation.z += dt * .4;
  portalLight.intensity = portal.scale.x * (10 + Math.sin(now / 150) * 3);
  crack.visible = !open;

  const id = roomAt(player.x, player.z);
  if (id && id !== currentRoom) {
    currentRoom = id;
    $('sala').textContent = ROOMS[id].name;
  }
  $('era').textContent = id && ROOMS[id].t > .5 ? 'Upside Down' : '1959';
  drawMap(id);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
renderPanel();
loading.hidden = true;
requestAnimationFrame(frame);

// API mínima para pruebas y demo.
window.casaCreel = {goTo, ring, jumpTo, startNight, dawn, setRoom, spell, state, player, rooms: ROOMS};


/* admiranext xp hook: open a named suite when ?suite= is present (copy only). */
(() => {
  try {
    const q = new URLSearchParams(location.search);
    const map = { virginia: 's1', alice: 's2', victor: 's3', henry: 's4', s1: 's1', s2: 's2', s3: 's3', s4: 's4' };
    const id = map[String(q.get('suite') || '').toLowerCase()];
    if (id && typeof goTo === 'function' && typeof ROOMS === 'object' && ROOMS[id]) goTo(id);
  } catch (_) {}
})();
