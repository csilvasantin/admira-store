// Placeholder animado de un formato Altadis (misión DCL-d7966deb02734a6f34beb54e): mientras el
// equipo de contenido no publica el MP4 adaptado, o si el vídeo falla el día de la demo, las
// pantallas del formato enseñan un lienzo con el nombre y los píxeles del formato, con una
// barra que lo cruza y un contador de tiempo: en un videowall se ve que las pantallas van
// sincronizadas (es un solo lienzo, como el vídeo). Mismas proporciones que el formato.
//
// La parte pura (tamaño del lienzo, posición de la barra, textos) va separada del dibujo para
// probarla sin navegador.

export const LADO_MAX = 1024;   // px del lado largo del canvas: nítido en el 3D y ligero de subir
export const CICLO_S = 6;       // la barra cruza el lienzo en 6 s
export const FPS = 25;

/** Tamaño del canvas: la proporción del formato con el lado largo a LADO_MAX como mucho. */
export function tamanoPlaceholder(ancho, alto, max = LADO_MAX) {
  if (!(ancho > 0 && alto > 0)) throw new Error('El formato necesita ancho y alto');
  const k = Math.min(1, max / Math.max(ancho, alto));
  return { ancho: Math.max(1, Math.round(ancho * k)), alto: Math.max(1, Math.round(alto * k)), escala: k };
}

/** Dónde va la barra (0..1 del ancho, o del alto si el formato es más alto que ancho) en el segundo t. */
export function barrido(t, ciclo = CICLO_S) {
  return (((t % ciclo) + ciclo) % ciclo) / ciclo;
}

/** Contador mm:ss.d del segundo t (lo que enseña cada pantalla para ver que van a una). */
export function reloj(t) {
  const s = Math.max(0, t), m = Math.floor(s / 60), r = s - m * 60;
  return `${String(m).padStart(2, '0')}:${r.toFixed(1).padStart(4, '0')}`;
}

/**
 * Textos del placeholder en el idioma pedido. `motivo`: 'error' (el vídeo falló: no se dice «en
 * preparación»), 'lento' (llegando) o el de que aún no hay vídeo publicado.
 */
export function rotulos(formato, idioma = 'es', motivo = null) {
  const en = idioma === 'en';
  const estado = motivo === 'error' ? (en ? 'video unavailable · format animation' : 'vídeo no disponible · animación del formato')
    : motivo === 'lento' ? (en ? 'loading the adapted video…' : 'cargando el vídeo adaptado…')
    : (en ? 'adapted content coming soon' : 'contenido adaptado en preparación');
  return { nombre: formato.nombre, pixeles: `${formato.ancho} × ${formato.alto} px`, pie: `${formato.fps || 25} fps · ${estado}` };
}

/**
 * Crea el canvas del placeholder. `pintar(t)` dibuja el fotograma del segundo t. Sin
 * imágenes ni red: no puede fallar por CORS el día de la demo.
 */
export function crearPlaceholder(formato, { doc = globalThis.document, idioma = 'es', motivo = null, recortes = [] } = {}) {
  const { ancho: W, alto: H, escala } = tamanoPlaceholder(formato.ancho, formato.alto);
  const canvas = doc.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d');
  const txt = rotulos(formato, idioma, motivo);
  const tumbado = H > W * 1.6;   // góndola LED 64 × 384: el texto va girado
  const largo = tumbado ? H : W, corto = tumbado ? W : H;
  function pintar(t) {
    const gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, '#0d3b36'); gr.addColorStop(0.55, '#10262e'); gr.addColorStop(1, '#1d1530');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // Cuadrícula de 10 % para leer la escala, y las juntas de las pantallas del formato.
    g.strokeStyle = 'rgba(120,243,255,.10)'; g.lineWidth = 1;
    for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(i * W / 10, 0); g.lineTo(i * W / 10, H); g.moveTo(0, i * H / 10); g.lineTo(W, i * H / 10); g.stroke(); }
    g.strokeStyle = 'rgba(255,200,103,.55)'; g.lineWidth = Math.max(1, Math.round(corto / 160));
    for (const r of recortes) g.strokeRect(r.x * escala + 0.5, r.y * escala + 0.5, r.w * escala - 1, r.h * escala - 1);
    // La barra que cruza todo el lienzo: en un videowall pasa de una pantalla a la siguiente.
    const b = barrido(t), bw = Math.max(2, largo * 0.06);
    const luz = tumbado ? g.createLinearGradient(0, b * H - bw, 0, b * H + bw) : g.createLinearGradient(b * W - bw, 0, b * W + bw, 0);
    luz.addColorStop(0, 'rgba(120,243,255,0)'); luz.addColorStop(0.5, 'rgba(120,243,255,.55)'); luz.addColorStop(1, 'rgba(120,243,255,0)');
    g.fillStyle = luz;
    if (tumbado) g.fillRect(0, b * H - bw, W, bw * 2); else g.fillRect(b * W - bw, 0, bw * 2, H);
    // Textos centrados (girados en un formato muy vertical).
    g.save();
    g.translate(W / 2, H / 2);
    if (tumbado) g.rotate(-Math.PI / 2);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const f1 = Math.max(8, Math.min(corto * 0.3, largo * 0.075));
    g.fillStyle = '#eafff8'; g.font = `800 ${Math.round(f1)}px system-ui, sans-serif`;
    g.fillText(txt.nombre, 0, -f1 * 0.45, largo * 0.92);
    const f2 = Math.max(7, f1 * 0.48);
    g.fillStyle = '#78f3ff'; g.font = `600 ${Math.round(f2)}px ui-monospace, Menlo, monospace`;
    g.fillText(`${txt.pixeles} · ${reloj(t)}`, 0, f1 * 0.45, largo * 0.92);
    if (corto >= 120) { g.fillStyle = 'rgba(234,255,248,.7)'; g.font = `500 ${Math.round(f2 * 0.8)}px system-ui, sans-serif`; g.fillText(txt.pie, 0, f1 * 0.45 + f2 * 1.3, largo * 0.92); }
    g.restore();
  }
  pintar(0);
  return { canvas, pintar, ancho: W, alto: H };
}
