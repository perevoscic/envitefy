import fs from 'node:fs';
const file='src/wedding-200-texts/captions.json',data=JSON.parse(fs.readFileSync(file,'utf8'));
data.ending=[{text:'Now…',startMs:1166,endMs:1933,timestampMs:null,confidence:null},{text:'the seating chart.',startMs:1933,endMs:3466,timestampMs:null,confidence:null}];
fs.writeFileSync(file,JSON.stringify(data,null,2));
