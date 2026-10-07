// Decorate the original controls: IDs, listeners and language updates stay intact.
(()=>{
 const host=document.querySelector('#advancedStreamControls .expert-primary-actions');
 if(!host)return;
 const icons={telegramSendBtn:'send',telegramHideBtn:'localview',advancedRetailRules:'rules','xtore-window-entry':'livecam','xtore-expert-close':'close'};
 const paths={send:'<path d="m3 3 18 9-18 9 4-9zM7 12h14"/>',localview:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',rules:'<path d="M5 3v6h14v6M5 9v12M2 18l3 3 3-3M16 12l3 3 3-3"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>'};
 function refresh(){
  const en=document.documentElement.lang==='en';
  for(const button of host.querySelectorAll('button')){
   const key=icons[button.id];if(!key)continue;
   if(button.querySelector('.expert-category-icon'))continue;
   const label=button.id==='xtore-expert-close'?(en?'Close Expert':'Cerrar Experto'):button.id==='advancedRetailRules'?'IF · THEN · DO':button.textContent.trim();
   const name=document.createElement('strong');name.textContent=label;button.replaceChildren(name);
   button.dataset.quickAction=key;
   window.XpaceExpertCategories.decorate(button,{en,preserveId:true});
   if(paths[key])button.querySelector('.expert-category-icon').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">'+paths[key]+'</svg>';
  }
 }
 new MutationObserver(refresh).observe(host,{childList:true,subtree:true,characterData:true});
 new MutationObserver(()=>{
  const button=document.getElementById('xtore-expert-close');
  if(button){button.textContent=document.documentElement.lang==='en'?'Close Expert':'Cerrar Experto';}
  refresh();
 }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 refresh();
})();
