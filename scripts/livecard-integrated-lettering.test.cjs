const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const load = require("./lib/event-messages-test-loader.cjs");
const cache = new Map();
const { integratedCardPrompt, integratedLetteringDeps: deps } = load("src/lib/card-integrated-lettering.ts", {}, cache);
const { generateCardHeadline, headlineGenerationDeps } = load("src/lib/shared-card-headline.ts", {}, cache);
const { generateSharedCard, sharedCardGenerationDeps } = load("src/lib/shared-card-generation.ts", {}, cache);
const { readSharedCardDesign, hasGeneratedCardHeadlineForForm, sharedCardArtworkUrl } = load("src/lib/shared-card-design.ts", {}, cache);
const { createLiveCardForm } = load("src/lib/livecard-builder.ts", {}, cache);
const style = { version: 1, titleFont: "bebas", introFont: "greatvibes", direction: "Sculpted warm gold lettering shaped around the party name", artworkDirection: "Nighttime celebration with dark velvet and amber light", texturePrompt: "Gold", preferredTop: 240, ornament: false };
const design = { version: 1, composition: "integrated-v1", font: "classic", ink: "#ffffff", accent: "#ffffff", surface: "#000000", backgroundUrl: "/scene.webp", letteringStyle: style };
const form = { ...createLiveCardForm(), eventType: "Birthday", title: "Sofía’s 30th", headlineIntro: "Celebrate with us", design: "Purple peonies with tall sculpted silver lettering and a brush-script opening", date: "2027-09-18", startTime: "19:00", locations: [{ id: "primary", venue: "Secret Venue", address: "999 Secret Street", query: "Secret Venue" }] };
const picture = async () => `data:image/webp;base64,${(await sharp({create:{width:100,height:150,channels:3,background:"#211521"}}).webp().toBuffer()).toString("base64")}`;
const candidate = async () => {const url=await picture();return {...design,backgroundUrl:url,headline:{renderer:"artwork-v1",imageUrl:url,title:form.title,intro:form.headlineIntro,wordingVerified:false}};};

test("every new planner card requests one integrated artwork, exact copy and phone hierarchy, without logistics or a material/overlay pass", async t => {
 const original={...sharedCardGenerationDeps}; t.after(()=>Object.assign(sharedCardGenerationDeps,original));
 let planner;const calls=[];const imageUrl=await picture();
 sharedCardGenerationDeps.createClient=()=>({chat:{completions:{create:async input=>{planner=input;return {choices:[{finish_reason:"stop",message:{content:JSON.stringify(design)}}]};}}}});
 sharedCardGenerationDeps.references=async()=>[];
 sharedCardGenerationDeps.generateImage=async(prompt)=>{calls.push(prompt);return {ok:true,imageDataUrl:imageUrl};};
 sharedCardGenerationDeps.encode=async bytes=>bytes;
 sharedCardGenerationDeps.verify=async()=>{throw Error("The durable wording stage checks the retained candidate");};
 const result=await generateSharedCard(form);
 assert.deepEqual(planner.response_format.json_schema.schema.properties.composition.enum,["integrated-v1"]);
 assert.equal(calls.length,1,"one artwork generation, no decorative swatch");
 assert.match(calls[0],/Sofía’s 30th/);assert.match(calls[0],/Purple peonies/);
 assert.match(calls[0],/title exactly once/);assert.match(calls[0],/288px/);assert.match(calls[0],/NEVER print date/);
 assert.doesNotMatch(calls[0],/2027-09-18|19:00|Secret Venue|999 Secret Street/);
 assert.equal(result.headline.renderer,"artwork-v1");assert.equal(result.headline.imageUrl,result.backgroundUrl);
 assert.equal(result.letteringStyle.textureUrl,undefined);
 assert.equal(hasGeneratedCardHeadlineForForm(form,result),false,"candidate needs wording verification");
 for(const brief of ["Black and gold nightclub, monumental dimensional title", "Ivory waterfront wedding, calligraphic names", "Crimson peonies, chrome lettering, purple silk"]){
  const prompt=integratedCardPrompt({...form,design:brief},design);assert.ok(prompt.includes(brief));
 }
});

test("verified integrated artwork saves its renderer and never dispatches a local title overlay", async t => {
 const original={...deps};const render=headlineGenerationDeps.render;t.after(()=>{Object.assign(deps,original);headlineGenerationDeps.render=render;});
 let checks=0;headlineGenerationDeps.render=async()=>{throw Error("A second title must never be drawn");};
 deps.edit=async()=>{throw Error("No second image for initial composition");};
 deps.verify=async()=>{checks++;return {status:"passed",issues:[],visibleText:[form.headlineIntro,form.title]};};
 const current=await candidate();const headline=await generateCardHeadline(form,current);
 assert.equal(checks,1);assert.equal(headline.wordingVerified,true);assert.equal(headline.layerUrl,undefined);
 const saved=readSharedCardDesign(JSON.parse(JSON.stringify({...current,headline})));
 assert.equal(saved.composition,"integrated-v1");assert.equal(saved.headline.renderer,"artwork-v1");
 assert.equal(hasGeneratedCardHeadlineForForm(form,saved),true);
 assert.equal(sharedCardArtworkUrl({title:form.title,headlineIntro:form.headlineIntro,sharedDesign:saved}),headline.imageUrl);
 assert.equal(hasGeneratedCardHeadlineForForm({...form,date:"2028-01-01"},saved),true);
});

test("repeated, missing, misspelled or extra logistical words cannot count as verified copy", async t => {
 const original={...deps};t.after(()=>Object.assign(deps,original));
 for(const visibleText of [[form.title,form.title,form.headlineIntro],["Sofia’s 30th",form.headlineIntro],[form.title],[form.title,form.headlineIntro,"Saturday 7PM"]]){
  deps.verify=async()=>({status:"passed",issues:[],visibleText});
  const current=await candidate();const headline=await generateCardHeadline(form,current);
  assert.equal(headline.wordingVerified,false,JSON.stringify(visibleText));
  assert.equal(hasGeneratedCardHeadlineForForm(form,{...current,headline}),false);
 }
});

test("checker outage retries the same candidate; explicit wording repair replaces words in the artwork without adding a font layer", async t => {
 const original={...deps};t.after(()=>Object.assign(deps,original));
 let edits=0;const imageUrl=await picture();
 deps.edit=async(prompt,source)=>{edits++;assert.match(prompt,/Remove all previous title\/name occurrences/);assert.match(prompt,/Élodie & Zoë/);assert.ok(source.startsWith("data:image/"));return {ok:true,imageDataUrl:imageUrl};};
 deps.encode=async bytes=>bytes;
 deps.verify=async()=>({status:"unavailable",issues:[]});
 const current=await candidate();let headline=await generateCardHeadline(form,current);
 headline=await generateCardHeadline(form,{...current,headline},undefined,undefined,false,{jobId:"retry",revision:"same",attempt:2});
 assert.equal(edits,0);assert.equal(headline.imageUrl,current.headline.imageUrl);
 deps.verify=async()=>({status:"passed",issues:[],visibleText:["Élodie & Zoë",form.headlineIntro]});
 const changed={...form,title:"Élodie & Zoë"};
 headline=await generateCardHeadline(changed,{...current,headline:{...headline,validation:{status:"failed",issues:["unexpected_text"]}}},undefined,undefined,false,{jobId:"repair",revision:"changed",attempt:3});
 assert.equal(edits,1);assert.equal(headline.wordingVerified,true);assert.equal(headline.renderer,"artwork-v1");assert.equal(headline.layerUrl,undefined);
});
