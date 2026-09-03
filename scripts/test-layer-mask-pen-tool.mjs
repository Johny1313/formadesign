import fs from 'node:fs';
const html=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const checks=[
  ['Layer mask controls exist', /id="propLayerMaskEnabled"/.test(html) && /id="propLayerMaskMode"/.test(html)],
  ['Inside mask option exists', /value="inside">Mostrar o que está dentro/.test(html)],
  ['Inverse mask option exists', /value="inverse">Ocultar o que está dentro/.test(html)],
  ['Mask uses immediate upper layer', /source=elements\?\.\[index\+1\]/.test(html)],
  ['Mask source is omitted from final board render', /isLayerMaskSourceAt\(elements,index\)\)return/.test(html)],
  ['Canvas mask supports inside and inverse composite', /destination-out':'destination-in/.test(html)],
  ['Layer mask persists in project data', /layerMaskEnabled=!!e\.layerMaskEnabled/.test(html) && /layerMaskMode=e\.layerMaskMode==='inverse'/.test(html)],
  ['Pen tool button exists', /id="penToolBtn"/.test(html)],
  ['Pen is a shape type', /'line','pen'/.test(html)],
  ['Pen draft point engine exists', /function addPenDraftPoint\(ev\)/.test(html)],
  ['Pen completes on Enter', /penToolActive&&ev\.key==='Enter'/.test(html)],
  ['Pen cancels on Escape', /penToolActive&&ev\.key==='Escape'/.test(html)],
  ['Pen stores normalized geometry', /e\.penPoints=penDraft\.map/.test(html)],
  ['Pen canvas path exists', /if\(e\.type==='pen'\)\{const pts=\(e\.penPoints\|\|\[\]\);ctx\.beginPath/.test(html)],
  ['Pen supports fill and stroke', /e\.penClosed&&e\.fillEnabled!==false/.test(html) && /e\.strokeWidth>0/.test(html)],
  ['Pen uses existing fill and stroke inspector', /if\(isShape\(e\)\)\{ensureShapePaint\(e\)/.test(html)]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('LAYER_MASK_PEN_TOOL_TEST: PASS');
