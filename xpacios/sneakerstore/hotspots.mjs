// Puntos pulsables de las fotografías 360, en ángulos del mundo de la esfera de panorama.mjs: yaw hacia la derecha de
// la vista inicial y pitch hacia arriba, en radianes. Medidos sobre la vista inicial de cada foto (fov 85°).
export const HOTSPOTS={
  // La puerta de cristal del fondo de Entrada, con el rótulo IoT Gallery: abre la cámara exterior (Carlos, 22-oct-2026).
  entrada:[{id:'iot-gallery',yaw:[-.30,.40],pitch:[-.48,.42]}],
};

// Tarjeta Puerta Cam (como el dispositivo de IEU): centrada en la puerta, bajo el rótulo WWW.IOT.GALLERY.
export const PUERTA_CAM_ANCHOR={scene:'entrada',yaw:.05,pitch:.12};

// Dirección del mundo para unos ángulos (la inversa de hotspotAt).
export function directionOf({yaw,pitch}){return {x:Math.cos(pitch)*Math.cos(yaw),y:Math.sin(pitch),z:Math.cos(pitch)*Math.sin(yaw)};}

export function hotspotAt(scene,direction){
  const spots=HOTSPOTS[scene];if(!spots||!direction)return null;
  const length=Math.hypot(direction.x,direction.y,direction.z);if(!length)return null;
  const yaw=Math.atan2(direction.z,direction.x),pitch=Math.asin(Math.max(-1,Math.min(1,direction.y/length)));
  return spots.find(s=>yaw>=s.yaw[0]&&yaw<=s.yaw[1]&&pitch>=s.pitch[0]&&pitch<=s.pitch[1])?.id||null;
}
