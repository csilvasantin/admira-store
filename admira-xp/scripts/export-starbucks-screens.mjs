import {writeFile} from 'node:fs/promises';
import {STARBUCKS_SCREEN_PLAYLIST,STARBUCKS_WALL_MAPPING} from './starbucks-screens.mjs';
for(const [file,value] of [['starbucks-screen-playlist.json',STARBUCKS_SCREEN_PLAYLIST],['starbucks-wall-mapping.json',STARBUCKS_WALL_MAPPING]])await writeFile(new URL('../'+file,import.meta.url),JSON.stringify(value,null,2)+'\n');
