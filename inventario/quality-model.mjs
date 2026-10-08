export const BASE_PROFILES=Object.freeze(['good','better','best']);
export const MATRIX_ASSET_NUMBER=47;
// Matrix (PBR de estudio) sólo existe para la pieza 47. Hiperreal (PBR CC0 2K-4K, imperfección y luz
// de tienda) se despliega por tandas: piloto 47 y tanda 1 = conjunto Starbucks (44-50, 52).
export const PHOTOREAL_PROFILES=Object.freeze(['matrix','hiperreal']);
export const HIPERREAL_BATCHES=Object.freeze({0:Object.freeze([47]),1:Object.freeze([44,45,46,48,49,50,52])});
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
