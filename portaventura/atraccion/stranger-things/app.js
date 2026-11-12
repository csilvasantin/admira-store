(function(){var cur="en";function set(l){if(l!=="es")l="en";cur=l;document.documentElement.lang=l;
document.querySelectorAll("[data-en]").forEach(function(n){n.innerHTML=n.getAttribute("data-"+l)});
var b=document.getElementById("langbtn");if(b){var o=l==="en"?"es":"en";b.textContent=o.toUpperCase();b.setAttribute("aria-label",o==="es"?"Cambiar a español":"Switch to English");b.title=b.getAttribute("aria-label")}
document.querySelectorAll("nav a, a.btn").forEach(function(a){var h=a.getAttribute("href");if(h&&!/^(https?:|#)/.test(h))a.setAttribute("href",h.split("?")[0]+(l==="es"?"?lang=es":""))});
try{sessionStorage.setItem("nv-lang",l)}catch(e){}}
var q=new URLSearchParams(location.search).get("lang"),s=null;try{s=sessionStorage.getItem("nv-lang")}catch(e){}
set(q||s||"en");var b=document.getElementById("langbtn");window.nvSetLang=set})();
/* Expert mode (frontend only): ` key or >_ button opens a bottom CLI. Only navigates/changes UI inside this site. */
(function(){var root=(document.querySelector("nav[data-root]")||{}).getAttribute?document.querySelector("nav").getAttribute("data-root")||"":"";
var P={studio:"./",st:"stranger-things",squid:"squid-game",wed:"wednesday",arcadia:"arcadia",pilot:"dia-visitante",tech:"tech"};
var L=["01-signage","02-studio","03-hilomusical","04-digital-twin","05-park-app","06-dashboard"];
var CMDS=["help","go studio","go st","go squid","go wed","go arcadia","go pilot","/english","/spanish","clear","exit","ask studio","ask st","ask squid","ask wed","ask arcadia"];
var bar=document.createElement("div");bar.id="xbar";bar.hidden=true;
bar.innerHTML='<div id="xout" aria-live="polite"></div><form id="xform"><span>&gt;_</span><input id="xin" autocomplete="off" spellcheck="false" aria-label="Command" placeholder="help · go st · /spanish (Tab = autocomplete, Esc = close)"></form>';
document.body.appendChild(bar);var inp=bar.querySelector("#xin"),out=bar.querySelector("#xout"),hist=[],hi=0;
function say(t){var d=document.createElement("div");d.textContent=t;out.appendChild(d);out.scrollTop=1e6}
function lang(){return document.documentElement.lang==="es"?"es":"en"}
function nav(h,l){location.href=root+h+((l||lang())==="es"?"?lang=es":"")}
function open_(){bar.hidden=false;inp.focus();try{sessionStorage.setItem("nv-x","1")}catch(e){}if(!out.childNodes.length)say("Expert mode. Type 'help'.")}
function close_(){bar.hidden=true;try{sessionStorage.removeItem("nv-x")}catch(e){}}
function run(c){c=c.trim().toLowerCase().replace(/\s+/g," ");if(!c)return;say("> "+c);hist.push(c);hi=hist.length;var a=c.split(" ");
if(a[0]==="help")say("go studio|st|squid|wed|arcadia|pilot · /english · /spanish · ask studio|st|squid|wed|arcadia <question> · clear · exit");
else if(a[0]==="go"&&P[a[1]])nav(P[a[1]]);
else if(/^\/?(english|spanish)$/.test(a[0])){var l=a[0].indexOf("span")>=0?"es":"en";window.nvSetLang(l);say("Language: "+(l==="es"?"Spanish":"English"))}
else if(a[0]==="ask"){var D={studio:"Glimmo",st:"Flicker",squid:"Dot",wed:"Inkling",arcadia:"Pebble"};if(!D[a[1]])say("Usage: ask studio|st|squid|wed|arcadia <question>");else say(D[a[1]]+" (demo): Hi! I am the "+a[1]+" zone assistant. This is a fixed demo answer, not connected to any agent yet.")}
else if(a[0]==="layer"&&/^[1-6]$/.test(a[1]))nav("tech/"+L[a[1]-1]);
else if(a[0]==="clear")out.innerHTML="";
else if(a[0]==="exit")close_();
else say("Unknown command. Type 'help'.")}
bar.querySelector("#xform").onsubmit=function(e){e.preventDefault();run(inp.value);inp.value=""};
inp.onkeydown=function(e){if(e.key==="Tab"){e.preventDefault();var v=inp.value.trim().toLowerCase(),m=CMDS.filter(function(x){return x.indexOf(v)===0});
if(m.length===1)inp.value=m[0];else if(m.length)say(m.join(" · "))}else if(e.key==="Escape")close_();
else if(e.key==="ArrowUp"&&hi>0){inp.value=hist[--hi];e.preventDefault()}else if(e.key==="ArrowDown"){inp.value=hist[++hi]||"";if(hi>hist.length)hi=hist.length}};
document.addEventListener("keydown",function(e){var t=e.target.tagName;if((e.key==="`"||e.code==="Backquote")&&t!=="INPUT"&&t!=="TEXTAREA"){e.preventDefault();bar.hidden?open_():close_()}});
var xb=document.getElementById("xbtn");if(xb)xb.onclick=function(){bar.hidden?open_():close_()};window.nvX={open:open_,close:close_};
try{if(sessionStorage.getItem("nv-x"))open_()}catch(e){}})();
/* Retícula cuadrática: left Options sidebar, right Advanced panel, resizable expert bar. Built in JS so every page shares one source. */
(function(){var nv=document.querySelector("nav[data-root]");var root=nv?nv.getAttribute("data-root")||"":"";
function T(en,es){return '<span data-en="'+en+'" data-es="'+es+'">'+(document.documentElement.lang==="es"?es:en)+'</span>'}
function href(h){return root+h+(document.documentElement.lang==="es"?"?lang=es":"")}
var pth=location.pathname.replace(/\/+$/,""),inTech=/\/netflix\/tech(\/|$)/.test(pth),here=(inTech?pth.split("/netflix/tech")[1]:pth.split("/netflix")[1]||"").replace(/^\//,"")||"index";
var css=document.createElement("style");css.textContent=
"body{padding-left:var(--sbw,56px);padding-right:var(--apw,0px);padding-bottom:var(--xh,0px);transition:padding-left .2s,padding-right .2s}"+
"#sb,#ap{position:fixed;top:0;bottom:var(--xh,0px);z-index:40;background:#0b0b0bf5;border:0 solid #222;overflow:auto;font:14px 'Helvetica Neue',Arial,sans-serif;transition:width .2s}"+
"#sb{left:0;width:var(--sbw,56px);border-right-width:1px}#ap{right:0;width:240px;border-left-width:1px}#ap[hidden]{display:none}"+
"#sb button,#sb a,#ap button{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:11px 16px;background:none;border:0;color:#ddd;text-decoration:none;text-align:left;font:inherit;cursor:pointer;white-space:nowrap}"+
"#sb button:hover,#sb a:hover,#ap button:hover{background:#1c1c1c}#sb a.on{color:#fff;box-shadow:inset 3px 0 #E50914}#sb .i{width:24px;text-align:center;flex:none;font-size:18px}"+
"#sb .l{overflow:hidden}body.sbc #sb .l,body.sbc #sb .sub{display:none}#sb .sub{background:#050505}#sb .sub a{padding-left:52px;font-size:13px}#sb .sub[hidden]{display:none}"+
"#sb .h,#ap .h{padding:10px 16px;color:#888;font-size:11px;letter-spacing:.1em;text-transform:uppercase}body.sbc #sb .h{visibility:hidden}"+
"#xbar{display:flex;flex-direction:column;height:var(--xh,220px);box-sizing:border-box}#xbar[hidden]{display:none}#xout{flex:1;overflow:auto;max-height:none!important}"+
"#xgrip{height:10px;cursor:ns-resize;touch-action:none;display:flex;justify-content:center;align-items:center;flex:none}#xgrip:before{content:'';width:48px;height:4px;border-radius:2px;background:#555}"+
"#xtools{position:absolute;right:8px;top:12px;display:flex;gap:6px}#xtools button{background:#111;color:#9f9;border:1px solid #333;border-radius:4px;cursor:pointer;font:inherit;padding:2px 8px}"+
"nav{z-index:30}@media(max-width:700px){body{padding-left:0}body.sbo #sb{width:240px}body:not(.sbo) #sb{width:0;border:0}#sbt{position:fixed;left:8px;bottom:calc(var(--xh,0px) + 12px);z-index:41;background:#E50914;color:#fff;border:0;border-radius:50%;width:46px;height:46px;font-size:20px}#ap{width:80vw}body{padding-right:0}}@media(min-width:701px){#sbt{display:none}}";
document.head.appendChild(css);
var L=[["01-signage","📺","Smart Signage","Cartelería"],["02-studio","🎬","Studio & Admirito","Studio y Admirito"],["03-hilomusical","🎵","Hilomusical","Hilomusical"],["04-digital-twin","🧭","Digital Twin","Gemelo digital"],["05-park-app","⌚","Park App & Wristband","App y pulsera"],["06-dashboard","📊","Dashboard","Panel de control"]];
var Z=[["./","🎬","Studio","Studio"],["stranger-things","🔦","Stranger Things","Stranger Things"],["squid-game","🦑","Squid Game","El Juego del Calamar"],["wednesday","🖤","Wednesday","Miércoles"],["arcadia","🛡️","Arcadia","Arcadia"],["dia-visitante","👨‍👩‍👧","A pilot day","Un día piloto"]];
var sb=document.createElement("aside");sb.id="sb";sb.setAttribute("aria-label","Options");
var h='<button id="sbcol" type="button" aria-label="Collapse options"><span class="i">☰</span><span class="l">'+T("Options","Opciones")+'</span></button>';
h+='<button id="techt" type="button" aria-expanded="false"><span class="i">⚙️</span><span class="l">'+T("Technology ▾","Tecnología ▾")+'</span></button><div class="sub" id="techs" hidden><a href="'+href("tech")+'"'+(inTech&&here==="index"?' class="on"':'')+'>'+T("Overview","Resumen")+'</a>';
L.forEach(function(x){h+='<a href="'+href("tech/"+x[0])+'"'+(inTech&&here===x[0]?' class="on"':'')+'>'+x[1]+' '+T(x[2],x[3])+'</a>'});
h+='</div><div class="h">'+T("Zones","Zonas")+'</div>';
Z.forEach(function(x){h+='<a href="'+href(x[0])+'"'+(!inTech&&(here===x[0]||(x[0]==="./"&&here==="index"))?' class="on"':'')+' title="'+x[2]+'"><span class="i">'+x[1]+'</span><span class="l">'+T(x[2],x[3])+'</span></a>'});

sb.innerHTML=h;document.body.appendChild(sb);
var tg=document.createElement("button");tg.id="sbt";tg.type="button";tg.textContent="☰";tg.setAttribute("aria-label","Options");tg.title="Options";document.body.appendChild(tg);
tg.onclick=function(){document.body.classList.toggle("sbo")};
var B=document.body,st=document.documentElement.style;function g(k){try{return localStorage.getItem(k)}catch(e){return null}}function p(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function col(c){B.classList.toggle("sbc",c);st.setProperty("--sbw",c?"56px":"240px");p("nv-sbc",c?"1":"0")}
col(g("nv-sbc")!=="0");sb.querySelector("#sbcol").onclick=function(){if(innerWidth<=700)B.classList.remove("sbo");else col(!B.classList.contains("sbc"))};
var gear=document.querySelector("nav a.mi.tech");if(gear)gear.addEventListener("click",function(e){e.preventDefault();if(innerWidth<=700)B.classList.toggle("sbo");else col(!B.classList.contains("sbc"))});
var tt=sb.querySelector("#techt"),ts=sb.querySelector("#techs");function te(o){ts.hidden=!o;tt.setAttribute("aria-expanded",o);p("nv-tech",o?"1":"0")}
te(inTech||g("nv-tech")==="1");tt.onclick=function(){if(B.classList.contains("sbc"))col(false);te(ts.hidden)};
/* Right Advanced panel */
var ap=document.createElement("aside");ap.id="ap";ap.hidden=true;ap.setAttribute("aria-label","Advanced");
ap.innerHTML='<div class="h">'+T("Advanced","Avanzadas")+'</div><button id="ap-x" type="button">✕ '+T("Close","Cerrar")+'</button><button id="ap-e" type="button">&gt;_ '+T("Expert mode","Modo experto")+'</button><button id="ap-a" type="button">🤖 '+T("Assistants demo","Demo asistentes")+'</button>';
document.body.appendChild(ap);
function apo(o){ap.hidden=!o;st.setProperty("--apw",o&&innerWidth>700?"240px":"0px");p("nv-ap",o?"1":"0")}apo(g("nv-ap")==="1");
ap.querySelector("#ap-x").onclick=function(){apo(false)};var xbb=document.getElementById("xbtn");if(xbb)xbb.onclick=function(){apo(ap.hidden)};

function xopen(){if(window.nvX)window.nvX.open()}
ap.querySelector("#ap-e").onclick=xopen;
ap.querySelector("#ap-a").onclick=function(){xopen();var i=document.getElementById("xin");i.value="ask studio what can I do here?";document.getElementById("xform").requestSubmit()};
/* Resizable expert bar */
var x=document.getElementById("xbar");if(!x)return;var MIN=120,ht=+g("nv-xh")||220,pre=ht;
function mx(){return Math.round(innerHeight*0.85)}
function setH(v,save){ht=Math.max(MIN,Math.min(mx(),v));if(!x.hidden)st.setProperty("--xh",ht+"px");x.style.height=ht+"px";if(save)p("nv-xh",ht)}
var gr=document.createElement("div");gr.id="xgrip";gr.title="Drag to resize";gr.setAttribute("role","separator");gr.setAttribute("aria-orientation","horizontal");x.insertBefore(gr,x.firstChild);
var tl=document.createElement("div");tl.id="xtools";tl.innerHTML='<button id="xmax" type="button" title="Maximise / restore">⤢</button><button id="xcl" type="button" title="Close (Esc)">✕</button>';x.appendChild(tl);x.style.position="fixed";
tl.querySelector("#xmax").onclick=function(){if(ht<mx()){pre=ht;setH(mx(),true)}else setH(pre<mx()?pre:220,true)};
tl.querySelector("#xcl").onclick=function(){var i=document.getElementById("xin");i.value="exit";document.getElementById("xform").requestSubmit()};
var dr=null;gr.addEventListener("pointerdown",function(e){dr={y:e.clientY,h:ht};gr.setPointerCapture(e.pointerId);e.preventDefault()});
gr.addEventListener("pointermove",function(e){if(dr)setH(dr.h+(dr.y-e.clientY),false)});
function end(){if(dr){dr=null;p("nv-xh",ht)}}gr.addEventListener("pointerup",end);gr.addEventListener("pointercancel",end);
function sync(){st.setProperty("--xh",x.hidden?"0px":ht+"px")}new MutationObserver(sync).observe(x,{attributes:true,attributeFilter:["hidden"]});setH(ht,false);sync();
addEventListener("resize",function(){setH(ht,false)});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!x.hidden){var i=document.getElementById("xin");i.value="exit";document.getElementById("xform").requestSubmit()}});
})();
