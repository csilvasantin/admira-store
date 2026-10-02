import {createShelfScreenPreview,connectShelfPreviewChannel} from './shelf-screen-preview.mjs?v=shelf-products-1';
// Installs the local priority layer; never changes a DS pin or publishes media.
export function mountShelfProductsRuntime({target=window,acquireSurface,drawMedia,enabled=()=>true,createImage,createVideo,storage}={}){
 target.__shelfProductsRuntime?.dispose();
 const controller=createShelfScreenPreview({acquireSurface:id=>enabled()?acquireSurface(id):null,drawMedia,createImage,createVideo}),draw=controller.draw;
 controller.draw=(...args)=>{if(enabled())return draw(...args);if(controller.status().phase!=='stopped')controller.stop();return false;};
 const disconnect=connectShelfPreviewChannel(controller,{target,storage});target.__shelfScreenPreview=controller;
 const change=()=>{if(!enabled())controller.stop();};target.addEventListener('xpaceos:project-change',change);
 let disposed=false;const runtime={controller,dispose(){if(disposed)return;disposed=true;controller.dispose();disconnect();target.removeEventListener('xpaceos:project-change',change);target.removeEventListener('pagehide',runtime.dispose);if(target.__shelfScreenPreview===controller)delete target.__shelfScreenPreview;if(target.__shelfProductsRuntime===runtime)delete target.__shelfProductsRuntime;}};
 target.__shelfProductsRuntime=runtime;target.addEventListener('pagehide',runtime.dispose,{once:true});return runtime;
}
