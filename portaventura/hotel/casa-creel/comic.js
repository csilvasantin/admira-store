"use strict";

const chapters = [
  {
    name: "Furius Baco", title: "La vía se enciende",
    existing: "Montaña rusa de lanzamiento junto al lago de Mediterrània.",
    proposal: "La cola, la estación y el audio cuentan una persecución. La vía, el tren y la plataforma son los de Furius Baco.",
    detail: "Un pulso rojo recorre la estación. La radio de Dustin recoge tres campanadas.",
    scenes: [
      ["coaster", "El último tren sale. La radio vuelve a encenderse sola."],
      ["radio", "Tres campanadas. La señal viene del agua.", "Dustin"],
      ["rift", "El raíl vibra. Al otro lado del lago, una luz responde.", "Lucas"],
    ],
  },
  {
    name: "Port de la Drassana", title: "El lago devuelve la señal",
    existing: "Embarcadero de Mediterrània para el paseo en barco por el parque.",
    proposal: "Reflejos y sonido convierten la travesía en un paso por Lover’s Lake. El muelle y el recorrido sirven de base.",
    detail: "Un reflejo de la Casa Creel aparece en el agua y apunta hacia el andén.",
    scenes: [
      ["boat", "La embarcación se aleja del muelle. El agua parece un espejo."],
      ["reflection", "Mirad abajo. Esa casa solo está en el reflejo.", "Max"],
      ["signal", "La luz se desplaza hacia el andén. Seguidla.", "Robin"],
    ],
  },
  {
    name: "Estació del Nord", title: "El último andén",
    existing: "Estación de Mediterrània del tren interno que comunica zonas del parque.",
    proposal: "El andén se viste como una llegada a Hawkins. La circulación del tren se conserva.",
    detail: "La Casa Creel se revela como hito en la maqueta conceptual de Mediterrània.",
    scenes: [
      ["train", "El convoy entra en la estación. El reloj se para a las 23:59."],
      ["clock", "La señal no quiere que subamos. Quiere que miremos.", "Once"],
      ["house", "En el plano, la Casa Creel se alza junto al lago. Hawkins vuelve a respirar."],
    ],
  },
];

const shapes = {
  coaster: '<path d="M-25 213 Q115 176 193 82T382 95 620 153 M-25 229 Q115 192 197 98T387 111 620 169" fill="none" stroke="#f18166" stroke-width="3"/><path d="M-25 229 Q115 192 197 98T387 111 620 169" fill="none" stroke="#ec976f" stroke-width="13" stroke-dasharray="2 10"/><path d="M78 208v97M154 150v130M255 63v223M331 66v220M415 125v168M507 158v135" fill="none" stroke="#190f1c" stroke-width="6"/><g transform="translate(196 80) rotate(-31)"><path d="M-20 0h135l-10 26H-9z" fill="#331721" stroke="#ff9e76" stroke-width="3"/><path d="M0 7h92" stroke="#ffd2a2" stroke-width="5" stroke-dasharray="9 6"/><circle cx="6" cy="27" r="5" fill="#120d17"/><circle cx="85" cy="27" r="5" fill="#120d17"/></g><path d="M10 47h140M27 60h75m324 30h88m-48 12h93" stroke="#ea6b56" opacity=".5"/>',
  radio: '<g transform="translate(212 48) rotate(-10 80 100)"><path d="M97 36l40-104" stroke="#e6a780" stroke-width="6"/><rect width="160" height="190" x="8" y="22" rx="12" fill="#2c2329" stroke="#f3b27d" stroke-width="4"/><rect x="28" y="44" width="119" height="55" rx="3" fill="#432334" stroke="#f27265"/><path d="M34 75h18l8-14 12 28 12-21 9 6h46" fill="none" stroke="#ff9872" stroke-width="3"/><path d="M35 119h105m-105 13h105m-105 13h105m-105 13h105m-105 13h105" stroke="#93675f" stroke-width="4"/></g>',
  rift: '<path d="M0 287 255 172h32L591 287M32 289l244-112L552 289" stroke="#b16976" fill="none" stroke-width="5"/><path d="m300 22-24 59 16 25-27 46 16 19-25 48 46-41-17-21 35-52-16-29 14-55z" fill="#ff7a5d" stroke="#ffac70" stroke-width="3"/><path d="M294 43l-9 37 18 24-27 46 10 19-18 29" fill="none" stroke="#ffdd9b" stroke-width="3"/>',
  boat: '<path d="M0 217q70-10 160 1t180 0 250 0m-578 26q100-10 200 0t185 0 200 0m-564 28q90-15 184 0t224 0 120 0" fill="none" stroke="#74c3bf" stroke-width="2"/><path d="M118 208h343l-32 38H174z" fill="#262334" stroke="#edbb8e" stroke-width="4"/><path d="M185 204v-53h201v53m-178-46v42m42-42v42m41-42v42m42-42v42m36-42v42m-197-55h232" fill="none" stroke="#edbb8e" stroke-width="5"/><path d="M198 156h176v40H198z" fill="#dc8450" opacity=".19"/>',
  reflection: '<path d="M0 102q120-7 230 0t370 0M0 115q140-7 250 0t350 0" fill="none" stroke="#9fd6ca"/><g transform="translate(96 337) scale(.74 -.76)" opacity=".78"><use href="#reflection-house"/></g><path d="M0 175h133m307 4h159M0 213h219m122 19h259M0 279h150m255-17h160" stroke="#79c7bf" stroke-width="3"/>',
  signal: '<path d="M0 255 285 169l315 66M0 289l283-113 317 95" fill="none" stroke="#858f9b" stroke-width="3"/><path d="M232 143h130v69H232zm-20 0 84-58 88 58z" fill="#292d3f" stroke="#a09a9e" stroke-width="3"/><path d="M288 165h21v46h-21z" fill="#ff9872"/><path d="M299 214 224 266h156z" fill="#ffc686" opacity=".27"/><path d="M117 186h98m175-12h105" stroke="#ef7e69" stroke-dasharray="9 10"/>',
  train: '<path d="M0 255h600M0 278h600" stroke="#d0a589" stroke-width="4"/><path d="M21 272h570" stroke="#ae8975" stroke-width="15" stroke-dasharray="4 17"/><path d="M48 218V112l101-66h354v172M75 216v-76m418-63h-331l-87 56h418" fill="none" stroke="#81778b" stroke-width="7"/><path d="M91 227v-54h34v-30h102v84m-120 0H453v-64H219v64" fill="#4d2839" stroke="#f09473" stroke-width="4"/><path d="M130 178h70m47 8h178" stroke="#ffd6a4" stroke-width="13" stroke-dasharray="17 11"/><path d="M94 203h358" stroke="#ed946f" stroke-width="3"/><circle cx="123" cy="230" r="15" fill="#181321" stroke="#ab6c68" stroke-width="3"/><circle cx="192" cy="230" r="15" fill="#181321" stroke="#ab6c68" stroke-width="3"/><circle cx="398" cy="230" r="15" fill="#181321" stroke="#ab6c68" stroke-width="3"/>',
  clock: '<path d="M232 250V97q0-72 68-72t68 72v153z" fill="#3c232d" stroke="#cda781" stroke-width="4"/><circle cx="300" cy="100" r="52" fill="#efd4a8" stroke="#60404b" stroke-width="5"/><path d="M300 53v9m0 74v9m-47-45h9m76 0h9m-51-28 4 28-6-37" fill="none" stroke="#5e343a" stroke-width="4"/><circle cx="300" cy="100" r="4" fill="#8f463b"/><path d="M299 163v50m-9 0h18" stroke="#e4ba84" stroke-width="6"/>',
  house: '<path d="m42 251 186-64 299 58-169 56z" fill="#2c3544" stroke="#789395" stroke-width="2"/><path d="m118 260 179-58m-69 85 188-64m-220-22 291 57m-344-38 273 56" stroke="#789395" opacity=".5"/><g transform="translate(130 0) scale(.6 .93)"><use href="#house-house"/></g>',
};

function art(kind, index) {
  const id = kind;
  const hue = index === 1 ? "#315967" : index === 2 ? "#424154" : "#79363c";
  const house = '<path d="M141 244v-96l62-57 44 37V73l29-50 30 50v44l44-25 86 59v93z" fill="#343747" stroke="#e2a482" stroke-width="4"/><path d="M126 154l77-72 45 40m57-1 46-37 99 71M239 78l37-63 38 65m-185 166h320" stroke="#f8b982" stroke-width="5" fill="none"/><path d="M177 160h34v34h-34zm95-2h18v87h-18zm77-1h31v37h-31zm-152-37h15v19h-15zm80-36h12v16h-12z" fill="#e99266"/><path d="m171 169 45 20m126-24 41 27" stroke="#4e333a" stroke-width="7"/><circle cx="277" cy="125" r="13" fill="#f4ca91"/><path d="M277 115v10l8 3" stroke="#5b3740" stroke-width="2" fill="none"/>';
  return `<svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}-sky" x2="0" y2="1"><stop stop-color="#231b2b"/><stop offset="1" stop-color="${hue}"/></linearGradient>
      <pattern id="${id}-dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".58" fill="#f3ba9d" opacity=".35"/></pattern>
      <g id="${id}-house">${house}</g>
    </defs>
    <rect width="600" height="300" fill="url(#${id}-sky)"/>
    <circle cx="453" cy="76" r="43" fill="#e68866" opacity=".71"/>
    <path d="M0 178 47 154l32 6 35-32 39 32 57-23 45 34 34-16 55 10 34-27 37 17 51-35 41 34 44-15 49 23v138H0Z" fill="#201c2a"/>
    <path d="M0 187q80-19 180 0t196-2 224 0v115H0" fill="${hue}" opacity=".64"/>
    <rect width="600" height="300" fill="url(#${id}-dots)" opacity=".66"/>
    ${shapes[kind]}
    <path d="M4 13V4h9m574 0h9v9M4 287v9h9m574 0h9v-9" stroke="#f3bc9d" opacity=".5" fill="none"/>
  </svg>`;
}

const byId = (id) => document.getElementById(id);
const tabs = Array.from(document.querySelectorAll("[data-chapter]"));
const position = byId("position");
let current = 0;

function paint(index) {
  current = index;
  const chapter = chapters[index];
  byId("sequence").textContent = `CAPÍTULO 0${index + 1} / 0${chapters.length}`;
  byId("chapter-title").textContent = chapter.title;
  byId("facts-title").textContent = chapter.name;
  for (const key of ["existing", "proposal", "detail"]) byId(key).textContent = chapter[key];
  byId("panels").replaceChildren(...chapter.scenes.map(([kind, text, speaker]) => {
    const panel = document.createElement("figure");
    panel.className = "panel";
    panel.innerHTML = art(kind, index);
    const caption = document.createElement("figcaption");
    if (speaker) {
      caption.className = "dialogue";
      const label = document.createElement("b");
      label.textContent = speaker;
      caption.append(label);
    }
    caption.append(text);
    panel.append(caption);
    return panel;
  }));
  tabs.forEach((tab, i) => i === index ? tab.setAttribute("aria-current", "page") : tab.removeAttribute("aria-current"));
  position.textContent = `PÁGINA ${index + 1} DE ${chapters.length}`;
  byId("previous").disabled = index === 0;
  byId("next").disabled = index === chapters.length - 1;
}

function select(index) {
  if (index < 0 || index >= chapters.length || index === current) return;
  const url = new URL(location.href);
  url.hash = `capitulo-${index + 1}`;
  history.pushState(null, "", url);
  paint(index);
  byId("chapter-title").focus({preventScroll:true});
}

function restorePage() {
  const match = location.hash.match(/^#capitulo-([1-3])$/);
  paint(match ? Number(match[1]) - 1 : 0);
}

tabs.forEach((tab) => tab.addEventListener("click", () => select(Number(tab.dataset.chapter))));
byId("previous").addEventListener("click", () => select(current - 1));
byId("next").addEventListener("click", () => select(current + 1));
window.addEventListener("hashchange", restorePage);
window.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented ||
      event.target.closest("button,input,textarea,select,a,dialog,[contenteditable]")) return;
  if (event.key === "ArrowLeft") select(current - 1);
  if (event.key === "ArrowRight") select(current + 1);
});
restorePage();
