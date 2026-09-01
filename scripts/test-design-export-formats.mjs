import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const formats=['png','png-transparent','h264','webm','webm-transparent','webp','svg'];
const checks = [
  ['Design export modal exists', /id="designExportModal"/],
  ...formats.map(format=>[`Design format ${format} exists`, new RegExp(`data-design-export-format="${format}"`)]),
  ['Download current opens chooser', /\$\('#exportBtn'\)\.onclick=\(\)=>openDesignExportModal\('current'\)/],
  ['Download all opens chooser', /\$\('#exportAllBtn'\)\.onclick=\(\)=>openDesignExportModal\('all'\)/],
  ['Transparent board render supported', /renderBoardCanvas\(board,\{transparent:true\}\)/],
  ['Export dispatcher exists', /async function boardExportArtifact\(board,format\)/],
  ['WEBM exporter exists', /async function boardVideoBlob\(/],
  ['SVG exporter exists', /async function boardSvgBlob\(/]
];
let failed=0;
for(const [name,re] of checks){const ok=re.test(html);console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('DESIGN_EXPORT_FORMATS_TEST: PASS');
