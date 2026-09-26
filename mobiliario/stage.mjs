import { applyEpoch, epochByBits, sweepOrder } from '../eras/epoch.mjs';
import { FURNITURE } from './catalog.mjs';

export const pieces = FURNITURE;
const epochOf = new Map(pieces.map((piece) => [piece.id, 32]));
let tick = 0;
let sweeping = false;

const canvas = document.querySelector('#room');
const ctx = canvas.getContext('2d');
const names = document.querySelector('#names');
const status = document.querySelector('#status');

function viewOf(piece) {
  return applyEpoch(piece, epochOf.get(piece.id));
}

function roomBits() {
  const values = [...epochOf.values()];
  return values.every((value) => value === values[0]) ? values[0] : 32;
}

function paintSky() {
  const bits = roomBits();
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (bits === 8) { sky.addColorStop(0, '#1b1464'); sky.addColorStop(1, '#3b1d8a'); }
  else if (bits === 16) { sky.addColorStop(0, '#123a5f'); sky.addColorStop(1, '#0c1b2a'); }
  else if (bits === 32) { sky.addColorStop(0, '#d7dde6'); sky.addColorStop(1, '#8d97a3'); }
  else { sky.addColorStop(0, '#010a08'); sky.addColorStop(1, '#02140f'); }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bits === 64 ? '#06281c' : bits === 32 ? '#6d5844' : '#222';
  ctx.fillRect(0, 310, canvas.width, 140);
}

function pixel(x, y, w, h, color, bits) {
  ctx.fillStyle = color;
  if (bits === 8) {
    const s = 8;
    ctx.fillRect(Math.round(x / s) * s, Math.round(y / s) * s, Math.ceil(w / s) * s, Math.ceil(h / s) * s);
  } else ctx.fillRect(x, y, w, h);
}

function drawShape(view) {
  const bits = view.bits;
  const bounce = bits === 8 ? Math.round(Math.sin(tick / 8) * 4) : 0;
  const x = view.x;
  const y = view.y + bounce;
  const c = view.color;
  if (bits === 16) {
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(x + 40, 340, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (view.silhouette === 'plant') {
    pixel(x + 34, y + 20, 12, 46, bits === 64 ? '#14ff6a' : '#6b4a2b', bits);
    pixel(x + 8, y - 10, 64, 40, c, bits);
    pixel(x + 20, y - 36, 40, 30, bits === 8 ? '#7CFF4A' : c, bits);
  } else if (view.silhouette === 'chair') {
    pixel(x + 18, y - 70, 44, 54, c, bits);
    pixel(x + 10, y - 8, 60, 14, c, bits);
    pixel(x + 16, y + 6, 10, 40, '#222', bits);
    pixel(x + 54, y + 6, 10, 40, '#222', bits);
  } else if (view.silhouette === 'table') {
    pixel(x + 4, y - 18, 92, 16, c, bits);
    pixel(x + 14, y - 2, 10, 42, '#333', bits);
    pixel(x + 76, y - 2, 10, 42, '#333', bits);
  } else if (view.silhouette === 'sofa') {
    pixel(x + 4, y - 28, 100, 36, c, bits);
    pixel(x + 4, y - 58, 16, 36, c, bits);
    pixel(x + 88, y - 58, 16, 36, c, bits);
    pixel(x + 16, y + 8, 12, 22, '#222', bits);
    pixel(x + 76, y + 8, 12, 22, '#222', bits);
  } else if (view.silhouette === 'lamp') {
    pixel(x + 36, y - 10, 8, 50, '#555', bits);
    pixel(x + 16, y - 48, 48, 40, c, bits);
  } else if (view.silhouette === 'screen') {
    pixel(x + 8, y - 62, 78, 52, '#111', bits);
    pixel(x + 14, y - 56, 66, 40, c, bits);
    pixel(x + 40, y - 8, 12, 28, '#333', bits);
  }
  if (bits === 16) {
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.fillRect(x + 16, y - 60, 18, 6);
  }
  if (bits === 64) {
    ctx.fillStyle = 'rgba(40,255,120,.18)';
    for (let i = 0; i < 6; i++) ctx.fillRect(x + 8, y - 80 + i * 14 + (tick % 14), 70, 2);
  }
  ctx.fillStyle = bits === 64 ? '#b6ffc8' : bits === 8 ? '#ffe14a' : '#f4f1ea';
  ctx.font = bits === 8 ? '12px monospace' : '13px sans-serif';
  ctx.fillText(view.name, x, 390);
}

function frame() {
  paintSky();
  for (const piece of pieces) drawShape(viewOf(piece));
  tick += 1;
  requestAnimationFrame(frame);
}

function renderNames() {
  names.textContent = pieces.map((piece) => viewOf(piece).name).join(' · ');
  const current = roomBits();
  status.textContent = epochByBits(current).label + ' · ' + epochByBits(current).sound;
  document.querySelectorAll('[data-bits]').forEach((button) => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.bits) === current));
  });
}

let audio;
function tone(kind) {
  audio = audio || new AudioContext();
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
  if (sweeping) return;
  sweeping = true;
  const target = epochByBits(nextBits);
  for (const piece of sweepOrder(pieces)) {
    epochOf.set(piece.id, target.bits);
    tone(target.sound);
    renderNames();
    await new Promise((resolve) => setTimeout(resolve, 460));
  }
  sweeping = false;
}

document.querySelectorAll('[data-bits]').forEach((button) => {
  button.addEventListener('click', () => sweepTo(Number(button.dataset.bits)));
});
renderNames();
requestAnimationFrame(frame);
