const RESOURCE_TABLE='forma_design_library';
const CHUNK_TABLE='forma_design_library_chunks';
const CHUNK_SIZE=48000;
const ALLOWED_KINDS=new Set(['template','palette','font']);

function json(data,status=200){
  return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
function clean(value,max=180){return String(value??'').trim().slice(0,max);}
function normalizeId(value){
  const raw=clean(value,120);
  return /^[a-zA-Z0-9_-]{3,120}$/.test(raw)?raw:null;
}
function newId(kind='resource'){return `${kind}_${crypto.randomUUID()}`;}
function splitText(text,size=CHUNK_SIZE){
  const input=String(text??'');
  const parts=[];
  for(let i=0;i<input.length;i+=size)parts.push(input.slice(i,i+size));
  return parts.length?parts:[''];
}
async function ensure(db){
  if(!db)return false;
  await db.prepare(`CREATE TABLE IF NOT EXISTS ${RESOURCE_TABLE}(
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    meta TEXT NOT NULL DEFAULT '{}',
    parts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${RESOURCE_TABLE}_kind_updated ON ${RESOURCE_TABLE}(kind,updated_at DESC)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS ${CHUNK_TABLE}(
    resource_id TEXT NOT NULL,
    part_no INTEGER NOT NULL,
    content TEXT NOT NULL,
    PRIMARY KEY(resource_id,part_no)
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${CHUNK_TABLE}_resource ON ${CHUNK_TABLE}(resource_id,part_no)`).run();
  return true;
}
function parseJson(value,fallback={}){try{return JSON.parse(value||'')??fallback;}catch{return fallback;}}

async function listResources(env,kind){
  await ensure(env.DB);
  const rows=await env.DB.prepare(`SELECT id,kind,name,meta,parts,created_at,updated_at FROM ${RESOURCE_TABLE} WHERE kind=? ORDER BY updated_at DESC LIMIT 100`).bind(kind).all();
  return json({ok:true,items:(rows.results||[]).map(row=>({
    id:row.id,kind:row.kind,name:row.name,meta:parseJson(row.meta,{}),parts:Number(row.parts)||0,createdAt:row.created_at,updatedAt:row.updated_at
  }))});
}
async function readResource(env,resourceId){
  await ensure(env.DB);
  const row=await env.DB.prepare(`SELECT * FROM ${RESOURCE_TABLE} WHERE id=?`).bind(resourceId).first();
  if(!row)return json({ok:false,error:'Recurso não encontrado'},404);
  const chunks=await env.DB.prepare(`SELECT content FROM ${CHUNK_TABLE} WHERE resource_id=? ORDER BY part_no ASC`).bind(resourceId).all();
  const text=(chunks.results||[]).map(x=>x.content||'').join('');
  return json({ok:true,item:{id:row.id,kind:row.kind,name:row.name,meta:parseJson(row.meta,{}),payload:parseJson(text,{}),createdAt:row.created_at,updatedAt:row.updated_at}});
}
async function saveResource(request,env){
  await ensure(env.DB);
  const body=await request.json().catch(()=>({}));
  const kind=clean(body.kind,30).toLowerCase();
  if(!ALLOWED_KINDS.has(kind))return json({ok:false,error:'Tipo de recurso inválido'},400);
  const resourceId=normalizeId(body.id)||newId(kind);
  const name=clean(body.name||body.payload?.name||'Sem nome',180)||'Sem nome';
  const meta=body.meta&&typeof body.meta==='object'?body.meta:{};
  const payload=body.payload&&typeof body.payload==='object'?body.payload:{};
  const serialized=JSON.stringify(payload);
  const parts=splitText(serialized);
  const now=new Date().toISOString();
  const current=await env.DB.prepare(`SELECT created_at FROM ${RESOURCE_TABLE} WHERE id=?`).bind(resourceId).first();
  const createdAt=current?.created_at||now;
  await env.DB.prepare(`INSERT OR REPLACE INTO ${RESOURCE_TABLE}(id,kind,name,meta,parts,created_at,updated_at) VALUES(?,?,?,?,?,?,?)`)
    .bind(resourceId,kind,name,JSON.stringify(meta),parts.length,createdAt,now).run();
  await env.DB.prepare(`DELETE FROM ${CHUNK_TABLE} WHERE resource_id=?`).bind(resourceId).run();
  for(let i=0;i<parts.length;i+=8){
    const statements=parts.slice(i,i+8).map((content,offset)=>
      env.DB.prepare(`INSERT INTO ${CHUNK_TABLE}(resource_id,part_no,content) VALUES(?,?,?)`).bind(resourceId,i+offset,content)
    );
    await env.DB.batch(statements);
  }
  return json({ok:true,id:resourceId,item:{id:resourceId,kind,name,meta,parts:parts.length,createdAt,updatedAt:now}});
}
async function deleteResource(env,resourceId){
  await ensure(env.DB);
  const exists=await env.DB.prepare(`SELECT id FROM ${RESOURCE_TABLE} WHERE id=?`).bind(resourceId).first();
  if(!exists)return json({ok:false,error:'Recurso não encontrado'},404);
  await env.DB.prepare(`DELETE FROM ${CHUNK_TABLE} WHERE resource_id=?`).bind(resourceId).run();
  await env.DB.prepare(`DELETE FROM ${RESOURCE_TABLE} WHERE id=?`).bind(resourceId).run();
  return json({ok:true,id:resourceId});
}

export async function handleLibraryApi(request,env){
  if(!env.DB)return json({ok:false,code:'DB_BINDING_REQUIRED',error:'Binding D1 DB não configurado'},503);
  const url=new URL(request.url);
  if(url.pathname==='/api/library'&&request.method==='GET'){
    const kind=clean(url.searchParams.get('kind'),30).toLowerCase();
    if(!ALLOWED_KINDS.has(kind))return json({ok:false,error:'Informe kind=template, palette ou font'},400);
    return listResources(env,kind);
  }
  if(url.pathname==='/api/library'&&request.method==='POST')return saveResource(request,env);
  const match=/^\/api\/library\/([a-zA-Z0-9_-]{3,120})$/.exec(url.pathname);
  if(match&&request.method==='GET')return readResource(env,match[1]);
  if(match&&request.method==='DELETE')return deleteResource(env,match[1]);
  return json({ok:false,error:'Endpoint não encontrado'},404);
}
