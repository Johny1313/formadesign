import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Export choice modal exists', /id="exportFormatModal"/],
  ['PNG option exists', /data-export-format="png"/],
  ['PNG transparent option exists', /data-export-format="png-transparent"/],
  ['H264 option exists', /data-export-format="h264"/],
  ['WEBM option exists', /data-export-format="webm"/],
  ['WEBM transparent option exists', /data-export-format="webm-transparent"/],
  ['WEBP option exists', /data-export-format="webp"/],
  ['SVG option exists', /data-export-format="svg"/],
  ['Export dispatcher exists', /async function exportSelectedFormat\(formatOverride\)/],
  ['Download button opens format modal', /\$\('exportBtn'\)\.addEventListener\('click', openExportFormatModal\)/],
  ['Video exporter exists', /async function exportVideo\(/],
  ['SVG exporter exists', /async function exportSvg\(/],
  ['X axis title default is blank', /id="xTitle"[^>]*value=""/],
  ['Y axis title default is blank', /id="yTitle"[^>]*value=""/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('CHART_EXPORT_FORMATS_TEST: PASS');
