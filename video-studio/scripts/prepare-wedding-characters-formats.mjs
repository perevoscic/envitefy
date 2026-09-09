import fs from 'node:fs';
const edits=[
['src/wedding-characters/CharacterPortrait.tsx','AdaptivePortrait','  const frame = useCurrentFrame();','  const frame = useCurrentFrame();\n  const {width,height}=useVideoConfig();\n  if(width>=height)return <AdaptivePortrait clip={clip} title={character} dialogue={dialogue}/>;'],
['src/wedding-characters/InvitationInsert.tsx','AdaptiveDemo','  const frame = useCurrentFrame();','  const frame = useCurrentFrame();\n  const {width,height}=useVideoConfig();\n  if(width>=height)return <AdaptiveDemo kind={kind}/>;'],
['src/wedding-characters/EndCard.tsx','AdaptiveEndCard','  const frame = useCurrentFrame();','  const frame = useCurrentFrame();\n  const {width,height}=useVideoConfig();\n  if(width>=height)return <AdaptiveEndCard/>;'],
['src/wedding-characters/WeddingPayoff.tsx','AdaptivePortrait','function Moment({ clip, label }: { clip: string; label: string }) {','function Moment({ clip, label }: { clip: string; label: string }) {\n  const {width,height}=useVideoConfig();\n  if(width>=height)return <AdaptivePortrait clip={clip} title={label} eyebrow="Every wedding has its characters."/>;'],
];
for(const [p,component,from,to]of edits){
 let s=fs.readFileSync(p,'utf8');if(!s.includes(from))throw Error('Missing expected source '+p);
 s='import { '+component+' } from "./AdaptiveScenes";\nimport { useVideoConfig } from "remotion";\n'+s.replace(from,to);fs.writeFileSync(p,s);
}
const rp='src/Root.tsx';let root=fs.readFileSync(rp,'utf8');const at='      <Composition\n        id="EnvitefyWeddingCharacters"';
if(!root.includes(at))throw Error('Root anchor not found');
const compositions=['Square','Wide'].map((suffix,i)=>'      <Composition\n        id="EnvitefyWeddingCharacters'+suffix+'"\n        component={WeddingCharacters}\n        width={'+(i?1920:1080)+'}\n        height={1080}\n        fps={30}\n        durationInFrames={750}\n        calculateMetadata={() => ({\n          defaultOutName: "wedding-characters/wedding-characters-'+(i?'16x9':'1x1')+'-v1",\n        })}\n      />\n').join('');
root=root.replace(at,compositions+at);fs.writeFileSync(rp,root);
const bp='projects/wedding-characters/brief.json';const b=JSON.parse(fs.readFileSync(bp,'utf8'));
for(const [aspectRatio,width]of [['1:1',1080],['16:9',1920]])if(!b.formats.some(f=>f.aspectRatio===aspectRatio))b.formats.push({aspectRatio,width,height:1080,fps:30});
b.formatAdaptations={date:'2026-09-08',request:'Also a 1:1 aspect ratio version and 16:9 as well.',basedOnVerticalVersion:4,status:'in-production',durationSeconds:25,layouts:'Separate character/caption panel with shot-specific framing and complete dance moves, large product captures with side explanations, format-specific wedding end cards retaining exact wordmark and weddings second row.'};
fs.writeFileSync(bp,JSON.stringify(b,null,2));
fs.appendFileSync('projects/wedding-characters/feedback.md','\n- 2026-09-08 format request: Add square 1:1 and widescreen 16:9 versions based on vertical v4, preserving prior footage fixes and the wordmark with weddings below it. In production.\n');
console.log('Adaptive layouts and two composition registrations prepared.');
