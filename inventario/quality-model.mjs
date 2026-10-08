export const BASE_PROFILES=Object.freeze(['good','better','best']);
export const MATRIX_ASSET_NUMBER=47;
// Matrix (PBR de estudio) sólo existe para la pieza 47. Hiperreal (PBR CC0 2K-4K, imperfección y luz
// de tienda) se despliega por tandas: piloto 47, tanda 1 = conjunto Starbucks (44-50, 52) y tanda 2 =
// piezas nativas de demo (2, 3, 7, 9, 10, 13, 15, 51) con detalle geométrico real y tanda 3 = resto de nativas
// (4, 5, 6, 8, 11, 12, 14, 16, 17, 18) con piezas añadidas a mano por pieza; tandas 4-6 = Pixeria (19-43) y
// tanda 7 = Mostrador (pieza 1, fuera del catálogo: assets/mostrador/counter-interpreted-hiperreal.glb).
export const PHOTOREAL_PROFILES=Object.freeze(['matrix','hiperreal']);
export const HIPERREAL_BATCHES=Object.freeze({0:Object.freeze([47]),1:Object.freeze([44,45,46,48,49,50,52]),2:Object.freeze([2,3,7,9,10,13,15,51]),3:Object.freeze([4,5,6,8,11,12,14,16,17,18]),4:Object.freeze([19,20,21,22,23,24,25,26,27]),5:Object.freeze([28,29,30,31,32,33,34,35]),6:Object.freeze([36,37,38,39,40,41,42,43]),7:Object.freeze([1])});
// Cache revision per piece when a published Hiperreal GLB is rebuilt (2 and 51: authored wood textures keep their own UVs; 27: neutral iron instead of teal; 29: beacon and headlamps as glossy plastic, not glass;
// r22: 2 amber bottles and the 19/20/23 headlamps/windscreens leave glass in the web LOD -> opaque gloss, HD keeps real glass).
export const HIPERREAL_REVISION=Object.freeze({2:3,51:2,27:2,29:2,30:2,19:2,20:2,23:2});
export const HIPERREAL_ASSET_NUMBERS=Object.freeze(Object.values(HIPERREAL_BATCHES).flat().sort((a,b)=>a-b));
export function hasHiperreal(number){return HIPERREAL_ASSET_NUMBERS.includes(number);}
export function hiperrealBatch(number){const entry=Object.entries(HIPERREAL_BATCHES).find(([,numbers])=>numbers.includes(number));return entry?Number(entry[0]):null;}
export function qualityProfiles(number){return [...BASE_PROFILES,...(number===MATRIX_ASSET_NUMBER?['matrix']:[]),...(hasHiperreal(number)?['hiperreal']:[])];}
export function supportsQuality(number,quality){return qualityProfiles(number).includes(quality);}
export function isPhotoreal(number,quality){return PHOTOREAL_PROFILES.includes(quality)&&supportsQuality(number,quality);}
// Gemelo (perfil Best): la mejor versión publicada primero; si falla la descarga se cae a la siguiente.
export function twinQualityChain(number,tier='best'){return tier==='best'?['hiperreal','matrix','best'].filter(quality=>supportsQuality(number,quality)):[tier];}
export function selectedQuality(number,quality){return quality==='all'||supportsQuality(number,quality)?quality:'best';}
export function comparisonProfiles(number,quality){return quality==='all'?qualityProfiles(number):[selectedQuality(number,quality)];}
export function qualityLabel(quality){return quality[0].toUpperCase()+quality.slice(1);}
export function catalogFrontAngle(number){return [2,MATRIX_ASSET_NUMBER].includes(number)?Math.PI/2:0;}
