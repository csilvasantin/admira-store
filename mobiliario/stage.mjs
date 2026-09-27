import { applyEpoch, definePiece, epochByBits, sweepOrder } from '../eras/epoch.mjs';
import { KIT, skinUrl } from './catalog.mjs';
import { eraStatus } from './room-state.mjs';

export const pieces = KIT.map((item) => ({
  ...definePiece({
    id: item.id,
    saga: item.saga,
    silhouette: item.silhouette,
    color: item.color,
    witness: !!item.witness,
    x: item.x,
    y: 300,
    fn: item.fn,
  }),
  number: item.number,
  title: item.title,
  type: item.type,
  location: item.location,
  state: item.state,
  maintenance: item.maintenance,
}));

const epochOf = new Map(pieces.map((piece) => [piece.id, 32]));
const images = new Map();
let rotation = 0;
let tick = 0;
let sweeping = false;
let wanted = null;

const canvas = document.querySelector('#room');
const ctx = canvas.getContext('2d');
const names = document.querySelector('#names');
const status = document.querySelector('#status');
const inventory = document.querySelector('#inventory');

function viewOf(piece) {
  return { ...piece, ...applyEpoch(piece, epochOf.get(piece.id)) };
}

function keyOf(piece) {
  return `${piece.number}-${epochOf.get(piece.id)}-${rotation}`;
}

function loadSkin(piece) {
  const key = keyOf(piece);
  if (images.has(key)) return images.get(key);
  const spec = skinUrl(piece.number, epochOf.get(piece.id), rotation);
  const img = new Image();
  const record = { img, ready: false, fallback: spec.fallback };
  img.onload = () => { record.ready = true; };
  img.src = spec.url;
  images.set(key, record);
  return record;
}

function paintSky() {
  const state = eraStatus(pieces.map((piece) => epochOf.get(piece.id)));
  const bits = state.mixed ? 0 : state.bits;
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (bits === 8) { sky.addColorStop(0, '#1b1464'); sky.addColorStop(1, '#3b1d8a'); }
  else if (bits === 16) { sky.addColorStop(0, '#123a5f'); sky.addColorStop(1, '#0c1b2a'); }
  else if (bits === 64) { sky.addColorStop(0, '#010a08'); sky.addColorStop(1, '#02140f'); }
  else { sky.addColorStop(0, '#d7dde6'); sky.addColorStop(1, '#8d97a3'); }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bits === 64 ? '#06281c' : bits === 8 ? '#241848' : '#6d5844';
  ctx.fillRect(0, 340, canvas.width, 160);
}

function frame() {
  paintSky();
  for (const piece of pieces) {
    const view = viewOf(piece);
    const skin = loadSkin(piece);
    const bounce = view.bits === 8 ? Math.round(Math.sin(tick / 8) * 3) : 0;
    const size = 150;
    const x = piece.x - size / 2;
    const y = 210 - size + bounce;
    ctx.imageSmoothingEnabled = view.bits > 16;
    if (skin.ready) ctx.drawImage(skin.img, x, y, size, size);
    ctx.fillStyle = view.bits === 64 ? '#b6ffc8' : '#f4f1ea';
    ctx.font = '13px sans-serif';
    ctx.fillText(`${piece.number} ${piece.title}`, piece.x - 54, 430);
  }
  tick += 1;
  requestAnimationFrame(frame);
}

function renderNames() {
  const state = eraStatus(pieces.map((piece) => epochOf.get(piece.id)));
  names.textContent = pieces.map((piece) => `${piece.number} ${viewOf(piece).name}`).join(' · ');
  if (state.mixed) {
    status.textContent = 'Mezcla · el barrido no ha terminado. Cada mueble muestra su propia época.';
  } else {
    const epoch = epochByBits(state.bits);
    const facing = rotation === 0 ? 'frente' : `giro ${rotation}`;
    const sixty = state.bits === 64 ? ' · 64 bits solo en el frente; los otros giros siguen en el Best' : '';
    status.textContent = `${epoch.label} · ${epoch.sound} · ${facing}${sixty}`;
  }
  document.querySelectorAll('[data-bits]').forEach((button) => {
    button.setAttribute('aria-pressed', String(!state.mixed && Number(button.dataset.bits) === state.bits));
  });
  if (inventory) {
    inventory.textContent = pieces.map((piece) => (
      `#${piece.number} ${piece.type} · ${piece.location} · ${piece.state} · ${piece.maintenance}`
    )).join('\n');
  }
}

let audio;
function tone(kind) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audio = audio || new Ctx();
  audio.resume();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(audio.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  if (kind === 'chiptune') { osc.type = 'square'; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.12); }
  else if (kind === 'cartridge') { osc.type = 'square'; osc.frequency.setValueAtTime(140, now); osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); }
  else if (kind === 'current') { osc.type = 'sine'; osc.frequency.setValueAtTime(440, now); }
  else { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(72, now); osc.frequency.setValueAtTime(68, now + 0.2); }
  osc.start(now);
  osc.stop(now + 0.48);
}

export async function sweepTo(nextBits) {
  wanted = epochByBits(nextBits).bits;
  if (sweeping) return;
  sweeping = true;
  while (wanted != null) {
    const target = wanted;
    wanted = null;
    const epoch = epochByBits(target);
    for (const piece of sweepOrder(pieces)) {
      if (wanted != null) break;
      epochOf.set(piece.id, target);
      tone(epoch.sound);
      renderNames();
      await new Promise((resolve) => setTimeout(resolve, 460));
    }
  }
  sweeping = false;
  renderNames();
}

document.querySelectorAll('[data-bits]').forEach((button) => {
  button.addEventListener('click', () => sweepTo(Number(button.dataset.bits)));
});
document.querySelectorAll('[data-rot]').forEach((button) => {
  button.addEventListener('click', () => {
    rotation = Number(button.dataset.rot);
    document.querySelectorAll('[data-rot]').forEach((other) => {
      other.setAttribute('aria-pressed', String(other === button));
    });
    renderNames();
  });
});
renderNames();
requestAnimationFrame(frame);
