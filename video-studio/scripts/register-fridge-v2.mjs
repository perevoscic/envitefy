import fs from 'node:fs/promises';
const clean='src/fridge-freedom/Cleanup.tsx';let c=await fs.readFile(clean,'utf8');
c=c.replace('export function FridgePayoff() {','export function FridgePayoff({ source = "payoff-edit.mp4", trimBefore = 0 }: { source?: string; trimBefore?: number } = {}) {').replace('src={asset("payoff-edit.mp4")}','src={asset(source)}\n        trimBefore={trimBefore}');await fs.writeFile(clean,c);
let r=await fs.readFile('src/Root.tsx','utf8');if(!r.includes('import { FridgeFreedomV2 }'))r='import { FridgeFreedomV2 } from "./FridgeFreedomV2";\n'+r;
if(!r.includes('id="EnvitefyFridgeFreedomV2"'))r=r.replace('    <>','    <>\n      <Composition id="EnvitefyFridgeFreedomV2" component={FridgeFreedomV2} width={1080} height={1920} fps={30} durationInFrames={900} calculateMetadata={() => ({ defaultOutName: "fridge-freedom/fridge-freedom-9x16-v2" })} />');await fs.writeFile('src/Root.tsx',r);
