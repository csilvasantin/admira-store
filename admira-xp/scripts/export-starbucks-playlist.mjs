import {writeFile} from 'node:fs/promises';
import {STARBUCKS_PLAYLIST} from './starbucks-playlist.mjs';

// Public static snapshot for PlayerTaza and other consumers. Do not edit by hand.
await writeFile(new URL('../starbucks-playlist.json',import.meta.url),JSON.stringify(STARBUCKS_PLAYLIST,null,2)+'\n');
