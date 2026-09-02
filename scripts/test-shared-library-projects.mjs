import fs from 'node:fs';
const html=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const projects=fs.readFileSync(new URL('../src/projects/service.js',import.meta.url),'utf8');
const library=fs.readFileSync(new URL('../src/library/service.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const checks=[
  ['Projetos tab exists',/data-panel="projects"[^>]*>[\s\S]*?Projetos<\/button>/],
  ['Projects page exists',/data-page="projects"/],
  ['Projects library renderer exists',/async function renderSavedProjects\(\)/],
  ['Projects open for editing exists',/async function openSavedProject\(projectId\)/],
  ['Projects delete UI exists',/async function deleteSavedProject\(projectId,title='Projeto'\)/],
  ['Project API supports DELETE',/request\.method==='DELETE'\) return remove\(m\[1\],env\)/,projects],
  ['Project create returns top-level id',/ok:true,id:projectId,project:/,projects],
  ['Project URL loader unwraps payload',/out\.project\?\.payload&&typeof out\.project\.payload==='object'\?out\.project\.payload:out\.project/,html],
  ['Shared library route installed',/url\.pathname\.startsWith\('\/api\/library'\)/,index],
  ['Shared library has chunk table',/forma_design_library_chunks/,library],
  ['Shared library supports template palette font',/\['template','palette','font'\]/,library],
  ['Templates use shared cache',/function getTemplates\(\)\{return sharedLibraryReady\?sharedTemplatesCache:getLocalTemplates\(\);\}/],
  ['Palette uses shared cache',/function getColorTemplates\(\)\{return sharedLibraryReady\?sharedColorTemplatesCache:getLocalColorTemplates\(\);\}/],
  ['Template save calls shared library',/await saveSharedResource\('template',compiled\)/],
  ['Palette save calls shared library',/await saveSharedResource\('palette',record\)/],
  ['Font upload calls shared library',/await saveSharedResource\('font',font\)/],
  ['Existing local resources migrate',/async function initSharedLibrary\(\)[\s\S]*saveSharedResource\('template',item\)[\s\S]*saveSharedResource\('palette',item\)/],
  ['Existing local fonts migrate',/for\(const font of local\)[\s\S]*saveSharedResource\('font',font\)/]
];
let failed=0;
for(const entry of checks){
  const [name,re,source]=entry;
  const ok=re.test(source||html);
  console.log(`${ok?'PASS':'FAIL'} | ${name}`);
  if(!ok)failed++;
}
if(failed)process.exit(1);
console.log('SHARED_LIBRARY_PROJECTS_TEST: PASS');
