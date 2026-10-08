"""install.py BATCH "19 20 ..." -> copy out/<n> LODs into catalog + write hiperreal.manifest.json (template: piece 07)"""
import sys,os,json,shutil
H=os.path.dirname(os.path.abspath(__file__)); BATCH=int(sys.argv[1]); P=sys.argv[2].split()
CAT=os.environ['CAT']; TEX=os.path.normpath(CAT+'/../hiperreal-tex'); cfg=json.load(open(H+'/pieces.json'))
tpl=json.load(open(f'{CAT}/07/hiperreal.manifest.json'))
for n in P:
    d=f'{CAT}/{int(n):02d}'; o=f'{H}/out/{n}'; log=json.load(open(o+'/build-log.json'))
    os.makedirs(d+'/hiperreal',exist_ok=True)
    shutil.copy(o+'/hiperreal.glb',d+'/hiperreal.glb'); shutil.copy(o+'/hiperreal-hd.glb',d+'/hiperreal/hiperreal-hd.glb'); shutil.copy(o+'/hiperreal.blend',d+'/hiperreal.blend')
    for t in log.get('shared_textures',[]):
        if not os.path.exists(f'{TEX}/{t}'):
            src=next((p for p in (f'{H}/tex/lib/{t}',f'{H}/tex/gen/{t}',f'{H}/hiperreal-tex/{t}') if os.path.exists(p)),None)
            if src: shutil.copy(src,f'{TEX}/{t}')
            else: print('MISSING tex',t)
    pc={**cfg['defaults'],**cfg['pieces'].get(n,{})}
    m=dict(tpl); m.update(number=int(n),name=pc.get('name',''),batch=BATCH,based_on=pc.get('source','best'),
        material_classes=log['materials'],jittered_items=log.get('jittered',0),
        bytes={'web':os.path.getsize(d+'/hiperreal.glb'),'hd':os.path.getsize(d+'/hiperreal/hiperreal-hd.glb'),'best':os.path.getsize(d+'/best.glb')},
        textures=log.get('shared_textures',[]),geometry_detail=log.get('detail',{}),added_parts=log.get('added_parts',[]),
        placed_on_front=log.get('placed_on_front',[]),object_classes=pc.get('object_classes',{}))
    m.pop('twin_instance',None)
    old=f'{d}/hiperreal.manifest.json'
    if os.path.exists(old):
        prev=json.load(open(old)); m['batch']=prev.get('batch',BATCH)
        if 'twin_instance' in prev: m['twin_instance']=prev['twin_instance']
    json.dump(m,open(old,'w'),ensure_ascii=False,indent=2); print(n,m['bytes'])
