import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const source = path.join(root, 'output/merch/gang-sheet-22x36-2026-10-29-v3');
const out = path.join(root, 'output/merch/shirt-fit-2026-10-29');
await fs.mkdir(out, { recursive: true });
const layout = JSON.parse(await fs.readFile(path.join(source, 'layout-and-validation.json'), 'utf8'));
const inch = 22;
const top = 226;
const bodyWidth = 22;
const bodyLength = 30;
const panels = [
  { kind: 'front', file: 'front-pocket.svg', name: 'FRONT · BOTH DESIGNS', cx: 420, left: 3, artTop: 7 },
  { kind: 'back1', file: 'back-01-make-it-a-thing.svg', name: 'BACK · MAKE IT A THING.', cx: 1200, artTop: 4 },
  { kind: 'back2', file: 'back-02-good-plans-great-people.svg', name: 'BACK · GOOD PLANS.', cx: 1980, artTop: 4 },
];
const fmt = n => Number(n.toFixed(2));
const dimH = (x1, x2, y, text) => `<path d="M${x1},${y}H${x2}M${x1},${y-6}V${y+6}M${x2},${y-6}V${y+6}" class="dim"/><text x="${(x1+x2)/2}" y="${y-12}" class="measure" text-anchor="middle">${text}</text>`;
const dimV = (x, y1, y2, text) => `<path d="M${x},${y1}V${y2}M${x-6},${y1}H${x+6}M${x-6},${y2}H${x+6}" class="dim"/><text x="${x+15}" y="${(y1+y2)/2}" class="measure" transform="rotate(90 ${x+15} ${(y1+y2)/2})" text-anchor="middle">${text}</text>`;
const shirt = (cx, front) => {
  const neckline = front ? 'Q0,5.5 -3.8,0' : 'Q0,2 -3.8,0';
  return `<g transform="translate(${cx} ${top}) scale(${inch})">
    <path d="M-3.8,0 L-7.7,1.2 L-15.5,5.5 L-12.8,12 L-11,10.8 L-11,29.6 Q0,30.4 11,29.6 L11,10.8 L12.8,12 L15.5,5.5 L7.7,1.2 L3.8,0 ${neckline}Z" fill="url(#cotton)" stroke="#c7beb0" stroke-width=".07"/>
    <path d="M-3.8,0 ${front ? 'Q0,5.5 3.8,0 M-4.05,.08 Q0,6.05 4.05,.08' : 'Q0,2 3.8,0 M-4.05,.08 Q0,2.5 4.05,.08'}" fill="none" stroke="#cbbfae" stroke-width=".09"/>
    <path d="M-10.75,28.95 Q0,29.7 10.75,28.95 M-15.1,5.8 L-12.45,11.6 M15.1,5.8 L12.45,11.6 M-11,10.8 L-9.7,5.3 M11,10.8 L9.7,5.3" fill="none" stroke="#d8cdbd" stroke-width=".055"/>
  </g>`;
};
let contents = '';
const dimensions = [];
for (const p of panels) {
  const placement = layout.placements.find(x => x.kind === p.kind);
  if (!placement) throw new Error(`Missing ${p.kind}`);
  const svg = await fs.readFile(path.join(source, p.file), 'utf8');
  const [, sw, sh] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = placement.printWidthIn * inch;
  const h = placement.printHeightIn * inch;
  if (Math.abs(w / h - Number(sw) / Number(sh)) > 0.000001) throw new Error('Aspect ratio changed');
  const x = p.cx + (p.left ?? -placement.printWidthIn / 2) * inch;
  const y = top + p.artTop * inch;
  const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  contents += `<text x="${p.cx}" y="178" class="panel" text-anchor="middle">${p.name}</text>`;
  contents += shirt(p.cx, p.kind === 'front');
  contents += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#c27795" stroke-width="1.1" stroke-dasharray="5 5"/>`;
  contents += `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${uri}"/>`;
  contents += dimH(x, x+w, y-18, `${fmt(placement.printWidthIn)}″`);
  contents += dimV(x+w+18, y, y+h, `${fmt(placement.printHeightIn)}″`);
  contents += dimH(p.cx - bodyWidth*inch/2, p.cx+bodyWidth*inch/2, top+bodyLength*inch+32, '22″ body width');
  contents += `<text x="${p.cx}" y="990" class="size" text-anchor="middle">${fmt(placement.printWidthIn)}″ W × ${fmt(placement.printHeightIn)}″ H</text>`;
  dimensions.push({ kind:p.kind, shirt:{bodyWidthIn:bodyWidth, shoulderToHemIn:bodyLength}, print:{widthIn:placement.printWidthIn,heightIn:placement.printHeightIn}, placement:{printLeftEdgeFromCenterIn:p.left ?? -placement.printWidthIn/2, positiveHorizontalDirection:'viewer-right', belowHighShoulderIn:p.artTop}, rendered:{x,y,width:w,height:h,pixelsPerInch:inch} });
}
contents += dimV(54, top, top+bodyLength*inch, '30″ shoulder to hem');
const board = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1120" viewBox="0 0 2400 1120">
  <defs><linearGradient id="cotton" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#eee8dc"/><stop offset=".4" stop-color="#f7f1e6"/><stop offset="1" stop-color="#ece3d4"/></linearGradient></defs>
  <style>text{font-family:Arial,sans-serif;fill:#342b30}.title{font-size:42px;font-weight:700;letter-spacing:-1px}.subtitle{font-size:25px;fill:#74656a}.panel{font-size:21px;font-weight:700;letter-spacing:1.2px}.measure{font-size:21px;fill:#7e3855}.dim{fill:none;stroke:#97617a;stroke-width:1.3}.size{font-size:28px;font-weight:700}.foot{font-size:23px;fill:#74656a}</style>
  <rect width="2400" height="1120" fill="#fffcf8"/>
  <text x="1200" y="65" class="title" text-anchor="middle">Envitefy · Current print sizes on a shirt</text>
  <text x="1200" y="111" class="subtitle" text-anchor="middle">Reference garment: 22″ body width laid flat × 30″ shoulder-to-hem length</text>
  ${contents}
  <text x="1200" y="1061" class="foot" text-anchor="middle">Artwork and shirts share one scale. Placement is suggested; garment measurements are a reference.</text>
</svg>`;
const svgPath = path.join(out, 'envitefy-current-print-sizes-to-scale.svg');
await fs.writeFile(svgPath, board);
await sharp(Buffer.from(board)).png().toFile(path.join(out, 'envitefy-current-print-sizes-to-scale.png'));
await fs.writeFile(path.join(out, 'scale-dimensions.json'), JSON.stringify({ sourceLayout:path.relative(root,path.join(source,'layout-and-validation.json')),referenceOnly:true,dimensions },null,2));
console.log(JSON.stringify({svgPath,width:2400,height:1120,dimensions},null,2));
