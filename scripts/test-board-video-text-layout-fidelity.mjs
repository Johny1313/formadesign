import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Text export DOM uses the same canvas/text classes', /host\.className=`canvas-el text-el[\s\S]*content\.className='el-content'/],
  ['Text export builds DOM line fragments', /function collectDomTextFragments\(content,hostRect,e\)/],
  ['Fragments follow browser Range geometry', /range\.getClientRects\(\)\[0\]/],
  ['Text is rendered as continuous fragments, not per-character fillText', /c\.fillText\(fragment\.text,0,0\)/],
  ['Fragment width follows actual DOM width', /const targetW=Math\.max\(0,fragment\.right-fragment\.x\)/],
  ['Canvas kerning is preserved when supported', /c\.fontKerning='normal'/],
  ['Letter spacing follows computed DOM style', /c\.letterSpacing=style\.letterSpacing/],
  ['Old per-character fillText path is gone', !/c\.fillText\(char,rect\.left-hostRect\.left,baseline\)/.test(html)],
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
