import fs from 'node:fs';

const editor = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const studio = fs.readFileSync(new URL('../public/design/chart-studio.html', import.meta.url), 'utf8');

const checks = [
  ['dedicated responsive renderer exists', editor.includes("chart-studio.html?embed=1&render=1")],
  ['resize request protocol exists', editor.includes("type:'forma-chart-render-request'") && studio.includes("data.type === 'forma-chart-render-request'")],
  ['resize result protocol exists', studio.includes("type:'forma-chart-render-result'") && editor.includes("data.type==='forma-chart-render-result'")],
  ['chart rerenders after handle resize', /ended\.type==='resize'[\s\S]{0,220}requestChartResponsiveRender/.test(editor)],
  ['chart rerenders after numeric width or height change', editor.includes("['#propW','#propH']") && editor.includes('requestChartResponsiveRender(e,{historySync:true})')],
  ['chart fills its element area while resizing', editor.includes("content.style.objectFit=isChartElement(e)?'fill'")],
  ['chart export follows exact element area', editor.includes("if(isChartElement(e))ctx.drawImage(img,0,0,e.w,e.h)") || editor.includes("if(isChartElement(e))ctx.drawImage(drawableAsset,0,0,e.w,e.h)")],
  ['renderer applies target area as custom chart format', studio.includes("state.formatW = Math.max(100, +payload.formatW") && studio.includes("state.formatH = Math.max(100, +payload.formatH") && studio.includes("setFormat('custom')")],
  ['responsive metadata is preserved', editor.includes('responsiveResize:true')],
  ['modal and background renderer messages are source-isolated', editor.includes("event.source===chartResponsiveFrame.contentWindow") && editor.includes("event.source===$('#chartStudioModalFrame').contentWindow")],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('CHART_RESPONSIVE_RESIZE_TEST: PASS');
