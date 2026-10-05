// Local presentation only: buttons still forward to their existing actions.
(()=>{
  const paths={
    creation:'<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2zM20 3v4M18 5h4"/>',
    megafonia:'<path d="M3 9h5l11-5v16l-11-5H3zM8 15l2 6H6l-2-6M8 9v6M22 9v6"/>',
    music:'<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
    video:'<rect x="3" y="4" width="18" height="16" rx="1"/><path d="m10 8 6 4-6 4z"/>',
    avatar:'<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M12 3v3M2 10v6M22 10v6M8 16h8"/><circle cx="8" cy="11" r="1"/><circle cx="16" cy="11" r="1"/>',
    counter:'<rect x="3" y="5" width="18" height="15" rx="1"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2v3H7M14 14h3l-3 3h3"/>',

    unitree:'<path d="M9 3h6v5H9zM12 8v3M6 12h12M8 11v7M16 11v7M8 18l-2 3M16 18l2 3M4 12v5M20 12v5"/>',
    templates:'<rect x="7" y="7" width="14" height="14" rx="1"/><path d="M17 7V3H3v14h4M11 11h6M11 15h6"/>',
    save:'<path d="M4 3h13l4 4v14H3V3zM7 3v6h9V3M7 21v-8h10v8M13 5v2"/>',
    presentation:'<rect x="3" y="4" width="18" height="13" rx="1"/><path d="m10 8 5 3-5 3zM12 17v4M7 21h10"/>',
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
  const iconMarkup=key=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">'+(paths[key]||paths.signage)+'</svg>';
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
    icon.innerHTML=iconMarkup(key);
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
  if(typeof window!=='undefined')window.XpaceExpertCategories={decorate,keyFor,iconMarkup};
  if(typeof document!=='undefined')document.querySelectorAll('[data-options-icon]').forEach(icon=>{icon.innerHTML=iconMarkup(icon.dataset.optionsIcon);});
})();
