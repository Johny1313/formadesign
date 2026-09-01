import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Palette insert button exists', /id="insertColorPaletteTemplateBtn"[^>]*>Criar layout na prancheta</],
  ['Palette template insert function exists', /function insertColorPaletteTemplate\(colors=colorTemplateDraft,name\)/],
  ['Palette text helper exists', /function createPaletteTextElement\(config=\{\}\)/],
  ['Palette shape helper exists', /function createPaletteShapeElement\(config=\{\}\)/],
  ['Saved palettes have layout action', /layout\.textContent='Layout'/],
  ['Insert palette button is wired', /\$\('#insertColorPaletteTemplateBtn'\)\.addEventListener\('click',\(\)=>insertColorPaletteTemplate\(colorTemplateDraft,\$\('#colorTemplateName'\)\?\.value\)\);/],
  ['Palette template creates panel', /name:'Painel da paleta'/],
  ['Palette template creates HEX labels', /name:`HEX \$\{index\+1\}`/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('COLOR_PALETTE_TEMPLATE_TEST: PASS');
