export const COFFEE_COLLECTION_PATH='/inventario/assets/catalog/47/collection/preview/';
export const MATRIX_COLLECTION_PATH='/inventario/assets/catalog/47/collection-matrix/preview/';
export const UNREAL_PROJECT_DOWNLOAD_URL='https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/matrix47-unreal.zip';
// Read-only model collection; preserve only explicit navigation preferences.
export function coffeeCollectionURL(baseURL,{quality='best'}={}){
 const base=new URL(baseURL),url=new URL(quality==='matrix'?MATRIX_COLLECTION_PATH:COFFEE_COLLECTION_PATH,base.origin);
 for(const key of ['lang','marca','loc','project','circuit'])if(base.searchParams.has(key))url.searchParams.set(key,base.searchParams.get(key));
 return url;
}
