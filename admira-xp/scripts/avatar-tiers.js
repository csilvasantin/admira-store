/* avatar-tiers.js — Avatar de la escena: Good (Admirito) · Better (Luna) · Best (Neo) (Carlos, 7-oct-2026).
 * Experto → Avatar3D: tres interruptores Good / Better / Best, cada uno con su estado ON/OFF.
 * CLI: /avatar good|better|best on|off  ·  /avatar good|better|best a secas alterna (ON↔OFF).
 * Alias: avatar|admirito = good · human|luna = better · metahuman|neo = best.
 *
 * Exclusivos: el tótem es UNA pantalla, así que solo un avatar está ON a la vez. Encender uno apaga el
 * anterior y, si el tótem estaba en modo interactivo (quiosco), lo pasa a avatar (Tótem · OFF) para que
 * se vea. Apagar el que está ON deja la pantalla del tótem sin avatar (negra); /totem on vuelve al
 * quiosco y /totem off (o encender cualquier nivel) devuelve el avatar.
 * Matrix · Starbucks: la pared junto a la salida (matrix-wall-avatar.mjs) lee el nivel de
 * sessionStorage «admira-avatar:nivel-elegido» y el apagado de localStorage «xpace:avatar-escena».
 * Good/Better/Best 8-32 bits: pin web del tótem (DS_PIN.metahuman) vía setAvatar3dTotem().
 * El «Avatar digital» (asistente flotante del cargador común) es independiente y no cambia. */
(function(){
  'use strict';
  const OFF_KEY='xpace:avatar-escena';            // 'off' = sin avatar en el tótem
  const TIER_KEY='xpace:avatar-escena-nivel';     // último nivel elegido (good|better|best)
  const CHOICE_KEY='admira-avatar:nivel-elegido'; // el que lee la pared de Matrix (sessionStorage)
  const TIERS=['good','better','best'];
  const ALIAS={good:'good',avatar:'good',admirito:'good',better:'better',human:'better',luna:'better',best:'best',metahuman:'best',neo:'best'};
  const NAMES={good:'Admirito',better:'Luna',best:'Neo'};
  const LABEL={good:'Good',better:'Better',best:'Best'};
  const en=()=>{ try{ return typeof lang!=='undefined'&&lang==='en'; }catch(_){ return String(document.documentElement.lang||'').startsWith('en'); } };
  const T=(es,english)=>en()?english:es;
  function get(store,key){ try{ return window[store].getItem(key)||''; }catch(_){ return ''; } }
  function put(store,key,value){ try{ if(value==null) window[store].removeItem(key); else window[store].setItem(key,value); }catch(_){} }
  function chosen(){ const v=get('localStorage',TIER_KEY); return TIERS.includes(v)?v:''; }
  function sceneOff(){ return get('localStorage',OFF_KEY)==='off'; }
  function totemOn(){ try{ return !!(window.XpaceTotem&&window.XpaceTotem.on()); }catch(_){ return false; } }
  function matrix(){ try{ return !!(window.XpaceMatrixOptions&&window.XpaceMatrixOptions.isActive()&&window.XpaceStarbucksDemo); }catch(_){ return false; } }
  function pin(){ try{ return (typeof DS_PIN==='object'&&DS_PIN)?DS_PIN['metahuman']:null; }catch(_){ return null; } }
  function tierOf(url){ const u=String(url||''); return /metahuman\.html/.test(u)?'best':/best\.html/.test(u)?'better':/(nube|better)\.html/.test(u)?'good':''; }
  // Nivel visible en el tótem ahora mismo ('' = ninguno: tótem en modo interactivo o avatar apagado).
  function active(){
    if(totemOn()||sceneOff()) return '';
    if(matrix()){
      let st=null; try{ st=window.XpaceMatrixOptions.avatarState(); }catch(_){}
      if(!st||st.mode==='kiosk'||st.off) return '';
      return TIERS.includes(st.level)?st.level:(chosen()||'good');
    }
    const p=pin();
    if(!p||p.kind!=='web'||p.kiosk||!/digitalavatar\.ai\//.test(p.src||'')) return '';
    return tierOf(p.src);
  }
  function emit(){ try{ window.dispatchEvent(new CustomEvent('xpace:avatar-tier',{detail:{active:active(),chosen:chosen(),off:sceneOff()}})); }catch(_){} }
  function toast(msg){ try{ if(typeof showEv==='function') showEv(msg,'#00a862'); }catch(_){} }
  function set(tier,on){
    tier=ALIAS[String(tier||'').toLowerCase()];
    if(!tier) return {ok:false,message:T('Nivel desconocido. Usa good, better o best.','Unknown level. Use good, better or best.')};
    const name=LABEL[tier]+' · '+NAMES[tier];
    if(on){
      put('localStorage',TIER_KEY,tier); put('sessionStorage',CHOICE_KEY,tier); put('localStorage','admira-avatar:nivel',tier);
      put('localStorage',OFF_KEY,null);
      // El tótem enseña una sola cosa: si estaba en modo interactivo (quiosco), pasa a avatar.
      if(totemOn()){ try{ window.XpaceTotem.set(false); }catch(_){} }
      if(!matrix()){
        let ok=false; try{ ok=typeof setAvatar3dTotem==='function'&&setAvatar3dTotem(true); }catch(_){}
        if(!ok){ emit(); return {ok:false,message:T('No hay tótem en este Xpacio (o el DVR está en replay).','No totem in this Xpace (or the DVR is replaying).')}; }
      }
      // Matrix: la cámara mira al tótem, como hacía /avatar good|better|best con la burbuja del cargador.
      if(matrix()){ try{ window.XpaceMatrixOptions.focusAvatar(); }catch(_){} }
      emit(); toast('🧑‍🚀 '+name+' · ON');
      return {ok:true,message:'🧑‍🚀 '+name+' · ON — '+T('en el tótem de la escena. Los otros dos niveles quedan OFF.','on the scene totem. The other two levels are OFF.')};
    }
    if(active()!==tier){ return {ok:true,message:name+' · OFF '+T('(ya estaba apagado).','(already off).')}; }
    put('localStorage',OFF_KEY,'off');
    if(!matrix()){ const p=pin(); if(p&&!p.kiosk&&/digitalavatar\.ai\//.test(p.src||'')){ try{ setAvatar3dTotem(false); }catch(_){} } }
    emit(); toast(name+' · OFF');
    return {ok:true,message:name+' · OFF — '+T('el tótem queda sin avatar. /avatar '+tier+' on lo devuelve; /totem on pone el quiosco.','the totem has no avatar now. /avatar '+tier+' on brings it back; /totem on shows the kiosk.')};
  }
  function toggle(tier){ tier=ALIAS[String(tier||'').toLowerCase()]; return set(tier,active()!==tier); }
  const RX=/^\/avatar\s+(good|better|best|avatar|admirito|human|luna|metahuman|neo)(?:\s+(on|off|encender|apagar|toggle))?\s*$/i;
  // «/digital avatar on» y «/digital on» (orden invertida) → /avatar digital on|off del asistente.
  const DIGITAL=/^\/?digital(?:\s+avatar)?(?:\s+(on|off))?\s*$/i;
  function match(text){ return RX.test(String(text||'').trim()); }
  function command(text){
    const m=String(text||'').trim().match(RX); if(!m) return null;
    const v=(m[2]||'').toLowerCase();
    if(!v||v==='toggle') return toggle(m[1]);
    return set(m[1],v==='on'||v==='encender');
  }
  // Mismo adaptador que /avatar digital: el compositor nativo, __xtExec y Experto pasan por XpaceShell.
  function hook(){
    const S=window.XpaceShell; if(!S||S.__avatarTiers||typeof S.avatarCommand!=='function') return !!(S&&S.__avatarTiers);
    const isAvatar=S.isAvatarCommand, avatarCommand=S.avatarCommand;
    S.isAvatarCommand=function(text){ return match(text)||DIGITAL.test(String(text||'').trim())||isAvatar.call(S,text); };
    S.avatarCommand=async function(text){
      const clean=String(text||'').trim();
      if(match(clean)){ const r=command(clean); return {ok:!!r.ok,local:true,kind:'avatar-tier',message:r.message}; }
      const d=clean.match(DIGITAL); if(d) return avatarCommand.call(S,'/avatar digital'+(d[1]?' '+d[1].toLowerCase():''));
      return avatarCommand.call(S,text);
    };
    S.__avatarTiers=true; return true;
  }
  if(!hook()){ document.addEventListener('DOMContentLoaded',hook,{once:true}); let n=0; const iv=setInterval(()=>{ if(hook()||++n>60) clearInterval(iv); },500); }
  // /totem off devuelve el avatar a la pantalla (si estaba apagado).
  window.addEventListener('xpace:totem-mode',e=>{ if(e&&e.detail&&e.detail.on===false&&sceneOff()){ put('localStorage',OFF_KEY,null); emit(); } });
  // La pared de Matrix lee el nivel de sessionStorage (por pestaña): se siembra con la elección recordada.
  if(chosen()&&!get('sessionStorage',CHOICE_KEY)) put('sessionStorage',CHOICE_KEY,chosen());
  window.XpaceAvatarTiers={tiers:TIERS.slice(),names:Object.assign({},NAMES),active,chosen,off:sceneOff,set,toggle,command,match,keys:{off:OFF_KEY,tier:TIER_KEY,choice:CHOICE_KEY}};
})();
