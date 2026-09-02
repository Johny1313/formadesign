import { handleFormaAiApi } from './ai/service.js';
import { handleSecureRemoveBg } from './forma/remove-bg.js';
import { handleFreeImagesApi } from './forma/free-images.js';
import { handleAssetProxyApi } from './forma/asset-proxy.js';
import { handleProjectsApi } from './projects/service.js';
import { handleLibraryApi } from './library/service.js';

function json(data,status=200){
  return Response.json(data,{status,headers:{
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  }});
}

function text(value,max=1600){
  return String(value ?? '').replace(/\s+/g,' ').trim().slice(0,max);
}

async function productionImage(request,env){
  if(request.method!=='POST') return json({ok:false,error:'Método não permitido'},405);
  if(!env.AI?.run) return json({ok:false,error:'Workers AI não está disponível'},503);

  const input=await request.json().catch(()=>({}));
  const prompt=text(input.prompt);
  if(prompt.length<8) return json({ok:false,error:'Descreva a imagem que deseja gerar.'},400);

  const width=Math.max(512,Math.min(1536,Number(input.width)||1024));
  const height=Math.max(512,Math.min(1536,Number(input.height)||1024));
  const model=env.FORMA_IMAGE_MODEL||'@cf/black-forest-labs/flux-1-schnell';

  try{
    const result=await env.AI.run(model,{prompt,width,height,num_steps:4});
    let body=null;
    if(result instanceof ReadableStream || result instanceof ArrayBuffer || ArrayBuffer.isView(result)){
      body=result;
    }else if(result?.image){
      const raw=String(result.image).replace(/^data:image\/[a-z+]+;base64,/i,'');
      body=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
    }
    if(!body) return json({ok:false,error:'O modelo não retornou uma imagem utilizável.'},502);
    return new Response(body,{status:200,headers:{
      'Content-Type':'image/png',
      'Cache-Control':'no-store',
      'X-Forma-AI-Model':model
    }});
  }catch(error){
    return json({ok:false,error:error?.message||'Falha ao gerar imagem'},502);
  }
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);

    if(url.pathname==='/'){
      return Response.redirect(new URL('/design/',request.url).toString(),302);
    }

    if(url.pathname==='/api/health'){
      return json({
        ok:true,
        product:'FORMA DESIGN',
        version:'0.9.7.5.30',
        chartStudio:true,
        giphy:true,
        removeBg:true,removeBgMode:env.REMOVEBG_API_KEY?'environment':'bundled-fallback',
        workersAi:!!env.AI,
        projects:!!env.DB,
        sharedLibrary:!!env.DB
      });
    }

    if(url.pathname==='/api/assets/proxy'){
      const out=await handleAssetProxyApi(request,env);
      if(out) return out;
    }

    if(url.pathname.startsWith('/api/free-images')) return handleFreeImagesApi(request,env);
    if(url.pathname==='/api/remove-bg') return handleSecureRemoveBg(request,env);
    if(url.pathname.startsWith('/api/projects')) return handleProjectsApi(request,env);
    if(url.pathname.startsWith('/api/library')) return handleLibraryApi(request,env);
    if(url.pathname==='/api/production/image') return productionImage(request,env);

    if(
      url.pathname.startsWith('/api/giphy/') ||
      url.pathname.startsWith('/api/ai/')
    ){
      return handleFormaAiApi(request,env);
    }

    if(url.pathname.startsWith('/api/')){
      return json({ok:false,error:'Endpoint não encontrado'},404);
    }

    const assetResponse=await env.ASSETS.fetch(request);
    if(url.pathname.startsWith('/design/')){
      const headers=new Headers(assetResponse.headers);
      headers.set('Cache-Control','no-store, max-age=0');
      headers.set('X-Forma-Version','0.9.7.5.30');
      return new Response(assetResponse.body,{status:assetResponse.status,statusText:assetResponse.statusText,headers});
    }
    return assetResponse;
  }
};
