// Escena three.js del gemelo de un Xpacio a partir de escenaDesdePlano() (plano3d.mjs).
// Volúmenes sencillos y a escala: paredes con sus huecos, suelo, techo, muebles,
// pantallas con su captura, players y webcam. Three.js r160 del propio sitio
// (admira-xp/scripts/premium-three.mjs, el mismo de Better/Best y de SneakerStore).
import * as T from '../../admira-xp/scripts/premium-three.mjs';
import { pointOnWall } from './plano3d.mjs?v=gdg51-3';

const GROSOR = 0.08;
const tipoTexto = (m, re) => (String(m.nombre || '').replace(re, '').trim() || m.id).toUpperCase();

// Acabados por Xpacio: el plano no los trae, los elige la página. «laboratorio» es el de
// Gran de Gràcia 51 (baldosa hidráulica, paredes blancas); «cafeteria» el de Starbucks
// Paseo de Gracia: tarima de madera, paredes cálidas y la pared de la barra en verde.
export const TEMAS = {
  laboratorio: { fondo: '#0f1416', pared: '#eeede8', techo: '#f4f3ef', suelo: 'baldosa', acento: null, bombillas: 1 },
  cafeteria: { fondo: '#10140f', pared: '#efe5d6', techo: '#f3ede3', suelo: 'tarima', acento: { re: /barra/i, color: '#1e3b31' }, bombillas: 3 },
};

export function crearEscena3D(escena, { anisotropia = 4, onCambio = () => {}, tema = 'laboratorio' } = {}) {
  const TEMA = TEMAS[tema] || TEMAS.laboratorio;
  const resources = new Set();
  const own = x => (resources.add(x), x);
  const scene = new T.Scene();
  scene.background = new T.Color(TEMA.fondo);
  const root = new T.Group();
  scene.add(root);
  const V = (x, y, h) => new T.Vector3(x, h, y);

  const mat = (color, extra = {}) => own(new T.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra }));
  const M = {
    pared: mat(TEMA.pared, { roughness: 0.95 }),
    techo: mat(TEMA.techo, { roughness: 1, side: T.FrontSide }),
    blanco: mat('#f3f3f0', { roughness: 0.55 }),
    patas: mat('#cfd0cd', { roughness: 0.4, metalness: 0.4 }),
    negro: mat('#16181b', { roughness: 0.5 }),
    bisel: mat('#0b0c0e', { roughness: 0.35, metalness: 0.2 }),
    aluminio: mat('#c6c8cb', { roughness: 0.32, metalness: 0.65 }),
    marco: mat('#f6f5f1', { roughness: 0.6 }),
    cristal: own(new T.MeshStandardMaterial({ color: '#7f97a3', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 })),
    gris: mat('#8a8c8e'),
    lente: mat('#050607', { roughness: 0.1, metalness: 0.5 }),
  };

  // ── Texturas dibujadas (sin ficheros que mantener) ──
  function lienzo(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = own(new T.CanvasTexture(c)); t.colorSpace = T.SRGBColorSpace; t.anisotropy = anisotropia;
    return t;
  }
  // Baldosa hidráulica de 20 cm: la textura cubre 2 × 2 baldosas (40 cm).
  const baldosa = lienzo(256, 256, (g, w) => {
    const b = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const x = i * b, y = j * b;
      g.fillStyle = '#d8ccb0'; g.fillRect(x, y, b, b);
      g.fillStyle = '#9a9a86';
      for (const [cx, cy] of [[x, y], [x + b, y], [x, y + b], [x + b, y + b]]) { g.beginPath(); g.arc(cx, cy, b * 0.28, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#b4835f';
      g.beginPath(); g.moveTo(x + b / 2, y + b * 0.18); g.lineTo(x + b * 0.82, y + b / 2); g.lineTo(x + b / 2, y + b * 0.82); g.lineTo(x + b * 0.18, y + b / 2); g.closePath(); g.fill();
      g.fillStyle = '#e8dfca';
      g.beginPath(); g.arc(x + b / 2, y + b / 2, b * 0.13, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(70,64,52,.35)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, b - 2, b - 2);
    }
  });
  baldosa.wrapS = baldosa.wrapT = T.RepeatWrapping;
  // Tarima de roble en lamas de 20 cm a junta corrida: la textura cubre 1,2 × 0,6 m.
  const tarima = lienzo(512, 256, (g, w, h) => {
    const fila = h / 3, tonos = ['#9a6b43', '#a87749', '#8f6340', '#b07f52', '#966843'];
    for (let r = 0; r < 3; r++) {
      const corte = (r % 2) * w / 2;
      for (let k = -1; k < 2; k++) {
        const x = corte + k * w / 2 + (r === 2 ? w / 4 : 0);
        g.fillStyle = tonos[(r * 3 + k + 5) % tonos.length]; g.fillRect(x, r * fila, w / 2, fila);
        g.strokeStyle = 'rgba(60,38,20,.18)'; g.lineWidth = 1;
        for (let v = 0; v < 6; v++) { const y = r * fila + 6 + v * (fila - 12) / 5; g.beginPath(); g.moveTo(x + 4, y); g.bezierCurveTo(x + w / 6, y + 3, x + w / 3, y - 3, x + w / 2 - 4, y); g.stroke(); }
        g.strokeStyle = 'rgba(40,24,12,.55)'; g.lineWidth = 2; g.strokeRect(x + 1, r * fila + 1, w / 2 - 2, fila - 2);
      }
    }
  });
  tarima.wrapS = tarima.wrapT = T.RepeatWrapping;
  // Frente de barra en listones verticales de madera oscura (la textura cubre 0,6 m de ancho).
  const listones = lienzo(256, 256, (g, w, h) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#4a3021' : '#563827'; g.fillRect(i * w / 8, 0, w / 8, h); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect((i + 1) * w / 8 - 3, 0, 3, h); }
  });
  listones.wrapS = listones.wrapT = T.RepeatWrapping;
  const C = {
    roble: mat('#9b6b42', { roughness: 0.6 }), nogal: mat('#3d281b', { roughness: 0.7 }), piedra: mat('#dcd6cb', { roughness: 0.35 }),
    bollo: mat('#c98a4b', { roughness: 0.8 }), chocolate: mat('#5a3523', { roughness: 0.8 }), verde: mat('#1e5b45', { roughness: 0.5 }),
  };
  function listonesDe(w, h) {
    const t = own(listones.clone()); t.needsUpdate = true; t.repeat.set(w / 0.6, Math.max(1, h / 0.6));
    return plano(w, h, own(new T.MeshStandardMaterial({ map: t, roughness: 0.75 })));
  }
  // Paneles 3D blancos de la pared de la mesa larga (piezas de 50 × 25 cm al tresbolillo).
  const paneles = lienzo(256, 256, (g, w, h) => {
    g.fillStyle = '#efeee9'; g.fillRect(0, 0, w, h);
    const fh = h / 4;
    for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) {
      const x = c * (w / 2) + (r % 2) * (w / 4), y = r * fh;
      const grad = g.createLinearGradient(x, y, x + w / 2, y + fh);
      grad.addColorStop(0, '#fbfaf6'); grad.addColorStop(1, '#dedcd5');
      g.fillStyle = grad; g.fillRect(x + 3, y + 3, w / 2 - 6, fh - 6);
    }
  });
  paneles.wrapS = paneles.wrapT = T.RepeatWrapping;
  const cortina = lienzo(256, 64, (g, w, h) => {
    for (let x = 0; x < w; x++) { const v = 214 + Math.round(18 * Math.sin(x / w * Math.PI * 18)); g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x, 0, 1, h); }
  });
  function cartel(texto, { fondo = '#111', color = '#43ff7a', w = 512, h = 128, fuente = 'bold 78px system-ui, sans-serif' } = {}) {
    return lienzo(w, h, (g) => { g.fillStyle = fondo; g.fillRect(0, 0, w, h); g.fillStyle = color; g.font = fuente; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, w / 2, h / 2, w - 24); });
  }

  const box = (w, h, d, m) => { const mesh = new T.Mesh(own(new T.BoxGeometry(w, h, d)), m); return mesh; };
  const plano = (w, h, m) => new T.Mesh(own(new T.PlaneGeometry(w, h)), m);
  const basic = (opts) => own(new T.MeshBasicMaterial({ toneMapped: false, ...opts }));
  // Grupo orientado: su +z mira hacia `n` y su +x sigue la pared (a→b).
  function orientado(x, y, h, yaw) { const g = new T.Group(); g.position.copy(V(x, y, h)); g.rotation.y = yaw; return g; }

  // ── Suelo, techo y aristas ──
  const { ancho, fondo, alto } = escena.sala;
  const conTarima = TEMA.suelo === 'tarima';
  const suelo = plano(ancho, fondo, own(new T.MeshStandardMaterial({ map: conTarima ? tarima : baldosa, roughness: conTarima ? 0.6 : 0.75 })));
  if (conTarima) tarima.repeat.set(ancho / 1.2, fondo / 0.6); else baldosa.repeat.set(ancho / 0.4, fondo / 0.4);
  suelo.rotation.x = -Math.PI / 2; suelo.position.copy(V(ancho / 2, fondo / 2, 0));
  suelo.userData.parte = 'suelo';
  root.add(suelo);
  const techo = plano(ancho, fondo, M.techo);
  techo.rotation.x = Math.PI / 2; techo.position.copy(V(ancho / 2, fondo / 2, alto));
  root.add(techo);
  const lampara = new T.Mesh(own(new T.CircleGeometry(0.22, 32)), basic({ color: '#fff6dc' }));
  lampara.rotation.x = Math.PI / 2; lampara.position.copy(V(ancho / 2, fondo / 2, alto - 0.01));
  root.add(lampara);

  // ── Paredes ──
  const paredes = new Map();
  for (const w of escena.paredes) {
    const g = new T.Group(); g.userData.pared = w.id; root.add(g); paredes.set(w.id, g);
    const conPaneles = /paneles\s*3d/i.test(w.nombre);
    const acento = TEMA.acento && TEMA.acento.re.test(w.nombre || '') ? mat(TEMA.acento.color, { roughness: 0.9 }) : null;
    for (const r of w.macizos) {
      const ws = r.s1 - r.s0, hz = r.z1 - r.z0;
      let m = acento || M.pared;
      if (conPaneles) { const t = paneles.clone(); own(t); t.needsUpdate = true; t.repeat.set(ws / 1.0, hz / 1.0); m = own(new T.MeshStandardMaterial({ map: t, roughness: 0.95 })); }
      const mesh = box(ws, hz, GROSOR, m);
      const p = pointOnWall(w, (r.s0 + r.s1) / 2);
      mesh.position.copy(V(p[0] - w.n[0] * GROSOR / 2, p[1] - w.n[1] * GROSOR / 2, r.z0 + hz / 2));
      mesh.rotation.y = w.yaw;
      g.add(mesh);
    }
    // Zócalo oscuro de 7 cm, como en las fotos.
    for (const r of w.macizos.filter(r => r.z0 === 0)) {
      const z = box(r.s1 - r.s0, 0.07, 0.012, M.negro), p = pointOnWall(w, (r.s0 + r.s1) / 2);
      z.position.copy(V(p[0] + w.n[0] * 0.006, p[1] + w.n[1] * 0.006, 0.035)); z.rotation.y = w.yaw; g.add(z);
    }
    for (const h of w.huecos) g.add(hueco(w, h));
  }

  function hueco(w, h) {
    const g = new T.Group(); g.userData.hueco = h.id;
    const s0 = h.desde, s1 = h.desde + h.ancho, z0 = h.base || 0, z1 = z0 + h.alto, sc = (s0 + s1) / 2;
    const en = (s, d, z, obj) => { const p = pointOnWall(w, s); obj.position.copy(V(p[0] + w.n[0] * d, p[1] + w.n[1] * d, z)); obj.rotation.y = w.yaw; g.add(obj); return obj; };
    // Marco
    for (const s of [s0 + 0.025, s1 - 0.025]) en(s, 0.005, z0 + h.alto / 2, box(0.05, h.alto, GROSOR + 0.03, M.marco));
    en(sc, 0.005, z1 - 0.025, box(h.ancho, 0.05, GROSOR + 0.03, M.marco));
    if (z0 === 0) { // pavimento del otro lado: el hueco no da al vacío
      const fuera = plano(h.ancho, 1.2, own(new T.MeshStandardMaterial({ color: '#b9ad92', roughness: 0.9 })));
      fuera.rotation.x = -Math.PI / 2;
      const p = pointOnWall(w, sc); fuera.position.copy(V(p[0] - w.n[0] * 0.6, p[1] - w.n[1] * 0.6, 0.001)); fuera.rotation.z = w.yaw; g.add(fuera);
    }
    if (h.tipo === 'ventana') {
      en(sc, -GROSOR / 2, z0 + h.alto / 2, plano(h.ancho - 0.1, h.alto - 0.05, M.cristal)).rotation.y = w.yaw;
      const c = plano(h.ancho + 0.1, h.alto - 0.05, own(new T.MeshStandardMaterial({ map: cortina, roughness: 1, side: T.DoubleSide })));
      cortina.wrapS = T.RepeatWrapping; cortina.repeat.set(h.ancho, 1);
      en(sc, 0.07, z0 + (h.alto - 0.05) / 2, c);
      return g;
    }
    if (/pizarra|doble/i.test(`${h.id} ${h.nombre || ''}`)) {
      // Puerta doble cerrada con una pizarra en cada hoja.
      const nombres = (String(h.nombre || '').split(/pizarras?\s+de\s+/i)[1] || '').split(/,\s*|\s+y\s+/).map(x => x.trim()).filter(Boolean);
      const hojaW = h.ancho / 2 - 0.03;
      [0, 1].forEach(i => {
        const s = s0 + 0.03 + hojaW / 2 + i * hojaW;
        en(s, -0.01, z0 + (h.alto - 0.05) / 2, box(hojaW - 0.01, h.alto - 0.05, 0.04, M.blanco));
        const quien = nombres.slice(i * 2, i * 2 + 2);
        const t = lienzo(256, 384, (g2, W, H) => {
          g2.fillStyle = '#fbfcfb'; g2.fillRect(0, 0, W, H); g2.strokeStyle = '#a5a8aa'; g2.lineWidth = 8; g2.strokeRect(4, 4, W - 8, H - 8);
          g2.font = 'bold 26px system-ui, sans-serif'; g2.textAlign = 'center';
          quien.forEach((n, k) => {
            const cx = W * (k ? 0.73 : 0.27); g2.fillStyle = '#3b4c6b'; g2.fillText(n.toUpperCase(), cx, 44, W / 2 - 10);
            const col = [['#f28da8', '#8fe08a'], ['#f6e46a', '#8cc8f2']][i][k];
            for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) { g2.fillStyle = col; g2.fillRect(cx - 34 + q * 38, 70 + r * 34, 28, 24); }
          });
          g2.fillStyle = '#5b6f8c'; for (let r = 0; r < 5; r++) g2.fillRect(30, 230 + r * 26, 120 + (r * 37) % 70, 4);
        });
        const p = plano(hojaW - 0.12, 1.15, basic({ map: t }));
        en(s, 0.013, z0 + 1.55, p);
      });
      return g;
    }
    // Puerta de paso abierta hacia dentro (bisagra en el extremo `desde`).
    const hoja = new T.Group(); en(s0 + 0.04, 0, z0, hoja);
    hoja.rotation.y = w.yaw - Math.PI * 80 / 180;
    const ancho = h.ancho - 0.06, panel = box(ancho, h.alto - 0.06, 0.04, M.blanco);
    panel.position.set(ancho / 2, (h.alto - 0.06) / 2, 0); hoja.add(panel);
    const pomo = new T.Mesh(own(new T.SphereGeometry(0.03, 16, 12)), M.marco); pomo.position.set(ancho - 0.07, 1.0, 0.05); hoja.add(pomo);
    return g;
  }

  // ── Muebles ──
  const muebles = new Map();
  for (const m of escena.muebles) {
    const g = orientado(m.x + m.w / 2, m.y + m.d / 2, 0, m.yaw); g.userData.mueble = m.id;
    // Medidas en el sistema del mueble: ancho a lo largo de su pared, fondo hacia n.
    const lateral = Math.abs(Math.sin(m.yaw)) > 0.7, W = lateral ? m.d : m.w, D = lateral ? m.w : m.d, H = m.alto;
    if (m.tipo === 'mesa') {
      const top = box(W, 0.03, D, conTarima ? C.roble : M.blanco); top.position.y = H - 0.015; g.add(top);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = box(0.04, H - 0.03, 0.04, M.patas); p.position.set(sx * (W / 2 - 0.05), (H - 0.03) / 2, sz * (D / 2 - 0.05)); g.add(p); }
    } else if (m.tipo === 'silla') {
      const clara = /secretlab/i.test(m.nombre || ''), cuerpo = clara ? M.blanco : M.negro;
      const asiento = box(W * 0.8, 0.09, D * 0.75, cuerpo); asiento.position.y = 0.5; g.add(asiento);
      const respaldo = box(W * 0.78, H - 0.55, 0.1, cuerpo); respaldo.position.set(0, 0.55 + (H - 0.55) / 2, -D * 0.33); respaldo.rotation.x = -0.12; g.add(respaldo);
      if (clara) { const cojin = box(W * 0.45, 0.13, 0.07, M.negro); cojin.position.set(0, H - 0.12, -D * 0.29); g.add(cojin); for (const sx of [-1, 1]) { const lado = box(0.05, H - 0.6, 0.11, M.negro); lado.position.set(sx * W * 0.38, 0.6 + (H - 0.6) / 2, -D * 0.33); lado.rotation.x = -0.12; g.add(lado); } }
      const pie = new T.Mesh(own(new T.CylinderGeometry(0.03, 0.03, 0.42, 12)), M.gris); pie.position.y = 0.25; g.add(pie);
      const estrella = new T.Mesh(own(new T.CylinderGeometry(0.3, 0.3, 0.04, 5)), M.negro); estrella.position.y = 0.06; g.add(estrella);
    } else if (m.tipo === 'nevera') {
      const cuerpo = box(W, H, D, M.negro); cuerpo.position.y = H / 2; g.add(cuerpo);
      const vidrio = plano(W * 0.52, H * 0.86, basic({ color: '#3fcf73', transparent: true, opacity: 0.85 })); vidrio.position.set(-W * 0.22, H * 0.48, D / 2 + 0.002); g.add(vidrio);
      const marca = plano(W * 0.4, H * 0.86, basic({ map: cartel(tipoTexto(m, /^nevera\s*/i), { fondo: '#0d0f0d', color: '#7dff5a', w: 256, h: 640, fuente: 'bold 52px system-ui, sans-serif' }) }));
      marca.position.set(W * 0.27, H * 0.48, D / 2 + 0.002); g.add(marca);
    } else if (m.tipo === 'recreativa') {
      const bajo = box(W, 0.82, D * 0.8, M.negro); bajo.position.set(0, 0.41, -D * 0.1); g.add(bajo);
      const caras = lienzo(256, 320, (g2, Wc, Hc) => { g2.fillStyle = '#121414'; g2.fillRect(0, 0, Wc, Hc); g2.fillStyle = '#b6ff4a'; g2.font = 'bold 20px system-ui'; g2.fillText('SCORE', 20, 26); g2.fillText('HI-SCORE', 150, 26); for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { g2.fillStyle = '#e8e2d6'; g2.beginPath(); g2.arc(42 + c * 58, 64 + r * 44, 17, 0, 6.3); g2.fill(); } });
      const frente = plano(W - 0.06, 0.78, basic({ map: caras })); frente.position.set(0, 0.41, D * 0.3 + 0.002); g.add(frente);
      const mandos = box(W, 0.07, 0.32, M.negro); mandos.position.set(0, 0.9, D * 0.2); mandos.rotation.x = 0.25; g.add(mandos);
      const alto2 = box(W, H - 0.95, D * 0.55, mat('#1d2a1d')); alto2.position.set(0, 0.95 + (H - 0.95) / 2, -D * 0.2); g.add(alto2);
      const pant = plano(W * 0.72, 0.36, basic({ color: '#0b1a12' })); pant.position.set(0, 1.25, D * 0.075 + 0.003); pant.rotation.x = -0.12; g.add(pant);
      const marq = plano(W, 0.2, basic({ map: cartel(tipoTexto(m, /^recreativa\s*/i), { fondo: '#4cc23a', color: '#f4fff0' }) })); marq.position.set(0, H - 0.11, D * 0.075 + 0.003); g.add(marq);
    } else if (m.tipo === 'barra' || m.tipo === 'caja' || m.tipo === 'vitrina') {
      // Mostrador de cafetería: cuerpo de madera oscura con frente de listones y encimera de piedra.
      // La barra lleva las cafeteras; la caja, el TPV; la vitrina, su urna de cristal con bollería.
      const bajo = m.tipo === 'vitrina' ? H * 0.58 : H - 0.04;
      const cuerpo = box(W, bajo, D - 0.04, C.nogal); cuerpo.position.y = bajo / 2; g.add(cuerpo);
      const frente = listonesDe(W, bajo - 0.08); frente.position.set(0, bajo / 2 + 0.02, (D - 0.04) / 2 + 0.002); g.add(frente);
      const encimera = box(W + 0.03, 0.04, D + 0.02, C.piedra); encimera.position.y = bajo + 0.02; g.add(encimera);
      if (m.tipo === 'barra') {
        for (const fx of [-0.32, -0.12]) {
          const maquina = box(0.78, 0.44, 0.52, M.aluminio); maquina.position.set(W * fx, bajo + 0.04 + 0.22, -D * 0.12); g.add(maquina);
          const panel = plano(0.62, 0.16, M.bisel); panel.position.set(W * fx, bajo + 0.04 + 0.3, -D * 0.12 + 0.262); g.add(panel);
        }
        const molino = new T.Mesh(own(new T.CylinderGeometry(0.09, 0.07, 0.42, 18)), M.negro); molino.position.set(W * 0.02, bajo + 0.04 + 0.21, -D * 0.15); g.add(molino);
      } else if (m.tipo === 'caja') {
        const brazo = box(0.04, 0.22, 0.04, M.bisel); brazo.position.set(W * 0.22, bajo + 0.04 + 0.11, 0); g.add(brazo);
        const tpv = box(0.36, 0.25, 0.03, M.bisel); tpv.position.set(W * 0.22, bajo + 0.04 + 0.28, 0.02); tpv.rotation.x = -0.35; g.add(tpv);
        const disp = plano(0.32, 0.21, basic({ color: '#16424a' })); disp.position.set(W * 0.22, bajo + 0.04 + 0.285, 0.04); disp.rotation.x = -0.35; g.add(disp);
      } else {
        const urnaH = H - bajo - 0.04;
        const urna = box(W - 0.06, urnaH, D - 0.12, M.cristal); urna.position.y = bajo + 0.04 + urnaH / 2; g.add(urna);
        const balda = box(W - 0.1, 0.015, D - 0.16, C.piedra); balda.position.y = bajo + 0.04 + urnaH * 0.5; g.add(balda);
        const bollos = [C.bollo, C.chocolate, C.bollo, C.verde];
        for (const y of [bajo + 0.05, bajo + 0.05 + urnaH * 0.5]) for (let i = 0; i < 12; i++) {
          const b = box(0.2, 0.07, 0.16, bollos[(i + (y > bajo + 0.1 ? 1 : 0)) % bollos.length]); b.position.set(-W / 2 + 0.35 + i * (W - 0.7) / 11, y + 0.04, 0); g.add(b);
        }
      }
    } else if (m.tipo === 'estanteria') {
      // Estantería de tazas: costados, baldas y tazas blancas y verdes.
      for (const sx of [-1, 1]) { const lado = box(0.03, H, D, C.roble); lado.position.set(sx * (W / 2 - 0.015), H / 2, 0); g.add(lado); }
      const baldas = 5, taza = own(new T.CylinderGeometry(0.045, 0.038, 0.1, 14));
      for (let k = 0; k < baldas; k++) {
        const y = 0.12 + k * (H - 0.2) / (baldas - 1);
        const balda = box(W - 0.06, 0.03, D, C.roble); balda.position.y = y; g.add(balda);
        if (k === baldas - 1) continue;
        const n = Math.floor((W - 0.2) / 0.16);
        for (let i = 0; i < n; i++) { const c = new T.Mesh(taza, i % 4 === 3 ? C.verde : M.blanco); c.position.set(-W / 2 + 0.16 + i * 0.16, y + 0.065, D * 0.1); g.add(c); }
      }
    } else if (m.tipo === 'pilar') {
      const cuerpo = box(W, H, D, mat(TEMA.pared, { roughness: 0.9 })); cuerpo.position.y = H / 2; g.add(cuerpo);
    } else {
      const cuerpo = box(W, H, D, M.negro); cuerpo.position.y = H / 2; g.add(cuerpo);
      if (/foto|retrato|cuadro/i.test(m.nombre || '')) {
        const marco = box(0.3, 0.38, 0.03, mat('#8f8a82')); marco.position.set(0, H + 0.19, -D * 0.2); marco.rotation.x = -0.12; g.add(marco);
        const foto = plano(0.22, 0.29, basic({ color: '#5b5751' })); foto.position.set(0, H + 0.19, -D * 0.2 + 0.017); foto.rotation.x = -0.12; g.add(foto);
      }
    }
    root.add(g); muebles.set(m.id, g);
  }

  // ── Pantallas ──
  const pantallas = new Map();
  let compartido = null;   // mural como un solo lienzo (ponerLienzo); antes del primer ponerMedio
  const loader = new T.TextureLoader(); loader.setCrossOrigin('anonymous');
  function cubrir(t, w, h) { // recorte «cover» de la imagen sobre el panel
    const ia = t.image.width / t.image.height, pa = w / h;
    if (ia > pa) { t.repeat.set(pa / ia, 1); t.offset.set((1 - pa / ia) / 2, 0); } else { t.repeat.set(1, ia / pa); t.offset.set(0, (1 - ia / pa) / 2); }
  }
  for (const p of escena.pantallas) {
    const g = orientado(p.centro[0], p.centro[1], p.centro[2], p.yaw); g.userData.pantalla = p.id; g.userData.pared = p.pared;
    const pantallaMat = basic({ color: '#1c2a33' });
    if (p.portatil) {
      // Portátil sobre su soporte: bisagra en la base de la pantalla, teclado hacia la sala.
      g.position.copy(V(p.centro[0], p.centro[1], p.z));
      const tapa = new T.Group(); tapa.rotation.x = -0.2; g.add(tapa);
      const bisel = box(p.w + 0.012, p.h + 0.012, 0.007, M.bisel); bisel.position.y = p.h / 2; tapa.add(bisel);
      const disp = plano(p.w, p.h, pantallaMat); disp.position.set(0, p.h / 2, 0.0041); tapa.add(disp);
      const base = box(p.w + 0.012, 0.016, 0.245, M.aluminio); base.position.set(0, -0.008, 0.1225); g.add(base);
      const teclas = plano(p.w * 0.82, 0.1, M.bisel); teclas.rotation.x = -Math.PI / 2; teclas.position.set(0, 0.0005, 0.08); g.add(teclas);
      if (p.apoyo) { const soporte = box(0.24, Math.max(0.01, p.z - p.apoyo.alto - 0.016), 0.06, M.aluminio); soporte.position.set(0, -(p.z - p.apoyo.alto) / 2 - 0.008, 0.12); g.add(soporte); }
      const t = lienzo(512, 330, (g2, W, H) => { const gr = g2.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0d3b2c'); gr.addColorStop(1, '#16222b'); g2.fillStyle = gr; g2.fillRect(0, 0, W, H); g2.fillStyle = '#d7efe2'; g2.font = 'bold 40px system-ui'; g2.textAlign = 'center'; g2.fillText(p.corto, W / 2, H / 2 - 10); g2.font = '22px system-ui'; g2.fillStyle = '#9fc4b4'; g2.fillText('pantalla integrada · sin captura publicada', W / 2, H / 2 + 30); });
      pantallaMat.map = t; pantallaMat.color.set('#ffffff'); pantallaMat.needsUpdate = true;
      pantallas.set(p.id, { grupo: g, display: disp, dato: p });
      root.add(g); continue;
    }
    const bisel = box(p.w + 0.016, p.h + 0.016, 0.025, M.bisel); g.add(bisel);
    const disp = plano(p.w, p.h, pantallaMat); disp.position.z = 0.0128; g.add(disp);
    const trasera = box(p.w * 0.45, p.h * 0.4, 0.035, M.bisel); trasera.position.z = -0.03; g.add(trasera);
    if (p.apoyo) {
      const cuello = p.centro[2] - p.apoyo.alto;
      const pie = box(0.05, cuello, 0.03, M.bisel); pie.position.set(0, -cuello / 2, -0.06); g.add(pie);
      const plato = box(0.22, 0.012, 0.18, M.bisel); plato.position.set(0, -cuello + 0.006, -0.03); g.add(plato);
    }
    // Sin captura (vista pública o pantalla sin contenido publicado): rótulo neutro, no un panel negro.
    const neutro = lienzo(p.orientacion === 'vertical' ? 288 : 512, p.orientacion === 'vertical' ? 512 : 288, (g2, W, H) => {
      const gr = g2.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#12333a'); gr.addColorStop(1, '#0b1a20'); g2.fillStyle = gr; g2.fillRect(0, 0, W, H);
      g2.fillStyle = '#78f3ff'; g2.font = 'bold 64px system-ui'; g2.textAlign = 'center'; g2.fillText(p.orientacion === 'vertical' ? 'V' : 'H', W / 2, H / 2);
      g2.fillStyle = '#7f9ea3'; g2.font = '22px system-ui'; g2.fillText(`${String(p.pulgadas).replace('.', ',')}″ · XpaceOS`, W / 2, H / 2 + 40);
    });
    pantallaMat.map = neutro; pantallaMat.color.set('#ffffff');
    const estado = { grupo: g, display: disp, dato: p, mat: pantallaMat, neutro, url: null, video: null, uv0: disp.geometry.attributes.uv.array.slice() };
    pantallas.set(p.id, estado);
    if (p.textura) ponerMedio(p.id, { fuente: 'captura', url: p.textura, tipo: 'imagen' });
    root.add(g);
  }

  // Lo que muestra una pantalla: la captura r2, lo que emite en vivo (imagen o vídeo) o el rótulo
  // neutro. Si el contenido en vivo no se puede pintar (CORS, formato), vuelve a la captura.
  function soltarVideo(e) { if (!e.video) return; try { e.video.pause(); e.video.removeAttribute('src'); e.video.load(); } catch (_) {} e.video = null; }
  function ponerMedio(id, est) {
    const e = pantallas.get(id);
    if (!e || e.dato.portatil) return;
    // Con el mural como un solo lienzo, sólo lo que la pantalla real emite EN VIVO se lo quita;
    // la captura o la falta de señal la devuelven al mural.
    if (compartido && e.lienzoUV) {
      if (!(est && est.fuente === 'vivo' && est.url)) { if (!e.enLienzo) volverAlLienzo(e); return; }
      if (e.enLienzo) { e.enLienzo = false; ponerUV(e, e.uv0); }
    }
    const url = est && est.url;
    if (!url) { if (e.url) { soltarVideo(e); e.url = null; e.mat.map = e.neutro; e.mat.needsUpdate = true; onCambio({ medio: id }); } return; }
    if (e.url === url) return;
    e.url = url;
    const fallo = () => { if (e.url !== url) return; e.url = null; soltarVideo(e); e.mat.map = e.neutro; e.mat.needsUpdate = true; onCambio({ medio: id, error: true, fuente: est.fuente }); if (est.fuente === 'vivo' && e.dato.textura) ponerMedio(id, { fuente: 'captura', url: e.dato.textura, tipo: 'imagen' }); };
    if (est.tipo === 'video') {
      const v = document.createElement('video');
      Object.assign(v, { crossOrigin: 'anonymous', muted: true, playsInline: true, loop: true, preload: 'auto' });
      v.addEventListener('loadedmetadata', () => {
        if (e.url !== url) return;
        if (est.startedAt && Number.isFinite(v.duration) && v.duration > 0) { try { v.currentTime = ((Date.now() - est.startedAt) / 1000) % v.duration; } catch (_) {} }
        const t = own(new T.VideoTexture(v)); t.colorSpace = T.SRGBColorSpace;
        const ia = v.videoWidth / v.videoHeight, pa = e.dato.w / e.dato.h; if (ia > pa) { t.repeat.set(pa / ia, 1); t.offset.set((1 - pa / ia) / 2, 0); } else { t.repeat.set(1, ia / pa); t.offset.set(0, (1 - ia / pa) / 2); }
        soltarVideo(e); e.video = v; e.mat.map = t; e.mat.needsUpdate = true; v.play().catch(() => {}); onCambio({ medio: id, video: true });
      }, { once: true });
      v.addEventListener('error', fallo, { once: true });
      v.src = url;
      return;
    }
    loader.load(url, t => {
      if (e.url !== url) { t.dispose(); return; }
      own(t); t.colorSpace = T.SRGBColorSpace; t.anisotropy = anisotropia; cubrir(t, e.dato.w, e.dato.h);
      soltarVideo(e); e.mat.map = t; e.mat.needsUpdate = true; onCambio({ medio: id, textura: id });
    }, undefined, fallo);
  }
  const hayVideo = () => [...pantallas.values()].some(e => e.video && !e.video.paused);

  // ── Un solo lienzo en varias pantallas (mural doble H de Starbucks) ──
  // Una textura compartida y, en cada pantalla, las UV de su trozo: las seis cambian en el mismo
  // fotograma y la textura se sube una vez. `uvs`: id de pantalla → 8 UV en el orden de PlaneGeometry.
  function ponerUV(e, arr) { const a = e.display.geometry.attributes.uv; a.array.set(arr); a.needsUpdate = true; }
  function volverAlLienzo(e) {
    soltarVideo(e); e.url = null; ponerUV(e, e.lienzoUV);
    e.mat.map = compartido.tex; e.mat.needsUpdate = true; e.enLienzo = true; onCambio({ lienzo: e.dato.id });
  }
  function quitarLienzo() {
    if (!compartido) return;
    const viejo = compartido; compartido = null;
    for (const e of pantallas.values()) {
      if (!e.lienzoUV) continue;
      const estaba = e.enLienzo; delete e.lienzoUV; e.enLienzo = false;
      if (!estaba) continue;
      ponerUV(e, e.uv0); e.mat.map = e.neutro; e.mat.needsUpdate = true;
      if (e.dato.textura) ponerMedio(e.dato.id, { fuente: 'captura', url: e.dato.textura, tipo: 'imagen' });
    }
    viejo.tex.dispose(); resources.delete(viejo.tex); onCambio({ lienzo: false });
  }
  function ponerLienzo(canvas, uvs) {
    quitarLienzo();
    if (!canvas || !uvs || !uvs.size) return 0;
    const tex = own(new T.CanvasTexture(canvas)); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = anisotropia;
    compartido = { tex };
    let n = 0;
    for (const [id, uv] of uvs) {
      const e = pantallas.get(id);
      if (!e || e.dato.portatil || !Array.isArray(uv) || uv.length !== 8) continue;
      e.lienzoUV = uv; volverAlLienzo(e); n++;
    }
    if (!n) quitarLienzo();
    return n;
  }
  const refrescarLienzo = () => { if (compartido) compartido.tex.needsUpdate = true; };
  const enLienzo = () => [...pantallas.values()].filter(e => e.enLienzo).length;

  // ── Players y webcam ──
  const dispositivos = new Map();
  for (const d of escena.dispositivos) {
    if (!d.pos || d.colocacion === 'pantalla') continue;
    const [w, h, dd] = d.tam;
    const g = orientado(d.pos[0], d.pos[1], d.pos[2], d.yaw); g.userData.dispositivo = d.id; g.userData.pared = d.pared;
    if (/webcam|c[aá]mara|insta360/i.test(`${d.nombre} ${d.id}`)) {
      const cuerpo = box(w, h, dd, M.negro); cuerpo.position.y = h / 2; g.add(cuerpo);
      const lente = new T.Mesh(own(new T.CylinderGeometry(0.014, 0.014, 0.01, 20)), M.lente); lente.rotation.x = Math.PI / 2; lente.position.set(0, h / 2, dd / 2 + 0.004); g.add(lente);
      if (d.colocacion === 'sobre-pantalla') { const pinza = box(0.04, 0.03, 0.05, M.negro); pinza.position.set(0, -0.015, -0.01); g.add(pinza); }
    } else {
      const cuerpo = box(w, h, dd, M.aluminio); cuerpo.position.y = h / 2; g.add(cuerpo);
      const frente = plano(w * 0.5, h * 0.25, M.bisel); frente.position.set(0, h * 0.3, dd / 2 + 0.001); g.add(frente);
      const luz = new T.Mesh(own(new T.CircleGeometry(0.003, 10)), basic({ color: '#e9f7ff' })); luz.position.set(w * 0.4, h * 0.3, dd / 2 + 0.002); g.add(luz);
    }
    root.add(g); dispositivos.set(d.id, g);
  }

  // ── Aristas de la sala (lectura del volumen en planta y en órbita) ──
  const pts = [];
  for (const w of escena.paredes) for (const hgt of [0.002, w.alto]) pts.push(V(w.a[0], w.a[1], hgt), V(w.b[0], w.b[1], hgt));
  for (const w of escena.paredes) pts.push(V(w.a[0], w.a[1], 0), V(w.a[0], w.a[1], w.alto));
  const aristas = new T.LineSegments(own(new T.BufferGeometry().setFromPoints(pts)), own(new T.LineBasicMaterial({ color: '#59636a' })));
  root.add(aristas);

  // ── Luz ──
  scene.add(new T.HemisphereLight('#ffffff', '#6b6253', 1.5));
  const sol = new T.DirectionalLight('#fff4e2', 1.1); sol.position.copy(V(-2, -3, 6)); scene.add(sol);
  // Una bombilla en el centro (laboratorio) o varias repartidas a lo largo de la sala (cafetería).
  const nb = Math.max(1, TEMA.bombillas || 1);
  for (let i = 0; i < nb; i++) {
    const bombilla = new T.PointLight('#fff1d6', nb > 1 ? 4.5 : 6, 8, 1.6);
    bombilla.position.copy(V(nb > 1 ? ancho * (i + 0.5) / nb : ancho / 2, fondo / 2, alto - 0.25)); scene.add(bombilla);
  }

  return {
    scene, root, paredes, techo, lampara, pantallas, dispositivos, muebles, ponerMedio, hayVideo,
    ponerLienzo, quitarLienzo, refrescarLienzo, enLienzo,
    dispose() { for (const e of pantallas.values()) soltarVideo(e); for (const r of resources) r.dispose?.(); resources.clear(); },
  };
}
