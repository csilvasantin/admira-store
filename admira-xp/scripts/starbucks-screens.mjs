import {DEMO_WALL,DEMO_CHRISTMAS} from './starbucks-demo.mjs?v=devices-1';
// Canonical shared wall playlist and calibrated virtual players. Real player IDs remain unbound.
export const STARBUCKS_SCREEN_PLAYLIST={
  "schemaVersion": 1,
  "id": "starbucks-alsea-paseo-de-gracia-wall",
  "store": "starbucks-alsea-paseo-de-gracia",
  "muted": true,
  "repeat": "all",
  "display": {"default":"individual","order":[1,2,3,4,5,6],"numbering":"from street entrance; wall view left to right: 6,5,4,3,2,1","screenNumbersById":{"starbucks-wall-01":6,"starbucks-wall-02":5,"starbucks-wall-03":4,"starbucks-wall-04":3,"starbucks-wall-05":2,"starbucks-wall-06":1},"spatialOrder":[6,5,4,3,2,1],"groups":[[1,2,3],[4],[5,6]],"total":[1,2,3,4,5,6],"fit":"cover for spans; contain for individual screens","storageKey":"xpaceos.starbucks.wall-display.v1"},
  "tracks": [...DEMO_WALL,...DEMO_CHRISTMAS]
};
export const STARBUCKS_WALL_VIEW={
  "yaw": 16.4651749580645,
  "pitch": 10.632539210967648,
  "fov": 65
};
export const STARBUCKS_WALL_MAPPING={
  "version": 1,
  "capture": "alsea-starbucks-360",
  "players": [
    {
      "id": "starbucks-wall-01",
      "name": "Starbucks · 6",
      "playerId": "",
      "url": "https://stock.admira.store/stock/1790708784283-yvy7w9/asset.mp4",
      "type": "video",
      "width": 360,
      "height": 640,
      "corners": [
        {
          "yaw": 52.198133,
          "pitch": 16.319982
        },
        {
          "yaw": 48.54128,
          "pitch": 17.476228
        },
        {
          "yaw": 47.468601,
          "pitch": 7.503179
        },
        {
          "yaw": 51.284016,
          "pitch": 7.020458
        }
      ]
    },
    {
      "id": "starbucks-wall-02",
      "name": "Starbucks · 5",
      "playerId": "",
      "url": "https://stock.admira.store/stock/1790708784283-yvy7w9/asset.mp4",
      "type": "video",
      "width": 360,
      "height": 640,
      "corners": [
        {
          "yaw": 48.191548,
          "pitch": 17.538685
        },
        {
          "yaw": 43.92489,
          "pitch": 18.836605
        },
        {
          "yaw": 42.787992,
          "pitch": 8.164901
        },
        {
          "yaw": 47.201178,
          "pitch": 7.523903
        }
      ]
    },
    {
      "id": "starbucks-wall-03",
      "name": "Starbucks · 4",
      "playerId": "",
      "url": "https://stock.admira.store/stock/1790708784283-yvy7w9/asset.mp4",
      "type": "video",
      "width": 360,
      "height": 640,
      "corners": [
        {
          "yaw": 35.631935,
          "pitch": 21.095054
        },
        {
          "yaw": 29.404923,
          "pitch": 22.379174
        },
        {
          "yaw": 28.371476,
          "pitch": 9.805911
        },
        {
          "yaw": 34.612086,
          "pitch": 9.235148
        }
      ]
    },
    {
      "id": "starbucks-wall-04",
      "name": "Starbucks · 3",
      "playerId": "",
      "url": "https://stock.admira.store/stock/1790708784283-yvy7w9/asset.mp4",
      "type": "video",
      "width": 360,
      "height": 640,
      "corners": [
        {
          "yaw": 7.651292,
          "pitch": 24.874202
        },
        {
          "yaw": -0.916088,
          "pitch": 24.956944
        },
        {
          "yaw": -0.891378,
          "pitch": 11.189915
        },
        {
          "yaw": 7.393863,
          "pitch": 11.06005
        }
      ]
    },
    {
      "id": "starbucks-wall-05",
      "name": "Starbucks · 2",
      "playerId": "",
      "url": "https://stock.admira.store/stock/1790708784283-yvy7w9/asset.mp4",
      "type": "video",
      "width": 360,
      "height": 640,
      "corners": [
        {
          "yaw": -1.571098,
          "pitch": 24.96937
        },
        {
          "yaw": -9.895858,
          "pitch": 24.620387
        },
        {
          "yaw": -9.62831,
          "pitch": 11.008248
        },
        {
          "yaw": -1.509388,
          "pitch": 11.152505
        }
      ]
    },
    {
      "id": "starbucks-wall-06",
      "name": "Starbucks · 1",
      "playerId": "",
      "url": "https://stock.admira.store/stock/1790708784283-yvy7w9/asset.mp4",
      "type": "video",
      "width": 360,
      "height": 640,
      "corners": [
        {
          "yaw": -10.927678,
          "pitch": 24.641729
        },
        {
          "yaw": -18.565843,
          "pitch": 23.715575
        },
        {
          "yaw": -17.873671,
          "pitch": 10.569829
        },
        {
          "yaw": -10.346931,
          "pitch": 10.987576
        }
      ]
    }
  ]
};
