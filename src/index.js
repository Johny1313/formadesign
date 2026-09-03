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

function productionImageModelKind(model){
  const value=String(model||'').toLowerCase();
  if(value.includes('flux-1-schnell')) return 'flux1';
  if(value.includes('flux-2-klein')) return 'flux2';
  if(value.includes('stable-diffusion-xl-lightning')) return 'sdxl';
  return 'generic';
}

async function runProductionImageModel(env,model,{prompt,width,height}){
  const kind=productionImageModelKind(model);
  if(kind==='flux1'){
    return {result:await env.AI.run(model,{prompt,steps:4}),contentType:'image/jpeg',kind};
  }
  if(kind==='flux2'){
    const form=new FormData();
    form.append('prompt',prompt);
    form.append('width',String(width));
    form.append('height',String(height));
    const serialized=new Response(form);
    return {result:await env.AI.run(model,{multipart:{body:serialized.body,contentType:serialized.headers.get('content-type')}}),contentType:'image/jpeg',kind};
  }
  if(kind==='sdxl'){
    return {result:await env.AI.run(model,{prompt,width,height,num_steps:4}),contentType:'image/png',kind};
  }
  return {result:await env.AI.run(model,{prompt}),contentType:'image/png',kind};
}

function productionImageBody(result){
  if(result instanceof ReadableStream || result instanceof ArrayBuffer || ArrayBuffer.isView(result)) return result;
  if(result?.image){
    const raw=String(result.image).replace(/^data:image\/[a-z0-9.+-]+;base64,/i,'');
    return Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
  }
  return null;
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
    const generated=await runProductionImageModel(env,model,{prompt,width,height});
    const body=productionImageBody(generated.result);
    if(!body) return json({ok:false,error:'O modelo não retornou uma imagem utilizável.'},502);
    return new Response(body,{status:200,headers:{
      'Content-Type':generated.contentType,
      'Cache-Control':'no-store',
      'X-Forma-AI-Model':model,
      'X-Forma-AI-Engine':generated.kind
    }});
  }catch(error){
    const message=String(error?.message||'Falha ao gerar imagem');
    return json({ok:false,error:message,detail:message},502);
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
        version:'0.9.7.5.40',
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
      headers.set('X-Forma-Version','0.9.7.5.40');
      return new Response(assetResponse.body,{status:assetResponse.status,statusText:assetResponse.statusText,headers});
    }
    return assetResponse;
  }
};
