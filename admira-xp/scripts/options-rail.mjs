export const OPTIONS_ICON_WIDTH=52;
export function readableOptionsWidth(rows,{padding=0,border=0,min=104,max=560}={}){
  return Math.min(max,Math.ceil(Math.max(min,...rows.map(row=>row.text+row.icon+row.gap+row.padding+row.border+8))+padding+border));
}
export function optionsWidth(width,readable,max=560){
  return Math.min(max,Math.round(width<readable?OPTIONS_ICON_WIDTH:width));
}

// Only Options changes presentation. Native actions, labels and translation nodes remain intact.
export function attachOptionsRail(panel,{onChange=()=>{},view=panel.ownerDocument.defaultView}={}){
  const doc=panel.ownerDocument,canvas=doc.createElement('canvas'),context=canvas.getContext('2d');
  const buttons=()=>[...panel.querySelectorAll('.qm-acc-head,.xs-link')];
  const px=(css,...keys)=>keys.reduce((n,key)=>n+(parseFloat(css[key])||0),0);
  const labelOf=button=>button.querySelector('.option-label,.xs-option-label');
  function decorate(button){
    if(labelOf(button)||!button.classList.contains('xs-link'))return;
    const label=doc.createElement('span');label.className='xs-option-label';
    label.append(...button.childNodes);
    for(const name of ['data-i18n','data-shell-es','data-shell-en'])if(button.hasAttribute(name)){label.setAttribute(name,button.getAttribute(name));button.removeAttribute(name);}
    const icon=doc.createElement('span');icon.className='xs-option-icon';icon.setAttribute('aria-hidden','true');
    const href=button.getAttribute('href')||'',language=button.id==='langToggle';
    const path=language?'M3 12h18M12 3c-6 6-6 12 0 18M12 3c6 6 6 12 0 18M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18':href.includes('scan')?'M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6M7 7h10v10H7z':href.includes('help')?'M12 17v1M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3M3 3h18v18H3z':href.includes('admira-xp')?'M3 5h18v14H3zM8 23h8M12 19v4':'M3 4h18v16H3zM7 8h10M7 12h10M7 16h6';
    icon.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="${path}"></path></svg>`;
    button.append(icon,label);
  }
  let chrome=null;
  function readable(){
    const css=view.getComputedStyle(panel);
    const list=buttons();
    if(!chrome||!panel.classList.contains('xp-options-icons'))chrome={padding:px(css,'paddingLeft','paddingRight'),border:px(css,'borderLeftWidth','borderRightWidth'),rows:list.map(button=>{const c=view.getComputedStyle(button);return {padding:px(c,'paddingLeft','paddingRight'),border:px(c,'borderLeftWidth','borderRightWidth'),gap:parseFloat(c.columnGap)||8};})};
    const rows=list.map((button,i)=>{
      const label=labelOf(button),style=view.getComputedStyle(button),labelStyle=view.getComputedStyle(label||button);
      context.font=labelStyle.font;
      const text=(label||button).textContent.trim();
      const spacing=parseFloat(labelStyle.letterSpacing)||0;
      return {text:context.measureText(text).width+Math.max(0,text.length-1)*spacing,icon:24,...(chrome.rows[i]||{gap:8,padding:14,border:2})};
    });
    return readableOptionsWidth(rows,{padding:chrome.padding,border:chrome.border,max:Math.max(OPTIONS_ICON_WIDTH,Math.min(560,view.innerWidth-24))});
  }
  function refresh(){
    for(const button of buttons()){
      decorate(button);
      const label=labelOf(button)?.textContent.trim();
      if(label){
        if(!button.title||button.dataset.optionsTitleOwned){button.title=label;button.dataset.optionsTitleOwned='1';}
        if(!button.hasAttribute('aria-label')||button.dataset.optionsLabelOwned){button.setAttribute('aria-label',label);button.dataset.optionsLabelOwned='1';}
      }
    }
    onChange();
  }
  function sync(width){
    panel.classList.toggle('xp-options-icons',width<readable());
  }
  function desired(width){
    const max=Math.max(OPTIONS_ICON_WIDTH,Math.min(560,view.innerWidth-24));
    const result=width==null?readable():Math.min(max,width===OPTIONS_ICON_WIDTH?width:Math.max(readable(),width));
    // A compact rail still opens the actual tool, with enough room for its inputs and previews.
    return panel.querySelector('.qm-acc.open')?Math.max(result,Math.min(320,max)):result;
  }
  const language=new view.MutationObserver(refresh);
  language.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
  const content=new view.MutationObserver(refresh);
  content.observe(panel,{subtree:true,characterData:true,childList:true,attributes:true,attributeFilter:['class']});
  doc.fonts?.ready.then(refresh);
  refresh();
  return {readable,desired,sync,dispose(){language.disconnect();content.disconnect();}};
}
