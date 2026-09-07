import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const raw=readFileSync(new URL('./birthday-gallery-preferences.ts',import.meta.url),'utf8');
const js=ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseBirthdayFavorites,toggleBirthdayFavorite,BIRTHDAY_GALLERY_BATCH_SIZE}=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
test('favorites restore valid IDs without duplicates or malformed stored values',()=>{
 const valid=new Set(['party-pop','candy-dreams']);
 assert.deepEqual(parseBirthdayFavorites('["party-pop","retired-design",3,"party-pop","candy-dreams"]',valid),['party-pop','candy-dreams']);
 for(const input of [null,'invalid','{}','null'])assert.deepEqual(parseBirthdayFavorites(input,valid),[]);
});
test('heart toggles preserve the other saved templates without mutating them',()=>{
 const current=['party-pop'];
 const saved=toggleBirthdayFavorite(current,'candy-dreams');
 assert.deepEqual(saved,['party-pop','candy-dreams']);
 assert.deepEqual(toggleBirthdayFavorite(saved,'party-pop'),['candy-dreams']);
 assert.deepEqual(current,['party-pop']);
});
test('gallery searches the full catalog and progressively reveals results with a manual fallback',()=>{
 const gallery=readFileSync(new URL('../components/birthdays/BirthdayDesignGallery.tsx',import.meta.url),'utf8');
 assert.equal(BIRTHDAY_GALLERY_BATCH_SIZE,24);
 assert.doesNotMatch(gallery,/Featured mix|FEATURED_COUNT|selectFeaturedIds|featuredIdSet/);
 assert.match(gallery,/BIRTHDAY_DESIGN_CATALOG\.filter/);
 assert.match(gallery,/visibleDesigns\.slice\(0, visibleCount\)/);
 assert.match(gallery,/IntersectionObserver/);
 assert.match(gallery,/Load more designs/);
 assert.match(gallery,/aria-pressed=\{favoriteIds.has\(design.id\)\}/);
 assert.match(gallery,/window.addEventListener\("storage", sync\)/);
});
