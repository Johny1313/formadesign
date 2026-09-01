import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Animation slider reaches 0.05x', /id="animSpeed"[^>]*min="0\.05"[^>]*step="0\.05"/],
  ['Animation getter accepts 0.05x', /return Math\.max\(0\.05, \+\(\$\('animSpeed'\)\?\.value \|\| 1\)\);/],
  ['Animation speed label remains dynamic', /getAnimationSpeed\(\)\.toFixed\(2\) \+ '×'/]
];
let failed=0;
for(const [name,re] of checks){const ok=re.test(html);console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('CHART_SLOW_ANIMATION_TEST: PASS');
