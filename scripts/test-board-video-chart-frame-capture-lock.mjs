import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Board video prefers manual canvas frame capture', /let stream=out\.captureStream\(0\),videoTrack=stream\.getVideoTracks\(\)\[0\]\|\|null;/],
  ['Manual requestFrame capability is detected', /typeof videoTrack\.requestFrame==='function'/],
  ['Fallback keeps 30fps captureStream', /stream=out\.captureStream\(fps\)/],
  ['Each rendered video frame is explicitly captured', /drawBoardVideoFrame\(c,board,assets,chartRenderers,elapsed\);\s*requestCapturedFrame\(\);/],
  ['Final 100 percent chart frame is explicitly captured', /drawBoardVideoFrame\(c,board,assets,chartRenderers,durationMs\);\s*requestCapturedFrame\(\);/],
  ['Final frame is captured again on the next animation frame', /requestAnimationFrame\(\(\)=>\{drawBoardVideoFrame\(c,board,assets,chartRenderers,durationMs\);requestCapturedFrame\(\);resolve\(\);\}\)/],
  ['Chart progress remains elapsed divided by exact chart duration', /clamp\(elapsedMs\/renderer\.durationMs,0,1\)/]
];
let failed=0;
for(const [name,re] of checks){const ok=re.test(html);console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('BOARD_VIDEO_CHART_FRAME_CAPTURE_LOCK_TEST: PASS');
