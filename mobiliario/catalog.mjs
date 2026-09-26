import { definePiece } from '../eras/epoch.mjs';

// Categoría Mobiliario para Xpacios. La planta es el objeto testigo: siempre está.
export const FURNITURE = [
  definePiece({ id: 'planta', saga: 'Planta', silhouette: 'plant', color: '#3ddc6a', witness: true, x: 24, y: 250, fn: 'testigo' }),
  definePiece({ id: 'silla', saga: 'Silla', silhouette: 'chair', color: '#ff5a36', x: 160, y: 250, fn: 'sentarse' }),
  definePiece({ id: 'mesa', saga: 'Mesa', silhouette: 'table', color: '#3aa0ff', x: 296, y: 250, fn: 'apoyar' }),
  definePiece({ id: 'sofa', saga: 'Sofá', silhouette: 'sofa', color: '#c45cff', x: 432, y: 250, fn: 'recostarse' }),
  definePiece({ id: 'lampara', saga: 'Lámpara', silhouette: 'lamp', color: '#ffd23a', x: 584, y: 250, fn: 'alumbrar' }),
  definePiece({ id: 'pantalla', saga: 'Pantalla', silhouette: 'screen', color: '#5ce1ff', x: 710, y: 250, fn: 'emitir' }),
];
