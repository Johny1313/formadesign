import fs from 'node:fs';
const html=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const checks=[
  ['image button exists', /id=["']removeBgBtn["']/.test(html)],
  ['mask button exists', /id=["']removeBgMaskBtn["']/.test(html)],
  ['remove-bg engine exists', /async function removeBgForElement\s*\(/.test(html)],
  ['image button wired', /\$\(['"]#removeBgBtn['"]\)\.addEventListener\(['"]click['"][\s\S]{0,260}?removeBgForElement\(e,\$\(['"]#removeBgBtn['"]\)\)/.test(html)],
  ['mask button wired', /\$\(['"]#removeBgMaskBtn['"]\)\.addEventListener\(['"]click['"][\s\S]{0,320}?removeBgForElement\(e,\$\(['"]#removeBgMaskBtn['"]\)\)/.test(html)],
  ['backend endpoint used', /fetch\(['"]\/api\/remove-bg['"]/.test(html)]
];
for(const [name,ok] of checks) console.log(`${ok?'PASS':'FAIL'} | ${name}`);
if(checks.some(([,ok])=>!ok)) process.exit(1);
console.log('REMOVE_BG_UI_WIRING_TEST: PASS');
