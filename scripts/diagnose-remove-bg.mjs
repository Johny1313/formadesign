import fs from 'node:fs';
const html=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const checks=[];
function add(name,ok,detail){checks.push({name,ok,detail});}
add('Botão imagem existe',/id=["']removeBgBtn["']/.test(html),'#removeBgBtn');
add('Botão máscara existe',/id=["']removeBgMaskBtn["']/.test(html),'#removeBgMaskBtn');
add('Motor frontend existe',/async function removeBgForElement\s*\(/.test(html),'removeBgForElement()');
const imageBound = /removeBgBtn[^\n]{0,300}(onclick|addEventListener)|(?:onclick|addEventListener)[^\n]{0,300}removeBgBtn/.test(html) || /\$\(['"]#removeBgBtn['"]\)\s*\.onclick/.test(html);
const maskBound = /removeBgMaskBtn[^\n]{0,300}(onclick|addEventListener)|(?:onclick|addEventListener)[^\n]{0,300}removeBgMaskBtn/.test(html) || /\$\(['"]#removeBgMaskBtn['"]\)\s*\.onclick/.test(html);
add('Botão imagem conectado ao motor',imageBound,'deve chamar removeBgForElement');
add('Botão máscara conectado ao motor',maskBound,'deve chamar removeBgForElement');
add('Frontend chama backend',/fetch\(['"]\/api\/remove-bg['"]/.test(html),'/api/remove-bg');
for(const c of checks) console.log(`${c.ok?'PASS':'FAIL'} | ${c.name} | ${c.detail}`);
if(checks.some(c=>!c.ok)) process.exitCode=1;
