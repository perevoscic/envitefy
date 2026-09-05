import {buildEventExtractionPrompt} from '../src/lib/ocr/prompts.ts';
import {EVENT_EXTRACTION_SCHEMA,EVENT_EXTRACTION_RESPONSE_SCHEMA} from '../src/lib/ocr/extraction-contract.ts';
import {writeFile} from 'node:fs/promises';
const p=buildEventExtractionPrompt('2026-09-05');const result={promptCharacters:p.system.length+p.user.length,promptWords:(p.system+' '+p.user).split(/\s+/).length,expandedSchemaCharacters:JSON.stringify(EVENT_EXTRACTION_SCHEMA).length,wireSchemaCharacters:JSON.stringify(EVENT_EXTRACTION_RESPONSE_SCHEMA).length};
await writeFile('artifacts/snap-prompt-size.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
