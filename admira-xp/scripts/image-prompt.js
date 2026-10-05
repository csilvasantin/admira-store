/* Inline advertising brief; existing PixerIA generation remains authoritative. */
(function(root){
  'use strict';
  const doc=root.document;if(!doc)return;
  const input=doc.getElementById('imagePrompt'),label=doc.getElementById('imagePromptLabel'),note=doc.getElementById('imagePromptNote'),status=doc.getElementById('imagePromptStatus'),login=doc.getElementById('imagePromptLogin'),button=doc.querySelector('[data-xp-do="imgGen"]');
  const draftKey='xpace-image-login-draft';
  try{const draft=root.sessionStorage.getItem(draftKey);if(input)input.value=draft||root.XpaceMedia?.pending('image')?.payload.text||input.value;root.sessionStorage.removeItem(draftKey);}catch(_){}
  login?.addEventListener('click',()=>{try{root.sessionStorage.setItem(draftKey,input?.value||'');}catch(_){}});
  let busy=false,phase='idle',result='';
  function render(){
    const en=doc.documentElement.lang==='en';
    if(label)label.textContent=en?'What do you want to advertise?':'Qué quieres anunciar';
    if(note){const active=root.XpaceAccess?.active();note.textContent=en?'PixerIA · Stock · one paid generation. '+(active?'Session active.':'Connect your Admira account.'):'PixerIA · Stock · una generación de pago. '+(active?'Sesión activa.':'Conecta tu cuenta de Admira.');}
    if(input)input.placeholder=en?'Describe the product, offer or announcement to display…':'Describe el producto, oferta o anuncio que quieres mostrar…';
    if(status){status.dataset.phase=phase;status.textContent=phase==='generating'?(en?'Generating the advertising image…':'Generando la imagen del anuncio…'):phase==='auth'?(en?'Sign in to generate the image.':'Inicia sesión para generar la imagen.'):phase==='empty'?(en?'Write what you want to advertise first.':'Escribe primero qué quieres anunciar.'):phase==='error'?(en?'Could not generate the image. Try again.':'No se pudo generar la imagen. Vuelve a intentarlo.'):phase==='result'?result:(en?'Write what you want to advertise, then generate the image.':'Escribe lo que quieres anunciar y genera la imagen.');}
    if(login){login.hidden=phase!=='auth';login.textContent=en?'Sign in':'Iniciar sesión';login.href='/auth/login?return_to='+encodeURIComponent(root.location.pathname+root.location.search);}
    if(button){button.disabled=busy;button.setAttribute('aria-busy',String(busy));}
  }
  root.XpaceImagePrompt={async generate(provider){
    if(busy)return;
    const text=String(input?.value||'').trim();
    if(!text){phase='empty';render();input?.focus();return;}
    busy=true;phase='generating';render();
    try{result=String(await provider(text)||'');phase=['Sign in to generate the image.','Inicia sesión para generar la imagen.'].includes(result)?'auth':['Could not generate the image. Try again.','No se pudo generar la imagen. Vuelve a intentarlo.'].includes(result)?'error':'result';}catch(_){phase='error';}
    finally{busy=false;render();}
  }};
  if(input)for(const event of ['keydown','keyup','keypress'])input.addEventListener(event,e=>e.stopPropagation());
  if(root.MutationObserver)new root.MutationObserver(render).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
  root.addEventListener('xpace:session',render);
  render();
})(typeof window!=='undefined'?window:globalThis);
