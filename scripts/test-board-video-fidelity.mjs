import fs from 'node:fs';
const editor = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const chart = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Board video preloads media assets', /async function preloadBoardVideoAssets\(board\)/],
  ['Board video uses per-frame compositor', /function drawBoardVideoFrame\(ctx,board,assets,chartRenderers,elapsedMs\)/],
  ['Each video frame clears prior pixels', /ctx\.clearRect\(0,0,ctx\.canvas\.width,ctx\.canvas\.height\)/],
  ['Layer order is rebuilt every frame', /for\(const e of \(board\?\.elements\|\|\[\]\)\)\{[\s\S]*drawPreparedBoardElement\(ctx,e,assets\.get\(e\.id\),chartCanvas\)/],
  ['Chart video renderers are prepared per chart element', /async function createBoardChartVideoRenderers\(board\)/],
  ['Board export reads exact chart animation duration', /durationMs:Math\.max\(0,Number\(meta\?\.durationMs\)\|\|0\)/],
  ['Board duration follows animated charts', /const durationMs=animatedDurations\.length\?Math\.max\(\.\.\.animatedDurations\):1000/],
  ['Chart progress follows elapsed export time', /clamp\(elapsedMs\/renderer\.durationMs,0,1\)/],
  ['Video is redrawn through requestAnimationFrame', /requestAnimationFrame\(tick\)/],
  ['Old static 900ms board recorder path is gone', !/boardVideoBlob[\s\S]{0,1800}setTimeout\(resolve,900\)/.test(editor)],
  ['Rich text exporter guards against duplicated HTML content', /if\(expected && actual && expected!==actual\)return\[\{text:/],
  ['Chart Studio exposes prepare API', /window\.__formaPrepareChartVideo = async function/],
  ['Chart Studio exposes frame API', /window\.__formaRenderPreparedChartFrame = function/],
  ['Chart Studio returns its animation duration', /durationMs:shouldAnimate\(\)\?getAnimationDuration\(\):0/],
  ['Chart frame renderer uses explicit progress', /state\.animationProgress = shouldAnimate\(\) \? clamp\(\+progress \|\| 0, 0, 1\) : 1/]
];
let failed = 0;
for (const item of checks) {
  const [name, rule] = item;
  const ok = typeof rule === 'boolean' ? rule : rule.test(name.includes('Chart Studio') || name.includes('Chart frame') ? chart : editor);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if(!ok) failed++;
}
if(failed) process.exit(1);
console.log('BOARD_VIDEO_FIDELITY_TEST: PASS');
