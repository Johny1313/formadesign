import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Animated chart durations are collected', /const animatedDurations=\[\.\.\.chartRenderers\.values\(\)\]\.filter\(item=>item\.animated\)\.map\(item=>item\.durationMs\)\.filter\(v=>v>0\);/],
  ['GIF durations are collected separately', /const gifDurations=\[\.\.\.\(assets\.gifDurations\|\|\[\]\)\]\.filter\(v=>v>0\);/],
  ['Board video duration prioritizes chart completion', /const durationMs=animatedDurations\.length\?Math\.max\(\.\.\.animatedDurations\):\(gifDurations\.length\?Math\.max\(\.\.\.gifDurations\):1000\);/],
  ['Per-frame chart progress uses chart duration', /const progress=renderer\.animated&&renderer\.durationMs>0\?clamp\(elapsedMs\/renderer\.durationMs,0,1\):1;/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('BOARD_VIDEO_CHART_DURATION_LOCK_TEST: PASS');
