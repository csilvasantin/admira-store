// Model composition, separate from placed instances and verified stock.
export const COMPONENTS_URL=new URL('./components.json?v=components-20261008-coffee47-1',import.meta.url);
export function componentLabel(value,lang='es'){
 return value?.[lang]||value?.es||value?.en||'';
}
export function componentsFor(data,asset){
 return data?.assets?.find(entry=>entry.id===asset.id&&entry.number===asset.number)||null;
}
export function breakdownURL(base,asset,lang='es'){
 const url=new URL(base);url.searchParams.set('asset',asset.number);url.searchParams.set('quality','best');url.searchParams.set('view','breakdown');url.searchParams.set('lang',lang);url.hash='catalog';return url;
}
export async function loadComponents(fetcher=fetch){
 const response=await fetcher(COMPONENTS_URL);
 if(!response.ok)throw Error('components unavailable');
 const data=await response.json();
 if(data.schema_version!==1||!Array.isArray(data.assets))throw Error('unsupported components data');
 return data;
}
