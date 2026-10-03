import {assetForInstance} from './model.mjs?v=scope-20261004-1';
// Counts are unit/record counts, never the global catalogue size or model count.
export function inventoryRows({space,layout=[],removed={},assets=[],units=[],devices=[]}={}){
 if(!space)return [];
 const models=new Map(assets.map(asset=>[asset.id,asset])),rows=new Map();
 const starbucks=space==='starbucks_pg103';
 for(const item of [...layout,...Object.values(removed)]){
  if(!item?.id||starbucks&&item.id==='sb-pillar'||rows.has(item.id))continue;
  const asset=models.get(assetForInstance(item));
  rows.set(item.id,{id:item.id,name:item.label||asset?.name||item.id,category:asset?.category||'Mobiliario',asset,item,retired:!!removed[item.id],placed:!removed[item.id]});
 }
 if(starbucks){
  for(const unit of units){const row=rows.get(unit.instance_id),asset=assets.find(a=>a.number===unit.asset_number);rows.set(unit.instance_id,{id:unit.instance_id,name:unit.name,category:'Mobiliario',asset,code:unit.itil_code,reference:unit.reference_id,...row});}
  for(const device of devices)if(!rows.has(device.id))rows.set(device.id,{id:device.id,name:device.name,category:'IoT',virtual:true});
 }
 return [...rows.values()];
}
