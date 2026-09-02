import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Rich text hint exists', /selecione uma palavra ou trecho para aplicar Fonte, Peso e Cor/],
  ['Rich text sanitizer exists', /function sanitizeRichTextHtml\(html\)/],
  ['Rich text selection range exists', /richTextSelectionRange=null,richTextSelectionElementId=null/],
  ['Selection capture exists', /function captureRichTextSelection\(\)/],
  ['Partial style engine exists', /function applyRichTextSelectionStyle\(key,value\)/],
  ['Partial font family supported', /key==='fontFamily'/],
  ['Partial font weight supported', /key==='fontWeight'/],
  ['Partial text color supported', /key==='textColor'/],
  ['Canvas rich text renderer exists', /function drawRichTextElementCanvas\(ctx,e\)/],
  ['Canvas uses rich runs', /function richTextRunsForCanvas\(e\)/],
  ['Artboard renders rich HTML', /renderRichTextInto\(content,e\)/],
  ['Editing syncs rich HTML', /syncRichTextFromContent\(content,e\)/],
  ['Project migration preserves rich HTML', /e\.richTextHtml=e\.richTextHtml\?sanitizeRichTextHtml/],
  ['Font control applies partial selection', /applyRichTextSelectionStyle\('fontFamily',value\)/],
  ['Weight control applies partial selection', /applyRichTextSelectionStyle\('fontWeight',value\)/],
  ['Color control applies partial selection', /applyRichTextSelectionStyle\('textColor',value\)/],
  ['Palette remaps rich text colors', /remapRichTextHtmlColors\(e\.richTextHtml,mapped\)/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('RICH_TEXT_PARTIAL_STYLES_TEST: PASS');
