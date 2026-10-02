// Local presentation only: buttons still forward to their existing actions.
(()=>{
  const paths={
    signage:'<rect x="3" y="4" width="18" height="13" rx="1"/><path d="M9 21h6M12 17v4M6 8h12M6 11h7"/>',
    admiralive:'<path d="M3 14h3l3-7 5 11 3-8 2 4h2M3 4h18M3 21h18"/>',
    livecam:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/><circle cx="9" cy="12" r="2"/>',
    dvr:'<path d="M4 7v5h5M4 12a8 8 0 1 1 2 6M12 7v5l3 2"/>',
    anonymizer:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 10h8M8 14h8M12 8v8"/>',
    editor:'<path d="M4 4h16v16H4zM4 12h8V4M12 12h8M12 12v8M7 17h2M16 7h2"/>',
    avatar3d:'<path d="m12 3 8 5v8l-8 5-8-5V8zM4 8l8 5 8-5M12 13v8"/><circle cx="12" cy="7" r="1"/>',
    impactos:'<path d="M4 4v16h17M8 16v-4M13 16V7M18 16v-7M7 8l5-4 7 2"/>',
    inventory:'<path d="m4 7 8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10M8 5l8 4"/>',
    perception:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    itil:'<rect x="5" y="4" width="14" height="17" rx="1"/><path d="M9 3h6v3H9zM8 10h1M12 10h4M8 14h1M12 14h4M8 18h1M12 18h4"/>',
    pixerai:'<path d="M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4"/><circle cx="15" cy="8" r="1"/>'
  };
  function keyFor(button){
    const command=(button.dataset.quickCommand||'').replace(/^\//,'').split(/\s/)[0].toLowerCase();
    return button.id==='advInventoryCli'?'inventory':button.id==='advPercibeBtn'?'perception':button.dataset.quickAction||({envivo:'dvr',impactos:'impactos'})[command]||command;
  }
  function decorate(button,{en=false,preserveId=false}={}){
    const key=keyFor(button);
    const oldLabel=button.querySelector('strong')?.textContent||'';
    const label=key==='perception'?(en?'Perception':'Percepción'):key==='anonymizer'?'Anonymizer':oldLabel.replace(/^[^\p{L}\p{N}]+/u,'').trim();
    const status=(button.querySelector('.expert-category-status')||button.querySelector('span'))?.textContent||'';
    const icon=document.createElement('span');icon.className='expert-category-icon';icon.setAttribute('aria-hidden','true');
    icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">'+(paths[key]||paths.signage)+'</svg>';
    const text=document.createElement('span');text.className='expert-category-text';
    const name=document.createElement('strong');name.textContent=label;
    const detail=document.createElement('span');detail.className='expert-category-status';detail.textContent=status;
    text.append(name,detail);button.replaceChildren(icon,text);
    button.classList.add('expert-category');button.dataset.categoryId=key;
    button.setAttribute('aria-label',label+(status?' · '+status:''));
    // Toggle state is inherited; do not invent a pressed state for launch actions.
    if(button.classList.contains('is-active'))button.setAttribute('aria-pressed','true');
    button.title=button.title||label+(status?' — '+status:'');
    if(!preserveId)button.removeAttribute('id');return button;
  }
  window.XpaceExpertCategories={decorate,keyFor};
})();
