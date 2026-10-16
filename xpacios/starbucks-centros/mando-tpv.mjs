// El mando del TPV del local (Carlos, 16-oct-2026: «en el gemelo digital de Diagonal 634 en calidad Matrix no me
// permite editar la playlist del hilo musical como sí me deja en Paseo de Gracia»). Es el mismo mando del gemelo de
// Paseo de Gràcia (/admira-xp/scripts/music-remote.mjs): Anterior, Escuchar, Siguiente, Lanzar pista y el editor de
// la playlist del local (Añadir desde Stock, Quitar de esta playlist). El editor toma proyecto y local de la
// dirección (?project=starbucks&venue=…), que el visor pone al cambiar de centro. Sin sesión, la lista se ve pero no
// se edita, como en Paseo de Gràcia.
import { mountMusicRemote } from '/admira-xp/scripts/music-remote.mjs?v=local-playlist-349';

export function crearMandoTPV({ doc = document, musica, win = globalThis } = {}) {
  let modal = null, titulo = null, hueco = null, mando = null;
  function montar() {
    if (modal) return;
    modal = doc.createElement('dialog'); modal.className = 'sc-mando'; modal.setAttribute('aria-label', 'Mando del hilo musical');
    modal.innerHTML = '<div class="sc-mando-caja"><header><strong></strong><button class="sc-mando-x" type="button" aria-label="Cerrar">✕</button></header><div class="sc-mando-hueco"></div></div>';
    titulo = modal.querySelector('strong'); hueco = modal.querySelector('.sc-mando-hueco');
    modal.querySelector('.sc-mando-x').addEventListener('click', cerrar);
    modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
    modal.addEventListener('cancel', e => { e.preventDefault(); cerrar(); });
    doc.body.append(modal);
    mando = mountMusicRemote(hueco, { music: musica, win });
    mando.node.open = true;
  }
  function abrir(local = '') {
    montar();
    titulo.textContent = '♪ Hilo musical' + (local ? ' · ' + local : '');
    mando.node.open = true; mando.update();
    try { if (!modal.open) modal.showModal(); } catch { modal.setAttribute('open', ''); }
    return true;
  }
  function cerrar() { if (!modal) return; try { if (modal.open) modal.close(); } catch { modal.removeAttribute('open'); } }
  return { abrir, cerrar, get abierto() { return !!(modal && modal.open); }, get nodo() { return modal; } };
}
