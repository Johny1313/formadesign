import fs from 'node:fs';
const backend=fs.readFileSync(new URL('../src/forma/free-images.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const checks=[
 ['Agência Brasil provider exists',/async function agenciaBrasilSearch\(query,limit=10\)/],
 ['Agência Brasil Foto Agência endpoint exists',/agenciabrasil\.ebc\.com\.br\/fotos/],
 ['Fotos Públicas provider exists',/async function fotosPublicasSearch\(query,limit=10\)/],
 ['Fotos Públicas acervo parsing exists',/fotospublicas\\\.com\\\/acervo/],
 ['Openverse provider exists',/async function openverseSearch\(query,limit=10\)/],
 ['Openverse allows anonymous public API',/api\.openverse\.org\/v1\/images/],
 ['Pexels provider is optional by env key',/env\?\.PEXELS_API_KEY/],
 ['Unsplash provider is optional by env key',/env\?\.UNSPLASH_ACCESS_KEY/],
 ['Unsplash download tracking endpoint exists',/\/api\/free-images\/track\/unsplash/],
 ['Unified search runs providers concurrently',/Promise\.allSettled\(providers\.map/],
 ['Factual Brazilian sources receive higher ranking',/score:120\+relevancy[\s\S]*score:110\+relevancy/],
 ['Secure image proxy allowlist exists',/function safeImageTarget\(value\)/],
 ['UI exposes Agência Brasil filter',/<option value="agencia-brasil">Agência Brasil · Foto Agência<\/option>/],
 ['UI exposes Fotos Públicas filter',/<option value="fotos-publicas">Fotos Públicas<\/option>/],
 ['UI exposes Openverse filter',/<option value="openverse">Openverse<\/option>/],
 ['UI preserves source and rights metadata',/sourceRightsStatus:item\.rightsStatus/],
 ['AI remains fallback in UI',/Imagem por IA · fallback/]
];
let failed=0;for(const [name,re] of checks){const target=name.startsWith('UI')||name.includes('AI remains')?ui:backend;const ok=re.test(target);console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('EDITORIAL_IMAGE_HUB_TEST: PASS');
