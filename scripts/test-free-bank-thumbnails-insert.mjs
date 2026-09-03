import fs from 'node:fs';
const backend=fs.readFileSync(new URL('../src/forma/free-images.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const checks=[
 ['Backend stores thumbnail proxy URL', backend.includes('const thumbnailProxyUrl=proxyFor(thumbnailUrl);')],
 ['Backend stores asset proxy URL', backend.includes('const assetProxyUrl=proxyFor(assetUrl);')],
 ['Dedicated source resolver endpoint exists', backend.includes("'/api/free-images/resolve'")],
 ['Resolver reads og image metadata', backend.includes("metaContent(html,'og:image')")],
 ['Resolver prioritizes download web link', backend.includes("download\\s*web") || backend.includes('download\s*web')],
 ['Resolver only accepts known editorial source hosts', backend.includes('RESOLVABLE_SOURCE_HOSTS')],
 ['UI resolves editorial source pages', ui.includes('async function freeBankResolveItem(item)')],
 ['UI builds insertion source fallback chain', ui.includes('function freeBankInsertSources(item)')],
 ['UI fetches image through multiple candidates', ui.includes('for(const src of candidates)')],
 ['UI resolves thumbnail when initial preview fails', ui.includes('resolvePreview();')],
 ['Use no longer opens source page automatically', (()=>{const a=ui.indexOf('async function freeBankUse(item)');const b=ui.indexOf('function freeBankProviderBadge(item)');return a>=0&&b>a&&!ui.slice(a,b).includes('window.open(');})()],
 ['Source remains a separate button', ui.includes("sourceBtn.onclick=()=>window.open(item.pageUrl,'_blank','noopener,noreferrer')")]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('FREE_BANK_THUMBNAILS_INSERT_TEST: PASS');
