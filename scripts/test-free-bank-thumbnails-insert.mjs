import fs from 'node:fs';
const backend=fs.readFileSync(new URL('../src/forma/free-images.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const checks=[
 ['Backend stores thumbnail proxy URL', backend.includes('const thumbnailProxyUrl=proxyFor(thumbnailUrl);')],
 ['Backend stores asset proxy URL', backend.includes('const assetProxyUrl=proxyFor(assetUrl);')],
 ['Proxy accepts image jpg alias', backend.includes("raw==='image/jpg'?'image/jpeg':raw")],
 ['Proxy can infer image type from file extension', backend.includes("path.endsWith('.jpg')||path.endsWith('.jpeg')")],
 ['UI builds preview source from thumbnail first', ui.includes('return item?.thumbnailProxyUrl||item?.proxyUrl||item?.thumbnailUrl')],
 ['UI builds insertion source fallback chain', ui.includes('function freeBankInsertSources(item)')],
 ['UI fetches image through multiple candidates', ui.includes('for(const src of candidates)')],
 ['UI renders image thumbnail with fallback placeholder', ui.includes('Miniatura indisponível nesta fonte')],
 ['UI use button availability depends on insertion sources', ui.includes('const canUse=item.insertable!==false&&freeBankInsertSources(item).length>0')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('FREE_BANK_THUMBNAILS_INSERT_TEST: PASS');
