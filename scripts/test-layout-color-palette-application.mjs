import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const layoutIndex = html.indexOf('data-page="layout"');
const backgroundIndex = html.indexOf('data-page="background"');
const paletteIndex = html.indexOf('id="colorTemplateEditor"');
const checks = [
  ['Layout tab exists', /data-panel="layout"/],
  ['Layout panel exists', /data-page="layout"/],
  ['Palette moved before Background panel', layoutIndex >= 0 && paletteIndex > layoutIndex && backgroundIndex > paletteIndex],
  ['Apply palette button exists', /id="applyColorPaletteToBoardBtn"/],
  ['Global palette apply function exists', /function applyColorTemplateToBoard\(colors=colorTemplateDraft,name='Paleta'\)/],
  ['Palette remaps text colors', /e\.textColor=mapped\(e\.textColor\)/],
  ['Palette remaps shape fill', /e\.fill=mapped\(e\.fill\)/],
  ['Palette remaps shape stroke', /e\.strokeColor=mapped\(e\.strokeColor\)/],
  ['Palette remaps gradient stops', /e\.fillGradient\?\.stops/],
  ['Palette updates chart colors', /config\.state\.itemColors=chartColors/],
  ['Palette rerenders chart elements', /requestChartResponsiveRender\(chart,\{historySync:false\}\)/],
  ['Saved palette has Apply action', /apply\.textContent='Aplicar'/],
  ['Builder apply button is wired', /\$\('#applyColorPaletteToBoardBtn'\)\.addEventListener/]
];
let failed = 0;
for (const [name, test] of checks) {
  const ok = test instanceof RegExp ? test.test(html) : !!test;
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if(!ok) failed += 1;
}
if(failed) process.exit(1);
console.log('LAYOUT_COLOR_PALETTE_APPLICATION_TEST: PASS');
