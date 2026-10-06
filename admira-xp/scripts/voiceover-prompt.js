/* Experto → Crear contenidos → Crear locución. Una generación ElevenLabs de pago, guardada
   automáticamente en Stock · Megafonía (misma ruta de sesión que Opciones → Locuciones:
   /admira-xp/announcement-tts). El resultado se abre en PREVIOS y no suena hasta pulsar Emitir.
   No usa /megafonia/push: esa cola de Pixeria emite al momento en los gemelos de la tienda.
   Expert → Create media → Create voiceover: one paid generation; result opens in PREVIEWS. */
(function(root){'use strict';const doc=root.document;if(!doc)return;
 const input=doc.getElementById('voiceoverText'),label=doc.getElementById('voiceoverTextLabel'),voiceLabel=doc.getElementById('voiceoverVoiceLabel'),voice=doc.getElementById('voiceoverVoice'),note=doc.getElementById('voiceoverNote'),status=doc.getElementById('voiceoverStatus'),login=doc.getElementById('voiceoverLogin'),button=doc.querySelector('[data-xp-do="voiceGen"]');
 if(!input||!button||!status)return;
 const draftKey='xpace-voiceover-login-draft',preference='xpace-voiceover-voice-v1';
 let busy=false,phase='idle',num=null;
 try{const draft=root.sessionStorage.getItem(draftKey);if(draft)input.value=draft;root.sessionStorage.removeItem(draftKey);}catch(_){}
 try{const saved=root.localStorage.getItem(preference)||root.localStorage.getItem('xpace-announcement-voice-v1');if(voice&&['male','female'].includes(saved))voice.value=saved;}catch(_){}
 voice?.addEventListener('change',()=>{try{root.localStorage.setItem(preference,voice.value);}catch(_){}});
 function render(){
  const en=doc.documentElement.lang==='en',active=root.XpaceAccess?.active();
  if(label)label.textContent=en?'What should the store announce?':'Qué debe decir la locución';
  if(voiceLabel)voiceLabel.textContent=en?'Voice':'Voz';
  if(voice)for(const o of voice.options)o.textContent=o.value==='male'?(en?'Male · James (English)':'Masculina · David Martín (España)'):(en?'Female · Cassidy (English)':'Femenina · Sara Martín (España)');
  input.placeholder=en?'Write the announcement the store will hear…':'Escribe el aviso que sonará en la tienda…';
  if(note)note.textContent=(en?'ElevenLabs · Stock · Public announcements · one paid generation. ':'ElevenLabs · Stock · Megafonía · una generación de pago. ')+(active?(en?'Session active.':'Sesión activa.'):(en?'Connect your Admira account.':'Conecta tu cuenta de Admira.'));
  button.textContent=en?'✨ Generate voiceover (ElevenLabs)':'✨ Generar locución (ElevenLabs)';
  button.title=en?'Generate the voiceover and review it in PREVIEWS before playing':'Generar la locución y revisarla en PREVIOS antes de emitir';
  const messages={idle:en?'Write the announcement, then generate the voiceover.':'Escribe el aviso y genera la locución.',empty:en?'Write the announcement first.':'Escribe primero el texto de la locución.',generating:en?'Generating the voiceover…':'Generando la locución…',archiving:en?'Saving to Stock…':'Guardando en Stock…',auth:en?'Sign in to generate the voiceover.':'Inicia sesión para generar la locución.',error:en?'Could not generate the voiceover. Retry to recover the same job.':'No se pudo generar la locución. Reintenta para recuperar el mismo trabajo.',done:(en?'Saved to Stock · Public announcements':'Guardada en Stock · Megafonía')+(num?' #'+num:'')+(en?'. Review it in PREVIEWS and press Play.':'. Revísala en PREVIOS y pulsa Emitir.')};
  status.textContent=messages[phase]||messages.error;status.dataset.phase=phase;
  button.disabled=busy;button.setAttribute('aria-busy',String(busy));
  if(login){login.hidden=phase!=='auth';login.textContent=en?'Sign in':'Iniciar sesión';login.href='/auth/login?return_to='+encodeURIComponent(root.location.pathname+root.location.search);}
 }
 async function generate(){
  if(busy)return;const text=input.value.trim();if(!text){phase='empty';render();input.focus();return;}
  if(!root.XpaceMedia){phase='error';render();return;}
  busy=true;num=null;phase='generating';render();
  try{
   const chosen=['male','female'].includes(voice?.value)?voice.value:'female',saved=root.XpaceMedia.pending('audio');
   const payload=saved&&saved.payload.text===text&&saved.payload.voice===chosen?saved.payload:{text,voice:chosen,language:doc.documentElement.lang==='en'?'en':'es'};
   const result=await root.XpaceMedia.generate('audio',payload,{onProgress(value){phase=value==='archiving'?'archiving':'generating';render();}});
   root.XpaceMedia.link('audio',result.stock);num=result.stock.num||null;
   const created={...result.stock,title:text,language:payload.language};
   if(root.XpaceExpertPreviews)root.XpaceExpertPreviews.add('voice',created);else root.dispatchEvent(new root.CustomEvent('xpace:media-created',{detail:{kind:'voice',track:created}}));
   phase='done';
  }catch(e){phase=e?.code==='auth'?'auth':'error';}
  finally{busy=false;render();}
 }
 button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();generate();});
 login?.addEventListener('click',()=>{try{root.sessionStorage.setItem(draftKey,input.value);}catch(_){}});
 for(const event of ['keydown','keyup','keypress'])input.addEventListener(event,e=>e.stopPropagation());
 if(root.MutationObserver)new root.MutationObserver(render).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
 root.addEventListener('xpace:session',render);render();
 root.XpaceVoiceoverPrompt={generate};
})(typeof window!=='undefined'?window:globalThis);
