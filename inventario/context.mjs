import {assetForInstance} from './model.mjs';
const spaces={xtanco:{project:'estancos',name:'Estancos'},starbucks_pg103:{project:'starbucks',name:'Starbucks · PG103'},cafebreria:{project:'cafebreria',name:'Cafebrería'},cafeteria:{project:'cafeteria',name:'Cafetería'},supermercado:{project:'supermercado',name:'Supermercado'},creator:{project:'creator',name:'Xpace Creator'},shoptalk:{project:'shoptalk',name:'Shoptalk'}};
const projects={estancos:'xtanco',xtanco:'xtanco',starbucks:'starbucks_pg103',cafebreria:'cafebreria',cafeteria:'cafeteria',supermercado:'supermercado',creator:'creator',shoptalk:'shoptalk'};
export function inventoryContext(input){
 const url=new URL(input,'https://www.xpaceos.com'),q=url.searchParams;
 const scoped=q.has('space')||q.has('project')||q.has('loc');
 const space=q.get('space')||(q.get('loc')==='alsea-sbux-021'?'starbucks_pg103':projects[q.get('project')])||'';
 const known=spaces[space]||(/^xtanco_altadis-bcn-00[1-9]$/.test(space)?{project:'estancos',name:'Estancos · '+space.slice(7)}:null);
 const valid=!!known&&(!q.get('project')||projects[q.get('project')]===projects[known.project]);
 return {scoped,valid,space:scoped?space:'xtanco',project:known?.project||'',name:known?.name||'Xpacio',lang:q.get('lang')==='en'?'en':'es'};
}
export function inventoryURL(input,{space,project,lang}={}){
 const source=new URL(input,'https://www.xpaceos.com'),url=new URL('/inventario/',source);
 for(const key of ['loc','circuit','lang','marca','quality'])if(source.searchParams.has(key))url.searchParams.set(key,source.searchParams.get(key));
 url.searchParams.set('space',space);if(project)url.searchParams.set('project',project);if(lang)url.searchParams.set('lang',lang);
 return url;
}
export function scopedAssets(assets,layout,{scoped=true,valid=true}={}){
 if(!scoped)return assets;if(!valid)return [];
 const ids=new Set(layout.map(item=>item.inventoryAssetId||assetForInstance(item)));
 return assets.filter(asset=>ids.has(asset.id));
}
export function scopedInstances(asset,layout){return layout.filter(item=>(item.inventoryAssetId||assetForInstance(item))===asset.id);}
export function twinURL(input,context){
 const source=new URL(input,'https://www.xpaceos.com');
 if(context.space==='cafebreria'){const url=new URL('/xpacios/cafebreria/',source);for(const key of ['lang','marca'])if(source.searchParams.has(key))url.searchParams.set(key,source.searchParams.get(key));url.searchParams.set('inventory','1');return url;}
 const url=new URL('/admira-xp/',source);for(const key of ['loc','circuit','lang','marca','quality'])if(source.searchParams.has(key))url.searchParams.set(key,source.searchParams.get(key));
 url.searchParams.set('autostart',context.space==='starbucks_pg103'?'cafeteria':context.space.startsWith('xtanco')?'xtanco':context.space);if(context.project)url.searchParams.set('project',context.project);if(context.space==='starbucks_pg103')url.searchParams.set('loc','alsea-sbux-021');url.searchParams.set('inventory','1');return url;
}
