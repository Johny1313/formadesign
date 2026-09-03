import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['GIF bytes are fetched explicitly', /async function fetchGifBlob\(src\)/],
  ['Animated GIF decoder exists', /async function decodeAnimatedGifAsset\(e\)/],
  ['ImageDecoder GIF path exists', /new ImageDecoder\(\{data:blob\.stream\(\),type:'image\/gif',preferAnimation:true\}\)/],
  ['GIF frames are converted to bitmaps', /createImageBitmap\(vf\)/],
  ['Per-frame GIF duration is read', /vf\.duration/],
  ['GIF frame timeline stores start time', /startMs:totalDurationMs/],
  ['GIF frame selector loops by elapsed time', /function gifFrameForElapsed\(asset,elapsedMs\)/],
  ['GIF timeline uses modulo loop', /local=\(\(Number\(elapsedMs\)\|\|0\)%duration\+duration\)%duration/],
  ['Prepared GIF asset is stored as decoder object', /assets\.set\(e\.id,gif\)/],
  ['Board element renderer receives elapsed time', /function drawPreparedBoardElement\(ctx,e,asset,chartCanvas,elapsedMs=0\)/],
  ['Image rendering resolves animated frame', /const drawableAsset=isAnimatedGifElement\(e\)\?gifFrameForElapsed\(asset,elapsedMs\):asset/],
  ['Mask rendering uses animated frame', /if\(drawableAsset\)drawMaskedImage\(ctx,drawableAsset,e\)/],
  ['Board video passes elapsed time into media renderer', /drawBoardElementLayerMasked\(ctx,board,index,assets,chartRenderers,elapsedMs\)/],
  ['GIF frame resources are cleaned', /frame\.bitmap\.close\(\)/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('GIF_FRAME_DECODER_TEST: PASS');
