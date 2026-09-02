import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Race photo fields wrapper exists', /id="racePhotoFieldsWrap"/],
  ['Race photo fields list exists', /id="racePhotoFieldsList"/],
  ['Race photo fields renderer exists', /function renderRacePhotoFields\(\)/],
  ['Race media items helper exists', /function getRaceMediaItems\(\)/],
  ['Photo upload helper exists', /function handleItemPhotoUpload\(idx, file, done\)/],
  ['Photo remove helper exists', /function removeItemPhoto\(idx\)/],
  ['Bar race toggle shows photo fields', /\$\('showBarRacePhotos'\)\.addEventListener\('change', \(\) => \{ renderRacePhotoFields\(\); draw\(\); \}\);/],
  ['Line race toggle shows photo fields', /\$\('showLineRacePhotos'\)\.addEventListener\('change', \(\) => \{ renderRacePhotoFields\(\); draw\(\); \}\);/],
  ['Photo rows include file input', /upload\.type = 'file';[\s\S]*upload\.accept = 'image\/\*';/],
  ['Selected item upload reuses helper', /handleItemPhotoUpload\(idx, file, \(\) => \{/],
  ['renderItemList renders race photo fields', /function renderItemList\(\)\{\s*renderRacePhotoFields\(\);\s*\}/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('RACE_PHOTO_FIELDS_TEST: PASS');
