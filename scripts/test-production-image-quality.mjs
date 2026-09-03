import fs from 'node:fs';
const src=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const checks=[
 ['AI prompt enhancer exists',/function productionImagePrompt\(prompt,style='editorial'\)/],
 ['Editorial preset requests realistic no-text image',/Realistic editorial photograph[\s\S]*no text, no logos, no watermark/],
 ['Documentary preset exists',/documentary:'Documentary photojournalism style/],
 ['Conceptual preset exists',/conceptual:'Realistic conceptual editorial image/],
 ['Illustration preset exists',/illustration:'Editorial illustration/],
 ['Artboard aspect ratio informs requested size',/const ratio=requestedWidth\/requestedHeight/],
 ['Landscape generation target exists',/width=1344;height=768/],
 ['Portrait generation target exists',/width=768;height=1344/],
 ['AI style header is returned',/'X-Forma-AI-Style':style/]
];
let failed=0;for(const [name,re] of checks){const ok=re.test(src);console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}if(failed)process.exit(1);console.log('PRODUCTION_IMAGE_QUALITY_TEST: PASS');
