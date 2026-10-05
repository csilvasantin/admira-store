// Reuse the original project and quality controls in the header.
const pickers=[...document.querySelectorAll('#topBar .topbar-picker')];
const value=document.getElementById('topbarQualityValue');
const quality=document.getElementById('visualQualityOptions');
function sync(){
  const selected=quality.querySelector('[aria-pressed="true"]');
  value.textContent=({good:'Good',better:'Better',best:'Best',matrix:'Matrix'})[selected?.dataset.visualMode]||'Good';
  for(const label of document.querySelectorAll('#topBar [data-es][data-en]'))label.textContent=label.dataset[document.documentElement.lang==='en'?'en':'es'];
}
new MutationObserver(sync).observe(quality,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed']});
new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
for(const picker of pickers){
  picker.addEventListener('toggle',()=>{if(picker.open)for(const other of pickers)if(other!==picker)other.open=false;});
  picker.addEventListener('keydown',event=>{if(event.key==='Escape'){picker.open=false;picker.querySelector('summary').focus();event.stopPropagation();}});
  // Keep game keyboard shortcuts out of selector interaction.
  for(const type of ['keydown','keyup','keypress','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend'])picker.addEventListener(type,event=>event.stopPropagation());
}
document.addEventListener('click',event=>{for(const picker of pickers)if(!picker.contains(event.target))picker.open=false;});
quality.addEventListener('click',event=>{if(event.target.closest('[data-visual-mode]'))document.getElementById('topbarQuality').open=false;},true);
sync();
