(() => {
  const root = typeof self !== 'undefined' ? self : window;
  if (root.XTANCO_RUNTIME_CONFIG) return;
  root.XTANCO_RUNTIME_CONFIG = {
    elgato: {
      proxyPort: 9124,
      directIp: '',
      directPort: 9123,
    },
    hue: {
      bridgeIP: '',
      apiKey: '',
      lights: {
        despacho: 9,
        comedor: 8,
      },
      enabled: true,
    },
    telegram: {
      proxyPort: 9124,
      enabled: true,
      proxyUrl: 'https://admira-telegram-bridge.csilvasantin.workers.dev',
      polling: true,
      defaultChatId: '',
    },
    grok: {
      proxyPort: 9124,
      enabled: true,
      proxyUrl: 'https://admira-grok-proxy.csilvasantin.workers.dev',
      // The worker auto-picks Gemini (free) when GEMINI_API_KEY is set, and falls
      // back to xAI Grok otherwise. The model name shown in the UI reflects the
      // free-tier default; the actual model used is reported via /health.
      model: 'gemini-2.5-flash',
    },
    tube: {
      // Public Tailscale Funnel mapped to elgato-proxy (yt-dlp) on the Mac Mini.
      // Setup: `tailscale funnel --bg --set-path=/admira http://127.0.0.1:9126`
      // Then run elgato-proxy.js with `XTANCO_PORT=9126`.
      proxyUrl: 'https://macmini.tail48b61c.ts.net/admira',
      enabled: true,
    },
    occupancy: {
      // Aforo real del punto: la cámara Hikvision (people-counting) hace POST a
      // ieu.ai, que expone el estado en /api/ocuppancy. El juego lo lee y "respira"
      // con la gente real (G.peopleOverride = ocupación real).
      // NOTA: ieu.ai debe permitir CORS desde este origen
      // (Access-Control-Allow-Origin) o el navegador bloqueará la lectura.
      enabled: true,
      // Worker proxy (CORS) que re-sirve ieu.ai/api/ocuppancy. El navegador no
      // puede leer ieu.ai directo (no es zona Cloudflare, sin Access-Control-*),
      // así que el aforo-proxy lo expone con CORS desde *.workers.dev.
      url: 'https://aforo-proxy.csilvasantin.workers.dev/',
      pollMs: 5000,
      // Modo de arranque (conmutable en caliente con /aforo real|exacto|fake):
      //   'real'   → la cámara marca el objetivo de clientes (ambiente).
      //   'exacto' → espejo estricto 1:1: la tienda = exactamente lo que dice la cámara.
      //   'fake'   → spawn aleatorio del juego (cámara ignorada).
      // El badge del HUD siempre muestra lo que dice la cámara.
      mode: 'real',
    },
  };
})();

/* ===========================================================================
 * Cargador XPL (lenguaje de reglas + señalización condicional)
 * ---------------------------------------------------------------------------
 * Se inyecta desde aquí (fichero estable) y NO desde index.html, porque el
 * index.html lo regenera el sync del gemelo y borraría los <script>. Este
 * config sí lo carga siempre el gemelo, así que XPL sobrevive a los syncs.
 * Carga en orden: runtime → adapter del gemelo → compositor.
 * ========================================================================= */
(() => {
  if (typeof document === 'undefined') return;
  const root = typeof self !== 'undefined' ? self : window;
  if (root.__XPL_LOADER) return; root.__XPL_LOADER = true;
  // Captura la etiqueta de equipo (?device=) ANTES de que el gemelo limpie la URL,
  // para que el registro de gemelos del backoffice muestre el nombre del equipo.
  try { var dp = new URLSearchParams(location.search).get('device'); if (dp) localStorage.setItem('xpl_device', dp); } catch (e) {}
  const V = '?v=24';
  // xpl-stock.js (resolver del Stock real) va ANTES del adapter: showContent lo usa.
  // megafonia.js + hilomusical.js: enlace pixeria→gemelo (audio); autónomos, no tocan el juego.
  ['scripts/xpl-runtime.js', 'scripts/xpl-stock.js', 'scripts/xpl-gemelo.js', 'scripts/xpl-composer.js', 'scripts/megafonia.js', 'scripts/hilomusical.js', 'scripts/canalkiosk-door.js', 'scripts/anonimizado-control.js'].forEach((src) => {
    const s = document.createElement('script');
    s.src = src + V; s.async = false; // async=false → ejecuta en orden de inserción
    document.head.appendChild(s);
  });
})();
