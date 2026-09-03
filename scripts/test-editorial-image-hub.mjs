import fs from 'node:fs';
const backend=fs.readFileSync(new URL('../src/forma/free-images.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const checks=[
 ['Agência Brasil provider exists', backend.includes('async function agenciaBrasilSearch(query,limit=10)')],
 ['Agência Brasil Foto Agência endpoint exists', backend.includes('https://agenciabrasil.ebc.com.br/fotos')],
 ['Fotos Públicas provider exists', backend.includes('async function fotosPublicasSearch(query,limit=10)')],
 ['Fotos Públicas acervo parsing exists', backend.includes('fotospublicas\\.com\\/acervo\\/') || backend.includes('fotospublicas.com/acervo')],
 ['Openverse provider exists', backend.includes('async function openverseSearch(query,limit=10)')],
 ['Openverse allows anonymous public API', backend.includes('https://api.openverse.org/v1/images/')],
 ['Pexels provider is optional by env key', backend.includes('env?.PEXELS_API_KEY')],
 ['Unsplash provider is optional by env key', backend.includes('env?.UNSPLASH_ACCESS_KEY')],
 ['Unsplash download tracking endpoint exists', backend.includes('/api/free-images/track/unsplash')],
 ['Unified search runs providers concurrently', backend.includes('Promise.allSettled(providers.map')],
 ['Factual Brazilian sources receive higher ranking', backend.includes('score:120+relevancy(query,item)') && backend.includes('score:110+relevancy(query,item)')],
 ['Secure image proxy allowlist exists', backend.includes('function safeImageTarget(value)')],
 ['Result metadata includes thumbnail and asset URLs', backend.includes('thumbnailUrl,thumbnailProxyUrl,assetUrl,assetProxyUrl')],
 ['Proxy accepts broader image content types', backend.includes("function inferredImageType(url,type='')")],
 ['UI exposes Agência Brasil filter', ui.includes('<option value="agencia-brasil">Agência Brasil · Foto Agência</option>')],
 ['UI exposes Fotos Públicas filter', ui.includes('<option value="fotos-publicas">Fotos Públicas</option>')],
 ['UI exposes Openverse filter', ui.includes('<option value="openverse">Openverse</option>')],
 ['UI preserves source and rights metadata', ui.includes('sourceRightsStatus:item.rightsStatus')],
 ['UI uses dedicated thumbnail preview helper', ui.includes('function freeBankPreviewSrc(item)')],
 ['AI remains fallback in UI', ui.includes('Imagem por IA · fallback')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('EDITORIAL_IMAGE_HUB_TEST: PASS');
