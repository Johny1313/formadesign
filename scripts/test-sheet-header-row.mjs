import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Parser accepts a header even without data rows', /if\(!lines\.length\) return \{headers:\[\],rows:\[\]\};[\s\S]*const headers = splitCSVLine\(lines\[0\], delimiter\);[\s\S]*const rows = lines\.slice\(1\)/],
  ['First spreadsheet row is marked as header', /const isHeader = r === 0;[\s\S]*sheet-header-row/],
  ['Header row receives a dedicated visual style', /\.sheet-grid tr\.sheet-header-row td/],
  ['Paste surface explains first row header rule', /A primeira linha colada é o cabeçalho\. Os dados começam na segunda linha\./],
  ['Status counts only rows after header as data', /Cabeçalho \+ \$\{dataRows\} linha/]
];
let failed = 0;
for (const [name, re] of checks){
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if(!ok) failed += 1;
}
if(failed) process.exit(1);
console.log('SHEET_HEADER_ROW_TEST: PASS');
