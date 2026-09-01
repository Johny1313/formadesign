import fs from 'node:fs';

for(const file of ['public/design/index.html','public/design/chart-studio.html']){
  const html=fs.readFileSync(file,'utf8');
  const blocks=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!/src\s*=/.test(m[1]))
    .map(m=>m[2]);
  blocks.forEach((code,index)=>{
    try{ new Function(code); }
    catch(error){ throw new Error(`${file} inline #${index}: ${error.message}`); }
  });
  console.log(`${file}: ${blocks.length} inline script(s) OK`);
}
