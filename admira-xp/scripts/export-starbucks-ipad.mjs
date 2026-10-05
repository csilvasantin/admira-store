import {writeFile} from 'node:fs/promises';
import {STARBUCKS_IPAD_PLAYLIST,STARBUCKS_IPAD_MAPPING} from './starbucks-ipad.mjs';
for(const [file,value] of [['starbucks-ipad-playlist.json',STARBUCKS_IPAD_PLAYLIST],['starbucks-ipad-mapping.json',STARBUCKS_IPAD_MAPPING]])await writeFile(new URL('../'+file,import.meta.url),JSON.stringify(value,null,2)+'\n');
