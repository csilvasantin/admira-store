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
    pin.addEventListener("click", () => activate(actor, false));
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

  return {
    cast,board,
    bindCamera(callback) { turnTo = callback; },
    setVisible(visible) { layers.hidden = !visible; field.hidden = !visible; portal.hidden = !visible; },
    project({cx,sx,cy,sy,zoom,aspect,center}) {
      cast.forEach(({id,x,y,z}) => {
        const h = y + 1.84 - center;
        pins[id].style.left = `${50 + (x * cx - z * sx) * zoom / aspect * 50}%`;
        pins[id].style.top = `${50 - (-x * sx * sy + h * cy - z * cx * sy) * zoom * 50}%`;
      });
      const towerHeight = 9.7 - center;
      portal.style.left = "50%";
      portal.style.top = `${50 - towerHeight * cy * zoom * 50}%`;
    },
    reset() {
      state.clear();
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
