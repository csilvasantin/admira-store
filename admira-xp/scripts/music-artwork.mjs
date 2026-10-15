// Visual curation only. The TV playlist, audio URL and ordering stay authoritative.
export const BAD_TIMES_ID='1790706121644-y5mqrq';
export const BAD_TIMES_COVER='https://img.youtube.com/vi/8PeU6AVPQVg/hqdefault.jpg';
export function musicArtwork(track){return (track?.id||track?.stockId)===BAD_TIMES_ID?{mode:'artwork',title:'Bad Times · Deep House',url:BAD_TIMES_COVER,aspect:3/2}:null;}
