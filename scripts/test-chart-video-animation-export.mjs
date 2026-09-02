import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Video export captures animation checkbox explicitly', /const animationRequested = !!\$\('enableAnimation'\)\?\.checked;/],
  ['Video export resets animation to frame zero', /state\.animationProgress = animationRequested \? 0 : 1;/],
  ['Video export draws before recording', /drawFrame\(animationRequested \? 0 : 1\);[\s\S]*recorder\.start\(250\);/],
  ['Animated export uses animation duration', /const duration = animationRequested \? getAnimationDuration\(\) : 1000;/],
  ['Animated video advances progress over duration', /const progress = animationRequested \? Math\.min\(1, elapsed \/ duration\) : 1;/],
  ['Video exporter holds final animation frame', /wait\(animationRequested \? 260 : 900\)/],
  ['H264 routes through video exporter', /format === 'h264'[\s\S]*exportVideo/],
  ['WEBM routes through video exporter', /format === 'webm'[\s\S]*exportVideo/],
  ['Transparent WEBM routes through video exporter', /format === 'webm-transparent'[\s\S]*exportVideo/]
];
let failed=0;
for(const [name,re] of checks){
  const ok=re.test(html);
  console.log(`${ok?'PASS':'FAIL'} | ${name}`);
  if(!ok) failed++;
}
if(failed) process.exit(1);
console.log('CHART_VIDEO_ANIMATION_EXPORT_TEST: PASS');
