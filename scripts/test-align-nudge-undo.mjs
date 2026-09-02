import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Alignment panel exists', /id="alignPanel"/],
  ['Selection align left exists', /data-align-selection="left"/],
  ['Selection align center exists', /data-align-selection="hcenter"/],
  ['Selection align right exists', /data-align-selection="right"/],
  ['Board align controls exist', /data-align-board="left"[\s\S]*data-align-board="hcenter"[\s\S]*data-align-board="right"/],
  ['Vertical alignment controls exist', /data-align-selection="top"[\s\S]*data-align-selection="vcenter"[\s\S]*data-align-selection="bottom"/],
  ['Horizontal distribution exists', /data-distribute="horizontal"/],
  ['Vertical distribution exists', /data-distribute="vertical"/],
  ['Alignment handles groups as layout units', /function selectedLayoutUnits\(\)/],
  ['Align between elements engine exists', /function alignSelectionUnits\(mode\)/],
  ['Align to artboard engine exists', /function alignSelectionToBoard\(mode\)/],
  ['Equal distribution engine exists', /function distributeSelection\(axis\)/],
  ['Keyboard nudge engine exists', /function nudgeSelection\(dx,dy\)/],
  ['Arrow keys are wired', /\['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'\]\.includes\(ev\.key\)/],
  ['Shift arrows use 10px', /const step=ev\.shiftKey\?10:1/],
  ['Ctrl Z undo is wired', /mod&&!typing&&key==='z'[\s\S]*undo\(\)/],
  ['Ctrl Shift Z redo is wired', /if\(ev\.shiftKey\)redo\(\);else undo\(\)/],
  ['Ctrl Y redo is wired', /mod&&!typing&&key==='y'[\s\S]*redo\(\)/],
  ['Multi selection exposes alignment panel', /propertiesForm\.classList\.add\('multi-align-only'\)/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('ALIGN_NUDGE_UNDO_TEST: PASS');
