// Escala 8/16/32/64. La usan el mobiliario de los Xpacios y, con el mismo
// registro, los gemelos de vehículos de videoanalytics. La época es una skin:
// no mueve el objeto ni cambia su función.

export const EPOCHS = [
  { bits: 8, id: '8', surname: '80', label: '8 bits', decade: '80', sound: 'chiptune' },
  { bits: 16, id: '16', surname: '90', label: '16 bits', decade: '90', sound: 'cartridge' },
  { bits: 32, id: '32', surname: 'Actual', label: '32 bits', decade: 'now', sound: 'current' },
  { bits: 64, id: '64', surname: 'Matrix', label: '64 bits', decade: 'matrix', sound: 'matrix' },
];

export function epochByBits(bits) {
  const epoch = EPOCHS.find((item) => item.bits === Number(bits));
  if (!epoch) throw new Error('época desconocida');
  return epoch;
}

export function displayName(saga, epoch) {
  return `${saga} ${epoch.surname}`;
}

// Un registro. saga, silhouette y color no viven en la skin.
export function definePiece({ id, saga, silhouette, color, role = 'furniture', witness = false, x, y, fn }) {
  if (!id || !saga || !silhouette || !color) throw new Error('falta id, saga, silueta o color');
  const skins = {};
  for (const epoch of EPOCHS) {
    skins[epoch.id] = { bits: epoch.bits, surname: epoch.surname, name: displayName(saga, epoch), sound: epoch.sound };
  }
  return { id, saga, silhouette, color, role, witness, x, y, fn, skins };
}

export function applyEpoch(piece, bits) {
  const epoch = epochByBits(bits);
  const skin = piece.skins[epoch.id];
  return {
    id: piece.id,
    saga: piece.saga,
    silhouette: piece.silhouette,
    color: piece.color,
    role: piece.role,
    witness: piece.witness,
    x: piece.x,
    y: piece.y,
    fn: piece.fn,
    bits: epoch.bits,
    name: skin.name,
    sound: skin.sound,
    skin,
  };
}

// La planta testigo va la primera. El resto conserva el orden del catálogo.
export function sweepOrder(pieces) {
  const witness = pieces.filter((piece) => piece.witness);
  const rest = pieces.filter((piece) => !piece.witness);
  return witness.concat(rest);
}
