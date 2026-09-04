const TABLE='forma_design_production_jobs';
const ALLOWED_SOURCE_TYPES=new Set(['url','text','topic','project']);
const ALLOWED_STAGES=new Set(['queued','source','reading','evidence','translation','generating','quality','fallback','ready','failed','cancelled']);
const TRACKING_KEYS=new Set(['fbclid','gclid','dclid','mc_cid','mc_eid','igshid','ref_src','ref_url','srsltid']);
const TEXT_MODEL='@cf/zai-org/glm-4.7-flash';
const ENGINE_BASELINE='forma-production-v1.2';
const READER_VERSION='forma-direct-reader-1.0';
const EVIDENCE_VERSION='forma-evidence-1.0';
const CAROUSEL_VERSION='forma-carousel-1.1';

function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function clean(value,max=5000){return String(value??'').trim().slice(0,max);}
function compact(value,max=5000){return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);}
function now(){return new Date().toISOString();}
function id(){return crypto.randomUUID();}
function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value)||min));}
function parseJson(value,fallback={}){try{return JSON.parse(value||'')??fallback;}catch{return fallback;}}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function ensure(db){if(!db)return false;await db.prepare(`CREATE TABLE IF NOT EXISTS ${TABLE}(
  id TEXT PRIMARY KEY,source_type TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',input_payload TEXT NOT NULL,normalized_input TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,stage TEXT NOT NULL,progress INTEGER NOT NULL DEFAULT 0,attempt INTEGER NOT NULL DEFAULT 1,retry_count INTEGER NOT NULL DEFAULT 0,
  heartbeat TEXT NOT NULL,output_payload TEXT NOT NULL DEFAULT '{}',error_payload TEXT NOT NULL DEFAULT '{}',reader_strategy TEXT NOT NULL DEFAULT '',
  evidence_count INTEGER NOT NULL DEFAULT 0,quality_score REAL,confidence REAL,engine_baseline TEXT NOT NULL DEFAULT '${ENGINE_BASELINE}',created_at TEXT NOT NULL,updated_at TEXT NOT NULL
)`).run();await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${TABLE}_updated ON ${TABLE}(updated_at DESC)`).run();await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${TABLE}_status ON ${TABLE}(status,updated_at DESC)`).run();return true;}

function normalizeUrl(value){const original=clean(value,4000);let url;try{url=new URL(original);}catch{throw new Error('URL inválida.');}if(!['http:','https:'].includes(url.protocol))throw new Error('Apenas URLs HTTP/HTTPS são aceitas.');url.hash='';for(const key of [...url.searchParams.keys()]){const lower=key.toLowerCase();if(lower.startsWith('utm_')||TRACKING_KEYS.has(lower))url.searchParams.delete(key);}const sorted=[...url.searchParams.entries()].sort(([a],[b])=>a.localeCompare(b));url.search='';sorted.forEach(([key,value])=>url.searchParams.append(key,value));return {originalRequestedUrl:original,normalizedUrl:url.toString()};}
function normalizeProductionInput(raw={}){const sourceType=clean(raw.sourceType||raw.type||'url',30).toLowerCase();if(!ALLOWED_SOURCE_TYPES.has(sourceType))throw new Error('Tipo de entrada inválido.');const slideCount=clamp(raw.slideCount||7,3,15);const title=clean(raw.title,220);const base={sourceType,slideCount,title,origin:'forma',createdBy:'forma-design'};if(sourceType==='url'){const url=normalizeUrl(raw.url);return {...base,...url,url:url.normalizedUrl};}if(sourceType==='text'){const text=clean(raw.text,120000);if(text.length<40)throw new Error('Cole um texto com pelo menos 40 caracteres.');return {...base,text};}if(sourceType==='topic'){const topic=clean(raw.topic||raw.text,4000);if(topic.length<8)throw new Error('Descreva a pauta com pelo menos 8 caracteres.');return {...base,topic};}const projectId=clean(raw.projectId,160);if(!projectId)throw new Error('Informe o projeto que será regenerado.');return {...base,projectId};}
function publicJob(row){if(!row)return null;return {id:row.id,sourceType:row.source_type,title:row.title,input:parseJson(row.normalized_input,{}),status:row.status,stage:row.stage,progress:Number(row.progress)||0,attempt:Number(row.attempt)||1,retryCount:Number(row.retry_count)||0,heartbeat:row.heartbeat,output:parseJson(row.output_payload,{}),error:parseJson(row.error_payload,{}),readerStrategy:row.reader_strategy||'',evidenceCount:Number(row.evidence_count)||0,qualityScore:row.quality_score==null?null:Number(row.quality_score),confidence:row.confidence==null?null:Number(row.confidence),engineBaseline:row.engine_baseline||ENGINE_BASELINE,createdAt:row.created_at,updatedAt:row.updated_at};}

function privateHostname(hostname){
  const h=String(hostname||'').toLowerCase().replace(/^\[|\]$/g,'');
  if(!h||h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal'))return true;
  if(h==='::1'||h.startsWith('fc')||h.startsWith('fd')||h.startsWith('fe80:'))return true;
  const m=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if(!m)return false;
  const [a,b,c,d]=m.slice(1).map(Number);if([a,b,c,d].some(x=>x<0||x>255))return true;
  return a===10||a===127||a===0||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19));
}
function assertSafeHttpUrl(value){const url=new URL(value);if(!['http:','https:'].includes(url.protocol))throw new Error('Apenas HTTP/HTTPS são permitidos.');if(privateHostname(url.hostname))throw new Error('Destino privado/local bloqueado pelo SSRF Guard.');return url;}

function decodeEntities(value){
  const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',hellip:'…',ldquo:'“',rdquo:'”',lsquo:'‘',rsquo:'’'};
  return String(value||'').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(all,key)=>{const k=String(key).toLowerCase();if(k[0]==='#'){const hex=k[1]==='x';const n=parseInt(k.slice(hex?2:1),hex?16:10);return Number.isFinite(n)?String.fromCodePoint(n):all;}return named[k]??all;});
}
function stripTags(value){return compact(decodeEntities(String(value||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ')),200000);}
function metaContent(html,key){const patterns=[new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,`i`),new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`,`i`)];for(const re of patterns){const m=re.exec(html);if(m)return decodeEntities(m[1]);}return '';}
function htmlTitle(html){return compact(metaContent(html,'og:title')||metaContent(html,'twitter:title')||(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]||''),300);}
function jsonLdBodies(html){
  const out=[];const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;let m;
  const visit=value=>{if(!value)return;if(Array.isArray(value)){value.forEach(visit);return;}if(typeof value!=='object')return;const type=Array.isArray(value['@type'])?value['@type'].join(' '):String(value['@type']||'');if(/NewsArticle|Article|Reportage|AnalysisNewsArticle|BlogPosting/i.test(type)){const body=value.articleBody||value.text||value.articleContent||value.transcript;if(body)out.push(compact(body,160000));}if(value['@graph'])visit(value['@graph']);};
  while((m=re.exec(html))){try{visit(JSON.parse(m[1].trim()));}catch{}}
  return out.filter(Boolean);
}
function extractArticleText(html){
  const bodies=jsonLdBodies(html);if(bodies.length){const best=bodies.sort((a,b)=>b.length-a.length)[0];if(best.length>=280)return {text:best,strategy:'json-ld'};}
  let source=String(html||'').replace(/<!--[\s\S]*?-->/g,' ').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<(nav|footer|aside|form|noscript)\b[\s\S]*?<\/\1>/gi,' ');
  const paragraphs=[];const re=/<p\b[^>]*>([\s\S]*?)<\/p>/gi;let m;
  while((m=re.exec(source))){const p=stripTags(m[1]);if(p.length>=35&&!/^(publicidade|assine|newsletter|compartilhe|leia também|veja também)\b/i.test(p))paragraphs.push(p);}
  const dedup=[...new Set(paragraphs)];const text=dedup.join('\n\n');
  if(text.length>=300)return {text,strategy:'paragraphs'};
  const article=/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)>/i.exec(source)?.[1];const fallback=stripTags(article||source);return {text:fallback,strategy:'generic'};
}
async function fetchWithTimeout(url,timeoutMs=6500){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort('timeout'),timeoutMs);
  try{return await fetch(url,{method:'GET',redirect:'manual',signal:controller.signal,headers:{Accept:'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8,*/*;q=0.4','User-Agent':'FORMA-DESIGN/0.9.7.5.50.1 ProductionReader/1.0'}});}finally{clearTimeout(timer);}
}
async function directReadUrl(value){
  let current=assertSafeHttpUrl(value),redirects=0,response;
  while(redirects<=5){
    try{response=await fetchWithTimeout(current.toString());}catch(error){if(String(error?.name||'')==='AbortError'||/timeout/i.test(String(error)))throw new Error('NETWORK_TIMEOUT');throw new Error('NETWORK_FETCH_FAILED');}
    if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');if(!location)throw new Error(`HTTP_${response.status}`);current=assertSafeHttpUrl(new URL(location,current).toString());redirects+=1;continue;}
    break;
  }
  if(!response)throw new Error('NETWORK_FETCH_FAILED');
  if(response.status===403)throw new Error('HTTP_403');if(response.status===429)throw new Error('HTTP_429');if(!response.ok)throw new Error(`HTTP_${response.status}`);
  const type=String(response.headers.get('content-type')||'').toLowerCase();if(!/(text\/html|application\/xhtml|text\/plain)/.test(type))throw new Error('UNSUPPORTED_CONTENT_TYPE');
  const html=(await response.text()).slice(0,2_500_000);const title=htmlTitle(html);const extracted=type.includes('text/plain')?{text:compact(html,160000),strategy:'text'}:extractArticleText(html);const articleText=clean(extracted.text,160000);const wordCount=(articleText.match(/\S+/g)||[]).length;
  if(articleText.length<300||wordCount<55)throw new Error('INSUFFICIENT_CONTENT');
  return {title:title||current.hostname,articleText,wordCount,readUrl:current.toString(),canonicalUrl:current.toString(),resolvedUrl:current.toString(),readerStrategy:`direct:${extracted.strategy}`,status:'ok'};
}

function sentenceList(text){return String(text||'').replace(/\r/g,'\n').split(/(?<=[.!?])\s+|\n{2,}/).map(x=>compact(x,700)).filter(x=>x.length>=28);}
function evidencePackFromSource(source,input){
  const sentences=sentenceList(source.articleText||'');const seen=new Set();const facts=[];
  for(const sentence of sentences){const key=sentence.toLowerCase().replace(/[^a-zà-ÿ0-9]+/gi,' ').slice(0,120);if(seen.has(key))continue;seen.add(key);facts.push({id:`E${String(facts.length+1).padStart(2,'0')}`,claim:sentence,evidence:sentence,confidence:'high'});if(facts.length>=18)break;}
  if(!facts.length&&input.sourceType==='topic'){facts.push({id:'E01',claim:input.topic,evidence:input.topic,confidence:'user-provided'});}
  const pack={id:id(),sourceType:input.sourceType,sourceRef:input.url||input.projectId||'forma-input',originalRequestedUrl:input.originalRequestedUrl||'',canonicalUrl:source.canonicalUrl||input.url||'',resolvedUrl:source.resolvedUrl||input.url||'',readUrl:source.readUrl||input.url||'',sourceName:source.sourceName||'',title:source.title||input.title||'',subtitle:'',author:'',publishedAt:'',articleText:source.articleText||'',wordCount:source.wordCount||0,facts,images:[],reading:{strategy:source.readerStrategy||'input',status:'ok'},sourceSelection:{singleSource:true},translation:{status:'not-needed'},readerVersion:READER_VERSION,evidenceVersion:EVIDENCE_VERSION};return pack;
}
function supportedSlideCount(pack,requested){const facts=pack.facts.length;const maxByFacts=Math.max(0,Math.min(15,facts+1));if(maxByFacts<3)return 0;return Math.min(requested,maxByFacts);}
function shortTitle(text,max=68){let value=compact(text,max+80);if(value.length<=max)return value;const cut=value.slice(0,max+1);const boundary=cut.lastIndexOf(' ');return (boundary>Math.floor(max*.65)?cut.slice(0,boundary):cut.slice(0,max)).replace(/[,:;\-–— ]+$/,'');}
function shortSubtitle(text,max=190){let value=compact(text,max+100);if(value.length<=max)return value;const cut=value.slice(0,max+1);const boundary=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('; '),cut.lastIndexOf(', '),cut.lastIndexOf(' '));return (boundary>Math.floor(max*.7)?cut.slice(0,boundary):cut.slice(0,max)).replace(/[,:;\-–— ]+$/,'')+'…';}
function deterministicCarousel(pack,slideCount){
  const facts=pack.facts.slice(0,Math.max(2,slideCount-1));const slides=[];const opening=facts[0]?.claim||pack.title||'Conteúdo';slides.push({number:1,role:'abertura',title:shortTitle(pack.title||opening),subtitle:shortSubtitle(opening),evidenceIds:facts[0]?[facts[0].id]:[]});
  for(let i=1;i<slideCount;i++){const fact=facts[Math.min(i-1,facts.length-1)];if(!fact)break;slides.push({number:i+1,role:i===slideCount-1?'fechamento':'fato',title:shortTitle(fact.claim),subtitle:shortSubtitle(fact.evidence),evidenceIds:[fact.id]});}
  return slides;
}
function extractModelText(output){if(!output)return '';if(typeof output==='string')return output;if(typeof output.response==='string')return output.response;if(typeof output.result==='string')return output.result;const content=output?.choices?.[0]?.message?.content??output?.choices?.[0]?.text;if(typeof content==='string')return content;if(Array.isArray(content))return content.map(x=>x?.text||x?.content||'').join('\n');return '';}
function parseLooseJson(text){const raw=String(text||'').trim().replace(/^```(?:json)?/i,'').replace(/```$/i,'').trim();try{return JSON.parse(raw);}catch{}const first=raw.indexOf('{'),last=raw.lastIndexOf('}');if(first>=0&&last>first){try{return JSON.parse(raw.slice(first,last+1));}catch{}}return null;}
async function aiCarousel(env,pack,slideCount){
  if(!env.AI?.run)return null;
  const evidence=pack.facts.slice(0,14).map(f=>`${f.id}: ${f.evidence}`).join('\n');
  const messages=[{role:'system',content:'Você é um redator jornalístico brasileiro. Use EXCLUSIVAMENTE as evidências fornecidas. Não crie fatos, números, datas, citações ou contexto externo. Produza português brasileiro. Retorne APENAS JSON válido no formato {"slides":[{"number":1,"role":"abertura","title":"...","subtitle":"...","evidenceIds":["E01"]}]}. Título até 68 caracteres. Subtítulo até 190 caracteres. Cada slide informativo deve acrescentar informação nova e usar apenas evidenceIds existentes.'},{role:'user',content:`TÍTULO: ${pack.title}\nSLIDES: ${slideCount}\nEVIDÊNCIAS:\n${evidence}`}];
  try{const output=await env.AI.run(TEXT_MODEL,{messages,temperature:0.15,max_completion_tokens:1800});const parsed=parseLooseJson(extractModelText(output));if(!Array.isArray(parsed?.slides))return null;return parsed.slides.slice(0,slideCount).map((slide,index)=>({number:index+1,role:clean(slide?.role||'fato',40),title:shortTitle(slide?.title||''),subtitle:shortSubtitle(slide?.subtitle||''),evidenceIds:Array.isArray(slide?.evidenceIds)?slide.evidenceIds.map(x=>clean(x,12)).filter(Boolean):[]}));}catch{return null;}
}
function factualGate(slides,pack){const allowed=new Set(pack.facts.map(f=>f.id));const source=compact(`${pack.title} ${pack.articleText}`,200000).toLowerCase();const errors=[];for(const slide of slides){if(!slide.title)errors.push(`slide ${slide.number}: título vazio`);if(!slide.evidenceIds?.length)errors.push(`slide ${slide.number}: sem evidenceIds`);for(const eid of slide.evidenceIds||[]){if(!allowed.has(eid))errors.push(`slide ${slide.number}: ${eid} inexistente`);}const content=`${slide.title} ${slide.subtitle}`;const nums=content.match(/(?:R\$\s*)?\d[\d.,]*%?/g)||[];for(const n of nums){const token=n.toLowerCase().replace(/\s+/g,'');if(token.length>=2&&!source.replace(/\s+/g,'').includes(token))errors.push(`slide ${slide.number}: número não suportado ${n}`);}}return {ok:errors.length===0,errors:errors.slice(0,20)};}
function qualityGate(slides,slideCount,pack){let score=100;const issues=[];if(slides.length!==slideCount){score-=25;issues.push('quantidade de slides diferente');}const normalized=new Set();for(const slide of slides){if(!slide.title){score-=15;issues.push(`slide ${slide.number} sem título`);}if(slide.title?.length>68){score-=5;issues.push(`slide ${slide.number} título longo`);}if(slide.subtitle?.length>190){score-=5;issues.push(`slide ${slide.number} subtítulo longo`);}const key=compact(`${slide.title} ${slide.subtitle}`,300).toLowerCase();if(normalized.has(key)){score-=12;issues.push(`slide ${slide.number} duplicado`);}normalized.add(key);}const factual=factualGate(slides,pack);if(!factual.ok){score-=Math.min(50,factual.errors.length*12);issues.push(...factual.errors);}return {score:Math.max(0,score),ok:score>=80&&factual.ok,issues,factual};}


async function processProductionInput(raw,env={}){
  const input=normalizeProductionInput(raw);
  const jobId=id();const ts=now();
  const title=clean(input.title||(input.sourceType==='url'?new URL(input.url).hostname:input.sourceType==='topic'?input.topic.slice(0,100):input.sourceType==='text'?input.text.slice(0,100):`Projeto ${input.projectId}`),220);
  let pack=null;let source={title:input.title||'',articleText:'',wordCount:0,readerStrategy:'input',sourceName:'FORMA'};
  const progress=[];const mark=(stageName,value)=>progress.push({stage:stageName,progress:value,at:now()});
  try{
    mark('source',8);
    if(input.sourceType==='url'){
      mark('reading',22);source=await directReadUrl(input.url);source.sourceName=new URL(source.readUrl).hostname;
    }else if(input.sourceType==='text'){
      mark('reading',22);source={title:input.title||sentenceList(input.text)[0]||'Texto colado',articleText:input.text,wordCount:(input.text.match(/\S+/g)||[]).length,readerStrategy:'input:text',sourceName:'Texto fornecido'};
    }else if(input.sourceType==='topic'){
      mark('reading',22);source={title:input.title||input.topic,articleText:input.topic,wordCount:(input.topic.match(/\S+/g)||[]).length,readerStrategy:'input:topic',sourceName:'Pauta fornecida'};
    }else throw new Error('Regeneração de projeto ainda não está disponível nesta etapa.');
    mark('evidence',44);pack=evidencePackFromSource(source,input);
    if(input.sourceType!=='topic'&&(pack.wordCount<55||pack.facts.length<2))throw new Error('INSUFFICIENT_CONTENT');
    mark('translation',54);pack.translation={status:'not-needed',language:'pt-BR',note:'A tradução dedicada será ampliada em etapa posterior; a geração editorial responde em PT-BR.'};
    mark('generating',67);
    const supported=supportedSlideCount(pack,input.slideCount);if(supported<3)throw new Error('A entrada não possui evidência suficiente para um carrossel seguro.');
    let slides=await aiCarousel(env,pack,supported);let generationMode='ai';
    if(!slides||slides.length!==supported){slides=deterministicCarousel(pack,supported);generationMode='deterministic-fallback';mark('fallback',78);}
    mark('quality',88);let quality=qualityGate(slides,supported,pack);
    if(!quality.ok&&generationMode==='ai'){slides=deterministicCarousel(pack,supported);generationMode='deterministic-fallback';quality=qualityGate(slides,supported,pack);}
    if(!quality.factual.ok)throw new Error(`FACTUAL_GATE_FAILED: ${quality.factual.errors.join('; ')}`);
    const result={topicTitle:pack.title||title,slides,evidencePack:pack,facts:pack.facts,reading:{selectedSource:{title:pack.title,sourceName:source.sourceName||'',url:pack.readUrl,images:[]},strategy:source.readerStrategy},verificationLinks:pack.readUrl?[{title:pack.title,sourceName:source.sourceName||'Fonte',url:pack.readUrl,linkRole:'factual-source'}]:[],qualityGate:{score:quality.score,issues:quality.issues},factualGate:quality.factual,confidence:quality.score/100,slideCountRequested:input.slideCount,slideCount:supported,slideCountAdjusted:supported!==input.slideCount,generationMode,translation:pack.translation,versions:{readerVersion:READER_VERSION,evidenceVersion:EVIDENCE_VERSION,carouselPipelineVersion:CAROUSEL_VERSION,engineBaseline:ENGINE_BASELINE}};
    mark('ready',100);const done=now();
    return {ok:true,mode:'stateless',job:{id:jobId,sourceType:input.sourceType,title,input,status:'ready',stage:'ready',progress:100,attempt:1,retryCount:0,heartbeat:done,output:{result},error:{},readerStrategy:source.readerStrategy,evidenceCount:pack.facts.length,qualityScore:quality.score,confidence:result.confidence,engineBaseline:ENGINE_BASELINE,createdAt:ts,updatedAt:done,progressLog:progress}};
  }catch(error){
    const done=now();return {ok:false,mode:'stateless',job:{id:jobId,sourceType:input.sourceType,title,input,status:'failed',stage:'failed',progress:100,attempt:1,retryCount:0,heartbeat:done,output:pack?{evidencePack:pack}:{},error:{message:String(error?.message||error||'Falha na produção'),stage:pack?'generating':'reading'},readerStrategy:source.readerStrategy||'',evidenceCount:pack?.facts?.length||0,qualityScore:null,confidence:null,engineBaseline:ENGINE_BASELINE,createdAt:ts,updatedAt:done,progressLog:progress}};
  }
}

async function runStateless(request,env){
  const raw=await request.json().catch(()=>({}));
  let normalized;try{normalized=normalizeProductionInput(raw);}catch(error){return json({ok:false,error:error.message||'Entrada inválida'},400);}
  const out=await processProductionInput(normalized,env);
  return json(out,out.ok?200:422);
}

async function updateJob(env,jobId,fields={}){const keys=Object.keys(fields);if(!keys.length)return;const clauses=[],values=[];for(const key of keys){clauses.push(`${key}=?`);values.push(fields[key]);}values.push(jobId);await env.DB.prepare(`UPDATE ${TABLE} SET ${clauses.join(',')} WHERE id=?`).bind(...values).run();}
async function jobCancelled(env,jobId){const row=await env.DB.prepare(`SELECT status FROM ${TABLE} WHERE id=?`).bind(jobId).first();return row?.status==='cancelled';}
async function stage(env,jobId,name,progress,extra={}){if(await jobCancelled(env,jobId))throw Object.assign(new Error('JOB_CANCELLED'),{cancelled:true});const ts=now();await updateJob(env,jobId,{status:'running',stage:name,progress,heartbeat:ts,updated_at:ts,...extra});}

async function processProductionJob(jobId,env){
  await ensure(env.DB);const row=await env.DB.prepare(`SELECT * FROM ${TABLE} WHERE id=?`).bind(jobId).first();if(!row||row.status==='cancelled')return;
  const input=parseJson(row.normalized_input,{});const saved=parseJson(row.output_payload,{});let pack=null;let source={title:input.title||'',articleText:'',wordCount:0,readerStrategy:'input',sourceName:'FORMA'};
  try{
    if(row.stage==='generating'&&saved?.evidencePack?.facts?.length){
      pack=saved.evidencePack;source={title:pack.title||row.title,articleText:pack.articleText||'',wordCount:pack.wordCount||0,readerStrategy:pack.reading?.strategy||row.reader_strategy||'evidence-cache',sourceName:pack.sourceName||'Fonte'};
      await stage(env,jobId,'generating',67,{reader_strategy:source.readerStrategy});
    }else{
      await stage(env,jobId,'source',8);
      if(input.sourceType==='url'){
        await stage(env,jobId,'reading',22);
        source=await directReadUrl(input.url);source.sourceName=new URL(source.readUrl).hostname;
      }else if(input.sourceType==='text'){
        await stage(env,jobId,'reading',22);source={title:input.title||sentenceList(input.text)[0]||'Texto colado',articleText:input.text,wordCount:(input.text.match(/\S+/g)||[]).length,readerStrategy:'input:text',sourceName:'Texto fornecido'};
      }else if(input.sourceType==='topic'){
        await stage(env,jobId,'reading',22);source={title:input.title||input.topic,articleText:input.topic,wordCount:(input.topic.match(/\S+/g)||[]).length,readerStrategy:'input:topic',sourceName:'Pauta fornecida'};
      }else throw new Error('Regeneração de projeto ainda não está disponível nesta etapa.');

      await stage(env,jobId,'evidence',44,{reader_strategy:source.readerStrategy});
      pack=evidencePackFromSource(source,input);if(input.sourceType!=='topic'&&(pack.wordCount<55||pack.facts.length<2))throw new Error('INSUFFICIENT_CONTENT');
      await updateJob(env,jobId,{evidence_count:pack.facts.length,output_payload:JSON.stringify({evidencePack:pack}),heartbeat:now(),updated_at:now()});
      await stage(env,jobId,'translation',54);
      pack.translation={status:'not-needed',language:'pt-BR',note:'A tradução completa será ampliada na etapa dedicada; a IA editorial, quando disponível, responde em PT-BR.'};
      await updateJob(env,jobId,{output_payload:JSON.stringify({evidencePack:pack}),heartbeat:now(),updated_at:now()});
      await stage(env,jobId,'generating',67);
    }

    const supported=supportedSlideCount(pack,input.slideCount);if(supported<3)throw new Error('A entrada não possui evidência suficiente para um carrossel seguro.');
    let slides=await aiCarousel(env,pack,supported);let generationMode='ai';
    if(!slides||slides.length!==supported){slides=deterministicCarousel(pack,supported);generationMode='deterministic-fallback';await stage(env,jobId,'fallback',78);}

    await stage(env,jobId,'quality',88);
    let quality=qualityGate(slides,supported,pack);
    if(!quality.ok&&generationMode==='ai'){
      slides=deterministicCarousel(pack,supported);generationMode='deterministic-fallback';quality=qualityGate(slides,supported,pack);
    }
    if(!quality.factual.ok)throw new Error(`FACTUAL_GATE_FAILED: ${quality.factual.errors.join('; ')}`);

    const result={topicTitle:pack.title||row.title,slides,evidencePack:pack,facts:pack.facts,reading:{selectedSource:{title:pack.title,sourceName:source.sourceName||'',url:pack.readUrl,images:[]},strategy:source.readerStrategy},verificationLinks:pack.readUrl?[{title:pack.title,sourceName:source.sourceName||'Fonte',url:pack.readUrl,linkRole:'factual-source'}]:[],qualityGate:{score:quality.score,issues:quality.issues},factualGate:quality.factual,confidence:quality.score/100,slideCountRequested:input.slideCount,slideCount:supported,slideCountAdjusted:supported!==input.slideCount,generationMode,translation:pack.translation,versions:{readerVersion:READER_VERSION,evidenceVersion:EVIDENCE_VERSION,carouselPipelineVersion:CAROUSEL_VERSION,engineBaseline:ENGINE_BASELINE}};
    const ts=now();await updateJob(env,jobId,{status:'ready',stage:'ready',progress:100,heartbeat:ts,output_payload:JSON.stringify({result}),error_payload:'{}',reader_strategy:source.readerStrategy,evidence_count:pack.facts.length,quality_score:quality.score,confidence:result.confidence,engine_baseline:ENGINE_BASELINE,updated_at:ts});
  }catch(error){if(error?.cancelled||String(error?.message)==='JOB_CANCELLED')return;const ts=now();await updateJob(env,jobId,{status:'failed',stage:'failed',progress:100,heartbeat:ts,error_payload:JSON.stringify({message:String(error?.message||error||'Falha na produção'),stage:pack?'generating':'reading'}),updated_at:ts});}
}

function scheduleProcess(jobId,env,ctx){const promise=processProductionJob(jobId,env);if(ctx?.waitUntil){ctx.waitUntil(promise);return;}return promise;}
async function createJob(request,env,ctx){await ensure(env.DB);const raw=await request.json().catch(()=>({}));let normalized;try{normalized=normalizeProductionInput(raw);}catch(error){return json({ok:false,error:error.message||'Entrada inválida'},400);}const jobId=id(),ts=now();const title=clean(normalized.title||(normalized.sourceType==='url'?new URL(normalized.url).hostname:normalized.sourceType==='topic'?normalized.topic.slice(0,100):normalized.sourceType==='text'?normalized.text.slice(0,100):`Projeto ${normalized.projectId}`),220);await env.DB.prepare(`INSERT INTO ${TABLE}(id,source_type,title,input_payload,normalized_input,status,stage,progress,attempt,retry_count,heartbeat,output_payload,error_payload,reader_strategy,evidence_count,quality_score,confidence,engine_baseline,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(jobId,normalized.sourceType,title,JSON.stringify(raw),JSON.stringify(normalized),'queued','source',4,1,0,ts,'{}','{}','',0,null,null,ENGINE_BASELINE,ts,ts).run();const row=await env.DB.prepare(`SELECT * FROM ${TABLE} WHERE id=?`).bind(jobId).first();scheduleProcess(jobId,env,ctx);return json({ok:true,job:publicJob(row),capabilities:{coordinator:true,reader:true,evidence:true,carousel:true,directReader:true,browserReader:false,externalRecovery:false},pollAfterMs:700},201);}
async function listJobs(env,url){await ensure(env.DB);const limit=clamp(url.searchParams.get('limit')||30,1,100);const rows=await env.DB.prepare(`SELECT * FROM ${TABLE} ORDER BY updated_at DESC LIMIT ?`).bind(limit).all();return json({ok:true,jobs:(rows.results||[]).map(publicJob)});}
async function getJob(jobId,env){await ensure(env.DB);const row=await env.DB.prepare(`SELECT * FROM ${TABLE} WHERE id=?`).bind(jobId).first();if(!row)return json({ok:false,error:'Job não encontrado'},404);return json({ok:true,job:publicJob(row)});}
async function retryJob(jobId,request,env,ctx){await ensure(env.DB);const row=await env.DB.prepare(`SELECT * FROM ${TABLE} WHERE id=?`).bind(jobId).first();if(!row)return json({ok:false,error:'Job não encontrado'},404);if(row.status==='cancelled')return json({ok:false,error:'Job cancelado não pode ser retomado.'},409);const body=await request.json().catch(()=>({}));const requestedStage=clean(body.stage,30).toLowerCase();const retryStage=ALLOWED_STAGES.has(requestedStage)&&!['ready','failed','cancelled'].includes(requestedStage)?requestedStage:(row.evidence_count>0?'generating':'source');const ts=now();await env.DB.prepare(`UPDATE ${TABLE} SET status='queued',stage=?,progress=?,attempt=attempt+1,retry_count=retry_count+1,heartbeat=?,error_payload='{}',updated_at=? WHERE id=?`).bind(retryStage,retryStage==='generating'?60:4,ts,ts,jobId).run();scheduleProcess(jobId,env,ctx);return getJob(jobId,env);}
async function cancelJob(jobId,env){await ensure(env.DB);const row=await env.DB.prepare(`SELECT * FROM ${TABLE} WHERE id=?`).bind(jobId).first();if(!row)return json({ok:false,error:'Job não encontrado'},404);if(row.status==='ready')return json({ok:false,error:'Job concluído não pode ser cancelado.'},409);const ts=now();await env.DB.prepare(`UPDATE ${TABLE} SET status='cancelled',stage='cancelled',progress=100,heartbeat=?,updated_at=? WHERE id=?`).bind(ts,ts,jobId).run();return getJob(jobId,env);}

export async function handleFormaProductionApi(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==='/api/forma/production/run'&&request.method==='POST')return runStateless(request,env);
  if(!env.DB){
    if(url.pathname==='/api/forma/production/jobs'&&request.method==='POST')return runStateless(request,env);
    if(url.pathname==='/api/forma/production/jobs'&&request.method==='GET')return json({ok:true,jobs:[],mode:'stateless',persistence:false});
    return json({ok:false,code:'STATELESS_MODE',error:'Persistência D1 indisponível neste deploy. Use /api/forma/production/run.'},503);
  }
  if(url.pathname==='/api/forma/production/jobs'&&request.method==='POST')return createJob(request,env,ctx);
  if(url.pathname==='/api/forma/production/jobs'&&request.method==='GET')return listJobs(env,url);
  const match=/^\/api\/forma\/production\/jobs\/([a-f0-9-]{20,80})(?:\/(retry|cancel))?$/i.exec(url.pathname);
  if(match&&!match[2]&&request.method==='GET')return getJob(match[1],env);
  if(match&&match[2]==='retry'&&request.method==='POST')return retryJob(match[1],request,env,ctx);
  if(match&&match[2]==='cancel'&&request.method==='POST')return cancelJob(match[1],env);
  return json({ok:false,error:'Endpoint não encontrado'},404);
}
export { normalizeProductionInput, normalizeUrl, directReadUrl, extractArticleText, evidencePackFromSource, deterministicCarousel, factualGate, qualityGate, processProductionJob, processProductionInput };
