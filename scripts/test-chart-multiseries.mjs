import fs from 'node:fs';

const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['multi-series dataset exists', /function\s+getStandardSeriesDataset\s*\(/],
  ['all category columns are counted', /\(parsed\.headers\?\.length\s*\|\|\s*0\)\s*-\s*1/],
  ['each category reads its own column', /r\?\.\[seriesIndex\s*\+\s*1\]/],
  ['line and area branch to multi-series renderer', /chartType\s*===\s*'line'\s*\|\|\s*chartType\s*===\s*'area'/],
  ['multi-series renderer exists', /function\s+drawMultiSeriesLine\s*\(/],
  ['single-series legacy path is still present', /const\s+data\s*=\s*getData\(\)/],
  ['race datasets remain present', /function\s+getBarRaceDataset\s*\(/],
  ['line race dataset remains present', /function\s+getLineRaceDataset\s*\(/],
];
let failed = false;
for (const [name, rx] of checks) {
  const ok = rx.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log('CHART_MULTISERIES_REGRESSION_TEST: PASS');
