import {writeFile} from 'node:fs/promises';
import {STARBUCKS_TPV_PLAYLIST,STARBUCKS_TPV_MAPPING} from './starbucks-tpv.mjs';
for(const [file,value] of [['starbucks-tpv-playlist.json',STARBUCKS_TPV_PLAYLIST],['starbucks-tpv-mapping.json',STARBUCKS_TPV_MAPPING]])await writeFile(new URL('../'+file,import.meta.url),JSON.stringify(value,null,2)+'\n');
