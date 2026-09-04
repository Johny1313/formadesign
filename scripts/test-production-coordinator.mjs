import fs from 'node:fs';
import { normalizeProductionInput, normalizeUrl } from '../src/production/service.js';
const backend=fs.readFileSync(new URL('../src/production/service.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const url=normalizeUrl('https://example.com/noticia?utm_source=x&b=2&a=1#fragment');
const text=normalizeProductionInput({sourceType:'text',text:'Este é um texto editorial suficientemente longo para validar a entrada do Production Engine.',slideCount:9});
const topic=normalizeProductionInput({sourceType:'topic',topic:'Impactos do trabalho híbrido nas carreiras jovens',slideCount:6});
const checks=[
 ['Production jobs table exists', backend.includes("const TABLE='forma_design_production_jobs'")],
 ['Production public API create/list exists', backend.includes("url.pathname==='/api/forma/production/jobs'")],
 ['Retry reuses the same job route', backend.includes("/(retry|cancel)") && backend.includes("retryJob(match[1],request,env)")],
 ['Cancel job route exists', backend.includes("cancelJob(match[1],env)")],
 ['Job model persists heartbeat', backend.includes('heartbeat TEXT NOT NULL')],
 ['Job model persists retry count', backend.includes('retry_count INTEGER NOT NULL DEFAULT 0')],
 ['Job model persists quality fields', backend.includes('quality_score REAL') && backend.includes('confidence REAL')],
 ['URL normalizer preserves original URL', url.originalRequestedUrl.includes('utm_source=x')],
 ['URL normalizer removes tracking and fragment', !url.normalizedUrl.includes('utm_source') && !url.normalizedUrl.includes('#')],
 ['URL normalizer sorts remaining params', url.normalizedUrl.includes('?a=1&b=2')],
 ['Text ProductionInput works', text.sourceType==='text' && text.slideCount===9],
 ['Topic ProductionInput works', topic.sourceType==='topic' && topic.slideCount===6],
 ['Worker routes FORMA production API', index.includes("url.pathname.startsWith('/api/forma/production/')")],
 ['Health exposes Production Engine phase', index.includes("productionEngine:{phase:'coordinator'")],
 ['Production tab exists', ui.includes('data-panel="production"') && ui.includes('data-page="production"')],
 ['Production supports URL text and topic', ui.includes('value="url">URL / matéria') && ui.includes('value="text">Texto colado') && ui.includes('value="topic">Pauta digitada')],
 ['Production UI creates FORMA-owned job', ui.includes("formaProductionApi('/api/forma/production/jobs'")],
 ['Production UI retries same job', ui.includes("/api/forma/production/jobs/${encodeURIComponent(id)}/retry")],
 ['Production UI exposes stage progress', ui.includes('id="formaProductionStages"')]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('PRODUCTION_COORDINATOR_TEST: PASS');
