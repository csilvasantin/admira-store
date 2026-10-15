// Matrix de los centros (Carlos, 15-oct-2026): «https://panorama-viewer-d8j.pages.dev/ es este el modo Matrix
// de Diagonal». En Matrix el visor enseña la foto 360 real del local, con la vista que se guardó en ese visor
// de panoramas (yaw, pitch, fov y la corrección de la esfera, sphereX/sphereY). Mismo renderer que el 3D:
// una esfera vista desde dentro. Arrastrar gira, la rueda o el pellizco acercan (fov de 30 a 100, como allí).
export const FOV_MIN = 30, FOV_MAX = 100;
const rad = d => d * Math.PI / 180;
const limitar = (v, a, b) => Math.min(b, Math.max(a, v));

// Qué imágenes se piden, por orden: la previa (rápida) y la buena que admite la tarjeta gráfica.
export function fuentesPanorama(conf, maxTextura = 4096) {
  if (!conf || !conf.src) return [];
  const buena = maxTextura >= 8192 ? conf.src : (conf.srcMovil || conf.previa || conf.src);
  return [...new Set([conf.previa, buena].filter(Boolean))];
}

export function crearPanorama(T, renderer) {
  const escena = new T.Scene();
  escena.background = new T.Color('#010a06');
  const camara = new T.PerspectiveCamera(FOV_MAX, 1, 0.1, 400);
  const geo = new T.SphereGeometry(100, 128, 64);
  geo.scale(-1, 1, 1); // la foto se ve desde dentro y sin espejo
  const material = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  const esfera = new T.Mesh(geo, material);
  esfera.rotation.order = 'YXZ';
  escena.add(esfera);
  const cargador = new T.TextureLoader();
  cargador.setCrossOrigin('anonymous');
  const vista = { yaw: 0, pitch: 0, fov: FOV_MAX };
  let actual = null, cargada = null;
  // Las pantallas del local sobre la foto (Carlos: «las pantallas no están emitiendo»): un cuadro por pantalla,
  // hijo de la esfera (gira con ella), con el vídeo de su playlist. Esquinas en píxeles de la foto (conf.base).
  const grupo = new T.Group(); esfera.add(grupo);
  const cuadros = new Map();
  const rayo = new T.Raycaster();
  function direccion(x, y, base, r) {
    const fi = 2 * Math.PI * x / base[0], te = Math.PI * y / base[1];
    return [r * Math.cos(fi) * Math.sin(te), r * Math.cos(te), r * Math.sin(fi) * Math.sin(te)];
  }
  function ponerPantallas(lista, base) {
    for (const m of cuadros.values()) { grupo.remove(m); m.geometry.dispose(); m.material.dispose(); if (m.userData.borde) { m.userData.borde.geometry.dispose(); m.userData.borde.material.dispose(); } }
    cuadros.clear();
    if (!Array.isArray(lista) || !base) return;
    for (const p of lista) {
      if (!p || !Array.isArray(p.esquinas) || p.esquinas.length !== 4) continue;
      const v = p.esquinas.map(([x, y]) => direccion(x, y, base, 99));
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(v.flat(), 3));
      g.setAttribute('uv', new T.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
      g.setIndex([0, 3, 1, 1, 3, 2]);
      // Por encima de la foto y en el orden de la lista: el cartel de delante (el verde de 1971) tapa al de detrás.
      const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, side: T.DoubleSide, depthTest: false }));
      m.renderOrder = 1 + cuadros.size;
      m.userData.pantalla = p.id;
      const borde = new T.LineLoop(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(p.esquinas.map(([x, y]) => direccion(x, y, base, 98.9)).flat(), 3)), new T.LineBasicMaterial({ color: '#ffffff', toneMapped: false }));
      borde.visible = false; m.userData.borde = borde;
      grupo.add(m, borde); cuadros.set(p.id, m);
    }
  }

  const textura = src => new Promise((ok, mal) => cargador.load(src, t => {
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);
    ok(t);
  }, undefined, mal));

  async function cargar(conf) {
    if (!conf || !conf.src || actual === conf.src) return;
    actual = conf.src; cargada = null;
    const v = conf.vista || {};
    vista.yaw = Number(v.yaw) || 0; vista.pitch = Number(v.pitch) || 0;
    vista.fov = limitar(Number(v.fov) || FOV_MAX, FOV_MIN, FOV_MAX);
    // Corrección de la esfera del visor de panoramas: inclinación (sphereX) y giro (sphereY), en grados.
    // El centro de la foto queda delante (yaw 0).
    esfera.rotation.set(rad(Number(v.sphereX) || 0), -Math.PI / 2 - rad(Number(v.sphereY) || 0), 0);
    // Las pantallas del mural y las piezas del mostrador (TPV con el hilo musical, iPad con la cola).
    ponerPantallas([...(conf.pantallas || []), ...(conf.piezas || [])], conf.base);
    for (const src of fuentesPanorama(conf, renderer.capabilities.maxTextureSize || 4096)) {
      try {
        const t = await textura(src);
        if (actual !== conf.src) { t.dispose(); return; }
        const vieja = material.map;
        material.map = t; material.needsUpdate = true;
        if (vieja) vieja.dispose();
        cargada = src;
      } catch (e) { console.warn('[starbucks-centros] panorama sin cargar', src, e); }
    }
  }

  function mirar() {
    const y = rad(vista.yaw), p = rad(vista.pitch);
    if (camara.fov !== vista.fov) { camara.fov = vista.fov; camara.updateProjectionMatrix(); }
    camara.lookAt(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p));
  }

  return {
    vista,
    get cargada() { return cargada; },
    cargar,
    // Arrastrar: la foto sigue al dedo (los grados por píxel dependen del zoom).
    girar(dx, dy, alto) {
      const k = vista.fov / Math.max(1, alto);
      vista.yaw -= dx * k;
      vista.pitch = limitar(vista.pitch + dy * k, -85, 85);
    },
    acercar(factor) { vista.fov = limitar(vista.fov * factor, FOV_MIN, FOV_MAX); },
    aspecto(a) { camara.aspect = a; camara.updateProjectionMatrix(); },
    get pantallas() { return [...cuadros.keys()]; },
    // La imagen que toca en cada pantalla (la misma textura de vídeo que en el 3D).
    pintarPantalla(id, textura) { const m = cuadros.get(id); if (m && textura && m.material.map !== textura) { m.material.map = textura; m.material.needsUpdate = true; } },
    resaltar(id) { for (const [k, m] of cuadros) m.userData.borde.visible = k === id; },
    // Qué pantalla hay bajo el puntero (coordenadas normalizadas -1…1), o null.
    elegir(nx, ny) { mirar(); esfera.updateMatrixWorld(true); rayo.setFromCamera(new T.Vector2(nx, ny), camara); const hit = rayo.intersectObjects([...cuadros.values()], false)[0]; return hit ? hit.object.userData.pantalla : null; },
    render() { mirar(); renderer.render(escena, camara); },
  };
}
