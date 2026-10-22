import {TOUCH_RECEIVERS} from './ainimation-receivers.mjs?v=scene-3d-1';
import {registerInteractiveScreens} from './ainimation-delivery.mjs?v=scene-3d-1';
import {surfaceCSS} from './ainimation-surface.mjs?v=scene-3d-1';
export function mountSceneInteractive({root,stage,viewer,location,win=window}){
 const config=TOUCH_RECEIVERS.find(r=>r.location===location);if(!config)return null;
 const doc=root.ownerDocument,host=doc.createElement('div'),width=config.orientation==='portrait'?608:1080,height=config.orientation==='portrait'?1080:608;
 host.dataset.ainimationSceneScreen=config.screen;host.setAttribute('aria-label',config.name+' · '+config.label);
 host.style.cssText=`position:absolute;top:0;left:0;width:${width}px;height:${height}px;transform-origin:0 0;overflow:hidden;pointer-events:none;z-index:3;display:none`;
 stage.append(host);
 const dispose=registerInteractiveScreens({win,root,location,host:id=>id===config.screen&&viewer.hasTouchSurface(id)?host:null,refocus:true,focus:id=>viewer.focusTouchSurface(id)});
 let reported;
 function update(){
  const ready=viewer.hasTouchSurface(config.screen);if(ready!==reported){reported=ready;if(win.parent!==win)win.parent.postMessage({type:'ainimation-scene-receiver',location,screen:config.screen,ready},win.location.origin);if(ready)win.dispatchEvent(new win.Event('xpace:ainimation-ready'));}
  const value=viewer.touchSurface(config.screen),rect=stage.getBoundingClientRect();
  const transform=value&&surfaceCSS(value.corners.map(p=>({x:p.x-rect.left,y:p.y-rect.top})),width,height);
  host.style.display=transform?'block':'none';host.dataset.projected=String(!!transform);if(transform)host.style.transform=transform;
 }
 update();return {update,dispose(){dispose();host.remove();if(win.parent!==win)win.parent.postMessage({type:'ainimation-scene-receiver',location,screen:config.screen,ready:false,reason:'view-closed'},win.location.origin);},screen:config.screen};
}
