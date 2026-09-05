import nextEnv from '@next/env';import {del} from '@vercel/blob';
nextEnv.loadEnvConfig(process.cwd(),true);
const prefix='event-media/upload-18371665-b031-4414-8f39-cf39b4b70e13/attachment/';
// Exact three paths returned by the approved benchmark upload.
await del([prefix+'display.webp',prefix+'thumb.webp',prefix+'source/september-28th.jpg']);
console.log('Removed the three assets from the completed test upload.');
