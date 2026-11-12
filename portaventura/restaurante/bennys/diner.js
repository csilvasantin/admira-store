// Benny's Burgers · NetflixVentura Restaurante — gemelo digital 3D (Three.js r160, el mismo de la Store Matrix).
// API: createDiner(canvas, {menu, onPick, onHover, onPortal}) → {setMode, focus, showDish, crossPortal, spell, orderPlaced, orderReady, setMusic, rotate, zoom, get upside}
import * as THREE from './three.module.min.js';

const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const std = (color, roughness = 0.6, metalness = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
function add(parent, geometry, material, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const box = (p, w, h, d, mat, x, y, z, cast) => add(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z, cast);
const cyl = (p, rt, rb, h, mat, x, y, z, seg = 24, cast) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, cast);

const MODES = {
  8: { w: 256, levels: 5, matrix: 0, scan: 1, samples: 0 },
  16: { w: 480, levels: 14, matrix: 0, scan: 0.55, samples: 0 },
  32: { w: 0, levels: 0, matrix: 1, scan: 0, samples: 4 }
};
const VIEWS = {
  sala: { t: [0, 1.1, -0.2], yaw: 0.42, pitch: 0.42, dist: 11.5 },
  barra: { t: [-2.6, 1.2, -2.3], yaw: 0.12, pitch: 0.24, dist: 5.2 },
  reservados: { t: [5, 1.1, 0.2], yaw: -1.05, pitch: 0.28, dist: 5.8 },
  cocina: { t: [-3.3, 1.75, -3.9], yaw: 0.18, pitch: 0.12, dist: 4.2 },
  jukebox: { t: [5.3, 1.1, -3.2], yaw: -0.55, pitch: 0.16, dist: 3.3 },
  luces: { t: [3, 1.95, -3.9], yaw: -0.05, pitch: 0.08, dist: 4.6 },
  portal: { t: [-5.7, 1.6, 0.6], yaw: 1.18, pitch: 0.1, dist: 5 },
  plato: { t: [-2.2, 1.19, -2.2], yaw: 0.25, pitch: 0.42, dist: 0.95 }
};

const POST_FRAG = /* glsl */`
uniform sampler2D tDiffuse; uniform vec2 uRes, uScreen;
uniform float uLevels, uMatrix, uTime, uFlash, uUpside, uScan;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
void main(){
  vec3 col = texture2D(tDiffuse, vUv).rgb;
  col += uFlash * vec3(1.6, 0.32, 0.28);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  vec3 c = gl_FragColor.rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  vec3 ud = vec3(l) * vec3(0.7, 0.84, 1.1) + vec3(0.5, 0.0, 0.02) * max(0.0, c.r - l);
  c = mix(c, ud, uUpside * 0.6);
  if (uLevels > 0.0) {
    vec2 px = floor(vUv * uRes);
    c += (bayer4(px) - 0.5) * 0.7 / uLevels;
    c = floor(c * uLevels + 0.5) / uLevels;
  }
  if (uMatrix > 0.0) {
    vec2 fc = gl_FragCoord.xy;
    vec2 cs = vec2(9.0, 14.0) * max(1.0, uScreen.y / 700.0);
    vec2 cell = floor(fc / cs);
    float sp = 0.35 + h21(vec2(cell.x, 7.0)) * 0.9;
    float hp = 1.0 - fract(uTime * sp * 0.11 + h21(vec2(cell.x, 3.0)));
    float d = fc.y / uScreen.y - hp;
    float trail = d > 0.0 ? exp(-d * 7.0) : 0.0;
    vec2 f = fract(fc / cs);
    vec2 sub = floor(f * vec2(3.0, 5.0));
    float on = step(0.48, h21(cell * 1.7 + sub * 13.1 + floor(uTime * 5.0 * sp + h21(cell) * 9.0)));
    float inside = step(0.14, f.x) * step(f.x, 0.86) * step(0.1, f.y) * step(f.y, 0.9);
    float rain = on * inside * trail * step(0.62, h21(vec2(cell.x, 11.0)));
    c = mix(c, c * vec3(0.78, 1.06, 0.86), uMatrix * 0.35);
    c += vec3(0.22, 1.0, 0.5) * rain * 0.24 * uMatrix * (1.0 - l * 0.7);
  }
  c *= 1.0 - uScan * 0.17 * step(0.5, fract(gl_FragCoord.y / (3.0 * max(1.0, uScreen.y / 600.0))));
  vec2 q = vUv - 0.5;
  c *= 1.0 - dot(q, q) * 0.6;
  gl_FragColor = vec4(c, 1.0);
}`;

const PORTAL_FRAG = /* glsl */`
uniform float uTime, uPower; varying vec2 vP;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main(){
  float r = length(vP), a = atan(vP.y, vP.x);
  float f = fbm(vec2(a * 1.6 + uTime * 0.15, r * 3.2 - uTime * 0.7));
  vec3 col = mix(vec3(0.3, 0.01, 0.02), vec3(1.0, 0.22, 0.04), f);
  col = mix(col, vec3(1.0, 0.82, 0.55), pow(max(0.0, 1.0 - r), 3.0) * 0.9);
  float alpha = smoothstep(1.0, 0.72, r + (f - 0.5) * 0.3);
  gl_FragColor = vec4(col * (1.4 + uPower * 2.2), alpha);
}`;

export function createDiner(canvas, { menu = [], onPick, onHover, onPortal } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const BG = { normal: new THREE.Color(0x07060a), upside: new THREE.Color(0x0a0f17) };
  const HEMI = { normal: new THREE.Color(0xffe2c4), upside: new THREE.Color(0x6f86a8) };
  const FOG = { normal: new THREE.Color(0x120a10), upside: new THREE.Color(0x1b2635) };
  scene.background = BG.normal.clone();
  scene.fog = new THREE.FogExp2(FOG.normal.clone(), 0.012);
  const camera = new THREE.PerspectiveCamera(42, 16 / 10, 0.05, 60);

  // ---------- entorno para cromados ----------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x1a1012);
  const glowBasic = (r, g, b) => { const m = new THREE.MeshBasicMaterial({ side: THREE.BackSide }); m.color.setRGB(r, g, b); return m; };
  for (const [w, h, d, x, y, z, m] of [
    [8, 0.4, 1, 0, 4, -2, glowBasic(3, 2.4, 1.6)], [1, 3, 1, -5, 1, 0, glowBasic(2.5, 0.2, 0.25)],
    [1, 2, 4, 5, 1.5, 0, glowBasic(0.3, 0.5, 1.4)], [10, 0.1, 10, 0, -2, 0, glowBasic(0.25, 0.2, 0.2)]
  ]) { const e = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); e.position.set(x, y, z); envScene.add(e); }
  envScene.add(new THREE.Mesh(new THREE.BoxGeometry(14, 8, 14), glowBasic(0.08, 0.05, 0.05)));
  const env = pmrem.fromScene(envScene, 0.04).texture;

  const M = {
    chrome: std(0xd8dde3, 0.18, 1, { envMap: env }),
    steel: std(0x9aa2a8, 0.35, 0.9, { envMap: env }),
    vinyl: std(0xa3172b, 0.32, 0, { envMap: env, envMapIntensity: 0.35 }),
    red: std(0xb51f2b, 0.42),
    formica: std(0xe4ddcb, 0.28),
    mint: std(0xa9dcc6, 0.32),
    wood: std(0x5a3322, 0.6),
    dark: std(0x17131a, 0.6),
    white: std(0xf1ece2, 0.5),
    ceramic: std(0xf6f3ea, 0.22, 0, { envMap: env, envMapIntensity: 0.5 }),
    redGloss: std(0xc8102e, 0.25)
  };
  const envMats = [M.chrome, M.steel, M.vinyl, M.ceramic];
  envMats.forEach(m => { m.userData.env = m.envMapIntensity; });

  const glowTex = canvasTexture(64, 64, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, '#ffffff'); r.addColorStop(0.25, '#ffffffaa'); r.addColorStop(1, '#ffffff00');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  function glow(color, scale) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    s.scale.setScalar(scale);
    return s;
  }

  const room = new THREE.Group();
  scene.add(room);

  // ---------- suelo, paredes, techo ----------
  const checker = canvasTexture(128, 128, (g, w) => {
    g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#141216'; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64);
    g.fillStyle = '#0003'; g.fillRect(0, 63, w, 2); g.fillRect(63, 0, 2, w);
  }, [12, 8]);
  add(room, new THREE.PlaneGeometry(12, 8).rotateX(-Math.PI / 2), std(0xffffff, 0.3, 0, { map: checker }), 0, 0, 0, false);

  const paper = canvasTexture(256, 256, (g, w) => {
    g.fillStyle = '#b39a74'; g.fillRect(0, 0, w, w);
    for (let x = 0; x < w; x += 32) { g.fillStyle = '#a58a63'; g.fillRect(x, 0, 9, w); }
    const R = rng(3);
    for (let i = 0; i < 18; i++) {
      const x = R() * w, y = R() * w;
      g.fillStyle = '#7d3a2c'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
      g.fillStyle = '#5d6b3a'; g.beginPath(); g.ellipse(x + 8, y + 4, 6, 2.5, 0.6, 0, TAU); g.fill();
    }
  }, [0.5, 0.6]);
  const wallMat = std(0xffffff, 0.85, 0, { map: paper });
  function wallGeo(u0, u1, h, holes = []) {
    const s = new THREE.Shape();
    s.moveTo(u0, 0); s.lineTo(u1, 0); s.lineTo(u1, h); s.lineTo(u0, h); s.closePath();
    for (const [a, b, c, d] of holes) {
      const p = new THREE.Path(); p.moveTo(a, b); p.lineTo(a, d); p.lineTo(c, d); p.lineTo(c, b); p.closePath(); s.holes.push(p);
    }
    return new THREE.ShapeGeometry(s);
  }
  const BOOTHS = [-1.85, 0.2, 2.25];
  add(room, wallGeo(-6, 6, 3.2, [[-5, 1.2, -1.6, 2.1]]), wallMat, 0, 0, -4, false);
  add(room, wallGeo(-4, 4, 3.2), wallMat, -6, 0, 0, false).rotation.y = Math.PI / 2;
  add(room, wallGeo(-4, 4, 3.2, BOOTHS.map(z => [z - 0.55, 1.3, z + 0.55, 2.4])), wallMat, 6, 0, 0, false).rotation.y = -Math.PI / 2;
  const ceiling = add(room, new THREE.PlaneGeometry(12, 8).rotateX(Math.PI / 2), std(0x1c1416, 0.9), 0, 3.2, 0, false);
  ceiling.receiveShadow = false;

  const planks = canvasTexture(64, 128, (g, w, h) => {
    g.fillStyle = '#4a2a1c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5c3624'; g.fillRect(4, 0, w - 8, h);
    g.fillStyle = '#2a170f'; g.fillRect(0, 0, 3, h);
  });
  const wainscot = (len, rep) => { const t = planks.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); t.needsUpdate = true; return std(0xffffff, 0.55, 0, { map: t }); };
  box(room, 12, 1, 0.04, wainscot(12, 24), 0, 0.5, -3.98, false);
  box(room, 0.04, 1, 8, wainscot(8, 16), -5.98, 0.5, 0, false);
  box(room, 0.04, 1, 8, wainscot(8, 16), 5.98, 0.5, 0, false);
  for (const [w, d, x, z] of [[12, 0.07, 0, -3.96], [0.07, 8, -5.96, 0], [0.07, 8, 5.96, 0]]) {
    box(room, w, 0.05, d, M.red, x, 1.02, z, false);
    box(room, w, 0.1, d, M.dark, x, 3.15, z, false);
  }

  // ---------- cocina y pase ----------
  const tiles = canvasTexture(128, 128, (g, w) => {
    g.fillStyle = '#d9d6cc'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#a9a59a'; for (let i = 0; i <= w; i += 32) { g.fillRect(i, 0, 2, w); g.fillRect(0, i, w, 2); }
  }, [4, 3]);
  const tileMat = std(0xffffff, 0.4, 0, { map: tiles, emissive: 0x3a2410, emissiveIntensity: 0.7 });
  add(room, new THREE.PlaneGeometry(4.2, 3.2), tileMat, -3.3, 1.6, -5.6, false);
  add(room, new THREE.PlaneGeometry(1.8, 3.2), tileMat, -5.3, 1.6, -4.8, false).rotation.y = Math.PI / 2;
  add(room, new THREE.PlaneGeometry(1.8, 3.2), tileMat, -1.3, 1.6, -4.8, false).rotation.y = -Math.PI / 2;
  box(room, 4.2, 0.02, 1.8, M.dark, -3.3, 0.01, -4.8, false);
  box(room, 2.6, 0.9, 0.7, M.steel, -3.3, 0.45, -5.2);
  box(room, 2.8, 0.5, 0.8, M.steel, -3.3, 2.55, -5.15);
  box(room, 3.6, 0.04, 0.5, M.chrome, -3.3, 1.22, -4.02);
  box(room, 3.52, 0.06, 0.14, M.chrome, -3.3, 2.13, -3.98);
  box(room, 0.06, 0.94, 0.14, M.chrome, -5.03, 1.65, -3.98);
  box(room, 0.06, 0.94, 0.14, M.chrome, -1.57, 1.65, -3.98);
  const rail = cyl(room, 0.008, 0.008, 3.2, M.chrome, -3.3, 2.03, -3.9, 8, false);
  rail.rotation.z = Math.PI / 2;
  const heatMat = std(0x2a0a04, 0.5, 0, { emissive: 0xff5a1a, emissiveIntensity: 2.5 });
  for (const x of [-4.4, -3.3, -2.2]) {
    cyl(room, 0.05, 0.08, 0.1, M.steel, x, 2.0, -4.15, 16, false);
    cyl(room, 0.075, 0.075, 0.01, heatMat, x, 1.945, -4.15, 16, false);
  }
  const kitchenLight = new THREE.PointLight(0xff8a3a, 9, 0, 2);
  kitchenLight.position.set(-3.3, 1.8, -4.7);
  scene.add(kitchenLight);
  const chef = new THREE.Group();
  add(chef, new THREE.CapsuleGeometry(0.17, 0.55, 4, 10), M.white, 0, 0.95, 0);
  add(chef, new THREE.SphereGeometry(0.11, 16, 12), std(0xe0b08a, 0.6), 0, 1.47, 0);
  add(chef, new THREE.CylinderGeometry(0.1, 0.09, 0.16, 16), M.white, 0, 1.62, 0);
  chef.position.set(-3.3, 0, -4.75);
  room.add(chef);
  const tickets = [];

  // menú digital (signage Admira) sobre el pase
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1024; boardCanvas.height = 272;
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
  boardMat.color.setRGB(1.25, 1.25, 1.25);
  add(room, new THREE.PlaneGeometry(3.4, 0.9), boardMat, -3.3, 2.62, -3.93, false);
  box(room, 3.5, 1.0, 0.04, M.dark, -3.3, 2.62, -3.96, false);
  const board = { selected: null, notice: 'PIDE DESDE LA MESA · PULSERA O APP' };

  // ---------- barra ----------
  box(room, 6, 1.0, 0.6, M.red, -2.5, 0.5, -2.2);
  box(room, 6.02, 0.06, 0.62, M.chrome, -2.5, 0.9, -2.2);
  box(room, 6.02, 0.12, 0.62, M.chrome, -2.5, 0.06, -2.2);
  box(room, 6.17, 0.03, 0.84, M.chrome, -2.5, 0.995, -2.2);
  box(room, 6.15, 0.05, 0.82, M.formica, -2.5, 1.025, -2.2);
  box(room, 5.9, 0.95, 0.5, M.wood, -2.55, 0.475, -3.72);
  box(room, 0.5, 0.35, 0.3, M.chrome, -0.8, 1.12, -3.72);
  for (const x of [-0.95, -0.8, -0.65]) cyl(room, 0.035, 0.03, 0.16, M.steel, x, 1.0, -3.6, 12, false);
  box(room, 0.45, 0.5, 0.35, M.red, 0.15, 1.2, -3.72);
  cyl(room, 0.1, 0.1, 0.04, M.chrome, 0.15, 1.47, -3.72, 16, false);
  for (const x of [-5.0, -4.2, -3.4, -1.0, -0.2]) {
    cyl(room, 0.2, 0.22, 0.03, M.chrome, x, 0.015, -1.6, 24, false);
    cyl(room, 0.035, 0.035, 0.7, M.chrome, x, 0.37, -1.6, 12);
    cyl(room, 0.2, 0.19, 0.1, M.vinyl, x, 0.76, -1.6, 24);
    const ring = add(room, new THREE.TorusGeometry(0.2, 0.012, 8, 32), M.chrome, x, 0.72, -1.6, false);
    ring.rotation.x = Math.PI / 2;
  }
  const pendantLights = [];
  const bulbMat = std(0xfff2d0, 0.3, 0, { emissive: 0xffc070, emissiveIntensity: 3 });
  for (const x of [-4.6, -3.4, -1.0]) {
    cyl(room, 0.006, 0.006, 0.65, M.dark, x, 2.88, -2.2, 6, false);
    add(room, new THREE.ConeGeometry(0.22, 0.22, 24, 1, true), std(0x1f6b5a, 0.4, 0.3, { side: THREE.DoubleSide }), x, 2.45, -2.2, false);
    add(room, new THREE.SphereGeometry(0.05, 12, 8), bulbMat, x, 2.36, -2.2, false);
    const l = new THREE.PointLight(0xffc68a, 5, 0, 2);
    l.position.set(x, 2.3, -2.2);
    scene.add(l);
    pendantLights.push(l);
  }

  // neón Benny's
  const neonTex = canvasTexture(1024, 400, (g, w, h) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const line = (text, y, font, color) => {
      g.font = font;
      for (const [blur, alpha] of [[40, 0.6], [18, 0.9], [0, 1]]) {
        g.shadowColor = color; g.shadowBlur = blur; g.globalAlpha = alpha;
        g.lineWidth = 9; g.strokeStyle = color; g.strokeText(text, w / 2, y);
      }
      g.shadowBlur = 0; g.globalAlpha = 1; g.lineWidth = 3; g.strokeStyle = '#fff3f0'; g.strokeText(text, w / 2, y);
    };
    line("Benny's", 150, 'italic 700 190px Georgia, serif', '#ff2340');
    line('BURGERS', 310, '800 110px "Arial Black", Impact, sans-serif', '#3aa8ff');
  });
  const neonMat = new THREE.MeshBasicMaterial({ map: neonTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  add(room, new THREE.PlaneGeometry(2.3, 0.9), neonMat, -0.3, 2.45, -3.93, false);
  const neonLight = new THREE.PointLight(0xff2a3a, 4, 0, 2);
  neonLight.position.set(-0.3, 2.4, -3.4);
  scene.add(neonLight);

  // ---------- plato protagonista sobre la barra ----------
  cyl(room, 0.21, 0.23, 0.025, M.chrome, -2.2, 1.062, -2.2, 40);
  const dishHolder = new THREE.Group();
  dishHolder.position.set(-2.2, 1.075, -2.2);
  room.add(dishHolder);
  const spot = new THREE.SpotLight(0xfff0d8, 22, 0, 0.42, 0.7, 2);
  spot.position.set(-2.2, 2.7, -1.5);
  spot.target = dishHolder;
  scene.add(spot);

  // ---------- reservados y ventanas ----------
  const night = canvasTexture(1024, 410, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#04060f'); sky.addColorStop(0.7, '#1a1838'); sky.addColorStop(1, '#2a1630');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const R = rng(11);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.7})`; g.fillRect(R() * w, R() * h * 0.6, 1.5, 1.5); }
    g.fillStyle = '#05040a';
    for (let x = -20; x < w + 40; x += 26 + R() * 30) {
      const th = 120 + R() * 140;
      g.beginPath(); g.moveTo(x - 28, h); g.lineTo(x, h - th); g.lineTo(x + 28, h); g.fill();
    }
    for (const x of [180, 520, 860]) {
      const r = g.createRadialGradient(x, h - 150, 0, x, h - 150, 90);
      r.addColorStop(0, '#ffd890'); r.addColorStop(1, '#ffd89000');
      g.fillStyle = r; g.fillRect(x - 90, h - 240, 180, 180);
    }
  });
  const outside = new THREE.MeshBasicMaterial({ map: night });
  outside.color.setRGB(1.1, 1.1, 1.1);
  add(room, new THREE.PlaneGeometry(8, 3.2), outside, 6.3, 1.6, 0, false).rotation.y = -Math.PI / 2;
  for (const zc of BOOTHS) {
    box(room, 1.25, 0.05, 0.78, M.mint, 5.35, 0.76, zc);
    box(room, 1.27, 0.025, 0.8, M.chrome, 5.35, 0.735, zc, false);
    cyl(room, 0.05, 0.05, 0.72, M.chrome, 5.15, 0.37, zc, 12);
    cyl(room, 0.22, 0.24, 0.03, M.chrome, 5.15, 0.015, zc, 20, false);
    for (const side of [-1, 1]) {
      box(room, 1.3, 0.38, 0.46, M.dark, 5.3, 0.19, zc + side * 0.68);
      box(room, 1.3, 0.14, 0.5, M.vinyl, 5.3, 0.45, zc + side * 0.68);
      box(room, 1.3, 0.8, 0.14, M.vinyl, 5.3, 0.9, zc + side * 0.98);
      const top = cyl(room, 0.02, 0.02, 1.3, M.chrome, 5.3, 1.31, zc + side * 0.98, 8, false);
      top.rotation.z = Math.PI / 2;
    }
    box(room, 0.1, 0.12, 0.07, M.chrome, 5.75, 0.84, zc - 0.15, false);
    cyl(room, 0.022, 0.022, 0.16, M.redGloss, 5.75, 0.86, zc + 0.1, 10, false);
    box(room, 0.14, 0.06, 1.22, M.white, 5.94, 1.27, zc, false);
    box(room, 0.14, 0.06, 1.22, M.white, 5.94, 2.43, zc, false);
    box(room, 0.14, 1.16, 0.06, M.white, 5.94, 1.85, zc - 0.58, false);
    box(room, 0.14, 1.16, 0.06, M.white, 5.94, 1.85, zc + 0.58, false);
    for (let i = 0; i < 5; i++) {
      const slat = box(room, 0.02, 0.035, 1.1, M.white, 5.92, 2.34 - i * 0.075, zc, false);
      slat.rotation.z = 0.5;
    }
  }

  // ---------- mesas centrales ----------
  const TABLES = [[-3.3, 1.5], [1.2, 1.3]];
  for (const [x, z] of TABLES) {
    cyl(room, 0.45, 0.45, 0.04, M.formica, x, 0.76, z, 40);
    add(room, new THREE.TorusGeometry(0.45, 0.015, 8, 48), M.chrome, x, 0.76, z, false).rotation.x = Math.PI / 2;
    cyl(room, 0.05, 0.05, 0.74, M.chrome, x, 0.37, z, 12);
    cyl(room, 0.25, 0.27, 0.03, M.chrome, x, 0.015, z, 24, false);
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * TAU + 0.4, cx = x + Math.cos(a) * 0.72, cz = z + Math.sin(a) * 0.72;
      const chair = new THREE.Group();
      chair.position.set(cx, 0, cz);
      chair.rotation.y = -a - Math.PI / 2;
      cyl(chair, 0.2, 0.2, 0.06, M.vinyl, 0, 0.46, 0, 20);
      cyl(chair, 0.02, 0.02, 0.44, M.chrome, 0, 0.22, 0, 8);
      cyl(chair, 0.18, 0.2, 0.02, M.chrome, 0, 0.01, 0, 16, false);
      box(chair, 0.36, 0.34, 0.05, M.vinyl, 0, 0.72, -0.18);
      room.add(chair);
    }
  }

  // ---------- jukebox ----------
  const juke = new THREE.Group();
  juke.position.set(5.55, 0, -3.4);
  juke.rotation.y = -Math.PI / 2;
  room.add(juke);
  const jukeWood = std(0x5b2a1c, 0.38, 0, { envMap: env, envMapIntensity: 0.4 });
  box(juke, 0.9, 1.25, 0.55, jukeWood, 0, 0.625, 0);
  add(juke, new THREE.CylinderGeometry(0.45, 0.45, 0.55, 32, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), jukeWood, 0, 1.25, 0);
  const jukeGlow = std(0x000000, 0.3, 0, { emissive: 0xff3080, emissiveIntensity: 2.4 });
  const jukeTube = std(0x000000, 0.3, 0, { emissive: 0x30c0ff, emissiveIntensity: 3 });
  add(juke, new THREE.CircleGeometry(0.37, 32, 0, Math.PI), jukeGlow, 0, 1.25, 0.281, false);
  for (const x of [-0.42, 0.42]) box(juke, 0.06, 1.15, 0.06, jukeTube, x, 0.68, 0.27, false);
  const records = canvasTexture(256, 140, (g, w, h) => {
    g.fillStyle = '#1b0f22'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(30 + i * 40, 75, 34, 0, TAU); g.fill();
      g.fillStyle = ['#ff3b30', '#ffcc00', '#34c759', '#0a84ff', '#ff2d92', '#ff9f0a'][i];
      g.beginPath(); g.arc(30 + i * 40, 75, 10, 0, TAU); g.fill();
    }
  });
  add(juke, new THREE.PlaneGeometry(0.62, 0.32), new THREE.MeshBasicMaterial({ map: records }), 0, 0.98, 0.281, false);
  const grill = canvasTexture(64, 64, (g, w) => {
    g.fillStyle = '#120c10'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#c9a86a'; for (let x = 4; x < w; x += 8) g.fillRect(x, 0, 3, w);
  });
  add(juke, new THREE.PlaneGeometry(0.62, 0.5), std(0xffffff, 0.4, 0.5, { map: grill }), 0, 0.45, 0.281, false);
  const jukeLight = new THREE.PointLight(0xff3080, 3, 0, 2);
  jukeLight.position.set(4.9, 1.2, -3.4);
  scene.add(jukeLight);

  // ---------- pared de luces (alfabeto) ----------
  const ROWS = ['ABCDEFGH', 'IJKLMNOPQ', 'RSTUVWXYZ'];
  const ROW_Y = [0.3, 0.6, 0.88];
  const AW = { x0: 1.0, x1: 5.0, y0: 1.15, y1: 2.75, z: -3.935 };
  const letterAt = [];
  ROWS.forEach((row, r) => [...row].forEach((ch, k) => letterAt.push({ ch, fx: 0.06 + (k + 0.5) / row.length * 0.88, fy: ROW_Y[r], r })));
  const alphaTex = canvasTexture(1024, 410, (g, w, h) => {
    g.fillStyle = '#c2b48c'; g.fillRect(0, 0, w, h);
    const R = rng(23);
    for (let i = 0; i < 90; i++) {
      const x = R() * w, y = R() * h, s = 8 + R() * 10;
      g.fillStyle = '#6f7d45aa'; g.beginPath(); g.ellipse(x, y, s, s * 0.45, R() * 3, 0, TAU); g.fill();
      g.fillStyle = '#a3463caa'; g.beginPath(); g.arc(x + s * 0.7, y - s * 0.4, s * 0.42, 0, TAU); g.fill();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const { ch, fx, fy } of letterAt) {
      g.save(); g.translate(fx * w, fy * h); g.rotate((R() - 0.5) * 0.25);
      g.font = '900 72px "Arial Black", Impact, sans-serif';
      g.fillStyle = '#121010'; g.fillText(ch, 0, 0);
      g.globalAlpha = 0.5; g.fillText(ch, 2, 1.5); g.restore();
    }
  });
  add(room, new THREE.PlaneGeometry(AW.x1 - AW.x0, AW.y1 - AW.y0), std(0xffffff, 0.9, 0, { map: alphaTex }), (AW.x0 + AW.x1) / 2, (AW.y0 + AW.y1) / 2, AW.z, false);
  const BULB_COLORS = [0xff3b30, 0xffcc00, 0x34c759, 0x0a84ff, 0xff9f0a, 0xff2d92];
  const bulbGeo = new THREE.SphereGeometry(0.03, 12, 10);
  const socketMat = std(0x1d3020, 0.6);
  const wireMat = std(0x141c14, 0.7);
  const bulbs = [];
  const rowPts = [[], [], []];
  const bR = rng(5);
  letterAt.forEach(({ fx, fy, r }, i) => {
    const x = AW.x0 + fx * (AW.x1 - AW.x0);
    const y = AW.y1 - fy * (AW.y1 - AW.y0) + 0.2;
    const color = new THREE.Color(BULB_COLORS[(i * 7 + r) % BULB_COLORS.length]);
    const mat = std(color.clone().multiplyScalar(0.4), 0.3, 0, { emissive: color, emissiveIntensity: 0.4 });
    const b = add(room, bulbGeo, mat, x, y, AW.z + 0.035, false);
    b.scale.set(1, 1.4, 1);
    cyl(room, 0.014, 0.014, 0.03, socketMat, x, y + 0.05, AW.z + 0.035, 8, false);
    const s = glow(color, 0.2);
    s.position.set(x, y, AW.z + 0.06);
    room.add(s);
    bulbs.push({ mat, s, phase: bR() * TAU });
    rowPts[r].push([x, y + 0.065]);
  });
  for (const pts of rowPts) {
    const v = [new THREE.Vector3(AW.x0 + 0.02, pts[0][1] + 0.04, AW.z + 0.03)];
    pts.forEach(([x, y], i) => {
      v.push(new THREE.Vector3(x, y, AW.z + 0.035));
      const next = pts[i + 1];
      if (next) v.push(new THREE.Vector3((x + next[0]) / 2, y - 0.035, AW.z + 0.035));
    });
    v.push(new THREE.Vector3(AW.x1 - 0.02, pts[pts.length - 1][1] + 0.04, AW.z + 0.03));
    add(room, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v), 120, 0.005, 5, false), wireMat, 0, 0, 0, false);
  }
  let spellQ = [];

  // ---------- portal ----------
  const portal = new THREE.Group();
  portal.position.set(-5.93, 1.55, 0.6);
  portal.rotation.y = Math.PI / 2;
  room.add(portal);
  const portalMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: PORTAL_FRAG,
    transparent: true, depthWrite: false
  });
  const core = add(portal, new THREE.CircleGeometry(1, 64), portalMat, 0, 0, 0.02, false);
  core.scale.set(0.7, 1.08, 1);
  const pR = rng(9);
  const rimShape = new THREE.Shape();
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = i / N * TAU, k = 1.1 + 0.12 * Math.sin(a * 5 + 1) + pR() * 0.06;
    const x = Math.cos(a) * 0.7 * k, y = Math.sin(a) * 1.08 * k;
    i ? rimShape.lineTo(x, y) : rimShape.moveTo(x, y);
  }
  const hole = new THREE.Path();
  for (let i = N; i >= 0; i--) {
    const a = i / N * TAU, k = 0.94 + 0.04 * Math.sin(a * 7);
    const x = Math.cos(a) * 0.7 * k, y = Math.sin(a) * 1.08 * k;
    i === N ? hole.moveTo(x, y) : hole.lineTo(x, y);
  }
  rimShape.holes.push(hole);
  const fleshMat = std(0x5a1416, 0.5, 0, { emissive: 0x420405, emissiveIntensity: 1 });
  add(portal, new THREE.ExtrudeGeometry(rimShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.04, bevelSegments: 3, curveSegments: 4 }), fleshMat, 0, 0, -0.02, false);
  const vineMat = std(0x3a1418, 0.8, 0, { emissive: 0x200306, emissiveIntensity: 1 });
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU + pR() * 0.3;
    const pts = [];
    for (let k = 0; k < 4; k++) {
      const rr = 1.05 + k * 0.22;
      pts.push(new THREE.Vector3(Math.cos(a + (pR() - 0.5) * 0.2 * k) * 0.7 * rr, Math.sin(a) * 1.08 * rr, 0.02));
    }
    add(portal, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.018 - i * 0.0006, 5, false), vineMat, 0, 0, 0, false);
  }
  const portalLight = new THREE.PointLight(0xff3010, 3, 0, 2);
  portalLight.position.set(-5.2, 1.6, 0.6);
  scene.add(portalLight);
  const portalGlow = glow(0xff4020, 2.6);
  portalGlow.position.set(-5.85, 1.55, 0.6);
  room.add(portalGlow);

  // ---------- Upside Down: enredaderas y esporas ----------
  const vines = [];
  const vR = rng(31);
  function vine(points, radius) {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, radius, 5, false);
    add(room, geo, vineMat, 0, 0, 0, false);
    geo.setDrawRange(0, 0);
    vines.push({ geo, count: geo.index.count, delay: vR() * 0.35 });
  }
  for (let i = 0; i < 9; i++) {
    let y = 1.55 + (vR() - 0.5) * 2, z = 0.6 + (vR() - 0.5) * 1.4;
    const pts = [];
    for (let k = 0; k < 7; k++) {
      pts.push(new THREE.Vector3(-5.95, clamp(y, 0.05, 3.15), clamp(z, -3.9, 3.9)));
      y += (vR() - 0.5) * 1.1; z += (vR() - 0.5) * 1.6;
    }
    vine(pts, 0.025 + vR() * 0.025);
  }
  for (let i = 0; i < 7; i++) {
    let x = -5.9, z = 0.6 + (vR() - 0.5) * 2.2;
    const pts = [new THREE.Vector3(-5.95, 0.6, z)];
    for (let k = 0; k < 7; k++) { pts.push(new THREE.Vector3(x, 0.025, clamp(z, -3.8, 3.8))); x += 0.6 + vR() * 0.5; z += (vR() - 0.5) * 1.3; }
    vine(pts, 0.03 + vR() * 0.02);
  }
  for (let i = 0; i < 5; i++) {
    let x = -5.95, y = 0.5 + vR() * 2.5;
    const pts = [];
    for (let k = 0; k < 8; k++) { pts.push(new THREE.Vector3(x, clamp(y, 0.05, 3.15), -3.94)); x += 0.7 + vR() * 0.6; y += (vR() - 0.5) * 0.9; }
    vine(pts, 0.02 + vR() * 0.02);
  }
  const SPORES = 900;
  const sporeGeo = new THREE.BufferGeometry();
  const sporePos = new Float32Array(SPORES * 3);
  const sporeSeed = new Float32Array(SPORES);
  const sR = rng(41);
  for (let i = 0; i < SPORES; i++) {
    sporePos.set([(sR() - 0.5) * 11.6, sR() * 3.1, (sR() - 0.5) * 7.8 + 0.2], i * 3);
    sporeSeed[i] = sR() * TAU;
  }
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
  const sporeMat = new THREE.PointsMaterial({ map: glowTex, color: 0xc9d4e6, size: 0.05, transparent: true, opacity: 0, depthWrite: false });
  const spores = new THREE.Points(sporeGeo, sporeMat);
  spores.frustumCulled = false;
  scene.add(spores);

  // ---------- clientes y camarera ----------
  const guests = new THREE.Group();
  room.add(guests);
  const gR = rng(17);
  const OUTFITS = [0x2ec4b6, 0xffbf00, 0x8e44ad, 0xff6b35, 0x3a86ff, 0xe63946, 0x6a994e];
  const SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
  function person(x, seatY, z, face, standing = false) {
    const p = new THREE.Group();
    p.position.set(x, standing ? 0 : seatY - 0.45, z);
    p.rotation.y = face;
    const shirt = std(OUTFITS[Math.floor(gR() * OUTFITS.length)], 0.7);
    const skin = std(SKIN[Math.floor(gR() * SKIN.length)], 0.6);
    add(p, new THREE.CapsuleGeometry(0.15, 0.3, 4, 10), shirt, 0, 0.78, 0);
    add(p, new THREE.SphereGeometry(0.1, 16, 12), skin, 0, 1.13, 0);
    const hair = add(p, new THREE.SphereGeometry(0.106, 16, 8, 0, TAU, 0, Math.PI / 2), std([0x2b1b10, 0x6b3e1d, 0xd8b26e, 0x111111][Math.floor(gR() * 4)], 0.8), 0, 1.15, -0.012);
    hair.rotation.x = -0.25;
    if (standing) {
      for (const s of [-1, 1]) add(p, new THREE.CapsuleGeometry(0.055, 0.42, 3, 8), std(0x1d2238, 0.7), s * 0.07, 0.3, 0);
    } else {
      for (const s of [-1, 1]) add(p, new THREE.CapsuleGeometry(0.055, 0.3, 3, 8), std(0x1d2238, 0.7), s * 0.07, 0.5, 0.17).rotation.x = Math.PI / 2;
    }
    guests.add(p);
    return p;
  }
  person(5.3, 0.52, BOOTHS[0] - 0.66, 0); person(5.3, 0.52, BOOTHS[0] + 0.66, Math.PI);
  person(5.4, 0.52, BOOTHS[1] + 0.66, Math.PI);
  person(5.25, 0.52, BOOTHS[2] - 0.66, 0); person(5.35, 0.52, BOOTHS[2] + 0.66, Math.PI);
  person(-5.0, 0.81, -1.6, Math.PI); person(-3.4, 0.81, -1.6, Math.PI);
  for (const [[x, z], seats] of [[TABLES[0], [0, 1]], [TABLES[1], [2]]]) {
    for (const k of seats) {
      const a = k / 3 * TAU + 0.4;
      person(x + Math.cos(a) * 0.72, 0.52, z + Math.sin(a) * 0.72, -a - Math.PI / 2);
    }
  }
  const waitress = person(0, 0, 0, 0, true);
  const tray = cyl(waitress, 0.17, 0.17, 0.015, M.chrome, 0.2, 0.98, 0.22, 20, false);
  cyl(waitress, 0.03, 0.025, 0.12, std(0xf4a3b8, 0.5), 0.22, 1.05, 0.22, 10, false);
  const walkPath = new THREE.CatmullRomCurve3([
    [0.9, -1.25], [3.5, -1.0], [3.8, 1.1], [3.6, 3.0], [1.4, 2.6], [-0.6, 0.6], [-1.8, -0.9]
  ].map(([x, z]) => new THREE.Vector3(x, 0, z)), true);

  // ---------- luces ----------
  const hemi = new THREE.HemisphereLight(0xffe2c4, 0x2a1a22, 0.6);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe9d0, 1.5);
  key.position.set(4, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.camera.updateProjectionMatrix();
  scene.add(key);
  const moon = new THREE.DirectionalLight(0x5a7cff, 0.25);
  moon.position.set(10, 3, 0);
  scene.add(moon);
  const storm = new THREE.DirectionalLight(0xff2020, 0);
  storm.position.set(-8, 4, 2);
  scene.add(storm);
  const matrixRim = new THREE.DirectionalLight(0x4dff9d, 0);
  matrixRim.position.set(-4, 3, -6);
  scene.add(matrixRim);

  // ---------- dianas para clic ----------
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hits = [];
  for (const [zone, [x, y, z], [w, h, d]] of [
    ['barra', [-2.5, 0.65, -2.1], [6.3, 1.3, 1.6]],
    ['cocina', [-3.3, 2.12, -3.95], [3.6, 1.95, 0.4]],
    ['reservados', [5.3, 1.2, 0.2], [1.4, 2.4, 5.4]],
    ['jukebox', [5.5, 0.9, -3.4], [0.7, 1.8, 1.0]],
    ['luces', [3, 1.95, -3.85], [4.1, 1.7, 0.25]],
    ['portal', [-5.85, 1.55, 0.6], [0.4, 2.6, 1.8]]
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
    m.position.set(x, y, z);
    m.userData.zone = zone;
    scene.add(m);
    hits.push(m);
  }
  const badgeAnchors = { barra: [-4.0, 1.55, -1.7], reservados: [4.75, 1.85, 0.2], cocina: [-1.85, 1.75, -3.8], jukebox: [5.3, 2.05, -3.4], luces: [1.0, 2.95, -3.8], portal: [-5.55, 2.95, 0.6] };
  const badges = [];
  Object.entries(badgeAnchors).forEach(([zone, pos], i) => {
    const t = canvasTexture(128, 128, (g, w) => {
      g.fillStyle = '#0e0c10dd'; g.beginPath(); g.arc(64, 64, 56, 0, TAU); g.fill();
      g.lineWidth = 6; g.strokeStyle = '#ff624f'; g.stroke();
      g.fillStyle = '#ffe3d6'; g.font = 'bold 50px ui-monospace, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(i + 1).padStart(2, '0'), 64, 68);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    s.scale.setScalar(0.34);
    s.position.set(...pos);
    s.renderOrder = 10;
    s.userData.zone = zone;
    scene.add(s);
    badges.push(s);
  });

  // ---------- platos 3D ----------
  const dishCache = {};
  function plate(g, r = 0.16) {
    add(g, new THREE.CylinderGeometry(r, r * 0.8, 0.018, 48), M.ceramic, 0, 0.009, 0);
    add(g, new THREE.TorusGeometry(r * 0.97, 0.005, 8, 64), M.redGloss, 0, 0.018, 0, false).rotation.x = Math.PI / 2;
  }
  const lathe = (g, pts, mat, y = 0, seg = 40) => add(g, new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), mat, 0, y, 0);
  function stripes(colors, n = 8) {
    return canvasTexture(64, 64, (g, w) => { const s = w / n; for (let i = 0; i < n; i++) { g.fillStyle = colors[i % colors.length]; g.fillRect(i * s, 0, s, w); } });
  }
  const BUILD = {
    burger(g) {
      plate(g);
      const bun = std(0xc7782f, 0.55);
      lathe(g, [[0, 0], [0.07, 0], [0.082, 0.008], [0.086, 0.022], [0.08, 0.03], [0, 0.03]], bun, 0.018);
      add(g, new THREE.CylinderGeometry(0.088, 0.09, 0.026, 40), std(0x4a2a1a, 0.85), 0, 0.062, 0);
      const cg = new THREE.PlaneGeometry(0.19, 0.19, 16, 16).rotateX(-Math.PI / 2);
      const cp = cg.attributes.position;
      for (let i = 0; i < cp.count; i++) { const r = Math.hypot(cp.getX(i), cp.getZ(i)); cp.setY(i, -Math.pow(Math.max(0, r - 0.07), 1.5) * 2.4); }
      cg.computeVertexNormals();
      add(g, cg, std(0xf2a51a, 0.4, 0, { side: THREE.DoubleSide }), 0, 0.077, 0).rotation.y = 0.6;
      for (const [x, z] of [[-0.03, 0.02], [0.035, -0.01]]) add(g, new THREE.CylinderGeometry(0.042, 0.042, 0.009, 24), std(0xc8231e, 0.35), x, 0.085, z);
      const lg = new THREE.CylinderGeometry(0.1, 0.096, 0.012, 48, 1);
      const lp = lg.attributes.position;
      for (let i = 0; i < lp.count; i++) {
        const x = lp.getX(i), z = lp.getZ(i), a = Math.atan2(z, x);
        if (Math.hypot(x, z) > 0.05) { const k = 1 + 0.09 * Math.sin(a * 9); lp.setX(i, x * k); lp.setZ(i, z * k); lp.setY(i, lp.getY(i) + 0.006 * Math.sin(a * 13)); }
      }
      lg.computeVertexNormals();
      add(g, lg, std(0x5dbb3a, 0.5), 0, 0.095, 0);
      add(g, new THREE.SphereGeometry(0.092, 40, 20, 0, TAU, 0, Math.PI / 2), bun, 0, 0.1, 0).scale.y = 0.62;
      const seed = std(0xf3e2b3, 0.6), sg = new THREE.SphereGeometry(0.0045, 6, 4), R = rng(7);
      for (let i = 0; i < 28; i++) {
        const th = R() * TAU, ph = R() * 1.15;
        const s = add(g, sg, seed, Math.sin(ph) * Math.cos(th) * 0.092, 0.1 + Math.cos(ph) * 0.057, Math.sin(ph) * Math.sin(th) * 0.092, false);
        s.scale.set(1, 0.5, 1.8); s.rotation.y = R() * TAU;
      }
      cyl(g, 0.0018, 0.0018, 0.16, std(0xd9b77e, 0.7), 0, 0.17, 0, 6, false);
      const flag = canvasTexture(128, 80, (c, w, h) => { c.fillStyle = '#c8102e'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'italic bold 40px Georgia'; c.textAlign = 'center'; c.fillText("Benny's", w / 2, 54); });
      add(g, new THREE.PlaneGeometry(0.06, 0.036), new THREE.MeshStandardMaterial({ map: flag, side: THREE.DoubleSide, roughness: 0.8 }), 0.031, 0.23, 0, false);
    },
    gofres(g) {
      plate(g);
      const top = canvasTexture(128, 128, (c, w) => { c.fillStyle = '#d89a4a'; c.fillRect(0, 0, w, w); c.fillStyle = '#9c5a22'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) c.fillRect(i * 16 + 3, j * 16 + 3, 10, 10); });
      const side = std(0xc98a3e, 0.7), face = std(0xffffff, 0.7, 0, { map: top });
      for (let i = 0; i < 3; i++) {
        const w = add(g, new THREE.CylinderGeometry(0.075, 0.075, 0.018, 40), [side, face, face], (i - 1) * 0.006, 0.028 + i * 0.02, (1 - i) * 0.005);
        w.rotation.y = i * 0.7;
      }
      add(g, new THREE.CylinderGeometry(0.06, 0.062, 0.003, 32), std(0x8a3c08, 0.08, 0, { transparent: true, opacity: 0.85 }), 0, 0.08, 0, false);
      const syrup = std(0x8a3c08, 0.08);
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3; add(g, new THREE.CapsuleGeometry(0.006, 0.02 + k * 0.004, 3, 6), syrup, Math.cos(a) * 0.074, 0.066 - k * 0.003, Math.sin(a) * 0.074, false); }
      const cream = std(0xfffaf0, 0.75);
      for (let k = 0; k < 4; k++) add(g, new THREE.TorusGeometry(0.03 * (1 - k * 0.2), 0.013, 10, 24), cream, 0, 0.095 + k * 0.013, 0).rotation.x = Math.PI / 2;
      add(g, new THREE.SphereGeometry(0.012, 12, 8), cream, 0, 0.15, 0);
      const R = rng(13), jg = new THREE.SphereGeometry(0.007, 10, 6);
      for (let i = 0; i < 10; i++) {
        const a = R() * TAU, r = 0.04 + R() * 0.02;
        const j = add(g, jg, std(BULB_COLORS[i % 6], 0.25), Math.cos(a) * r, 0.084, Math.sin(a) * r, false);
        j.scale.set(1.5, 0.9, 0.9); j.rotation.y = R() * TAU;
      }
      const choco = std(0x3b1d0e, 0.4, 0.3);
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.8; add(g, new THREE.ConeGeometry(0.01, 0.014, 12), choco, Math.cos(a) * 0.055, 0.09, Math.sin(a) * 0.055, false); }
    },
    batido(g) {
      cyl(g, 0.075, 0.075, 0.008, std(0x1f3a7a, 0.5), 0, 0.004, 0, 32);
      const glass = std(0xdfefff, 0.05, 0.1, { transparent: true, opacity: 0.28, side: THREE.DoubleSide, envMap: env, depthWrite: false });
      lathe(g, [[0, 0.008], [0.045, 0.008], [0.047, 0.014], [0.012, 0.024], [0.009, 0.06], [0.02, 0.07], [0.043, 0.15], [0.053, 0.21], [0.055, 0.215]], glass, 0, 48);
      lathe(g, [[0, 0.072], [0.019, 0.072], [0.04, 0.145], [0.049, 0.2], [0, 0.2]], std(0xf4a3b8, 0.6));
      const cream = std(0xfffaf0, 0.75);
      [0.038, 0.03, 0.021, 0.012].forEach((r, k) => add(g, new THREE.TorusGeometry(r, 0.014, 10, 28), cream, 0, 0.208 + k * 0.014, 0).rotation.x = Math.PI / 2);
      add(g, new THREE.SphereGeometry(0.012, 12, 8), cream, 0, 0.262, 0);
      add(g, new THREE.SphereGeometry(0.013, 16, 12), std(0xc0001a, 0.15), 0.004, 0.282, 0);
      add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0.004, 0.29, 0], [0.008, 0.31, 0.004], [0.02, 0.325, 0.006]].map(p => new THREE.Vector3(...p))), 8, 0.0015, 4), std(0x3d5a1e, 0.7), 0, 0, 0, false);
      const straw = add(g, new THREE.CylinderGeometry(0.0055, 0.0055, 0.25, 12), std(0xffffff, 0.4, 0, { map: stripes(['#c8102e', '#ffffff', '#1f3a7a', '#ffffff']) }), 0.025, 0.25, -0.01);
      straw.rotation.z = -0.28;
    },
    pizza(g) {
      cyl(g, 0.19, 0.19, 0.02, std(0x8b5a2b, 0.65), 0, 0.01, 0, 48);
      box(g, 0.12, 0.02, 0.05, std(0x8b5a2b, 0.65), 0.24, 0.01, 0);
      const sector = (r, a0, a1, depth, mat, y) => {
        const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, r, a0, a1, false); s.lineTo(0, 0);
        return add(g, new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 40 }).rotateX(-Math.PI / 2), mat, 0, y, 0);
      };
      const dough = std(0xe0b070, 0.7), sauce = std(0xb3261e, 0.5), cheese = std(0xf6c453, 0.42), crustMat = std(0xc98a3e, 0.65);
      const WEDGE = 0.9;
      const layers = (a0, a1, parent) => {
        const prev = g; g = parent;
        sector(0.15, a0, a1, 0.01, dough, 0.02);
        sector(0.142, a0, a1, 0.003, sauce, 0.03);
        sector(0.134, a0, a1, 0.004, cheese, 0.031);
        const crust = add(g, new THREE.TorusGeometry(0.146, 0.012, 10, 64, a1 - a0).rotateZ(a0).rotateX(-Math.PI / 2), crustMat, 0, 0.03, 0);
        crust.castShadow = true;
        g = prev;
      };
      layers(WEDGE, TAU, g);
      const slice = new THREE.Group();
      slice.position.set(Math.cos(WEDGE / 2) * 0.05, 0.001, -Math.sin(WEDGE / 2) * 0.05);
      g.add(slice);
      layers(0, WEDGE, slice);
      const R = rng(19), pep = std(0x9c1f16, 0.5);
      for (let i = 0; i < 11; i++) {
        const a = WEDGE + 0.25 + R() * (TAU - WEDGE - 0.5), r = 0.03 + R() * 0.085;
        cyl(g, 0.018, 0.018, 0.004, pep, Math.cos(a) * r, 0.036, -Math.sin(a) * r, 20, false);
      }
      for (const [a, r] of [[0.3, 0.08], [0.6, 0.05]]) cyl(slice, 0.018, 0.018, 0.004, pep, Math.cos(a) * r, 0.036, -Math.sin(a) * r, 20, false);
      const basil = std(0x2f7a2a, 0.5);
      for (let i = 0; i < 5; i++) {
        const a = WEDGE + 0.5 + i * 1.0, r = 0.06 + R() * 0.05;
        const b = add(g, new THREE.SphereGeometry(0.012, 10, 6), basil, Math.cos(a) * r, 0.037, -Math.sin(a) * r, false);
        b.scale.set(1.6, 0.25, 0.8); b.rotation.y = R() * TAU;
      }
    },
    patatas(g) {
      plate(g, 0.15);
      const carton = canvasTexture(128, 64, (c, w, h) => { c.fillStyle = '#c8102e'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; for (let x = 0; x < w; x += 16) c.fillRect(x, 0, 6, h); });
      add(g, new THREE.CylinderGeometry(0.068, 0.05, 0.1, 4, 1, true).rotateY(Math.PI / 4), std(0xffffff, 0.6, 0, { map: carton, side: THREE.DoubleSide }), -0.02, 0.07, 0);
      const fry = std(0xf2c14e, 0.6), fg = new THREE.BoxGeometry(0.011, 0.12, 0.011), R = rng(29);
      for (let i = 0; i < 32; i++) {
        const f = add(g, fg, fry, -0.02 + (R() - 0.5) * 0.07, 0.09 + R() * 0.035, (R() - 0.5) * 0.07, false);
        f.rotation.set((R() - 0.5) * 0.5, R() * 3, (R() - 0.5) * 0.5);
      }
      cyl(g, 0.03, 0.026, 0.025, M.white, 0.085, 0.031, 0.05, 20);
      cyl(g, 0.027, 0.027, 0.004, std(0xa0000f, 0.15), 0.085, 0.043, 0.05, 20, false);
    },
    copa(g) {
      cyl(g, 0.075, 0.075, 0.008, std(0x18141f, 0.5), 0, 0.004, 0, 32);
      const glass = std(0x9fb3c8, 0.06, 0.1, { transparent: true, opacity: 0.32, side: THREE.DoubleSide, envMap: env, depthWrite: false });
      lathe(g, [[0, 0.008], [0.05, 0.008], [0.05, 0.014], [0.008, 0.022], [0.007, 0.075], [0.03, 0.085], [0.075, 0.125], [0.082, 0.13]], glass, 0, 48);
      const scoops = [[0.022, 0.135, 0.005, 0x3b1f4f], [-0.026, 0.13, 0.016, 0x8c1c2a], [0.0, 0.17, -0.008, 0x5b6f86]];
      for (const [x, y, z, c] of scoops) {
        const s = add(g, new THREE.SphereGeometry(0.038, 24, 16), std(c, 0.55), x, y, z);
        s.scale.y = 0.85;
        add(g, new THREE.CapsuleGeometry(0.006, 0.02, 3, 6), std(c, 0.35), x + 0.025, y - 0.03, z + 0.01, false);
      }
      const wafer = box(g, 0.05, 0.085, 0.006, std(0x1a1010, 0.5), -0.01, 0.2, 0.02);
      wafer.rotation.set(0.2, 0.4, 0.35);
      const lic = [];
      for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU * 1.5; lic.push(new THREE.Vector3(Math.cos(a) * 0.065, 0.12 + i * 0.004, Math.sin(a) * 0.065)); }
      add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lic), 60, 0.004, 6), std(0x9a0010, 0.3), 0, 0, 0, false);
      const n = 60, pos = new Float32Array(n * 3), R = rng(37);
      for (let i = 0; i < n; i++) pos.set([(R() - 0.5) * 0.3, 0.05 + R() * 0.3, (R() - 0.5) * 0.3], i * 3);
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(pg, new THREE.PointsMaterial({ map: glowTex, color: 0xdfe8ff, size: 0.012, transparent: true, depthWrite: false }));
      pts.userData.spin = true;
      g.add(pts);
    }
  };
  function showDish(id) {
    if (!BUILD[id]) return;
    if (!dishCache[id]) { const g = new THREE.Group(); BUILD[id](g); g.scale.setScalar(1.25); dishCache[id] = g; dishHolder.add(g); }
    for (const [k, g] of Object.entries(dishCache)) g.visible = k === id;
    board.selected = id;
    drawBoard();
    focus('plato');
  }

  // ---------- pizarra digital ----------
  function drawBoard() {
    const g = boardCanvas.getContext('2d'), w = 1024, h = 272;
    const ud = upside;
    g.fillStyle = ud ? '#0b0f16' : '#140d0b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = ud ? '#5b7aa0' : '#ff624f'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    g.textBaseline = 'middle';
    g.fillStyle = ud ? '#9fb7d8' : '#ffd27a'; g.font = 'bold 34px ui-monospace, monospace'; g.textAlign = 'left';
    g.fillText(ud ? "BENNY'S · EL OTRO LADO" : "BENNY'S · CARTA DE HAWKINS", 26, 36);
    g.textAlign = 'right'; g.font = 'bold 24px ui-monospace, monospace'; g.fillStyle = ud ? '#c1121f' : '#82f7ad';
    g.fillText(ud ? '● SEÑAL INVERTIDA' : '● COCINA ABIERTA', w - 26, 36);
    menu.slice(0, 6).forEach((item, i) => {
      const col = i % 2, row = Math.floor(i / 2), x = 26 + col * 494, y = 84 + row * 52;
      const sel = item.id === board.selected;
      if (sel) { g.fillStyle = ud ? '#3a1218' : '#7a1a14'; g.fillRect(x - 8, y - 22, 486, 44); }
      g.textAlign = 'left'; g.font = (sel ? 'bold ' : '') + '28px ui-monospace, monospace';
      g.fillStyle = ud ? (sel ? '#ffd0d0' : '#8fa3bd') : (sel ? '#fff4e2' : '#f2dcc2');
      const name = ud ? item.n.toUpperCase().split('').map((c, k) => ((k * 7 + i) % 5 === 0 ? '▓' : c)).join('') : item.n.toUpperCase();
      g.fillText(name.slice(0, 24), x, y);
      g.textAlign = 'right'; g.fillText(item.p.toFixed(2).replace('.', ',') + '€', x + 470, y);
    });
    g.fillStyle = ud ? '#1b2635' : '#2a1a14'; g.fillRect(12, h - 44, w - 24, 32);
    g.fillStyle = ud ? '#c1121f' : '#ffb35c'; g.font = 'bold 22px ui-monospace, monospace'; g.textAlign = 'center';
    g.fillText(board.notice, w / 2, h - 28);
    boardTex.needsUpdate = true;
  }

  // ---------- postproceso (8 / 16 / 32-Matrix) ----------
  let rt = null;
  const post = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uScreen: { value: new THREE.Vector2(1, 1) },
      uLevels: { value: 0 }, uMatrix: { value: 0 }, uTime: { value: 0 }, uFlash: { value: 0 }, uUpside: { value: 0 }, uScan: { value: 0 }
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: POST_FRAG,
    depthTest: false, depthWrite: false
  });
  const postScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post);
  quad.frustumCulled = false;
  postScene.add(quad);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let mode = 32, W = 1, H = 1;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.round(w * dpr); H = Math.round(h * dpr);
    renderer.setSize(W, H, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const m = MODES[mode];
    const rw = m.w ? Math.min(m.w, W) : W, rh = Math.max(1, Math.round(rw * H / W));
    if (!rt || rt.samples !== m.samples) {
      rt?.dispose();
      rt = new THREE.WebGLRenderTarget(rw, rh, { type: THREE.HalfFloatType, samples: m.samples, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    } else rt.setSize(rw, rh);
    post.uniforms.tDiffuse.value = rt.texture;
    post.uniforms.uRes.value.set(rw, rh);
    post.uniforms.uScreen.value.set(W, H);
    post.uniforms.uLevels.value = m.levels;
    post.uniforms.uMatrix.value = m.matrix;
    post.uniforms.uScan.value = m.scan;
    matrixRim.intensity = m.matrix ? 0.9 : 0;
  }
  new ResizeObserver(resize).observe(canvas);

  // ---------- cámara ----------
  const v = VIEWS.sala;
  const cur = { t: new THREE.Vector3(...v.t), yaw: v.yaw, pitch: v.pitch, dist: v.dist };
  const goal = { t: new THREE.Vector3(...v.t), yaw: v.yaw, pitch: v.pitch, dist: v.dist };
  let roll = null, rollAngle = 0, fovKick = 0;
  function focus(zone) {
    const p = VIEWS[zone] || VIEWS.sala;
    goal.t.set(...p.t); goal.yaw = p.yaw; goal.pitch = p.pitch; goal.dist = p.dist;
  }
  function placeCamera() {
    const cp = Math.cos(cur.pitch);
    camera.position.set(cur.t.x + Math.sin(cur.yaw) * cp * cur.dist, cur.t.y + Math.sin(cur.pitch) * cur.dist, cur.t.z + Math.cos(cur.yaw) * cp * cur.dist);
    camera.up.set(0, 1, 0);
    camera.lookAt(cur.t);
    if (rollAngle) camera.rotateZ(rollAngle);
    const fov = 42 + fovKick;
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function zoneAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const badge = ray.intersectObjects(badges, false)[0];
    if (badge) return badge.object.userData.zone;
    return ray.intersectObjects(hits, false)[0]?.object.userData.zone || null;
  }
  let drag = null, hoverZone = null;
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, moved: 0 };
  });
  canvas.addEventListener('pointermove', e => {
    if (drag && canvas.hasPointerCapture(e.pointerId)) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.x = e.clientX; drag.y = e.clientY;
      goal.yaw = cur.yaw = clamp(cur.yaw - dx * 0.006, -1.45, 1.45);
      goal.pitch = cur.pitch = clamp(cur.pitch + dy * 0.005, -0.05, 1.25);
      return;
    }
    const z = zoneAt(e);
    if (z !== hoverZone) { hoverZone = z; canvas.style.cursor = z ? 'pointer' : 'grab'; onHover?.(z); }
  });
  canvas.addEventListener('pointerup', e => {
    if (drag && drag.moved < 6) { const z = zoneAt(e); if (z) onPick?.(z); }
    drag = null;
  });
  canvas.addEventListener('lostpointercapture', () => { drag = null; });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    goal.dist = clamp(goal.dist * (e.deltaY > 0 ? 1.1 : 1 / 1.1), 0.8, 16);
  }, { passive: false });
  canvas.addEventListener('keydown', e => {
    const k = { ArrowLeft: [0.2, 0], ArrowRight: [-0.2, 0], ArrowUp: [0, 0.12], ArrowDown: [0, -0.12] }[e.key];
    if (k) { e.preventDefault(); rotate(k[0], k[1]); }
    else if (e.key === '+' || e.key === '=') zoom(1 / 1.15);
    else if (e.key === '-') zoom(1.15);
  });
  function rotate(dyaw, dpitch = 0) {
    goal.yaw = clamp(goal.yaw + dyaw, -1.45, 1.45);
    goal.pitch = clamp(goal.pitch + dpitch, -0.05, 1.25);
  }
  function zoom(f) { goal.dist = clamp(goal.dist * f, 0.8, 16); }

  // ---------- estado del mundo ----------
  let upside = false, udK = 0, flash = 0, lightning = 3, music = false, visible = true;
  function crossPortal() {
    if (roll) return !upside;
    roll = { t: 0, flipped: false };
    return !upside;
  }
  function spell(text) {
    const clean = String(text).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z ]/g, '').slice(0, 24);
    const now = clock.elapsedTime;
    let t = now + 0.3;
    spellQ = [];
    for (const ch of clean) {
      if (ch === ' ') { t += 0.6; continue; }
      spellQ.push({ i: ch.charCodeAt(0) - 65, on: t, off: t + 0.75 });
      t += 1.0;
    }
    return t - now;
  }
  function orderPlaced(code) {
    const paper = std(0xfaf6ea, 0.9, 0, { side: THREE.DoubleSide });
    const tk = add(room, new THREE.PlaneGeometry(0.11, 0.15), paper, -4.7 + tickets.length * 0.22, 1.94, -3.89, false);
    tk.rotation.z = (Math.random() - 0.5) * 0.15;
    tickets.push(tk);
    if (tickets.length > 12) { const old = tickets.shift(); room.remove(old); old.geometry.dispose(); }
    board.notice = 'EN COCINA · ' + code;
    drawBoard();
    kitchenPulse = 1;
  }
  function orderReady(code) {
    const tk = tickets.pop();
    if (tk) { room.remove(tk); tk.geometry.dispose(); }
    board.notice = 'PEDIDO ' + code + ' · LISTO · ¡A LA MESA!';
    drawBoard();
    kitchenPulse = 1.5;
    return spell('LISTO');
  }
  let kitchenPulse = 0;

  const io = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) clock.getDelta(); });

  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  const pendantBase = 5;
  function update(dt, t) {
    // cámara
    const k = 1 - Math.exp(-dt * 3.2);
    cur.t.lerp(goal.t, k);
    cur.yaw += (goal.yaw - cur.yaw) * k;
    cur.pitch += (goal.pitch - cur.pitch) * k;
    cur.dist += (goal.dist - cur.dist) * k;
    if (roll) {
      roll.t += dt / 1.9;
      const e = ease(Math.min(1, roll.t));
      rollAngle = e * TAU;
      fovKick = Math.sin(e * Math.PI) * 28;
      if (!roll.flipped && roll.t >= 0.5) {
        roll.flipped = true;
        upside = !upside;
        flash = 1.2;
        guests.visible = !upside;
        board.notice = upside ? 'NO SALGAS DEL GRUPO · LAS LUCES TE GUIARÁN' : 'PIDE DESDE LA MESA · PULSERA O APP';
        drawBoard();
        onPortal?.(upside);
      }
      if (roll.t >= 1) { roll = null; rollAngle = 0; fovKick = 0; }
    }
    placeCamera();

    // transición al otro lado
    udK += ((upside ? 1 : 0) - udK) * (1 - Math.exp(-dt * 2.2));
    scene.background.lerpColors(BG.normal, BG.upside, udK);
    scene.fog.color.lerpColors(FOG.normal, FOG.upside, udK);
    scene.fog.density = 0.012 + udK * 0.045;
    hemi.intensity = 0.6 - udK * 0.38;
    hemi.color.copy(HEMI.normal).lerp(HEMI.upside, udK);
    key.intensity = 1.5 - udK * 1.2;
    moon.intensity = 0.25 + udK * 0.7;
    envMats.forEach(m => { m.envMapIntensity = m.userData.env * (1 - udK * 0.75); });
    sporeMat.opacity = udK * 0.85;
    post.uniforms.uUpside.value = udK;
    vines.forEach(vn => {
      const g = clamp((udK - vn.delay) / (1 - vn.delay), 0, 1);
      vn.geo.setDrawRange(0, Math.floor(vn.count * g / 3) * 3);
    });
    const flicker = upside ? (Math.sin(t * 23) * Math.sin(t * 7.3) > 0.55 ? 0.15 : 1) : 1;
    pendantLights.forEach((l, i) => { l.intensity = pendantBase * (1 - udK) + udK * 1.2 * (Math.sin(t * 17 + i * 3) > 0.7 ? 1 : 0); });
    bulbMat.emissiveIntensity = 3 * (1 - udK) + udK * 0.5;
    const neonF = upside ? (Math.random() > 0.93 ? 0.1 : 0.7) : (Math.random() > 0.995 ? 0.35 : 1);
    neonMat.color.setScalar(1.6 * neonF);
    neonLight.intensity = 4 * neonF * (1 - udK * 0.5);
    portalMat.uniforms.uTime.value = t;
    portalMat.uniforms.uPower.value = udK;
    portalLight.intensity = (3 + udK * 14) * (0.85 + 0.15 * Math.sin(t * 5.3) * Math.sin(t * 1.7));
    portalGlow.material.opacity = 0.35 + udK * 0.5;
    portal.scale.setScalar(0.82 + udK * 0.25 + Math.sin(t * 1.3) * 0.012);

    // rayos rojos en el Upside Down
    if (upside) {
      lightning -= dt;
      if (lightning <= 0) { flash = 0.55 + Math.random() * 0.4; lightning = 2.5 + Math.random() * 5; }
    }
    flash = Math.max(0, flash - dt * 2.4);
    post.uniforms.uFlash.value = flash * flash * 0.35;
    storm.intensity = flash * 7;

    // esporas
    for (let i = 0; i < SPORES; i++) {
      const s = sporeSeed[i];
      let y = sporePos[i * 3 + 1] + dt * (0.05 + 0.04 * Math.sin(s));
      if (y > 3.15) y = 0.02;
      sporePos[i * 3 + 1] = y;
      sporePos[i * 3] += Math.sin(t * 0.4 + s) * dt * 0.03;
    }
    if (udK > 0.01) sporeGeo.attributes.position.needsUpdate = true;

    // pared de luces
    const spelling = spellQ.length && t < spellQ[spellQ.length - 1].off + 0.4;
    bulbs.forEach((b, i) => {
      const lit = spelling && spellQ.some(q => q.i === i && t >= q.on && t < q.off);
      let e = lit ? 7 : spelling ? 0.05 : 0.35 + 0.25 * Math.sin(t * 2 + b.phase);
      if (!lit && upside) e *= Math.sin(t * 11 + b.phase * 5) > 0.2 ? 1.8 : 0.1;
      b.mat.emissiveIntensity = e;
      b.s.scale.setScalar(lit ? 0.85 : 0.12 + e * 0.12);
      b.s.material.opacity = lit ? 1 : Math.min(1, e * 0.8);
    });
    if (!spelling && spellQ.length) spellQ = [];

    // jukebox
    const hue = (t * (music ? 0.18 : 0.05)) % 1;
    jukeGlow.emissive.setHSL(hue, 1, 0.5);
    jukeTube.emissive.setHSL((hue + 0.5) % 1, 1, 0.55);
    jukeLight.color.setHSL(hue, 1, 0.55);
    jukeLight.intensity = (music ? 4.5 + Math.sin(t * 8.4) * 1.5 : 2.5) * (1 - udK * 0.6);

    // cocina
    kitchenPulse = Math.max(0, kitchenPulse - dt * 0.8);
    kitchenLight.intensity = (9 + kitchenPulse * 18 + Math.sin(t * 9) * 0.6) * (1 - udK * 0.7);
    heatMat.emissiveIntensity = 2.5 + kitchenPulse * 4;
    chef.position.x = -3.3 + Math.sin(t * 0.6) * 1.2;
    chef.visible = !upside;

    // camarera
    const u = (t * 0.022) % 1;
    walkPath.getPointAt(u, waitress.position);
    walkPath.getTangentAt(u, tmp);
    waitress.rotation.y = Math.atan2(tmp.x, tmp.z);
    waitress.position.y = Math.abs(Math.sin(t * 6)) * 0.025;

    // plato y badges
    dishHolder.rotation.y += dt * 0.55;
    for (const g of Object.values(dishCache)) g.traverse(o => { if (o.userData.spin) o.rotation.y += dt * 0.3; });
    const near = cur.dist < 2.2;
    badges.forEach(b => { b.material.opacity = near ? 0 : 0.95; b.scale.setScalar(0.3 + Math.sin(t * 2.4) * 0.02); });
    post.uniforms.uTime.value = t;
  }

  function frame() {
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt, clock.elapsedTime);
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  }
  resize();
  drawBoard();
  renderer.setAnimationLoop(frame);

  return {
    setMode(m) { if (MODES[m]) { mode = m; rt?.dispose(); rt = null; resize(); } },
    focus, showDish, crossPortal, spell, orderPlaced, orderReady, rotate, zoom,
    setMusic(on) { music = !!on; },
    get upside() { return upside; }
  };
}
