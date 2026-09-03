import fs from 'node:fs';
const backend=fs.readFileSync(new URL('../src/forma/free-images.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const checks=[
 ['Source page allowlist exists', backend.includes("'agenciabrasil.ebc.com.br'") && backend.includes("'www.fotospublicas.com'")],
 ['Source resolver fetches individual page', backend.includes('async function resolveSourcePage(request)') && backend.includes('await fetchText(page.toString()')],
 ['Resolver extracts download links and images', backend.includes('function sourceImageCandidates(html,base)')],
 ['Resolver returns direct asset proxy', backend.includes('assetProxyUrl:proxyFor(preferred.url)')],
 ['Resolver returns thumbnail proxy', backend.includes('thumbnailProxyUrl:proxyFor(thumbnail.url)')],
 ['UI can resolve before inserting', ui.includes('const working=await freeBankResolveItem(item);')],
 ['UI does not redirect on insertion failure', ui.includes('Use Fonte apenas para consultar o original.')],
 ['UI proactively resolves editorial thumbnails', ui.includes('if(freeBankCanResolve(item))resolvePreview();')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('FREE_BANK_DIRECT_RESOLVER_TEST: PASS');
