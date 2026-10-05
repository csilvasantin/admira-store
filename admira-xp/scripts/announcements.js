/* Local PA announcements: one click, three sequential readings; no remote publish. */
(function(root){
  'use strict';
  function createAnnouncements({synthesis,Utterance,onState=()=>{},duck=()=>()=>{},schedule=setTimeout,unschedule=clearTimeout}={}){
    let revision=0,timer=null,current=null,release=null;
    let state={phase:'idle',completed:0,total:3,language:'es-ES',error:null};
    const emit=()=>onState({...state});
    function cleanup(){if(timer!==null){unschedule(timer);timer=null;}current=null;if(release){release();release=null;}}
    function stop(){++revision;cleanup();try{synthesis?.cancel();}catch(_){}state={...state,phase:state.phase==='idle'?'idle':'stopped',error:null};emit();}
    function play(text,{language='es',muted=false}={}){
      stop();const clean=String(text||'').trim();const token=revision;
      state={phase:'starting',completed:0,total:3,language:language==='en'?'en-US':'es-ES',error:null};
      const fail=error=>{cleanup();state={...state,phase:'error',error};emit();return false;};
      if(!clean)return fail('empty');
      if(muted)return fail('muted');
      if(!synthesis||typeof synthesis.speak!=='function'||typeof Utterance!=='function')return fail('unsupported');
      try{release=duck();}catch(_){}
      function next(){
        if(token!==revision)return;
        try{
          const u=new Utterance(clean);current=u;u.lang=state.language;u.rate=0.96;u.pitch=1;u.volume=1;
          const voices=synthesis.getVoices?.()||[];
          const voice=voices.find(v=>v.lang===u.lang)||voices.find(v=>String(v.lang).toLowerCase().startsWith(u.lang.slice(0,2)));
          if(voice)u.voice=voice;
          u.onstart=()=>{if(token===revision&&current===u){state={...state,phase:'speaking'};emit();}};
          u.onend=()=>{
            if(token!==revision||current!==u)return;current=null;
            state={...state,completed:state.completed+1};
            if(state.completed===3){cleanup();state={...state,phase:'done'};emit();}
            else{state={...state,phase:'between'};emit();timer=schedule(()=>{timer=null;next();},250);}
          };
          u.onerror=event=>{if(token===revision&&current===u)fail(event?.error||'speech');};
          state={...state,phase:'starting'};emit();
          synthesis.resume?.();synthesis.speak(u);
        }catch(_){fail('speech');}
      }
      next();return state.phase!=='error';
    }
    return {play,stop,state:()=>({...state})};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createAnnouncements};
  if(!root.document)return;
  const doc=root.document,status=doc.getElementById('announcementStatus'),input=doc.getElementById('announcementText');
  let latest={phase:'idle',completed:0,total:3};
  function render(s=latest){
    latest=s;if(!status)return;
    const en=doc.documentElement.lang==='en';
    const errors={empty:en?'Write the announcement first.':'Escribe primero el texto de la locución.',muted:en?'Audio is muted. Enable audio and try again.':'El audio está silenciado. Actívalo y vuelve a emitir.',unsupported:en?'Voice playback is unavailable in this browser.':'Este navegador no dispone de lectura por voz.'};
    status.textContent=s.phase==='error'?(errors[s.error]||(en?'Could not play the announcement. Try again.':'No se pudo emitir la locución. Vuelve a intentarlo.')):s.phase==='done'?(en?'Announcement complete · 3/3':'Locución completada · 3/3'):s.phase==='stopped'?(en?'Announcement stopped':'Locución detenida'):['starting','speaking','between'].includes(s.phase)?(en?'Playing announcement · ':'Emitiendo locución · ')+(s.completed+1)+'/3':(en?'Your text will play three times.':'Tu texto sonará tres veces.');
    status.dataset.phase=s.phase;status.dataset.completed=String(s.completed);
    doc.querySelector('[data-xp-do="mega"]')?.setAttribute('aria-busy',String(['starting','speaking','between'].includes(s.phase)));
  }
  const api=createAnnouncements({synthesis:root.speechSynthesis,Utterance:root.SpeechSynthesisUtterance,onState:render,duck(){
    const saved=['bgMusic','starbucksMusic'].map(id=>doc.getElementById(id)).filter(Boolean).map(audio=>({audio,volume:audio.volume,ducked:Math.min(audio.volume,0.06)}));
    for(const s of saved)s.audio.volume=s.ducked;
    return ()=>{for(const s of saved)if(s.audio.volume===s.ducked)s.audio.volume=s.volume;};
  }});
  root.XpaceAnnouncements=api;
  if(input)for(const event of ['keydown','keyup','keypress'])input.addEventListener(event,e=>e.stopPropagation());
  if(root.MutationObserver)new root.MutationObserver(()=>render()).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
  root.addEventListener('pagehide',api.stop);render();
})(typeof window!=='undefined'?window:globalThis);
