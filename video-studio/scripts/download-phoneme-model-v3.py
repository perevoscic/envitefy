from pathlib import Path
import urllib.request,hashlib
root=Path(__file__).resolve().parents[1]
dest=root/'out/mom-just-snap-it/local-phoneme-model';dest.mkdir(parents=True,exist_ok=True)
base='https://huggingface.co/onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX/resolve/main/'
for name,remote in [('model.onnx','onnx/model_quantized.onnx'),('vocab.json','vocab.json')]:
 target=dest/name
 if target.exists():print(name+' already downloaded',flush=True);continue
 with urllib.request.urlopen(base+remote,timeout=60) as r,target.open('wb') as f:
  total=0
  while True:
   chunk=r.read(1024*1024)
   if not chunk:break
   f.write(chunk);total+=len(chunk)
   if total%(40*1024*1024)<1024*1024:print(f'{name}: {total//1024//1024} MB',flush=True)
 digest=hashlib.sha256(target.read_bytes()).hexdigest()
 if name=='model.onnx' and digest!='3d1479b5c70836645a4310902479f7f7e8bbc8c16c58745d918804f4f6f9d120':raise RuntimeError('Model hash mismatch')
 print(name+' verified '+digest,flush=True)
