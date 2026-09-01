const TABLE = 'forma_design_projects';

function json(data,status=200){
  return Response.json(data,{status,headers:{
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  }});
}

function clean(value,max=5000){
  return String(value ?? '').trim().slice(0,max);
}

function id(){
  return crypto.randomUUID();
}

async function ensure(db){
  if(!db) return false;
  await db.prepare(`CREATE TABLE IF NOT EXISTS ${TABLE}(
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${TABLE}_updated ON ${TABLE}(updated_at DESC)`).run();
  return true;
}

function normalizePayload(value){
  if(value && typeof value === 'object') return value;
  return {};
}

async function create(request,env){
  await ensure(env.DB);
  const body=await request.json().catch(()=>({}));
  const projectId=id();
  const now=new Date().toISOString();
  const title=clean(body.title || body.name || 'Sem título',180);
  const payload=normalizePayload(body.payload || body.project || body);
  await env.DB.prepare(`INSERT INTO ${TABLE}(id,source,title,payload,created_at,updated_at) VALUES(?,?,?,?,?,?)`)
    .bind(projectId,'forma-design',title,JSON.stringify(payload),now,now).run();
  return json({ok:true,project:{id:projectId,title,payload,createdAt:now,updatedAt:now}});
}

async function list(env){
  await ensure(env.DB);
  const rows=await env.DB.prepare(`SELECT id,title,source,created_at,updated_at FROM ${TABLE} ORDER BY updated_at DESC LIMIT 100`).all();
  return json({ok:true,projects:(rows.results||[]).map(r=>({
    id:r.id,title:r.title,source:r.source,createdAt:r.created_at,updatedAt:r.updated_at
  }))});
}

async function get(projectId,env){
  await ensure(env.DB);
  const r=await env.DB.prepare(`SELECT * FROM ${TABLE} WHERE id=?`).bind(projectId).first();
  if(!r) return json({ok:false,error:'Projeto não encontrado'},404);
  let payload={};try{payload=JSON.parse(r.payload||'{}')}catch{}
  return json({ok:true,project:{
    id:r.id,title:r.title,source:r.source,payload,
    createdAt:r.created_at,updatedAt:r.updated_at
  }});
}

async function save(projectId,request,env){
  await ensure(env.DB);
  const current=await env.DB.prepare(`SELECT id,created_at FROM ${TABLE} WHERE id=?`).bind(projectId).first();
  if(!current) return json({ok:false,error:'Projeto não encontrado'},404);
  const body=await request.json().catch(()=>({}));
  const title=clean(body.title || body.name || 'Sem título',180);
  const payload=normalizePayload(body.payload || body.project || body);
  const now=new Date().toISOString();
  await env.DB.prepare(`UPDATE ${TABLE} SET title=?,payload=?,updated_at=? WHERE id=?`)
    .bind(title,JSON.stringify(payload),now,projectId).run();
  return json({ok:true,project:{id:projectId,title,payload,createdAt:current.created_at,updatedAt:now}});
}

export async function handleProjectsApi(request,env){
  if(!env.DB) return json({ok:false,code:'DB_BINDING_REQUIRED',error:'Binding D1 DB não configurado'},503);
  const url=new URL(request.url);
  if(url.pathname==='/api/projects' && request.method==='POST') return create(request,env);
  if(url.pathname==='/api/projects' && request.method==='GET') return list(env);
  const m=/^\/api\/projects\/([a-f0-9-]{20,80})$/i.exec(url.pathname);
  if(m && request.method==='GET') return get(m[1],env);
  if(m && (request.method==='PUT'||request.method==='POST')) return save(m[1],request,env);
  return json({ok:false,error:'Endpoint não encontrado'},404);
}
