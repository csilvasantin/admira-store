import {DEMO_MUSIC} from './starbucks-demo.mjs?v=devices-1';
// Published Stock assets selected for this venue. Keep durable references here:
// /hilomusical/next is a delivery queue with a 24-hour retention period.
export const STARBUCKS_PLAYLIST={
  schemaVersion:1,
  id:'starbucks-alsea-paseo-de-gracia',
  title:'Starbucks Alsea · Paseo de Gracia · hiloMusical',
  playback:{order:'sequential',repeat:'all',screenMuted:true,audioOwner:'XpaceOS speaker',crossDeviceSync:false},
  localState:{api:'window.XpaceStarbucksMusic',event:'xpaceos:starbucks-music',scope:'local-page',schemaVersion:1,physicalMugVerified:false},
  tracks:DEMO_MUSIC
};
export const STARBUCKS_PUBLISHED_TRACKS=STARBUCKS_PLAYLIST.tracks;
