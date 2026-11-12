"use strict";

const creelScene = (() => {
  const board = {width: 120, depth: 90, unitCm: 2.5};
  const cast = [
    // Celda, x cm, z cm, chaqueta, pelo, zona, reacción, efecto
    ["Will", "D14", 17.5, 67.5, "#dc9b38", "#392617", "Jardín", "El lago refleja una sombra que no está en el jardín.", "lago"],
    ["Mike", "G15", 32.5, 72.5, "#266aa0", "#201a24", "Sendero", "Las balizas del sendero señalan el porche.", "sendero"],
    ["Lucas", "L15", 57.5, 72.5, "#366c52", "#272027", "Entrada", "Una linterna ilumina la entrada de la casa.", "linterna"],
    ["Dustin", "D09", 17.5, 42.5, "#365b9d", "#dd763f", "Puesto de radio", "La radio WSQK recibe la primera pista.", "radio", "creelRadio"],
    ["Nancy", "E06", 22.5, 27.5, "#5e394c", "#663a26", "Lateral oeste", "Una luz en las ventanas marca la dirección de la torre.", "ventanas"],
    ["Jonathan", "H04", 37.5, 17.5, "#7d4b32", "#38251e", "Parte trasera", "El flash de la cámara revela una silueta.", "flash"],
    ["Steve", "Q15", 82.5, 72.5, "#7b333f", "#51311f", "Acceso de vehículos", "Los faros iluminan el acceso.", "faros"],
    ["Robin", "T10", 97.5, 47.5, "#28768a", "#8c542e", "Puesto de pistas", "Robin descifra la frecuencia. Segunda pista.", "frecuencia", "creelFrequency"],
    ["Holly", "P12", 77.5, 57.5, "#ca6986", "#b4853b", "Porche", "Las luces cálidas del porche marcan un refugio.", "porche"],
    ["Sr. Whatsit", "T06", 97.5, 27.5, "#ac9b77", "#694831", "Lateral este", "El jardín cambia de tono y aparece una grieta.", "grieta"],
    ["Max", "P04", 77.5, 17.5, "#a23d46", "#a64d26", "Refugio trasero", "Un pulso de música mantiene a Max a salvo. Tercera pista.", "pulso", "creelPulse"],
    ["Vecna", "M05", 62.5, 22.5, "#714148", "#995956", "Estación de la torre", "El reloj se detiene y el portal se abre sobre la casa.", "portal", "creelPortal"],
    ["Once", "U14", 102.5, 67.5, "#744a92", "#40291f", "Junto al lago", "Once cierra el portal. Las luces de Hawkins vuelven.", "cierre", "creelClosed"],
  ].map(([name,cell,xCm,zCm,coat,hair,zone,message,effect,fact],id) => ({
    id,name,cell,xCm,zCm,coat,hair,zone,message,effect,fact,
    x:(xCm-board.width/2)/board.unitCm, y:.03, z:(zCm-board.depth/2)/board.unitCm,
  }));
  const clues = ["creelRadio","creelFrequency","creelPulse"];
  const state = new Set();
  const field = document.getElementById("creel-cast");
  const layers = document.getElementById("creel-pins");
  const eventText = document.getElementById("creel-event");
  const actionText = document.getElementById("creel-result");
  const counter = document.getElementById("creel-clues");
  const viewer = layers.parentElement;
  const portal = document.getElementById("creel-portal");
  const pins = [];
  const selectors = [];
  let signal = -1;
  let active = -1;
  let turnTo = () => {};
  let lastAnimation;
  let moved = () => {};
  let camera = null;
  const home = new Map();
  const house = {x:0, z:0};
  const handle = document.createElement("button");
  let audio;
  const sound = document.getElementById("creel-sound");
  let soundOn = false;
  sound.addEventListener("click", () => {
    soundOn = !soundOn;
    if (soundOn && typeof AudioContext === "function") {
      audio ||= new AudioContext();
      audio.resume().catch(() => {});
    }
    sound.textContent = soundOn ? "Sonido activado" : "Activar sonido";
    sound.setAttribute("aria-pressed", String(soundOn));
  });

  function tone(effect) {
    if (!soundOn || audio?.state !== "running") return;
    const frequencies = effect === "pulso" ? [220,277,330] : effect === "portal" ? [62,74,50] : [130,174];
    frequencies.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const volume = audio.createGain();
      const start = audio.currentTime + index * .13;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(.0001, start);
      volume.gain.exponentialRampToValueAtTime(.16, start + .04);
      volume.gain.exponentialRampToValueAtTime(.0001, start + .23);
      oscillator.connect(volume).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + .24);
    });
  }

  XPL.FACTS.push(...cast.map(({id}) => ({id:`creelTap${id}`,type:"bool"})),
    ...[...clues,"creelPortal","creelClosed"].map(id => ({id,type:"bool"})));
  XPL.ACTIONS.push({id:"creelReaction",scope:"world",mode:"on"},{id:"creelFact",scope:"world",mode:"on"});
  const engine = XPL.createEngine({
    fact: id => id === `creelTap${signal}` || state.has(id),
    act(id,value) {
      if (id === "creelFact") {
        state.add(value);
        return;
      }
      const actor = cast[value];
      actionText.textContent = actor.message;
      viewer.dataset.effect = actor.effect;
      lastAnimation?.cancel();
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        lastAnimation = document.getElementById("creel-atmosphere").animate(
          [{opacity:.1},{opacity:.8},{opacity:.35}], {duration:1050});
      }
      tone(actor.effect);
    },
  });
  engine.setRules(cast.map(({id,fact}) => ({
    id:`creel-${id}`,
    when:{join:"and",conds:[
      {fact:`creelTap${id}`,value:true},
      ...(fact === "creelPortal" ? clues.map(fact => ({fact,value:true})) : []),
      ...(fact === "creelClosed" ? [{fact:"creelPortal",value:true}] : []),
    ]},
    do:[{id:"creelReaction",value:id},...(fact ? [{id:"creelFact",value:fact}] : [])],
  })));

  function updateCounter() {
    counter.textContent = `${clues.filter(id => state.has(id)).length} / 3 pistas`;
    viewer.classList.toggle("portal-abierto", state.has("creelPortal") && !state.has("creelClosed"));
  }

  function activate(actor, focusCamera) {
    active = actor.id;
    pins.forEach((pin,i) => pin.setAttribute("aria-pressed", String(i === active)));
    selectors.forEach((button,i) => button.setAttribute("aria-pressed", String(i === active)));
    if (focusCamera) turnTo(actor);
    eventText.textContent = `${actor.name} · ${actor.cell} · ${actor.zone}`;
    if (state.has("creelClosed") && (actor.fact === "creelPortal" || actor.fact === "creelClosed")) {
      actionText.textContent = "El portal está cerrado. Reinicia la escena para volver a abrirlo.";
      return;
    }
    signal = actor.id;
    const log = engine.tick();
    signal = -1;
    engine.tick();
    if (!log.length) actionText.textContent = actor.fact === "creelPortal"
      ? "Busca primero a Dustin, Robin y Max. Sus pistas desbloquean el reloj."
      : "Vecna todavía no ha abierto el portal.";
    updateCounter();
  }

  for (const actor of cast) {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "creel-pin";
    pin.textContent = actor.id + 1;
    pin.title = `${actor.name} · ${actor.cell} · ${actor.zone}`;
    pin.setAttribute("aria-label", pin.title);
    pin.setAttribute("aria-pressed", "false");
    pin.tabIndex = -1;
    pin.addEventListener("click", () => { if (!pin.dataset.arrastrado) activate(actor, false); delete pin.dataset.arrastrado; });
    // Arrastrar el personaje por el tablero (simulador de la cámara: quién se acerca a la casa).
    pin.addEventListener("pointerdown", event => {
      if (event.button !== 0 || !camera) return;
      event.preventDefault(); event.stopPropagation();
      pin.setPointerCapture(event.pointerId);
      const start = [event.clientX, event.clientY];
      const mover = ev => {
        if (Math.hypot(ev.clientX - start[0], ev.clientY - start[1]) < 4 && !pin.dataset.arrastrado) return;
        pin.dataset.arrastrado = "1";
        const p = toBoard(ev.clientX, ev.clientY); if (p) moveActor(actor.id, p.x, p.z);
      };
      const soltar = () => {
        pin.removeEventListener("pointermove", mover); pin.removeEventListener("pointerup", soltar); pin.removeEventListener("pointercancel", soltar);
        if (pin.dataset.arrastrado && distance(actor) < NEAR) activate(actor, false);
      };
      pin.addEventListener("pointermove", mover); pin.addEventListener("pointerup", soltar); pin.addEventListener("pointercancel", soltar);
    });
    pins.push(pin);
    layers.append(pin);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${actor.id + 1} · ${actor.name}`;
    button.title = actor.zone;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => activate(actor, true));
    selectors.push(button);
    field.append(button);
  }

  // ── Presencia: distancia a la casa (centro del tablero) en cm. La cámara real alimentará lo mismo con moveActor. ──
  const NEAR = 9, MID = 16; // unidades de tablero (×2,5 cm): 22 cm y 40 cm
  const distance = a => Math.hypot(a.x - house.x, a.z - house.z);
  function toBoard(clientX, clientY, alto = 1.84) {
    const {cx,sx,cy,sy,zoom,aspect,center} = camera; if (sy < .05) return null;
    const r = viewer.getBoundingClientRect();
    const u = ((clientX - r.left) / r.width * 100 - 50) / 50 * aspect / zoom;
    const v = (50 - (clientY - r.top) / r.height * 100) / 50 / zoom;
    const w = (v - (alto - center) * cy) / sy;
    const bx = board.width / board.unitCm / 2 - .5, bz = board.depth / board.unitCm / 2 - .5;
    return {x: Math.max(-bx, Math.min(bx, u * cx - w * sx)), z: Math.max(-bz, Math.min(bz, -u * sx - w * cx))};
  }
  // Manda quien se mueve (el que se acerca), como hará la cámara con la persona que entra en plano.
  function presence(id) {
    const near = cast.map(a => ({id:a.id, name:a.name, effect:a.effect, cm:Math.round(distance(a) * board.unitCm)}));
    const first = id == null ? {id:-1, name:"", cm:Infinity} : near[id];
    const nivel = first.cm < NEAR * board.unitCm ? "puerta" : first.cm < MID * board.unitCm ? "cerca" : "lejos";
    const detail = {nivel, quien:first.name, id:first.id, cerca:near.filter(a => a.cm < MID * board.unitCm).map(a => a.name), cm:Number.isFinite(first.cm) ? first.cm : null};
    window.dispatchEvent(new CustomEvent("creel-presencia", {detail}));
  }
  function moveActor(id, x, z) {
    const a = cast[id]; if (!a) return;
    if (!home.has(id)) home.set(id, [a.x, a.z]);
    a.x = x; a.z = z; lastMoved = id; moved(); presence(id);
  }

  // Mover la casa: asa 🏠 arrastrable y flechas del teclado (X e Y del tablero). La presencia se mide desde aquí.
  function moveHouse(x, z) {
    const bx = board.width / board.unitCm / 2 - 6, bz = board.depth / board.unitCm / 2 - 5;
    house.x = Math.max(-bx, Math.min(bx, x)); house.z = Math.max(-bz, Math.min(bz, z));
    moved(); if (lastMoved != null) presence(lastMoved);
  }
  let lastMoved = null;
  handle.type = "button"; handle.className = "creel-pin creel-casa"; handle.textContent = "🏠";
  handle.title = "Mover el hotel: arrastra o usa las flechas"; handle.setAttribute("aria-label", handle.title);
  layers.append(handle);
  handle.addEventListener("keydown", e => {
    const d = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]}[e.key]; if (!d) return;
    e.preventDefault(); moveHouse(house.x + d[0], house.z + d[1]);
  });
  handle.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !camera) return;
    event.preventDefault(); event.stopPropagation(); handle.setPointerCapture(event.pointerId); handle.focus();
    const mover = ev => { const p = toBoard(ev.clientX, ev.clientY, 0); if (p) moveHouse(p.x, p.z); };
    const soltar = () => { handle.removeEventListener("pointermove", mover); handle.removeEventListener("pointerup", soltar); handle.removeEventListener("pointercancel", soltar); };
    handle.addEventListener("pointermove", mover); handle.addEventListener("pointerup", soltar); handle.addEventListener("pointercancel", soltar);
  });

  return {
    cast,board,house,moveActor,moveHouse,presence,
    onMove(callback) { moved = callback; },
    bindCamera(callback) { turnTo = callback; },
    setVisible(visible) { layers.hidden = !visible; field.hidden = !visible; portal.hidden = !visible; },
    project({cx,sx,cy,sy,zoom,aspect,center}) {
      camera = {cx,sx,cy,sy,zoom,aspect,center};
      window.dispatchEvent(new CustomEvent("creel-camara", {detail:{...camera, bx:board.width / board.unitCm / 2, bz:board.depth / board.unitCm / 2}}));
      cast.forEach(({id,x,y,z}) => {
        const h = y + 1.84 - center;
        pins[id].style.left = `${50 + (x * cx - z * sx) * zoom / aspect * 50}%`;
        pins[id].style.top = `${50 - (-x * sx * sy + h * cy - z * cx * sy) * zoom * 50}%`;
      });
      const towerHeight = 9.7 - center;
      portal.style.left = `${50 + (house.x * cx - house.z * sx) * zoom / aspect * 50}%`;
      portal.style.top = `${50 - (-house.x * sx * sy + towerHeight * cy - house.z * cx * sy) * zoom * 50}%`;
      handle.style.left = `${50 + (house.x * cx - house.z * sx) * zoom / aspect * 50}%`;
      handle.style.top = `${50 - (-house.x * sx * sy + (0 - center) * cy - house.z * cx * sy) * zoom * 50}%`;
    },
    reset() {
      state.clear();
      if (house.x || house.z) { house.x = 0; house.z = 0; lastMoved = null; moved(); presence(); }
      if (home.size) { for (const [id,[x,z]] of home) { cast[id].x = x; cast[id].z = z; } home.clear(); moved(); presence(); }
      active = -1;
      pins.concat(selectors).forEach(button => button.setAttribute("aria-pressed","false"));
      delete viewer.dataset.effect;
      lastAnimation?.cancel();
      eventText.textContent = "Elige una figura";
      actionText.textContent = "Encuentra las tres pistas para abrir el portal.";
      updateCounter();
    },
  };
})();
