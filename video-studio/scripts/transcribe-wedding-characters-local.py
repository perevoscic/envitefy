import os,sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'out/wedding-characters/local-review-runtime'))
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING']='1'
from faster_whisper import WhisperModel
model=WhisperModel(os.environ.get('WEDDING_SPEECH_MODEL','base.en'),device='cpu',compute_type='int8',download_root=str(root/'out/wedding-characters/local-review-model'))
for name in sys.argv[1:]:
    source=root/'out/wedding-characters'/name
    segments,info=model.transcribe(str(source),beam_size=5,word_timestamps=True,condition_on_previous_text=False)
    result=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'word':w.word,'start':w.start,'end':w.end,'probability':w.probability} for w in (s.words or [])]} for s in segments]
    (root/'projects/wedding-characters'/f'{source.stem}-local-transcript.json').write_text(json.dumps(result,indent=2))
    print(json.dumps(result))


