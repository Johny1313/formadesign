import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['X font control exists', /id="xAxisFontSize"[^>]*value="10"[^>]*min="6"[^>]*max="96"/],
  ['Y font control exists', /id="yAxisFontSize"[^>]*value="10"[^>]*min="6"[^>]*max="96"/],
  ['X font getter exists', /function getXAxisFontSize\(\)/],
  ['Y font getter exists', /function getYAxisFontSize\(\)/],
  ['X labels use configurable font', /c\.font = `\$\{xAxisFontSize\}px Inter, sans-serif`/],
  ['Y ticks use configurable font', /c\.font = `\$\{yAxisFontSize\}px Inter, sans-serif`/],
  ['Line race Y uses configurable font', /const yAxisFontSize = getYAxisFontSize\(\);[\s\S]{0,120}c\.font = `\$\{yAxisFontSize\}px Inter, sans-serif`/],
  ['X reserve responds to font and rotation', /function getXAxisLabelReserve\([\s\S]*projectedHeight[\s\S]*return Math\.max/],
  ['Y left padding responds to font', /Math\.max\(0, getYAxisFontSize\(\) - 10\) \* 1\.8/],
  ['Config persists X font', /xAxisFontSize: \$\('xAxisFontSize'\)\.value/],
  ['Config persists Y font', /yAxisFontSize: \$\('yAxisFontSize'\)\.value/],
  ['Controls trigger redraw', /\['hideValues','showX','showY','xAxisFontSize','yAxisFontSize'/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('CHART_AXIS_FONT_SIZE_TEST: PASS');
