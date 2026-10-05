/* Inline advertising brief; existing PixerIA generation remains authoritative. */
(function(root){
  'use strict';
  const doc=root.document;if(!doc)return;
  const input=doc.getElementById('imagePrompt'),label=doc.getElementById('imagePromptLabel'),status=doc.getElementById('imagePromptStatus'),button=doc.querySelector('[data-xp-do="imgGen"]');
  let busy=false,phase='idle',result='';
  function render(){
    const en=doc.documentElement.lang==='en';
    if(label)label.textContent=en?'What do you want to advertise?':'Qué quieres anunciar';
    if(input)input.placeholder=en?'Describe the product, offer or announcement to display…':'Describe el producto, oferta o anuncio que quieres mostrar…';
    if(status){status.dataset.phase=phase;status.textContent=phase==='generating'?(en?'Generating the advertising image…':'Generando la imagen del anuncio…'):phase==='empty'?(en?'Write what you want to advertise first.':'Escribe primero qué quieres anunciar.'):phase==='error'?(en?'Could not generate the image. Try again.':'No se pudo generar la imagen. Vuelve a intentarlo.'):phase==='result'?result:(en?'Write what you want to advertise, then generate the image.':'Escribe lo que quieres anunciar y genera la imagen.');}
    if(button){button.disabled=busy;button.setAttribute('aria-busy',String(busy));}
  }
  root.XpaceImagePrompt={async generate(provider){
    if(busy)return;
    const text=String(input?.value||'').trim();
    if(!text){phase='empty';render();input?.focus();return;}
    busy=true;phase='generating';render();
    try{result=String(await provider(text)||'');phase='result';}catch(_){phase='error';}
    finally{busy=false;render();}
  }};
  if(input)for(const event of ['keydown','keyup','keypress'])input.addEventListener(event,e=>e.stopPropagation());
  if(root.MutationObserver)new root.MutationObserver(render).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
  render();
})(typeof window!=='undefined'?window:globalThis);
