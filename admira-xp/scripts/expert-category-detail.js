// One central workspace; existing controls are reparented, never cloned.
(()=>{
  const host=document.getElementById('expertCategoryDetail');
  const heading=document.getElementById('expertControlsLabel');
  if(!host||!heading)return;
  const en=()=>document.documentElement.lang==='en';
  const t=(es,english)=>en()?english:es;
  const sections=new Map();let selected='';
  const panelKeys={telegramSignagePanel:'signage',dvrPanel:'dvr',mupiCamPanel:'dvr',impactsHud:'impactos',metahumanPanel:'avatar3d',percibeOverlay:'perception'};
  const panelSelectors='#telegramSignagePanel,#dvrPanel,#mupiCamPanel,#impactsHud,#metahumanPanel,#percibeOverlay,.distribuit-panel';
  const label=key=>document.querySelector('#expertQuickIcons [data-category-id="'+key+'"] strong')?.textContent||key;
  async function command(text){
    const key=selected,output=section(key).querySelector('.expert-detail-response');
    try{
      let result;
      if(window.XpaceShell?.isAvatarCommand(text)){
        const avatar=await window.XpaceShell.avatarCommand(text);
        result=avatar.message;
      }
      else if(/^\/dvr$/.test(text))result=window.openDVRPanel?.();
      else if(/^\/envivo$/.test(text))result=window.closeDVRPanel?.();
      else if(/^\/AdmiraLive /.test(text))result=window.XpaceExpertActions.setAdmiraLive(text.slice(12));
      else if(/^\/livecam$/.test(text))result=await window.toggleLiveCam?.();
      else if(/^\/(avatar3d|impactos)\b/.test(text))result=await window.xtAPI?.command(text);
      else{
        await window.sendComposerText?.(text);
        result=document.getElementById('telegramLastResponse')?.textContent;
      }
      output.textContent=/^\/inventario\s*$/.test(text)?'':typeof result==='string'?result:result?.message||'';
      dockPanels();
    }catch(error){output.textContent=error.message;}
  }
  function original(key){
    return [...document.querySelectorAll('#advQuickIcons button')].find(b=>window.XpaceExpertCategories.keyFor(b)===key);
  }
  function launch(key){original(key)?.click();dockPanels();}
  function button(parent,es,english,run){
    const b=document.createElement('button');b.type='button';b.textContent=t(es,english);b.dataset.itilEs=es;b.dataset.itilEn=english;
    b.addEventListener('click',run);parent.append(b);return b;
  }
  function field(parent,es,english){
    const l=document.createElement('label');const text=document.createElement('span');text.textContent=t(es,english);text.dataset.itilEs=es;text.dataset.itilEn=english;l.append(text);
    const input=document.createElement('input');input.type='text';l.append(input);parent.append(l);return input;
  }
  function section(key){
    if(sections.has(key))return sections.get(key);
    const s=document.createElement('section');s.dataset.detailCategory=key;s.hidden=key!==selected;host.append(s);sections.set(key,s);
    const actions=document.createElement('div');actions.className='expert-detail-actions';s.append(actions);
    if(key==='creation'){
      const forms=document.getElementById('expertMediaGeneration');if(forms){forms.hidden=false;s.append(forms);}
    }
    if(key==='signage')button(actions,'Abrir playlist','Open playlist',()=>launch(key));
    if(key==='admiralive'){
      const input=field(s,'Texto LED','LED text');
      button(actions,'Aplicar texto','Apply text',()=>{if(input.value.trim())command('/AdmiraLive '+input.value.trim());});
      button(actions,'Apagar','Turn off',()=>command('/AdmiraLive off'));
    }
    if(key==='livecam')button(actions,'Activar / desactivar cámara','Toggle camera',()=>command('/livecam'));
    if(key==='dvr'){
      button(actions,'Abrir reproducción','Open replay',()=>command('/dvr'));
      button(actions,'Volver al directo','Return to live',()=>command('/envivo'));
    }
    if(key==='anonymizer')button(actions,'Abrir Anonymizer en Pixeria','Open Anonymizer in Pixeria',()=>launch(key));
    if(key==='editor')button(actions,'Distribuir muebles','Distribute furniture',()=>command('/cli '+(en()?'distribute':'distribuir')));
    if(key==='avatar3d'){
      button(actions,'Encender tótem','Turn on totem',()=>command('/avatar3d on'));
      button(actions,'Apagar tótem','Turn off totem',()=>command('/avatar3d off'));
      button(actions,'Avatar digital · on','Digital avatar · on',()=>command('/avatar digital on'));
      button(actions,'Avatar digital · off','Digital avatar · off',()=>command('/avatar digital off'));
      button(actions,'Opciones del avatar','Avatar options',()=>window.openMetahumanPanel?.());
    }
    if(key==='impactos'){
      button(actions,'Mostrar audiencia','Show audience',()=>command('/impactos on'));
      button(actions,'Ocultar audiencia','Hide audience',()=>command('/impactos off'));
    }
    if(key==='inventory'){
      button(actions,'Consultar inventario','View inventory',()=>command('/inventario'));
      const input=field(s,'Objeto: número o nombre','Object: number or name');
      button(actions,'Añadir','Add',()=>{if(input.value.trim())command('/inventario añadir '+input.value.trim());});
      button(actions,'Eliminar','Delete',()=>{if(input.value.trim())command('/inventario eliminar '+input.value.trim());});
    }
    if(key==='perception'){
      button(actions,'Abrir percepción','Open perception',()=>window.__PERCIBE?.open());
      button(actions,'Siguiente audiencia','Next audience',()=>window.__PERCIBE?.next());
      button(actions,'Cerrar percepción','Close perception',()=>window.__PERCIBE?.close());
    }
    if(key==='pixerai')button(actions,'Cargar último mueble de Pixeria','Load latest furniture from Pixeria',()=>launch(key));
    const output=document.createElement('div');output.className='expert-detail-response';output.setAttribute('aria-live','polite');s.append(output);
    return s;
  }
  function syncSelection(){
    document.querySelectorAll('#expertQuickIcons [data-category-id]').forEach(b=>{
      const active=b.dataset.categoryId===selected;b.classList.toggle('is-selected',active);
      if(active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');
    });
  }
  function dockPanel(panel){
    const key=panel.id==='impactsHud'&&selected==='dvr'?'dvr':panelKeys[panel.id]||(panel.classList.contains('distribuit-panel')?'editor':'');
    if(!key||!selected||panel.parentElement===section(key))return;
    // Keep the exact nodes, IDs and listeners used by their original tools.
    section(key).append(panel);panel.classList.add('expert-docked-panel');
    if(panel.id==='telegramSignagePanel')document.body.classList.add('expert-signage-docked');
  }
  function dockPanels(){document.querySelectorAll(panelSelectors).forEach(dockPanel);}
  function select(button){
    const key=button.dataset.categoryId;if(!key)return;
    selected=key;heading.textContent=label(key);heading.parentElement.setAttribute('aria-label',label(key));host.hidden=false;
    section(key);for(const [id,s]of sections)s.hidden=id!==key;
    host.closest('.expert-workspace').dataset.activeCategory=key;
    document.dispatchEvent(new CustomEvent('xpace:inventory-select',{detail:{category:key}}));
    syncSelection();dockPanels();
    if(key==='signage'&&!document.querySelector('#telegramDock .send.signage-open'))launch(key);
    if(['inventory','itil'].includes(key)&&!window.XpaceInventoryUI)import('./scripts/inventory-workspace.mjs?v=windows-menu-1').then(()=>{if(selected!==key)return;document.dispatchEvent(new CustomEvent('xpace:inventory-select',{detail:{category:key}}));});
  }
  new MutationObserver(syncSelection).observe(document.getElementById('expertQuickIcons'),{childList:true});
  let pending=false;
  new MutationObserver(records=>{
    if(!selected||pending||!records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.(panelSelectors)||n.querySelector?.(panelSelectors)))))return;
    pending=true;requestAnimationFrame(()=>{pending=false;dockPanels();});
  }).observe(document.body,{childList:true,subtree:true});
  const translateCreation=()=>{for(const node of host.querySelectorAll('[data-itil-es]'))node.textContent=t(node.dataset.itilEs,node.dataset.itilEn);const music=host.querySelector('[data-pixeria-music-create]');if(music)music.href=en()?'https://www.pixeria.com/en/musica.html':'https://www.pixeria.com/musica.html';};
  translateCreation();new MutationObserver(translateCreation).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  host.hidden=true;window.XpaceExpertDetail={select,dockPanels};
})();
