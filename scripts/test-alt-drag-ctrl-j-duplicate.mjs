import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Alt drag duplicable helper exists', /function isAltDragDuplicableElement\(e\)/],
  ['Alt drag includes text', /e\.type==='text'/],
  ['Alt drag includes image', /e\.type==='image'/],
  ['Alt drag includes core shapes', /\['rect','square','roundRect','circle','triangle','star','line'\]\.includes\(e\.type\)/],
  ['Alt drag excludes chart elements', /isChartElement\(e\)\)return false/],
  ['Alt duplicate materializer exists', /function materializeAltDragDuplicate\(\)/],
  ['Alt duplicate creates new element ids', /c\.id=uid\(\)/],
  ['Alt duplicate preserves group mapping', /remapCopiedGroupIds\(/],
  ['Move drag stores Alt intent', /altDuplicate:!resizeDir&&!!ev\.altKey/],
  ['Group drag stores Alt intent', /altDuplicate:!!ev\.altKey/],
  ['Alt duplicate only materializes after movement', /if\(Math\.abs\(dx\)>1\|\|Math\.abs\(dy\)>1\)\{drag\.moved=true;if\(drag\.altDuplicate&&!drag\.altDuplicated\)materializeAltDragDuplicate\(\);\}/],
  ['Ctrl J shortcut exists', /if\(mod&&!typing&&key==='j'\)\{[\s\S]*duplicateSelected\(\);return;\s*\}/],
  ['Ctrl J reuses existing duplicate engine', /function duplicateSelected\(\)/]
];
let failed=0;
for(const [name,re] of checks){const ok=re.test(html);console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('ALT_DRAG_CTRL_J_DUPLICATE_TEST: PASS');
