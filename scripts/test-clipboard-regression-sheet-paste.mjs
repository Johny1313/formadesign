import fs from 'node:fs';
const editor = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const chart = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Typing gate uses actual event target only', /const typing=isTextInputTarget\(ev\.target\);/],
  ['Typing gate no longer globally blocks on editingTextId', !/const typing=isTextInputTarget\(ev\.target\)\|\|state\.editingTextId;/.test(editor)],
  ['Copy guard uses actual active input only', /if\(isTextInputTarget\(document\.activeElement\)\)return false;/],
  ['Copy guard no longer globally blocks on editingTextId', !/if\(isTextInputTarget\(document\.activeElement\)\|\|state\.editingTextId\)return false;/.test(editor)],
  ['Ctrl C remains wired', /mod&&!typing&&key==='c'/],
  ['Ctrl V remains wired', /mod&&!typing&&key==='v'/],
  ['Paste surface exists', /id="sheetPasteSurface"/],
  ['Paste surface has close control', /id="closeSheetPasteBtn"/],
  ['Paste button opens sheet surface', /\$\('pasteSheetBtn'\)\.addEventListener\('click', openSheetPasteSurface\);/],
  ['Open sheet function exists', /function openSheetPasteSurface\(\)/],
  ['Open sheet focuses a sheet cell', /const firstCell = \$\('sheetGrid'\)\.querySelector\('\.sheet-cell'\);/],
  ['Sheet paste still consumes clipboard data', /\$\('sheetWrap'\)\.addEventListener\('paste',[\s\S]*clipboardData\?\.getData\('text\/plain'\)/],
  ['Clipboard direct read was removed from button flow', !/async function pasteFromClipboard\(\)/.test(chart)],
  ['Escape closes expanded sheet', /e\.key === 'Escape'[\s\S]*closeSheetPasteSurface\(\)/]
];
let failed = 0;
for (const [name, condition] of checks) {
  const ok = condition instanceof RegExp ? condition.test(name.includes('Ctrl') || name.includes('Typing') || name.includes('Copy guard') ? editor : chart) : Boolean(condition);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if(!ok) failed += 1;
}
if(failed) process.exit(1);
console.log('CLIPBOARD_REGRESSION_SHEET_PASTE_TEST: PASS');
