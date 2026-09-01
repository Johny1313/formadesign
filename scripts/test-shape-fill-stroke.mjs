import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Fill enable toggle exists', /id="propFillEnabled"/],
  ['Stroke style control exists', /id="propStrokeStyle"/],
  ['Continuous stroke option exists', /option value="solid">Contínuo</],
  ['Dotted stroke option exists', /option value="dashed">Pontilhado</],
  ['Shape model stores fill enabled', /fillEnabled:true/],
  ['Line defaults to fill disabled', /name:'Linha'[\s\S]{0,150}fillEnabled:false/],
  ['Shape model stores stroke style', /strokeStyle:'solid'/],
  ['Fill toggle is wired', /\$\('#propFillEnabled'\)\.addEventListener\('change'/],
  ['Stroke style is wired', /\$\('#propStrokeStyle'\)\.addEventListener\('change'/],
  ['DOM supports transparent fill', /e\.fillEnabled===false\?'transparent'/],
  ['Line DOM supports dotted stroke', /borderTopStyle=e\.strokeStyle==='dashed'\?'dotted':'solid'/],
  ['Canvas export skips disabled fill', /if\(e\.fillEnabled!==false\)\{ctx\.fillStyle/],
  ['Canvas export uses dash pattern', /ctx\.setLineDash\(dash\)/],
  ['Triangle-star SVG stroke supports dash', /stroke-dasharray','1 5'/]
];
let failed=0;
for(const [name,re] of checks){const ok=re.test(html);console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('SHAPE_FILL_STROKE_TEST: PASS');
