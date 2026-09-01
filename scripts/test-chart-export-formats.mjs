import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Export format selector exists', /id="exportFormat"/],
  ['PNG option exists', /option value="png">PNG</],
  ['PNG transparent option exists', /option value="png-transparent"[^>]*>PNG com transparência</],
  ['H264 option exists', /option value="h264">H264</],
  ['WEBM option exists', /option value="webm">WEBM</],
  ['WEBM transparent option exists', /option value="webm-transparent"[^>]*>WEBM com transparência</],
  ['WEBP option exists', /option value="webp">WEBP</],
  ['SVG option exists', /option value="svg">SVG</],
  ['Export dispatcher exists', /async function exportSelectedFormat\(\)/],
  ['Video exporter exists', /async function exportVideo\(/],
  ['SVG exporter exists', /async function exportSvg\(/],
  ['X axis title default is blank', /id="xTitle"[^>]*value=""/],
  ['Y axis title default is blank', /id="yTitle"[^>]*value=""/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('CHART_EXPORT_FORMATS_TEST: PASS');
