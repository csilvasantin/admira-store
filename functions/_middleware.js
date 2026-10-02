// Perímetro de seguridad de toda la web (login de Google + permiso por web en
// AdmiraNeXT). La lógica vive en _perimetro.js; ver allí el porqué.
import {perimetro} from './_perimetro.js';

import {withPresence} from "./_live-presence.js";
export const onRequest = async (context) => withPresence(await perimetro(context));
