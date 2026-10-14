// Página de Starbucks Paseo de Gracia: pone el mural doble H como un solo lienzo en cuanto el
// gemelo está listo (evento xpacio:listo de gemelo.mjs) y lo anima a FPS fotogramas por segundo
// mientras la pestaña se ve. Lo que una pantalla real emita en vivo (espejo de admira.tv, con
// sesión) manda sobre el lienzo: lo decide escena3d.mjs.
import { CAMPANA_STARBUCKS_SIX, FPS, instalacionDe, repartoPantallas, uvDeRect, crearMural } from './mural.mjs?v=mural-1';

const reducido = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

async function montar(api) {
  const { escena, s3d, invalidar, status, t } = api;
  let campana;
  try {
    const r = await fetch(CAMPANA_STARBUCKS_SIX, { cache: 'no-store', credentials: 'omit' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    campana = await r.json();
  } catch (e) { status(t('Mural: no se pudo leer la campaña starbucks-six de admira.studio', 'Mural: the starbucks-six campaign could not be read from admira.studio') + ` (${e.message})`); return; }
  const ins = instalacionDe(campana, 'starbucks-six');
  const reparto = repartoPantallas(escena.pantallas, ins);
  if (!reparto) { status(t('Mural: las pantallas del plano no casan con la instalación starbucks-six', 'Mural: the plan screens do not match the starbucks-six installation')); return; }
  const mural = await crearMural(campana, ins);
  const uvs = new Map([...reparto].map(([id, rect]) => [id, uvDeRect(rect, ins.width, ins.height)]));
  const n = s3d.ponerLienzo(mural.canvas, uvs);
  if (!n) return;
  const vistas = document.getElementById('vistas');
  const boton = document.createElement('button');
  boton.type = 'button'; boton.id = 'mural-play';
  vistas?.append(boton);
  let animando = !reducido(), timer = null, t0 = performance.now();
  const pie = t(`Mural · «${campana.name || 'starbucks-six'}» como un solo lienzo en las ${n} pantallas · aproximación del gemelo`, `Mural · “${campana.name || 'starbucks-six'}” as one canvas across the ${n} screens · twin approximation`);
  const fotograma = () => { mural.pintar((performance.now() - t0) / 1000); s3d.refrescarLienzo(); invalidar(); };
  function poner(on) {
    animando = on;
    boton.textContent = on ? t('❚❚ Mural', '❚❚ Mural') : t('▶ Mural', '▶ Mural');
    boton.setAttribute('aria-pressed', String(on));
    boton.title = on ? t('Pausar el mural', 'Pause the mural') : t('Animar el mural como un solo lienzo', 'Play the mural as one canvas');
    clearInterval(timer); timer = null;
    if (on && document.visibilityState === 'visible') timer = setInterval(fotograma, 1000 / FPS);
  }
  boton.addEventListener('click', () => poner(!animando));
  document.addEventListener('visibilitychange', () => poner(animando));
  if (!animando) { mural.pintar(6); s3d.refrescarLienzo(); invalidar(); }
  poner(animando);
  document.getElementById('gemelo')?.setAttribute('data-mural', String(n));
  status(pie);
}

if (window.XpacioGemelo) montar(window.XpacioGemelo);
else document.addEventListener('xpacio:listo', e => montar(e.detail), { once: true });
