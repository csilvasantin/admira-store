import {mountInventoryWorkspace} from '../../inventario/workspace.mjs?v=inventory-merge-20261004-1';
const doc=document,host=doc.getElementById('expertCategoryDetail'),view=doc.querySelector('#telegramDock .expert-view-pane'),abort=new AbortController();
let workspace;
function previewLabel(){const label=doc.getElementById('expertPreviewLabel');if(label)label.textContent=['itil','inventory'].includes(host?.closest('.expert-workspace')?.dataset.activeCategory)?(doc.documentElement.lang==='en'?'DETAIL':'DETALLE'):(doc.documentElement.lang==='en'?'PREVIEWS':'PREVIOS');}
function updateCount(count){
 previewLabel();
 const en=doc.documentElement.lang==='en',label=count+' items';
 for(const button of doc.querySelectorAll('#advInventoryCli,[data-category-id=inventory]')){const status=button.querySelector('.expert-category-status')||button.querySelector('span');if(status&&status.textContent!==label)status.textContent=label;button.title='Inventory/ITIL · '+label;button.setAttribute('aria-label','Inventory/ITIL · '+label);}
}
if(host&&view){
 const list=doc.createElement('section');list.dataset.detailCategory='inventory-list';list.className='itil-workspace';list.hidden=true;host.append(list);
 const detail=doc.createElement('section');detail.className='itil-record';detail.dataset.inventoryDetail='';detail.hidden=true;view.append(detail);
 workspace=mountInventoryWorkspace({listHost:list,detailHost:detail,read:()=>window.XpaceInventorySource?.read()||{},onCount:updateCount,signal:abort.signal});
 doc.addEventListener('xpace:inventory-select',event=>{
  const category=event.detail.category;
  if(['itil','inventory'].includes(category)){for(const node of host.children)node.hidden=node!==list&&!(category==='inventory'&&node.dataset.detailCategory==='inventory');host.hidden=false;doc.getElementById('expertControlsLabel').textContent=doc.documentElement.lang==='en'?'INVENTORY':'INVENTARIO';workspace.show();}
  else workspace.hide();
  previewLabel();
 },{signal:abort.signal});
 window.XpaceInventoryUI={show:()=>workspace.show(),get count(){return workspace.count;},open(category='inventory'){
  const button=doc.getElementById('pfExpert');if(doc.body.classList.contains('xp-left-hidden'))button?.click();window.dispatchEvent(new Event('resize'));
  category=category==='itil'?'inventory':category;
  const card=doc.querySelector('#expertQuickIcons [data-category-id="'+category+'"]');if(card)window.XpaceExpertDetail?.select(card);
 }};
 doc.addEventListener('xpaceos-inventory-change',()=>workspace.refresh(true),{signal:abort.signal});
 window.addEventListener('pagehide',()=>{abort.abort();workspace.dispose();},{once:true});
}
export function openNativeInventory(category='inventory'){window.XpaceInventoryUI?.open(category);}
