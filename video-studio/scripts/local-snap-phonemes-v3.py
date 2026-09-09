from pathlib import Path
import sys,os,json,subprocess,itertools,hashlib
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'out/wedding-characters/local-review-runtime'))
os.environ['HF_HUB_OFFLINE']='1';os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
import numpy as np
import onnxruntime as ort
ort.disable_telemetry_events()
model=root/'out/mom-just-snap-it/local-phoneme-model'
options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
session=ort.InferenceSession(str(model/'model.onnx'),sess_options=options,providers=['CPUExecutionProvider'])
vocab=json.loads((model/'vocab.json').read_text());decoder={v:k for k,v in vocab.items()};blank=vocab.get('<pad>',0)
print('Inputs',[(x.name,x.shape,x.type) for x in session.get_inputs()],flush=True)
clips=[('user_acoustic_reference','assets/brand/audio/envitefy-approved-pronunciation-reference.wav',0,None),('approved_synthetic_reference','assets/brand/audio/envitefy-approved-jessica-concierge.mp3',0,None),('candidate_clean_dialogue','out/mom-just-snap-it/discovery-edited-voice.wav',0,3.0),('candidate_final_mix','public/projects/mom-just-snap-it/final-mix-v2.wav',7,3.0)]
results=[]
for name,path,start,duration in clips:
 source=root/path;args=['ffmpeg','-v','error','-ss',str(start),'-i',str(source)]
 if duration is not None:args+=['-t',str(duration)]
 args+=['-ar','16000','-ac','1','-f','f32le','-']
 data=np.frombuffer(subprocess.run(args,check=True,stdout=subprocess.PIPE).stdout,dtype=np.float32).copy()
 data=(data-data.mean())/np.sqrt(data.var()+1e-7)
 feed={'input_values':data[None]}
 if any(x.name=='attention_mask' for x in session.get_inputs()):feed['attention_mask']=np.ones((1,len(data)),np.int64)
 logits=session.run(None,feed)[0][0];ids=logits.argmax(-1)
 tokens=[]
 for token,group in itertools.groupby(enumerate(ids),key=lambda x:int(x[1])):
  entries=list(group)
  if token==blank:continue
  tokens.append({'phoneme':decoder.get(token,str(token)),'start':round(entries[0][0]*.02+start,3),'end':round((entries[-1][0]+1)*.02+start,3)})
 record={'name':name,'file':path,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'phonemes':' '.join(t['phoneme'] for t in tokens),'tokens':tokens}
 print(name+': '+record['phonemes'],flush=True);results.append(record)
(root/'projects/mom-just-snap-it/local-phoneme-review-v3.json').write_text(json.dumps({'method':'Offline Wav2Vec2 phoneme recognition using ONNX CPU. No audio uploads. Phonetic labels are acoustic estimates, not listening approval.','model':'facebook/wav2vec2-lv-60-espeak-cv-ft (ONNX int8)','results':results},ensure_ascii=False,indent=2))
