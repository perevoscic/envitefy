import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
followups=json.loads((ROOT/'root-followup-results.json').read_text(encoding='utf-8'))
for stem in ['02-mom','07-corporate']:
    path=ROOT/(stem+'.json')
    item=json.loads(path.read_text(encoding='utf-8-sig'))
    item['rootFollowup']=followups[stem]
    item['status']='published and verified on production owner route'
    item['state']='published'
    item['publicUrl']=followups[stem]['publicUrl']
    if stem=='02-mom':
        item['publication'].update(status='Published after one explicit lettering repair',publicUrl=item['publicUrl'],exactBlocker=None)
        item['generation']['repairs'][0]['state']='Passed; attempt 2 ready to review in 72 seconds'
        item['outcome']='Published; production URL resolves to the correct owner workspace'
    else:
        item['generation']['lastObservedStage']='Ready to review; repair passed'
        item['rootFollowup']['productionOwnerRouteVerified']=True
    path.write_text(json.dumps(item,ensure_ascii=False,indent=2),encoding='utf-8')
for stem in ['01-teacher','03-dad']:
    path=ROOT/(stem+'.json');item=json.loads(path.read_text(encoding='utf-8-sig'))
    item['rootFollowup']={'productionOwnerRouteVerified':True,'note':'Root opened the actual published /card/ address; signed-in owner redirected to the matching owner workspace with saved title and artwork. Anonymous guest access was not tested.'}
    if 'execution' in item:
        item['execution']['status']='published; production owner route verified'
        item['execution']['blocker']=None
    path.write_text(json.dumps(item,ensure_ascii=False,indent=2),encoding='utf-8')
path=ROOT/'08-nonprofit.json';item=json.loads(path.read_text(encoding='utf-8-sig'))
item['rootFollowup']={
 'designRetryCount':1,'retryResult':'The background did not pass the design check; 27 seconds elapsed on the second job.',
 'reconnectResult':'Reconnect retained both Checking background and the background-check failure message. No artwork was shown.',
 'approvalRejection':'Automatic approval review rejected selecting the Lantern festival idea because the UI still reported a running check and the trial protocol allowed only one retry.',
 'pendingUserQuestion':'Approve cancellation of stuck job and one new attempt with the exact built-in Lantern festival brief; title, Monday date and guest details retained.',
 'proposedPrompt':'Design a general event Live Card featuring a garden path lined with glowing lanterns leading to a beautifully decorated pavilion. Use peach, emerald and soft gold, rendered as a dimensional paper sculpture with tactile layers and gentle shadows. Keep a clear focal subject, layered surroundings and intentional lighting, with a naturally readable title pocket.'}
item['generation']['retries']=1
item['output']['exactBlocker']='Background check failed on initial job and one explicit retry. New design revision awaits user approval after automatic review rejection.'
if item.get('revisedAttempt',{}).get('output',{}).get('published'):
    item['rootFollowup']['approvalRejectionResolved']=True
    item['rootFollowup']['userAnswer']='Approve one revised attempt'
    item['rootFollowup'].pop('pendingUserQuestion',None)
    item['rootFollowup']['completion']='The single approved revised attempt published successfully; original failed tab no longer existed, so no cancellation was claimed.'
    item.setdefault('initialOutput',dict(item['output']))
    item['output']=item['revisedAttempt']['output']
    item['status']='published_revised_attempt'
path.write_text(json.dumps(item,ensure_ascii=False,indent=2),encoding='utf-8')

def pick(d,*paths):
    for path in paths:
        o=d
        try:
            for k in path.split('.'):o=o[k]
            if o is not None:return o
        except (KeyError,TypeError):pass
    raise KeyError(paths)

names=['teacher','mom','dad','event-creator','wedding-planner','pto-volunteer','corporate','nonprofit','small-business','community-host']
roles=['Teacher','Mom','Dad / team parent','Event creator','Wedding planner','PTO volunteer','Office administrator','Nonprofit coordinator','Small-business owner','Community host']
contexts=[
    'An elementary teacher planning a welcoming family literacy night.',
    'A busy mother planning a fictional eighth birthday.',
    'A father coordinating a youth soccer team celebration.',
    'A professional creator launching a neighborhood supper club.',
    'A wedding planner coordinating a garden welcome evening.',
    'A parent volunteer creating a school fundraiser concept.',
    'An office administrator organizing an innovation workshop.',
    'A volunteer coordinator preparing a community kindness evening.',
    'A shop owner promoting a creative printing workshop.',
    'A retired neighborhood host planning a tea and story swap.'
]
times=['6:00-7:00 PM','5:30-6:30 PM','6:30-8:00 PM','6:30-8:30 PM','6:30-8:00 PM','5:30-7:00 PM','6:00-7:00 PM','6:00-7:30 PM','5:00-6:00 PM','3:00-4:30 PM']
slugs=[
    'books-and-blankets-family-night-at-online-demo-https-envitefy-com',
    'nova-s-galactic-eight-at-online-event',
    'comets-team-celebration-at-online-event',
    'the-long-table-ai-demo-at-online-event',
    'garden-welcome-evening-ai-demo-at-online-event',
    None,
    'innovation-after-hours-at-online-event',None,
    'ink-and-imagination-studio-at-online-event',
    'a-cup-of-stories-ai-demo-at-online-event'
]
initial=['65 s','78 s','64 s','82 s','66 s','68 s','91 s','Failed: 34 s','56 s','66 s']
extras=['Repair + check','1 repair','None','None','None','Repair + check','1 repair','1 design retry','None','Repair + check']
feedback=[
    ['Wording was entered once; logistics stayed editable during generation. One lettering repair took 83 s, followed by a 45 s same-image check. A remaining style concern became an advisory and publication succeeded.',
     'A prefixed online URL was treated as a physical venue; the bare URL worked. The public slug retained the earlier venue wording. Show an explicit online link field and a concise style advisory.'],
    ['Initial wording was correct and readable, but decorative objects in the isolated lettering layer blocked Publish. One repair passed in 72 s and the card was published.',
     'The form could be shortened for a one-hour party by hiding a different end date. Explain the distinction between the two guest-message fields.'],
    ['One generation produced a publishable card with the requested soccer scene; no repair was needed. The updated wording summary removed repeated entry.',
     'Online entry was hidden under Venue name. Share failed in this browser; a visible selectable public URL would provide a useful fallback.'],
    ['One generation produced the detailed supper-club scene and passed without repair. All logistics could be entered while artwork ran; the initial job took 82 s.',
     'Full-screen Preview omits the nearby logistics summary. Optional wording advice did not display a proposed difference. Keep exact wording and professional art-direction control.'],
    ['One generation passed in 66 s; the saved production card was verified. The opening line was small and low contrast in the inspected preview.',
     'Occasion changes starting ideas positioned above it. Move the optional control above those ideas, and show the actual proposed wording change before Apply.'],
    ['Logistics and a fictional RSVP host phone were entered during generation. Initial lettering had correct, readable words but raised a style-only concern. One repair and one same-image check were performed.',
     'School fundraiser was absent from optional Occasion. The two guest-message disclosures had overlapping helper text. Keep RSVP optional and reveal only the contact fields it needs.'],
    ['The first opening line had insufficient contrast against dark glass. One explicit repair passed in 69 s and the published production card was verified.',
     'An online event had no visible named-timezone confirmation. Add an event-link label and a concise timezone summary while retaining venue resolution in final preparation.'],
    ['The original background and one retry failed (34 s and 27 s). The user then approved one revised lantern-garden brief. That attempt was ready in 79 s and published without repair or rechecking.',
     'The revised run used the updated advisory-check policy: correct readable wording with decorative findings could proceed. The earlier conflicting failure/progress display and approval rejection remain recorded as historical evidence.'],
    ['The card published after one 56 s generation with no repair. Exact requested wording and the printing-studio scene were preserved.',
     'Apply wording suggestion offered no visible before/after text. Native Share failed. Show the proposed edit, an online-link cue and a selectable guest-link fallback.'],
    ['The initial card and one repair both raised decorative-layer style findings despite correct readable words. A 67 s same-image check then passed unchanged artwork; publication succeeded.',
     'Generation to observed publication took 7 min 28 s in this automated trial, including recovery/navigation. Verification initially displayed Creating title artwork. Make check status and the next action accurate.']
]
trials=[]
for i,name in enumerate(names,1):
    source=f'{i:02d}-{name}.json'
    raw=json.loads((ROOT/source).read_text(encoding='utf-8-sig'))
    title=pick(raw,'title','event.title','inputs.title','intendedInputs.eventTitle','plannedInputs.eventTitle')
    opening=pick(raw,'openingLine','event.openingLine','inputs.openingLine','intendedInputs.openingLine','plannedInputs.openingLine')
    prompt=pick(raw,'exactArtworkPrompt','exactDesignPrompt','artBrief','event.artBrief','event.designPrompt','inputs.designPrompt','inputs.look','inputs.artBrief','intendedInputs.designPrompt','plannedInputs.exactDesignPrompt')
    if i==6:
        # Consume the final actual address only after the trial has completed.
        url=raw.get('execution',{}).get('publicUrl')
        if url:slugs[i-1]=url.split('/card/')[-1]
    if i==8:
        url=raw.get('revisedAttempt',{}).get('output',{}).get('resultUrl')
        if url:
            slugs[i-1]=url.split('/card/')[-1]
            extras[i-1]='Retry + new brief'
    image=f'{i:02d}-{name}-artwork.webp'
    if i==6:image='06-pto-artwork.webp'
    if not (ROOT/image).exists():
        image=None
    published=slugs[i-1] is not None
    trials.append(dict(id=i,role=roles[i-1],personaContext=contexts[i-1],source=source,
       title=title,opening=opening,prompt=prompt,time=times[i-1],initial=initial[i-1],extra=extras[i-1],
       feedback=feedback[i-1],image=image,cropScreenshot=False,published=published,
       revisedPrompt=raw.get('revisedAttempt',{}).get('prompt') if i==8 else None,
       url='https://envitefy.com/card/'+slugs[i-1] if slugs[i-1] else None,
       blocker='Trial publication still pending.' if not published else None))

data={
 'conclusion':'The revised flow removes duplicate wording and preserves parallel work. Initial trials exposed difficult artwork recovery; all ten cards are now published, including the nonprofit card after its approved brief revision.',
 'method':'Ten distinct AI agents used normal signed-in browser UI and actual generated artwork. Creation used the updated local builder and production backend. All cards are fictional online demos for Monday, October 26, 2026; no invitations or responses were sent. This is AI task testing, not human research or a completion-rate study. UI timings measure provider jobs. The implementation evolved during testing: the revised nonprofit attempt used advisory non-safety checks, and desktop preview placement was subsequently fixed. Intended timezone was Central; most screens displayed Event local time. Public URLs were verified as the signed-in owner with owner-workspace redirects; signed-out access was not tested.',
 'priorities':[
   ['1. Make artwork readiness and recovery consistent','State one clear result: Ready, Needs a wording fix, or Optional style concern. Explain the issue in one sentence; keep detailed diagnostics collapsed. Preserve the existing background and exact words during an explicit lettering repair. Show checking when re-verifying an existing image.'],
   ['2. Make online logistics explicit','Offer In person / Online with the relevant venue or event-link field and a visible timezone summary. Keep provider-backed venue resolution in final preparation. Put date, time and location beside Publish in full-screen Preview.'],
   ['3. Show the actual wording edit before Apply','Present the current and suggested wording together, then offer Apply suggestion or Keep my wording. Retain one canonical title/opening editor and preserve unsaved logistics.'],
   ['4. Keep Occasion optional and useful','Do not require a taxonomy choice to generate. Put Occasion above the examples it changes, or make an inferred occasion visible and editable. School, team and fundraiser creators could already proceed with General event.'],
   ['5. Shorten the ordinary path; preserve advanced controls','Hide a different end date behind an option; make one guest message primary with clearly named additional notes. Keep optional RSVP, registry, reference and generation quality controls. Show a selectable public link when native Copy or Share is unavailable.']
 ],
 'trials':trials
}
(ROOT/'report-manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'all-persona-trial-records.json').write_text(json.dumps({
    'reviewType':'AI persona task testing; not a human focus group',
    'eventDate':'2026-10-26',
    'summary':data,
    'originalRecords':[json.loads((ROOT/t['source']).read_text(encoding='utf-8-sig')) for t in trials]
},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'trials':len(trials),'published':sum(t['published'] for t in trials),'missingImages':[t['id'] for t in trials if not t['image']]}))
