/* Local PA announcements: one click, three sequential readings; no remote publish. */
(function(root){
  'use strict';
  function createAnnouncements({synthesis,Utterance,generate,Audio,onState=()=>{},duck=()=>()=>{},schedule=setTimeout,unschedule=clearTimeout}={}){
    let revision=0,timer=null,current=null,release=null,audio=null,asset=null,abort=null;
    let state={phase:'idle',completed:0,total:3,language:'es-ES',error:null};
    const emit=()=>onState({...state});
    function cleanup(){if(timer!==null){unschedule(timer);timer=null;}current=null;abort?.abort();abort=null;if(audio){audio.onended=audio.onerror=audio.onplaying=null;audio.pause();audio.removeAttribute?.('src');audio.load?.();audio=null;}asset?.release?.();asset=null;if(release){release();release=null;}}
    function stop(){++revision;cleanup();try{synthesis?.cancel();}catch(_){}state={...state,phase:state.phase==='idle'?'idle':'stopped',error:null};emit();}
    function play(text,{language='es',muted=false,voice='browser'}={}){
      stop();const clean=String(text||'').trim();const token=revision;
      state={phase:'starting',completed:0,total:3,language:voice==='browser'&&language==='en'?'en-US':'es-ES',voice,error:null};
      const fail=error=>{cleanup();state={...state,phase:'error',error};emit();return false;};
      if(!clean)return fail('empty');
      if(muted)return fail('muted');
      if(clean.length>1500)return fail('too_long');
      if(voice!=='browser'){
        if(!['male','female'].includes(voice)||!generate||!Audio)return fail('unsupported');
        abort=new AbortController();state={...state,phase:'generating'};emit();
        const signal=abort.signal;
        Promise.resolve().then(()=>generate(clean,{voice,signal})).then(result=>{
          if(token!==revision){result?.release?.();return;}
          asset=result;audio=new Audio(result.url);
          try{release=duck();}catch(_){}
          function replay(){
            if(token!==revision||!audio)return;
            state={...state,phase:'starting'};emit();audio.currentTime=0;
            audio.onplaying=()=>{if(token===revision){state={...state,phase:'speaking'};emit();}};
            audio.onerror=()=>{if(token===revision)fail('playback');};
            audio.onended=()=>{
              if(token!==revision||!audio)return;
              state={...state,completed:state.completed+1};
              if(state.completed===3){cleanup();state={...state,phase:'done'};emit();}
              else{state={...state,phase:'between'};emit();timer=schedule(()=>{timer=null;replay();},250);}
            };
            Promise.resolve(audio.play()).catch(()=>{if(token===revision)fail('playback');});
          }
          replay();
        }).catch(error=>{if(token===revision)fail(error?.code||'generation');});
        return true;
      }
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
  const doc=root.document,status=doc.getElementById('announcementStatus'),input=doc.getElementById('announcementText'),selector=doc.getElementById('announcementVoice'),login=doc.getElementById('announcementLogin');
  const preference='xpace-announcement-voice-v1';
  try{const saved=root.localStorage.getItem(preference);if(selector&&['male','female','browser'].includes(saved))selector.value=saved;}catch(_){}
  try{const draft=root.sessionStorage.getItem('xpace-announcement-login-draft');if(input&&draft)input.value=draft;root.sessionStorage.removeItem('xpace-announcement-login-draft');}catch(_){}
  login?.addEventListener('click',()=>{try{root.sessionStorage.setItem('xpace-announcement-login-draft',input?.value||'');}catch(_){}});
  selector?.addEventListener('change',()=>{api.stop();try{root.localStorage.setItem(preference,selector.value);}catch(_){}render();});
  let latest={phase:'idle',completed:0,total:3};
  function render(s=latest){
    latest=s;if(!status)return;
    const en=doc.documentElement.lang==='en';
    if(selector){
      const label=doc.getElementById('announcementVoiceLabel');if(label)label.textContent=en?'Announcement voice':'Voz de la locución';
      for(const o of selector.options)o.textContent=o.value==='male'?(en?'Male · David Martín (Spain)':'Masculina · David Martín (España)'):o.value==='female'?(en?'Female · Sara Martín (Spain)':'Femenina · Sara Martín (España)'):(en?'Local browser voice · free':'Voz local del navegador · gratuita');
      const note=doc.getElementById('announcementVoiceNote');if(note)note.textContent=en?'ElevenLabs · high quality. One paid generation, three readings. Sign in to generate.':'ElevenLabs · alta calidad. Una generación de pago, tres lecturas. Inicia sesión para generar.';
    }
    const errors={empty:en?'Write the announcement first.':'Escribe primero el texto de la locución.',muted:en?'Audio is muted. Enable audio and try again.':'El audio está silenciado. Actívalo y vuelve a emitir.',unsupported:en?'Voice playback is unavailable in this browser.':'Este navegador no dispone de lectura por voz.'};
    status.textContent=s.phase==='error'?(errors[s.error]||(en?'Could not play the announcement. Try again.':'No se pudo emitir la locución. Vuelve a intentarlo.')):s.phase==='done'?(en?'Announcement complete · 3/3':'Locución completada · 3/3'):s.phase==='stopped'?(en?'Announcement stopped':'Locución detenida'):['starting','speaking','between'].includes(s.phase)?(en?'Playing announcement · ':'Emitiendo locución · ')+(s.completed+1)+'/3':(en?'Your text will play three times.':'Tu texto sonará tres veces.');
    status.dataset.phase=s.phase;status.dataset.completed=String(s.completed);
    if(s.phase==='generating')status.textContent=en?'Preparing ElevenLabs voice…':'Preparando voz ElevenLabs…';
    if(s.phase==='error'&&s.error==='auth')status.textContent=en?'Sign in to generate with ElevenLabs.':'Inicia sesión para generar con ElevenLabs.';
    if(login){login.hidden=!(s.phase==='error'&&s.error==='auth');login.textContent=en?'Sign in':'Iniciar sesión';login.href='/auth/login?return_to='+encodeURIComponent(root.location.pathname+root.location.search);}
    doc.querySelector('[data-xp-do="mega"]')?.setAttribute('aria-busy',String(['generating','starting','speaking','between'].includes(s.phase)));
  }
  const api=createAnnouncements({synthesis:root.speechSynthesis,Utterance:root.SpeechSynthesisUtterance,Audio:root.Audio,async generate(text,{voice,signal}){
    const res=await root.fetch('/admira-xp/announcement-tts',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice}),signal,redirect:'error'});
    if(!res.ok){const e=new Error('generation');e.code=res.status===401?'auth':'generation';throw e;}
    if(!String(res.headers.get('Content-Type')).startsWith('audio/'))throw new Error('invalid_audio');
    const blob=await res.blob();if(!blob.size)throw new Error('empty_audio');const url=root.URL.createObjectURL(blob);return {url,release:()=>root.URL.revokeObjectURL(url)};
  },onState:render,duck(){
    const saved=['bgMusic','starbucksMusic'].map(id=>doc.getElementById(id)).filter(Boolean).map(audio=>({audio,volume:audio.volume,ducked:Math.min(audio.volume,0.06)}));
    for(const s of saved)s.audio.volume=s.ducked;
    return ()=>{for(const s of saved)if(s.audio.volume===s.ducked)s.audio.volume=s.volume;};
  }});
  root.XpaceAnnouncements={...api,play:(text,opts={})=>api.play(text,{...opts,voice:opts.voice||selector?.value||'browser'})};
  if(input)for(const event of ['keydown','keyup','keypress'])input.addEventListener(event,e=>e.stopPropagation());
  if(root.MutationObserver)new root.MutationObserver(()=>render()).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
  root.addEventListener('pagehide',api.stop);render();
})(typeof window!=='undefined'?window:globalThis);
