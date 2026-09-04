import { processProductionJob, normalizeProductionInput } from '../src/production/service.js';

class FakeStatement {
  constructor(db, sql){ this.db=db; this.sql=sql; this.args=[]; }
  bind(...args){ this.args=args; return this; }
  async run(){
    if(/^CREATE\s+/i.test(this.sql)) return {success:true};
    if(/^UPDATE\s+/i.test(this.sql)){
      const id=this.args[this.args.length-1];
      const row=this.db.rows.get(id);
      if(!row) return {success:false};
      const set=this.sql.match(/SET\s+([\s\S]+?)\s+WHERE\s+id=\?/i)?.[1]||'';
      const cols=set.split(',').map(x=>x.trim().split('=')[0].trim());
      cols.forEach((col,i)=>{row[col]=this.args[i];});
      this.db.rows.set(id,row);
      return {success:true};
    }
    throw new Error('FakeDB unsupported run SQL: '+this.sql);
  }
  async first(){
    if(/SELECT \* FROM .* WHERE id=\?/i.test(this.sql)) return this.db.rows.get(this.args[0])||null;
    if(/SELECT status FROM .* WHERE id=\?/i.test(this.sql)){
      const row=this.db.rows.get(this.args[0]); return row?{status:row.status}:null;
    }
    throw new Error('FakeDB unsupported first SQL: '+this.sql);
  }
  async all(){ return {results:[...this.db.rows.values()]}; }
}
class FakeDB { constructor(){this.rows=new Map();} prepare(sql){return new FakeStatement(this,sql);} }

const text=[
  'O governo anunciou nesta quinta-feira um programa nacional de infraestrutura que começará a funcionar em outubro de 2026 e terá execução gradual em todas as regiões do país.',
  'A primeira etapa prevê investimento de R$ 20 milhões para obras emergenciais, segundo informações divulgadas pelo ministério responsável durante coletiva realizada em Brasília.',
  'O planejamento inicial inclui atendimento a 15 cidades consideradas prioritárias, escolhidas a partir de critérios técnicos relacionados à população e às estruturas existentes.',
  'A execução será dividida em três fases, com acompanhamento mensal e publicação de relatórios sobre o andamento físico e financeiro de cada intervenção prevista no programa.',
  'O ministério informou que os contratos da primeira fase deverão ser assinados em novembro, após a conclusão dos processos de seleção e análise das propostas apresentadas.',
  'A expectativa oficial é que as primeiras entregas ocorram no primeiro semestre de 2027, mas o cronograma poderá ser ajustado conforme a evolução das obras e das licitações.'
].join(' ');
const input=normalizeProductionInput({sourceType:'text',title:'Programa nacional de infraestrutura',text,slideCount:6});
const ts=new Date().toISOString();
const row={id:'11111111-1111-4111-8111-111111111111',source_type:'text',title:input.title,input_payload:'{}',normalized_input:JSON.stringify(input),status:'queued',stage:'source',progress:4,attempt:1,retry_count:0,heartbeat:ts,output_payload:'{}',error_payload:'{}',reader_strategy:'',evidence_count:0,quality_score:null,confidence:null,engine_baseline:'forma-production-v1.1',created_at:ts,updated_at:ts};
const DB=new FakeDB(); DB.rows.set(row.id,row);
await processProductionJob(row.id,{DB});
const final=DB.rows.get(row.id); const out=JSON.parse(final.output_payload||'{}');
const checks=[
  ['Job reaches ready', final.status==='ready'&&final.stage==='ready'&&final.progress===100],
  ['Evidence is persisted', Number(final.evidence_count)>=5],
  ['Fallback creates six slides without AI', out.result?.slides?.length===6],
  ['Quality score is persisted', Number(final.quality_score)>=80],
  ['Result records deterministic fallback', out.result?.generationMode==='deterministic-fallback'],
  ['Result passes factual gate', out.result?.factualGate?.ok===true]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('PRODUCTION_PROCESS_E2E_TEST: PASS');
