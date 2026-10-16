// El mando del TPV del local (Carlos, 16-oct-2026: «en el gemelo digital de Diagonal 634 en calidad Matrix no me
// permite editar la playlist del hilo musical como sí me deja en Paseo de Gracia»). Es el mismo mando del gemelo de
// Paseo de Gràcia (/admira-xp/scripts/music-remote.mjs): Anterior, Escuchar, Siguiente, Lanzar pista y el editor de
// la playlist del local (Añadir desde Stock, Quitar de esta playlist). El editor toma proyecto y local de la
// dirección (?project=starbucks&venue=…), que el visor pone al cambiar de centro. Sin sesión, la lista se ve pero no
// se edita, como en Paseo de Gràcia.
// Foco (Carlos, 16-oct-2026: «pon un botón que sea foco y ponga el tpv centrado en el fondo en primer plano, como
// hacemos con el kiosko… un botón pequeño a la izquierda de Hilo musical · con el nombre del centro»): ◎ lleva la
// vista al TPV y aparta el mando a un lado para verlo; otra vez, vuelve donde estaba.
import { mountMusicRemote } from '/admira-xp/scripts/music-remote.mjs?v=local-playlist-349';
import { hacerMovible } from './movible.mjs?v=sc-movible-2';

export function crearMandoTPV({ doc = document, musica, win = globalThis, alEnfocar = null } = {}) {
  let modal = null, titulo = null, hueco = null, mando = null, foco = null, enFoco = false, movil = null;
  function ponerFoco(on) {
    enFoco = !!on && !!alEnfocar;
    if (modal) modal.classList.toggle('sc-mando--foco', enFoco);
    if (foco) { foco.setAttribute('aria-pressed', String(enFoco)); foco.title = enFoco ? 'Volver a la vista de antes' : 'Foco: el TPV en el centro, de cerca'; }
  }
  function montar() {
    if (modal) return;
    modal = doc.createElement('dialog'); modal.className = 'sc-mando'; modal.setAttribute('aria-label', 'Mando del hilo musical');
    modal.innerHTML = '<div class="sc-mando-caja"><header><button class="sc-mando-foco" type="button" aria-label="Foco: el TPV en el centro, de cerca" aria-pressed="false">◎</button><strong></strong><button class="sc-mando-x" type="button" aria-label="Cerrar">✕</button></header><div class="sc-mando-hueco"></div></div>';
    titulo = modal.querySelector('strong'); hueco = modal.querySelector('.sc-mando-hueco'); foco = modal.querySelector('.sc-mando-foco');
    foco.hidden = !alEnfocar;
    foco.addEventListener('click', () => { const on = !enFoco; ponerFoco(on); alEnfocar(on); });
    modal.querySelector('.sc-mando-x').addEventListener('click', cerrar);
    modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
    modal.addEventListener('cancel', e => { e.preventDefault(); cerrar(); });
    doc.body.append(modal);
    mando = mountMusicRemote(hueco, { music: musica, win });
    mando.node.open = true;
    // Se mueve por la cabecera y cambia de tamaño por la esquina, como las demás ventanas.
    movil = hacerMovible(modal.querySelector('.sc-mando-caja'), modal.querySelector('header'), { clave: 'sc-mando-tpv-v1', win });
    // Quitar cada canción: la papelera va a la izquierda del título (centros.css), con su nombre al pasar el ratón.
    const titular = () => hueco.querySelectorAll('[data-playlist-remove]:not([title])').forEach(b => { b.title = 'Quitar de esta playlist (Stock conserva el contenido)'; });
    new MutationObserver(titular).observe(hueco, { childList: true, subtree: true }); titular();
  }
  function abrir(local = '') {
    montar();
    titulo.textContent = '♪ Hilo musical' + (local ? ' · ' + local : ''); ponerFoco(false);
    mando.node.open = true; mando.update(); movil.restaurar();
    try { if (!modal.open) modal.showModal(); } catch { modal.setAttribute('open', ''); }
    return true;
  }
  // Al cerrar, la vista se queda donde esté (como el foco del quiosco).
  function cerrar() { if (!modal) return; ponerFoco(false); try { if (modal.open) modal.close(); } catch { modal.removeAttribute('open'); } }
  return { abrir, cerrar, get abierto() { return !!(modal && modal.open); }, get enFoco() { return enFoco; }, get nodo() { return modal; } };
}
