// Reproductor sincronizado de los centros Starbucks: un solo reloj para todas las pantallas de un centro.
//
// Un programa es una secuencia de tramos que se repite (el ciclo). En cada tramo cada pantalla tiene su
// pieza (mural repartido en seis vídeos) o todas comparten una (pieza individual). Las fronteras de los
// tramos son comunes a todas las pantallas: por construcción, las seis cambian de pieza a la vez.
//
// La lógica de tiempos es pura y se prueba en Node; el control de los <video> recibe la fábrica de
// vídeos y el reloj por inyección, así que también se prueba sin navegador.

export const DERIVA = { tolerancia: 0.04, ritmo: 0.25, maxAjuste: 0.08 };
export const PRECARGA_S = 1.5;
export const ESPERA_ARRANQUE_S = 8;
export const REINTENTOS = [1.2, 4];
export const ATASCO_S = 1.5;

/** Misma URL con una marca de intento (para no reutilizar una respuesta fallida guardada). */
export function conIntento(url, n) {
  if (!n) return url;
  const [base, hash = ''] = url.split('#');
  return base + (base.includes('?') ? '&' : '?') + 'intento=' + n + (hash ? '#' + hash : '');
}

const num = v => typeof v === 'number' && Number.isFinite(v);

/** Pieza que toca a una pantalla en un tramo: la suya del mural o la común del tramo individual. */
export function piezaDe(tramo, pantalla) {
  return (tramo && tramo.piezas && tramo.piezas[pantalla]) || (tramo && tramo.pieza) || null;
}

/** Duración provisional de un tramo mientras no se conoce la del medio («medio» = la del vídeo). */
export function segundosDe(tramo) {
  if (num(tramo.segundos) && tramo.segundos > 0) return tramo.segundos;
  if (num(tramo.segundosMedidos) && tramo.segundosMedidos > 0) return tramo.segundosMedidos;
  const pz = tramo.pieza || Object.values(tramo.piezas || {})[0];
  return pz && num(pz.segundos) && pz.segundos > 0 ? pz.segundos : 0;
}

export function cicloDe(programa) {
  return programa.tramos.reduce((s, t) => s + segundosDe(t), 0);
}

/** Dónde cae el instante t (segundos desde el arranque) dentro del ciclo. */
export function tramoEn(programa, t) {
  const ciclo = cicloDe(programa), n = programa.tramos.length;
  const vuelta = Math.floor(t / ciclo);
  const x = t - vuelta * ciclo;
  let inicio = 0;
  for (let i = 0; i < n; i++) {
    const tr = programa.tramos[i], s = segundosDe(tr);
    if (x < inicio + s || i === n - 1) return { indice: i, tramo: tr, inicio, local: x - inicio, segundos: s, restante: inicio + s - x, vuelta, ciclo, t };
    inicio += s;
  }
  return null;
}

/** Inicio (en segundos de ciclo) de cada tramo, para la línea de tiempo. */
export function marcasDe(programa) {
  const ciclo = cicloDe(programa); let a = 0;
  return programa.tramos.map(tr => { const s = segundosDe(tr); const m = { id: tr.id, nombre: tr.nombre, tipo: tr.tipo, desde: a, hasta: a + s, fraccion: s / ciclo }; a += s; return m; });
}

/** Errores que impedirían reproducir el programa sobre las pantallas del modelo. */
export function validarPrograma(programa, pantallasModelo = []) {
  const errores = [];
  if (!programa || !Array.isArray(programa.tramos) || !programa.tramos.length) return ['programa sin tramos'];
  const delModelo = new Set(pantallasModelo.map(s => s.id));
  const asociadas = new Set();
  if (!Array.isArray(programa.asociaciones) || !programa.asociaciones.length) errores.push('programa sin asociaciones pantalla ↔ playlist');
  for (const a of programa.asociaciones || []) {
    if (!a || !a.pantalla) { errores.push('asociación sin pantalla'); continue; }
    if (delModelo.size && !delModelo.has(a.pantalla)) errores.push(`asociación a una pantalla que no está en el modelo: «${a.pantalla}»`);
    if (asociadas.has(a.pantalla)) errores.push(`pantalla asociada dos veces: «${a.pantalla}»`);
    if (!a.canal) errores.push(`asociación de «${a.pantalla}» sin canal`);
    asociadas.add(a.pantalla);
  }
  for (const id of delModelo) if (!asociadas.has(id)) errores.push(`pantalla del modelo sin playlist: «${id}»`);
  for (const tr of programa.tramos) {
    if (!(segundosDe(tr) > 0)) errores.push(`tramo «${tr.id}» sin duración`);
    if (tr.tipo === 'mural' && !tr.piezas) errores.push(`tramo mural «${tr.id}» sin piezas por pantalla`);
    for (const id of asociadas) {
      const pz = piezaDe(tr, id);
      if (!pz || !pz.src) errores.push(`tramo «${tr.id}» sin pieza para «${id}»`);
      else if (!(pz.ancho > 0 && pz.alto > 0)) errores.push(`pieza «${pz.titulo || pz.src}» sin formato`);
    }
  }
  return errores;
}

/**
 * Encaja un medio en el panel sin recortarlo ni deformarlo. Si los aspectos coinciden se ve a
 * resolución nativa (escala 1); si no, se reduce el lado que sobra y quedan bandas, nunca un recorte.
 */
export function ajusteSinRecorte(panel, medio) {
  const pa = panel[0] / panel[1], ma = medio[0] / medio[1];
  if (!(pa > 0 && ma > 0)) return { modo: 'nativo', escala: [1, 1] };
  if (Math.abs(pa - ma) / ma < 0.005) return { modo: 'nativo', escala: [1, 1] };
  return ma > pa ? { modo: 'encaje', escala: [1, pa / ma] } : { modo: 'encaje', escala: [ma / pa, 1] };
}

/** Qué hacer con un vídeo que va desfasado del reloj: nada, ajustar el ritmo o saltar. */
export function correccion(esperado, actual, o = DERIVA) {
  const d = actual - esperado; // > 0: el vídeo va adelantado
  const a = Math.abs(d);
  if (a <= o.tolerancia) return { accion: 'nada', ritmo: 1, deriva: d };
  if (a <= o.ritmo) return { accion: 'ritmo', ritmo: 1 - Math.max(-o.maxAjuste, Math.min(o.maxAjuste, d * 0.5)), deriva: d };
  return { accion: 'salto', objetivo: esperado, ritmo: 1, deriva: d };
}

/**
 * Rehace un programa de pantallas desde el estado vivo del MCP (canal sincroIA): las pistas
 * «pantalla N de 6» van a la pantalla N de la plantilla. Si el estado no encaja, null y se queda la copia.
 */
export function programaDesdeMCP(estado, plantilla) {
  const pl = estado && estado.playlists && estado.playlists[plantilla.fuente && plantilla.fuente.canal || 'sincroIA'];
  const pistas = pl && Array.isArray(pl.tracks) ? pl.tracks : null;
  const n = plantilla.asociaciones.length;
  if (!pistas || pistas.length !== n) return null;
  const orden = p => { const m = /pantalla\s+(\d+)\s+de\s+(\d+)/i.exec(p.title || ''); return m ? Number(m[1]) : NaN; };
  const ordenadas = pistas.map((p, i) => ({ p, n: orden(p), i })).sort((a, b) => (a.n || a.i + 1) - (b.n || b.i + 1));
  if (ordenadas.some(o => !/^https:\/\//.test(o.p.url || ''))) return null;
  const tramo = plantilla.tramos[0];
  const piezas = {};
  plantilla.asociaciones.forEach((a, i) => {
    const p = ordenadas[i].p, previa = piezaDe(tramo, a.pantalla) || {};
    piezas[a.pantalla] = { id: p.stockId || p.id, titulo: p.title, src: p.url, ancho: previa.ancho || 1080, alto: previa.alto || 1920, segundos: previa.segundos, stock: p.stockNumber };
  });
  return {
    ...plantilla,
    revision: estado.revision,
    fuente: { ...plantilla.fuente, revision: estado.revision, actualizado: estado.updatedAt, vivo: true },
    tramos: [{ ...tramo, piezas }, ...plantilla.tramos.slice(1)],
  };
}

export function resolverUrl(src, base) {
  if (/^https?:\/\//.test(src) || !base) return src;
  return new URL(src, base).href;
}

// ───────────────────────────── Control de los vídeos ─────────────────────────────

function videoNavegador(url) {
  const v = document.createElement('video');
  // Muted + playsinline: los navegadores dejan arrancar solo así. crossOrigin: el vídeo va a WebGL.
  Object.assign(v, { crossOrigin: 'anonymous', muted: true, defaultMuted: true, playsInline: true, loop: false, preload: 'auto' });
  v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
  v.src = url;
  return v;
}
const relojNavegador = () => performance.now() / 1000;
const dormir = s => new Promise(r => setTimeout(r, s * 1000));

/**
 * Controla los vídeos de un programa con un reloj maestro.
 * avisar(tipo, datos): 'tramo' | 'medio' | 'error' | 'bloqueado' | 'desbloqueado' | 'aviso' | 'listo'
 */
export function crearReproductor({ programa: original, base = '', crearVideo = videoNavegador, ahora = relojNavegador, avisar = () => {}, precarga = PRECARGA_S, reintentos = REINTENTOS } = {}) {
  const programa = JSON.parse(JSON.stringify(original));
  const pantallas = programa.asociaciones.map(a => a.pantalla);
  const medios = new Map();
  let srcPorTramo = [];
  let reloj = { origen: ahora(), pausado: true, enPausa: 0 };
  let clave = null, bloqueado = false, destruido = false, ultima = null;

  function indexar() {
    srcPorTramo = programa.tramos.map(tr => new Set(pantallas.map(id => piezaDe(tr, id)).filter(Boolean).map(pz => pz.src)));
    for (const tr of programa.tramos) for (const id of pantallas) {
      const pz = piezaDe(tr, id);
      if (pz && pz.src && !medios.has(pz.src)) medios.set(pz.src, crearMedio(pz));
    }
  }

  function crearMedio(pieza) {
    const url = resolverUrl(pieza.src, base);
    const m = { src: pieza.src, url, pieza, video: crearVideo(url), estado: 'cargando', error: null, reintentos: 0, ritmo: 1, deriva: 0, pidiendo: false };
    const on = (ev, fn) => m.video.addEventListener(ev, fn);
    on('loadeddata', () => { if (m.estado !== 'error') { m.estado = 'listo'; avisar('medio', m); } });
    on('waiting', () => { if (m.estado !== 'error') { m.estado = 'esperando'; avisar('medio', m); } });
    on('playing', () => { m.estado = 'reproduciendo'; avisar('medio', m); });
    on('error', () => {
      const codigo = m.video.error ? m.video.error.code : 0;
      // Cualquier fallo de carga se reintenta (dos veces, con espera creciente): un corte de red, una
      // comprobación del navegador o una respuesta fallida en caché no deben dejar una pantalla en negro.
      // La URL cambia un poco en cada intento para no reutilizar esa respuesta. Si sigue, se avisa.
      if (m.reintentos < reintentos.length) {
        const espera = reintentos[m.reintentos++];
        m.estado = 'cargando'; avisar('aviso', { m, motivo: `reintento ${m.reintentos} (error ${codigo})` });
        setTimeout(() => {
          if (destruido) return;
          m.video.src = conIntento(url, m.reintentos); m.video.load && m.video.load();
          // Al volver, que el reloj la recoloque: se fuerza un nuevo «entrar» en el siguiente tick.
          clave = null;
        }, espera * 1000);
        return;
      }
      m.estado = 'error'; m.error = codigo; avisar('error', m);
    });
    return m;
  }

  const t = () => (reloj.pausado ? reloj.enPausa : ahora() - reloj.origen);
  const duracionDe = m => (num(m.video.duration) && m.video.duration > 0 ? m.video.duration : (m.pieza.segundos || Infinity));
  const fijar = (m, s) => { try { m.video.currentTime = Math.max(0, s); } catch { /* aún sin metadatos */ } };

  function intentarPlay(m) {
    if (m.pidiendo || m.estado === 'error' || destruido) return;
    m.pidiendo = true;
    let p; try { p = m.video.play(); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(() => {
      m.pidiendo = false;
      if (bloqueado) { bloqueado = false; avisar('desbloqueado'); }
    }, e => {
      m.pidiendo = false;
      if (e && e.name === 'NotAllowedError') { if (!bloqueado) { bloqueado = true; avisar('bloqueado'); } }
      else if (e && e.name !== 'AbortError') avisar('aviso', { m, motivo: String(e && e.message || e) });
    });
  }

  function entrar(pos) {
    const activos = srcPorTramo[pos.indice];
    for (const [src, m] of medios) if (!activos.has(src) && !m.video.paused) m.video.pause();
    for (const src of activos) {
      const m = medios.get(src), objetivo = Math.min(pos.local, duracionDe(m) - 0.04);
      m.ultimoCambio = ahora(); m.ultimoT = undefined; // el vigilante cuenta desde que entra
      // Si la pieza ya espera en su sitio (precargada), no se vuelve a saltar: el corte es inmediato.
      if (Math.abs(m.video.currentTime - objetivo) > 0.05) fijar(m, objetivo);
      if (!reloj.pausado) intentarPlay(m);
    }
    avisar('tramo', pos);
  }

  function gobernar(m, local) {
    if (m.estado === 'error' || reloj.pausado) return;
    const dur = duracionDe(m);
    if (local >= dur - 0.05) return; // la pieza ya acabó: se queda en su último fotograma
    // Vigilante: un vídeo activo que no avanza en 1,5 s (salto que no termina, búfer vacío) se recoloca;
    // si le pasa tres veces seguidas, se recarga.
    const s = ahora();
    if (m.video.currentTime !== m.ultimoT) { m.ultimoT = m.video.currentTime; m.ultimoCambio = s; m.atascos = 0; }
    else if (s - (m.ultimoCambio ?? s) > ATASCO_S && local < dur - 0.3) {
      m.ultimoCambio = s; m.atascos = (m.atascos || 0) + 1;
      if (m.atascos >= 3) { m.atascos = 0; m.video.src = conIntento(m.url, 10 + (m.recargas = (m.recargas || 0) + 1)); m.video.load && m.video.load(); clave = null; }
      else { fijar(m, local + 0.05); try { m.video.pause(); } catch { /* */ } intentarPlay(m); }
      avisar('aviso', { m, motivo: 'vídeo parado: se recoloca' });
      return;
    }
    if (m.video.paused) intentarPlay(m);
    if (m.video.readyState < 2 || m.video.seeking) return;
    const c = correccion(local, m.video.currentTime);
    m.deriva = c.deriva;
    if (c.accion === 'salto') fijar(m, local + 0.03);
    const r = c.accion === 'ritmo' ? c.ritmo : 1;
    if (m.ritmo !== r) { m.video.playbackRate = r; m.ritmo = r; }
  }

  // La pieza siguiente espera en su primer fotograma: al cambiar de tramo no hay negro.
  function preparar(m) {
    if (m && m.estado !== 'error' && m.video.paused && !m.video.seeking && m.video.currentTime > 0.01) fijar(m, 0);
  }

  function tick() {
    if (destruido) return ultima;
    const pos = tramoEn(programa, t());
    const k = pos.vuelta * programa.tramos.length + pos.indice;
    ultima = pos; // antes de avisar: quien escuche el cambio de tramo ya ve el tramo nuevo
    if (k !== clave) { clave = k; entrar(pos); }
    const activos = srcPorTramo[pos.indice];
    for (const src of activos) gobernar(medios.get(src), pos.local);
    if (pos.restante < precarga) {
      const sig = srcPorTramo[(pos.indice + 1) % programa.tramos.length];
      for (const src of sig) if (!activos.has(src)) preparar(medios.get(src));
    }
    return pos;
  }

  function reproducir() {
    if (!reloj.pausado) return;
    reloj = { ...reloj, origen: ahora() - reloj.enPausa, pausado: false };
    clave = null; tick();
  }
  function pausar() {
    if (reloj.pausado) return;
    reloj = { ...reloj, enPausa: t(), pausado: true };
    for (const m of medios.values()) { if (!m.video.paused) m.video.pause(); if (m.ritmo !== 1) { m.video.playbackRate = 1; m.ritmo = 1; } }
  }
  function irA(segundos) {
    const s = Math.max(0, segundos);
    if (reloj.pausado) reloj = { ...reloj, enPausa: s }; else reloj = { ...reloj, origen: ahora() - s };
    clave = null; tick();
    if (reloj.pausado) { const pos = tramoEn(programa, s); for (const src of srcPorTramo[pos.indice]) { const m = medios.get(src); fijar(m, Math.min(pos.local, duracionDe(m) - 0.04)); } }
  }
  const reiniciar = () => irA(0);
  function siguiente() { const pos = tramoEn(programa, t()); irA(pos.t + pos.restante + 0.001); }

  /** Arranque: espera a que las piezas del primer tramo puedan reproducirse (o un máximo) y arranca a la vez. */
  async function iniciar(espera = ESPERA_ARRANQUE_S) {
    const listo = (m, nivel) => new Promise(res => {
      if (m.video.readyState >= nivel || m.estado === 'error') return res();
      const fin = () => { m.video.removeEventListener('canplay', fin); m.video.removeEventListener('loadedmetadata', fin); m.video.removeEventListener('error', fin); res(); };
      m.video.addEventListener(nivel >= 3 ? 'canplay' : 'loadedmetadata', fin); m.video.addEventListener('error', fin);
    });
    // Tramos con «segundos: medio»: la duración es la del vídeo (la menor, para que acaben juntos).
    const porMedio = programa.tramos.filter(tr => tr.segundos === 'medio');
    if (porMedio.length) {
      await Promise.race([Promise.all(porMedio.flatMap(tr => pantallas.map(id => medios.get(piezaDe(tr, id).src))).map(m => listo(m, 1))), dormir(espera)]);
      for (const tr of porMedio) {
        const d = pantallas.map(id => medios.get(piezaDe(tr, id).src)).map(m => m.video.duration).filter(x => num(x) && x > 0);
        if (d.length) tr.segundos = Math.min(...d);
      }
    }
    const primeros = [...srcPorTramo[0]].map(s => medios.get(s));
    await Promise.race([Promise.all(primeros.map(m => listo(m, 3))), dormir(espera)]);
    if (destruido) return;
    irA(0); reproducir();
    avisar('listo', estado());
  }

  function medioDe(pantalla) {
    const pos = ultima || tramoEn(programa, t());
    const pz = piezaDe(pos.tramo, pantalla);
    return pz ? medios.get(pz.src) : null;
  }

  function estado() {
    const pos = ultima || tramoEn(programa, t());
    return {
      t: t(), ciclo: cicloDe(programa), pos, pausado: reloj.pausado, bloqueado,
      pantallas: pantallas.map(id => { const m = medioDe(id); return { id, pieza: m && m.pieza, estado: m && m.estado, deriva: m && m.deriva, ritmo: m && m.ritmo }; }),
      errores: [...medios.values()].filter(m => m.estado === 'error').map(m => ({ src: m.src, codigo: m.error, titulo: m.pieza.titulo })),
    };
  }

  function desbloquear() { bloqueado = false; const pos = tramoEn(programa, t()); for (const src of srcPorTramo[pos.indice]) intentarPlay(medios.get(src)); }

  function destruir() {
    destruido = true;
    for (const m of medios.values()) { try { m.video.pause(); m.video.removeAttribute && m.video.removeAttribute('src'); m.video.load && m.video.load(); } catch { /* ya liberado */ } }
  }

  indexar();
  return { programa, medios, pantallas, tick, iniciar, reproducir, pausar, reiniciar, siguiente, irA, medioDe, estado, desbloquear, destruir, get pausado() { return reloj.pausado; }, get bloqueado() { return bloqueado; } };
}
