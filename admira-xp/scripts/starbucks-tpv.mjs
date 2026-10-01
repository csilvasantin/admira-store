import {DEMO_TPV} from './starbucks-demo.mjs?v=devices-1';
// Separate local-advertising playlist for the customer-facing virtual POS screen.
export const STARBUCKS_TPV_PLAYLIST={
  "schemaVersion": 1,
  "id": "starbucks-alsea-paseo-de-gracia-tpv",
  "store": "starbucks-alsea-paseo-de-gracia",
  "purpose": "local-advertising",
  "muted": true,
  "repeat": "all",
  "tracks": DEMO_TPV
};
export const STARBUCKS_TPV_MAPPING={
  "version": 1,
  "capture": "alsea-starbucks-360",
  "players": [
    {
      "id": "starbucks-tpv-01",
      "name": "Starbucks · TPV / POS",
      "playerId": "",
      "url": "https://stock.admira.store/stock/1790711463701-yxy150/asset.mp4",
      "type": "video",
      "width": 360,
      "height": 640,
      "corners": [
        {
          "yaw": 43.089694,
          "pitch": -1.290079
        },
        {
          "yaw": 39.146838,
          "pitch": -1.278682
        },
        {
          "yaw": 40.879539,
          "pitch": -10.275015
        },
        {
          "yaw": 44.87092,
          "pitch": -9.799996
        }
      ]
    }
  ]
};
export const STARBUCKS_TPV_VIEW={
  "yaw": 48.4651749580645,
  "pitch": -13.367460789032352,
  "fov": 45
};
// Seed missing TPV in memory; never rewrite saved corners, URLs or localStorage.
export function withStarbucksTPV(model){
 if(model.players.some(p=>p.id===STARBUCKS_TPV_MAPPING.players[0].id)||model.players.length>=24)return model;
 return {...model,players:[...model.players,structuredClone(STARBUCKS_TPV_MAPPING.players[0])]};
}
