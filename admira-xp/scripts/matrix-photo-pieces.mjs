// Coordinates on the generated transparent atlas, expressed on a 1600 × 1000
// design canvas. These are presentation cut lines, never simulation geometry.
// The source composition remains archived; this atlas supplies movable layers.
export const MATRIX_ATLAS_SIZE=[1600,1000];
export const MATRIX_ATLAS_URL=new URL('../assets/matrix-furniture/avenida-furniture-atlas-v1.png',import.meta.url).href;
const piece=(number,base,anchor,target,polygons,extra={})=>({number,base,anchor,target,polygons,scale:.94,...extra});
export const MATRIX_PHOTO_PIECES={
  counter:piece(1,[1,2],[181,590],[.112,.576],[[[88,449],[211,407],[239,382],[281,376],[291,398],[332,420],[332,531],[203,594],[137,583],[88,566]]]),
  shelves:piece(2,[4,1],[689,430],[.421,.435],[[[574,175],[651,153],[680,127],[748,130],[769,150],[797,172],[793,417],[750,443],[684,418],[573,378]]]),
  wineRack:piece(3,[6,1],[833,463],[.515,.464],[[[788,218],[878,250],[884,447],[834,465],[777,436],[781,270]]]),
  lottery:piece(4,[7,2],[961,547],[.601,.528],[[[882,365],[904,329],[953,316],[982,356],[1026,367],[1042,403],[1033,552],[969,552],[884,499]]]),
  vending:piece(5,[9,2],[1101,581],[.677,.561],[[[1036,343],[1104,320],[1167,348],[1165,554],[1102,585],[1030,550],[1032,402]]]),
  magazines:piece(6,[2,3],[325,726],[.210,.673],[[[277,493],[421,535],[435,583],[417,638],[416,699],[363,731],[211,659],[235,572]]]),
  manager:piece(7,[5,4],[498,760],[.320,.723],[[[482,556],[533,570],[532,602],[593,624],[595,646],[584,659],[586,741],[557,757],[545,689],[532,686],[531,743],[496,777],[456,772],[414,749],[413,706],[417,639],[437,596],[478,600]]]),
  plant1:piece(9,[0,1],[521,371],[.326,.369],[[[495,141],[538,149],[563,171],[575,207],[568,260],[555,292],[565,326],[548,373],[500,374],[480,345],[475,295],[477,215]]]),
  plant3:piece(9,[0,5],[69,538],[.045,.521],[[[29,401],[63,385],[85,390],[111,408],[113,436],[88,450],[88,527],[77,542],[47,533],[36,488]]]),
  floorLamp:piece(10,[10,5],[361,442],[.225,.416],[[[317,167],[401,164],[402,444],[319,444]]]),
  led:piece(12,[0,0],[438,295],[.285,.325],[[[394,121],[480,87],[484,269],[397,300]]],{wall:true}),
  metahuman:piece(14,[13,3],[729,617],[.461,.586],[[[688,372],[766,396],[777,575],[795,593],[796,608],[748,624],[667,593],[671,576],[685,567]]]),
  aroma:piece(16,[13,1],[1516,516],[.942,.468],[[[1477,436],[1561,461],[1558,512],[1532,521],[1474,497]]],{wall:true}),
  djBooth:piece(17,[11,3],[713,818],[.442,.754],[[[624,595],[658,601],[661,617],[709,631],[746,650],[806,648],[826,664],[825,681],[843,693],[839,766],[720,824],[596,772],[589,651],[610,639]]]),
  turnKiosk:piece(18,[12,6],[1088,930],[.653,.877],[[[1071,681],[1132,696],[1121,788],[1127,889],[1140,908],[1140,921],[1091,939],[1033,910],[1042,895],[1047,801],[1058,769]]])
};

// Ground contacts measured on the unchanged 1600 × 1000 atlas. Visible plinth
// corners, feet and pot bases define these supports; the occluded rear corner
// of a rectangular plinth is inferred from its three visible corners. The
// renderer centers and uniformly fits these supports inside the actual floor
// footprint. It must not use the top of a cabinet, foliage or its image crop
// as floor geometry. Wall-mounted photographs keep their original calibration.
const GROUND_SUPPORTS={
  counter:[[261,502],[325,531],[152,595],[88,566]],
  shelves:[[616,352],[793,417],[750,443],[573,378]],
  wineRack:[[828,413],[884,447],[834,465],[777,436]],
  lottery:[[951,459],[1033,493],[1033,552],[969,552],[884,499]],
  vending:[[1099,516],[1165,554],[1102,585],[1030,550]],
  magazines:[[274,627],[416,699],[363,731],[211,659]],
  manager:[[501,702],[586,741],[557,757],[496,777],[456,772],[414,749]],
  plant1:[[509,354],[542,354],[545,366],[524,372],[507,365]],
  plant3:[[58,518],[88,527],[77,542],[47,533]],
  floorLamp:[[359,415],[390,428],[359,443],[329,429]],
  metahuman:[[715,577],[796,608],[748,624],[667,593]],
  djBooth:[[681,720],[831,782],[748,817],[598,755]],
  turnKiosk:[[1090,884],[1135,909],[1094,934],[1034,910]]
};
for(const [id,ground] of Object.entries(GROUND_SUPPORTS))MATRIX_PHOTO_PIECES[id].ground=Object.freeze(ground.map(point=>Object.freeze(point)));
// This photograph's long bay runs along the opposite isometric axis from the
// native 1 × 2 shelving footprint. Mirror both photograph and measured supports;
// an inventory mirror then composes with this correction rather than replacing it.
MATRIX_PHOTO_PIECES.shelves.mirrorX=true;

// Ceiling luminaires and printed wall art belong to the architectural backdrop,
// rather than to an invented inventory instance. /mudanza hides these fixtures.
export const MATRIX_ARCHITECTURE_DETAILS=[
  piece(null,null,[126,356],[.083,.348],[[[87,244],[174,245],[174,357],[86,357]]],{wall:true}),
  piece(null,null,[623,160],[.395,.159],[[[580,42],[668,44],[668,163],[580,164]]],{wall:true}),
  piece(null,null,[960,291],[.590,.291],[[[914,179],[1007,178],[1007,294],[913,294]]],{wall:true}),
  piece(null,null,[1289,434],[.780,.421],[[[1241,313],[1336,313],[1336,440],[1240,440]]],{wall:true}),
  piece(null,null,[204,400],[.127,.391],[[[154,228],[250,193],[252,367],[160,405]]],{wall:true}),
  piece(null,null,[1406,576],[.871,.550],[[[1350,385],[1455,424],[1461,578],[1351,540]]],{wall:true})
];

export function photoPieceFor(item,number){
  if(number===9)return MATRIX_PHOTO_PIECES[item.id==='plant3'?'plant3':'plant1'];
  return Object.values(MATRIX_PHOTO_PIECES).find(p=>p.number===number)||null;
}
