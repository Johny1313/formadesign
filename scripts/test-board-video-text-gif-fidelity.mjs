import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['DOM text export builder exists', /function buildTextExportDom\(e\)/],
  ['Text rasterizer uses DOM layout', /async function rasterizeTextElementFromDom\(e\)/],
  ['Text rasterizer reads Range client rects', /range\.getClientRects\(\)\[0\]/],
  ['Text rasterizer uses computed span styles', /const parent=node\.parentElement\|\|content;const style=getComputedStyle\(parent\)/],
  ['Static board export pre-rasterizes text', /textAssets\.set\(e\.id,await rasterizeTextElementFromDom\(e\)\)/],
  ['Video assets pre-rasterize text', /if\(e\.type==='text'\)\{try\{assets\.set\(e\.id,await rasterizeTextElementFromDom\(e\)\)/],
  ['Prepared video draws text bitmap once', /if\(e\.type==='text'\)\{if\(asset\)ctx\.drawImage\(asset,0,0\)/],
  ['Animated GIF detection exists', /function isAnimatedGifElement\(e\)/],
  ['GIF duration parser exists', /function parseGifDurationMs\(buffer\)/],
  ['GIF decoder uses explicit frame timeline', /async function decodeAnimatedGifAsset\(e\)[\s\S]*new ImageDecoder\(/],
  ['GIF assets are prepared after chart renderers', /createBoardChartVideoRenderers\(board\);await prepareBoardAnimatedGifAssets\(board,assets\)/],
  ['GIF durations remain available as fallback when there is no animated chart', /const gifDurations=\[\.\.\.\(assets\.gifDurations\|\|\[\]\)\]\.filter\(v=>v>0\);const durationMs=animatedDurations\.length\?Math\.max\(\.\.\.animatedDurations\):\(gifDurations\.length\?Math\.max\(\.\.\.gifDurations\):1000\);/],
  ['GIF assets are cleaned after recording', /cleanupBoardVideoAssets\(assets\)/],
  ['Per-frame compositor still clears canvas', /ctx\.clearRect\(0,0,ctx\.canvas\.width,ctx\.canvas\.height\)/],
  ['Chart animation progress remains time based', /clamp\(elapsedMs\/renderer\.durationMs,0,1\)/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('BOARD_VIDEO_TEXT_GIF_FIDELITY_TEST: PASS');
