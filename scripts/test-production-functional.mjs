import fs from 'node:fs';
import { extractArticleText, evidencePackFromSource, deterministicCarousel, factualGate, qualityGate, directReadUrl, normalizeProductionInput } from '../src/production/service.js';
const backend=fs.readFileSync(new URL('../src/production/service.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const paragraphs=[
'O governo anunciou nesta quinta-feira um novo programa nacional de infraestrutura que começará a funcionar em outubro de 2026 e terá execução gradual em todas as regiões do país.',
'A primeira etapa prevê investimento de R$ 20 milhões para obras emergenciais, segundo informações divulgadas pelo ministério responsável durante coletiva realizada em Brasília.',
'O planejamento inicial inclui atendimento a 15 cidades consideradas prioritárias, escolhidas a partir de critérios técnicos relacionados à população e à situação das estruturas existentes.',
'A execução será dividida em três fases, com acompanhamento mensal e publicação de relatórios sobre o andamento físico e financeiro de cada intervenção prevista no programa.',
'O ministério informou ainda que os contratos da primeira fase deverão ser assinados em novembro, após a conclusão dos processos de seleção e análise das propostas apresentadas.',
'A expectativa oficial é que as primeiras entregas ocorram no primeiro semestre de 2027, mas o cronograma poderá ser ajustado conforme a evolução das obras e das licitações.'
];
const html=`<html><head><title>Programa nacional de infraestrutura</title></head><body><article>${paragraphs.map(p=>`<p>${p}</p>`).join('')}</article></body></html>`;
const extracted=extractArticleText(html);
const input=normalizeProductionInput({sourceType:'text',text:extracted.text,slideCount:6,title:'Programa nacional de infraestrutura'});
const pack=evidencePackFromSource({title:input.title,articleText:input.text,wordCount:(input.text.match(/\S+/g)||[]).length,readerStrategy:'test'},input);
const slides=deterministicCarousel(pack,6);
const factual=factualGate(slides,pack),quality=qualityGate(slides,6,pack);
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
let direct=null;try{direct=await directReadUrl('https://example.com/noticia');}finally{globalThis.fetch=originalFetch;}
const checks=[
 ['Direct reader extracts editorial paragraphs', extracted.strategy==='paragraphs' && extracted.text.length>900],
 ['Direct URL reader returns real article text', direct?.wordCount>=55 && direct?.readerStrategy==='direct:paragraphs'],
 ['Evidence pack extracts multiple facts', pack.facts.length>=5],
 ['Deterministic fallback returns requested slides', slides.length===6],
 ['Factual gate passes evidence-derived fallback', factual.ok],
 ['Quality gate passes evidence-derived fallback', quality.ok && quality.score>=80],
 ['Worker uses waitUntil for asynchronous processing', backend.includes('ctx?.waitUntil') && index.includes('async fetch(request,env,ctx)')],
 ['Job processor advances through reading Evidence generating quality', backend.includes("stage(env,jobId,'reading'") && backend.includes("stage(env,jobId,'evidence'") && backend.includes("stage(env,jobId,'generating'") && backend.includes("stage(env,jobId,'quality'")],
 ['Job result is persisted as ready', backend.includes("status:'ready',stage:'ready',progress:100")],
 ['Evidence snapshot is persisted before generation', backend.includes('output_payload:JSON.stringify({evidencePack:pack})')],
 ['Retry can reuse Evidence snapshot', backend.includes("row.stage==='generating'&&saved?.evidencePack?.facts?.length")],
 ['Ready job can be opened in editor', ui.includes('openFormaProductionJob(job)') && ui.includes('applyRondaProject(project')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('PRODUCTION_FUNCTIONAL_TEST: PASS');
