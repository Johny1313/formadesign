import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Static board export preloads assets in parallel', /const jobs=\(board\?\.elements\|\|\[\]\)\.filter\(e=>e\?\.visible\)\.map\(async e=>\{/],
  ['Static asset preloader awaits Promise.all', /await Promise\.all\(jobs\);\s*return assets;\s*}\s*async function renderBoardCanvas/],
  ['Video preloads assets in parallel', /async function preloadBoardVideoAssets\(board\)\{[\s\S]*const jobs=\(board\?\.elements\|\|\[\]\)\.filter\(e=>e\?\.visible\)\.map\(async e=>\{/],
  ['GIF preparation runs in parallel', /async function prepareBoardAnimatedGifAssets\(board,assets\)\{[\s\S]*const jobs=\(board\?\.elements\|\|\[\]\)\.filter\(e=>e\?\.visible/],
  ['GIF preparation awaits Promise.all', /prepareBoardAnimatedGifAssets\(board,assets\)\{[\s\S]*await Promise\.all\(jobs\);/]
];
let failed=0;
for(const [name,re] of checks){
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if(!ok) failed += 1;
}
if(failed) process.exit(1);
console.log('BOARD_EXPORT_SPEED_OPTIMIZATIONS_TEST: PASS');
