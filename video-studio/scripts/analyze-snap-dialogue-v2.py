import wave,numpy as np,json
from pathlib import Path
p=Path('public/projects/mom-just-snap-it'); w=wave.open(str(p/'dialogue-edit.wav'));a=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2)/32768;s=w.getframerate()
result=[]
for label,t,e in [('Girl opening',0,1.8),('Girl discovery',7,14.4),('Girl actions',21.1,25),('Mom payoff',28,31)]:
 b=a[int(t*s):int(e*s)]
 def db(x):return round(float(20*np.log10(np.sqrt(np.mean(x**2))+1e-9)),2)
 result.append(dict(line=label,stereoRMSdb=db(b),monoRMSdb=db(b.mean(1)),correlation=round(float(np.corrcoef(b.T)[0,1]),3)))
print(json.dumps(result,indent=2));Path('projects/mom-just-snap-it/dialogue-v1-levels.json').write_text(json.dumps(result,indent=2))
