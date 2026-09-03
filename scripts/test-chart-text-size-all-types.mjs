import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Chart label font control exists', /id="chartLabelFontSize"[^>]*value="11"/],
  ['Chart value font control exists', /id="chartValueFontSize"[^>]*value="10"/],
  ['Label font getter exists', /function getChartLabelFontSize\(\)/],
  ['Value font getter exists', /function getChartValueFontSize\(\)/],
  ['Legend uses chart label font', /const legendFontSize = getChartLabelFontSize\(\);[\s\S]*c\.font = `\$\{legendFontSize\}px Inter/],
  ['Bar labels use chart label font', /function drawBar[\s\S]*c\.font = `600 \$\{labelFontSize\}px Inter/],
  ['Bar values use chart value font', /function drawBar[\s\S]*c\.font = `700 \$\{valueFontSize\}px Inter/],
  ['Column values use chart value font', /function drawColumn[\s\S]*getChartValueFontSize\(\)/],
  ['Line values use chart value font', /function drawLine[\s\S]*getChartValueFontSize\(\)/],
  ['Multi series line values use chart value font', /function drawMultiSeriesLine[\s\S]*getChartValueFontSize\(\)/],
  ['Lollipop labels use chart label font', /function drawLollipop[\s\S]*getChartLabelFontSize\(\)/],
  ['Lollipop values use chart value font', /function drawLollipop[\s\S]*getChartValueFontSize\(\)/],
  ['Donut value uses chart value font', /function drawDonut[\s\S]*getChartValueFontSize\(\)/],
  ['Bar race labels use chart label font', /function drawBarRace[\s\S]*getChartLabelFontSize\(\)/],
  ['Bar race values use chart value font', /function drawBarRace[\s\S]*getChartValueFontSize\(\)/],
  ['Line race labels use chart label font', /function drawLineRace[\s\S]*getChartLabelFontSize\(\)/],
  ['Line race values use chart value font', /function drawLineRace[\s\S]*getChartValueFontSize\(\)/],
  ['Treemap labels use chart label font', /function drawTreemap[\s\S]*getChartLabelFontSize\(\)/],
  ['Treemap values use chart value font', /function drawTreemap[\s\S]*getChartValueFontSize\(\)/],
  ['Radar labels use chart label font', /function drawRadar[\s\S]*getChartLabelFontSize\(\)/],
  ['Radar values use chart value font', /function drawRadar[\s\S]*getChartValueFontSize\(\)/],
  ['X axis font control remains present', /id="xAxisFontSize"/],
  ['Y axis font control remains present', /id="yAxisFontSize"/],
  ['Config persists label font size', /chartLabelFontSize:\s*\$\('chartLabelFontSize'\)\.value/],
  ['Config persists value font size', /chartValueFontSize:\s*\$\('chartValueFontSize'\)\.value/],
  ['Font controls trigger redraw', /'chartLabelFontSize','chartValueFontSize'/]
];
let failed=0;
for(const [name,re] of checks){const ok=re.test(html);console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('CHART_TEXT_SIZE_ALL_TYPES_TEST: PASS');
