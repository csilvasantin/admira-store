// Binary controls reflect confirmed runtime state, including CLI changes.
(function(root){
 function mount(button,{label,state,run}){
  let busy=false;
  function sync(){const on=!!state();button.textContent=label()+' · '+(on?'ON':'OFF');button.classList.add('expert-state-toggle');button.dataset.state=on?'on':'off';button.setAttribute('aria-pressed',String(on));}
  button.addEventListener('click',async()=>{if(busy)return;busy=true;button.disabled=true;try{await run(!state());}finally{busy=false;button.disabled=false;sync();}});
  sync();const timer=root.setInterval(sync,400);root.addEventListener('pagehide',()=>root.clearInterval(timer),{once:true});return sync;
 }
 root.XpaceToggle={mount};
})(typeof window==='undefined'?globalThis:window);
