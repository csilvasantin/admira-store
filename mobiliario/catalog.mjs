import { definePiece } from '../eras/epoch.mjs';

// Números del registro inventario/registry.json. No hay catálogo paralelo.
// 33 y 22 y 24 siguen en el registro; la sala enseña un mueble de cada tipo.
export const KIT = [
  { number: 9, id: 'planta', saga: 'Planta', title: 'Planta', silhouette: 'plant', color: '#c4784a', type: 'planta', fn: 'testigo', witness: true, x: 70, location: 'sala · izquierda', state: 'en_sala', maintenance: 'ok' },
  { number: 43, id: 'silla', saga: 'Silla', title: 'Silla de madera', silhouette: 'chair', color: '#c4a574', type: 'silla', fn: 'sentarse', x: 210, location: 'sala · junto a la planta', state: 'en_sala', maintenance: 'ok' },
  { number: 37, id: 'mesa', saga: 'Mesa', title: 'Mesa ogro', silhouette: 'table', color: '#d6d39a', type: 'mesa', fn: 'apoyar', x: 350, location: 'sala · centro', state: 'en_sala', maintenance: 'ok' },
  { number: 39, id: 'sofa', saga: 'Sofá', title: 'Sofá verde', silhouette: 'sofa', color: '#6f9a78', type: 'sofa', fn: 'recostarse', x: 500, location: 'sala · centro-derecha', state: 'en_sala', maintenance: 'ok' },
  { number: 10, id: 'lampara', saga: 'Lámpara', title: 'Lámpara', silhouette: 'lamp', color: '#d4b46a', type: 'lampara', fn: 'alumbrar', x: 660, location: 'sala · fondo', state: 'en_sala', maintenance: 'ok' },
  { number: 13, id: 'pantalla', saga: 'Pantalla', title: 'Pantalla TFT', silhouette: 'screen', color: '#2f6f66', type: 'pantalla', fn: 'emitir', x: 800, location: 'sala · pared', state: 'en_sala', maintenance: 'ok' },
];

export const FURNITURE = KIT.map((item) => definePiece({
  id: item.id,
  saga: item.saga,
  silhouette: item.silhouette,
  color: item.color,
  witness: item.witness,
  x: item.x,
  y: 300,
  fn: item.fn,
}));

export function skinUrl(number, bits, rotation) {
  const nn = String(number).padStart(2, '0');
  const rot = ((rotation % 4) + 4) % 4;
  const best = `/admira-xp/assets/matrix-furniture/catalog/${nn}-r${rot}.png`;
  if (bits === 32) return { url: best, fallback: false };
  if (bits === 64 && rot !== 0) return { url: best, fallback: true };
  return { url: `./skins/${bits}/${nn}-r${rot}.png`, fallback: false };
}
