import { handleFormaProductionApi } from '../src/production/service.js';
const text=`O projeto editorial foi apresentado nesta manhã e reúne informações verificadas sobre a iniciativa. A primeira etapa começa na próxima semana e terá acompanhamento técnico durante todo o processo. A equipe responsável informou que o cronograma foi dividido em fases para facilitar a execução e a avaliação. O planejamento inclui reuniões periódicas para revisão dos resultados e ajustes operacionais. Segundo o material apresentado, a prioridade inicial será organizar o fluxo de trabalho e consolidar os dados disponíveis. A segunda fase será dedicada à aplicação prática das medidas definidas pela equipe. O acompanhamento seguirá até a conclusão das entregas previstas no cronograma. Ao final, os responsáveis deverão publicar um balanço com os principais resultados obtidos e os próximos passos da iniciativa.`;
const request=new Request('https://forma.test/api/forma/production/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sourceType:'text',text,title:'Teste stateless',slideCount:6})});
const response=await handleFormaProductionApi(request,{},{});const out=await response.json();
const checks=[
 ['Stateless POST returns success',response.ok&&out.ok===true],
 ['Stateless mode is declared',out.mode==='stateless'],
 ['Job reaches ready',out.job?.status==='ready'],
 ['Six slides are returned',out.job?.output?.result?.slides?.length===6],
 ['Evidence is created',(out.job?.evidenceCount||0)>=5],
 ['Factual gate passes',out.job?.output?.result?.factualGate?.ok===true]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('PRODUCTION_STATELESS_E2E_TEST: PASS');
