// New virtual landscape surface. Photo identifies the old sign, not installed hardware.
export const STARBUCKS_IPAD_ID='starbucks-ipad-01';
export const STARBUCKS_IPAD_PLAYLIST={schemaVersion:1,id:'starbucks-alsea-paseo-de-gracia-ipad',store:'starbucks-alsea-paseo-de-gracia',purpose:'counter-landscape-advertising',muted:true,repeat:'all',tracks:[]};
export const STARBUCKS_IPAD_MAPPING={version:1,capture:'alsea-starbucks-360',players:[{id:STARBUCKS_IPAD_ID,name:'iPad horizontal',playerId:'',url:'',type:'video',width:1024,height:768,corners:[{yaw:19.564034,pitch:5.076355},{yaw:10.492924,pitch:5.267327},{yaw:10.505333,pitch:-.770688},{yaw:20.758103,pitch:-.875231}]}]};
export const STARBUCKS_IPAD_VIEW={yaw:15.6,pitch:2.1,fov:30};
// Seed only missing identity, retaining all saved calibration and other players.
export function withStarbucksIPad(model){
 if(model.players.some(p=>p.id===STARBUCKS_IPAD_ID)||model.players.length>=24)return model;
 return {...model,players:[...model.players,structuredClone(STARBUCKS_IPAD_MAPPING.players[0])]};
}
