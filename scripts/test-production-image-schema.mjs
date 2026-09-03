import fs from 'node:fs';
const src = fs.readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
const checks = [
  ['Production image route still exists', /url\.pathname==='\/api\/production\/image'/],
  ['FLUX1 model is detected', /value\.includes\('flux-1-schnell'\)/],
  ['FLUX1 uses prompt and steps only', /env\.AI\.run\(model,\{prompt,steps:4\}\)/],
  ['FLUX1 no longer receives width height num_steps', !/kind==='flux1'[\s\S]{0,240}\{prompt,width,height,num_steps:4\}/.test(src)],
  ['FLUX2 keeps multipart dimensions', /form\.append\('width',String\(width\)\)[\s\S]*form\.append\('height',String\(height\)\)/],
  ['SDXL retains its own legacy schema', /kind==='sdxl'[\s\S]{0,180}\{prompt,width,height,num_steps:4\}/],
  ['Unknown models get safe prompt-only payload', /env\.AI\.run\(model,\{prompt\}\)/],
  ['FLUX1 response content type is JPEG', /contentType:'image\/jpeg',kind/],
  ['Generated image body supports base64 result.image', /if\(result\?\.image\)/]
];
let failed=0;
for(const [name, rule] of checks){
  const ok=typeof rule==='boolean'?rule:rule.test(src);
  console.log(`${ok?'PASS':'FAIL'} | ${name}`);
  if(!ok) failed++;
}
if(failed) process.exit(1);
console.log('PRODUCTION_IMAGE_SCHEMA_TEST: PASS');
