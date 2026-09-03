import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Text export DOM uses the same canvas/text classes', /host\.className=`canvas-el text-el[\s\S]*content\.className='el-content'/],
  ['Text export builds foreignObject snapshot', /function buildTextForeignObjectSvg\(content,width,height\)/],
  ['Text rasterizer serializes the actual DOM', /new XMLSerializer\(\)\.serializeToString\(wrapper\)/],
  ['Text rasterizer draws a single text bitmap', /c\.drawImage\(img,0,0,width,height\)/],
  ['Fallback canvas text renderer still exists', /drawRichTextElementCanvas\(c,e\);/],
  ['Old fragment-by-fragment DOM text path is gone', !/function collectDomTextFragments\(content,hostRect,e\)/.test(html)],
  ['Video still uses prepared text bitmap', /if\(e\.type==='text'\)\{if\(asset\)ctx\.drawImage\(asset,0,0\)/],
  ['Chart frame capture path remains intact', /drawBoardVideoFrame\(c,board,assets,chartRenderers,durationMs\);requestCapturedFrame\(\)/]
];
let failed = 0;
for (const [name, rule] of checks) {
  const ok = typeof rule === 'boolean' ? rule : rule.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('BOARD_VIDEO_TEXT_LAYOUT_FIDELITY_TEST: PASS');
