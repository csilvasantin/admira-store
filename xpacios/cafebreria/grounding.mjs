import * as T from '../../admira-xp/scripts/premium-three.mjs';

// Keep the historical X/Z editor coordinates; the floor, not Blender's
// default Cube, defines the vertical datum and the street footprint.
export function groundCafe(root,nodes,manifest){
  root.updateMatrixWorld(true);
  const sourceBox=new T.Box3().setFromObject(root),size=sourceBox.getSize(new T.Vector3());
  const floor=nodes.get(manifest.items.find(r=>r.id==='glb:suelo')?.node);
  if(!floor)throw Error('Falta el suelo de la Cafebrería');
  const sourceFloor=new T.Box3().setFromObject(floor);
  root.position.x-=sourceBox.min.x;root.position.z-=sourceBox.min.z;
  root.position.y+=.025-sourceFloor.max.y;
  root.updateMatrixWorld(true);
  const floorBox=new T.Box3().setFromObject(floor);
  return {size,floorBox,street:{cols:floorBox.max.x-floorBox.min.x,rows:floorBox.max.z-floorBox.min.z,wallHeight:sourceBox.max.y-sourceFloor.max.y},
    placeStreet(scene){const exterior=scene.getObjectByName('life:exterior');if(exterior){exterior.position.x=floorBox.min.x;exterior.position.z=floorBox.min.z;}}};
}
