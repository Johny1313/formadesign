import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');
const checks = [
  ['Bar race photo toggle exists', /id="showBarRacePhotos"/],
  ['Line race photo toggle exists', /id="showLineRacePhotos"/],
  ['Selected item label editor exists', /id="selectedItemLabel"/],
  ['Selected item photo upload exists', /id="selectedItemPhotoUpload"/],
  ['State stores item labels', /itemLabels:\s*\{\}/],
  ['State stores item images', /itemImages:\s*\{\}/],
  ['Item label helper exists', /function itemLabel\(idx, fallback\)/],
  ['Rounded photo renderer exists', /function drawRoundedPhoto\(c, img, x, y, w, h, radius, borderColor\)/],
  ['Circular photo renderer exists', /function drawCircularPhoto\(c, img, cx, cy, radius, borderColor\)/],
  ['Bar race uses photo toggle', /const showPhotos = shouldShowBarRacePhotos\(\);/],
  ['Bar race draws label on bar section', /fillText\(d\.label, barX, y - 6\)/],
  ['Bar race draws rounded item photo', /drawRoundedPhoto\(c, img, pad\.left, photoY, photoSize, photoSize/],
  ['Line race uses photo toggle', /const showPhoto = shouldShowLineRacePhotos\(\) && !!getItemImageSrc\(series\.idx\);/],
  ['Line race draws circular item photo', /drawCircularPhoto\(c, img, photoCx, p\.y, photoRadius, color\)/],
  ['Config persists race photo toggles', /showBarRacePhotos:\s*\$\('showBarRacePhotos'\)\.checked[\s\S]*showLineRacePhotos:\s*\$\('showLineRacePhotos'\)\.checked/],
  ['Config persists item labels and images', /itemColors:state\.itemColors, itemLabels:state\.itemLabels, itemImages:state\.itemImages/],
  ['Selection label input updates state', /state\.itemLabels\[idx\] = \$\('selectedItemLabel'\)\.value;/],
  ['Selection photo upload updates state', /state\.itemImages\[idx\] = String\(reader\.result \|\| ''\);/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('CHART_RACE_MEDIA_TEST: PASS');
