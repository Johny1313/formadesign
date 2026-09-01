const FORMA_REMOVEBG_FALLBACK_KEY='7k34KuZDw8kqzyXPnYpMDMSE';
function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function uniqueKeys(...values){return [...new Set(values.map(value=>String(value||'').trim()).filter(Boolean))];}
async function readRemoveBgError(response){
  let detail='';
  try{const data=await response.clone().json();detail=data?.errors?.[0]?.title||data?.errors?.[0]?.detail||data?.error||'';}
  catch{try{detail=(await response.text()).slice(0,240);}catch{}}
  return detail||`Remove.bg respondeu HTTP ${response.status}`;
}
export async function handleSecureRemoveBg(request,env){
  if(request.method!=='POST')return json({ok:false,error:'Método não permitido'},405);
  const keys=uniqueKeys(env.REMOVEBG_API_KEY,FORMA_REMOVEBG_FALLBACK_KEY);
  if(!keys.length)return json({ok:false,code:'REMOVEBG_NOT_CONFIGURED',error:'Remoção de fundo não configurada no servidor.'},503);
  const form=await request.formData().catch(()=>null);const file=form?.get('image_file');
  if(!file||typeof file.arrayBuffer!=='function')return json({ok:false,error:'Imagem não enviada.'},400);
  if(Number(file.size)>12*1024*1024)return json({ok:false,error:'Imagem acima do limite seguro de 12 MB.'},413);

  let lastStatus=502,lastDetail='Não foi possível concluir a remoção de fundo.';
  for(let index=0;index<keys.length;index+=1){
    const key=keys[index];
    const upstream=new FormData();upstream.append('image_file',file,file.name||'imagem.png');upstream.append('size','auto');upstream.append('format','png');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),30000);
    try{
      const response=await fetch('https://api.remove.bg/v1.0/removebg',{method:'POST',headers:{'X-Api-Key':key},body:upstream,signal:controller.signal});
      if(response.ok){
        const headers=new Headers({'Content-Type':response.headers.get('Content-Type')||'image/png','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Forma-Remove-Bg':'ok','X-Forma-Remove-Bg-Key':index===0&&env.REMOVEBG_API_KEY?'environment':'fallback'});
        return new Response(response.body,{status:200,headers});
      }
      lastStatus=response.status;lastDetail=await readRemoveBgError(response);
      const canRetry=index<keys.length-1&&[401,402,403,408,429,500,502,503,504].includes(response.status);
      if(canRetry)continue;
      return json({ok:false,code:'REMOVEBG_UPSTREAM_ERROR',upstreamStatus:response.status,error:lastDetail},response.status>=500?502:response.status);
    }catch(error){
      lastStatus=error?.name==='AbortError'?504:502;
      lastDetail=error?.name==='AbortError'?'Remoção de fundo excedeu 30 segundos.':'Não foi possível concluir a remoção de fundo.';
      if(index<keys.length-1)continue;
      return json({ok:false,code:error?.name==='AbortError'?'REMOVEBG_TIMEOUT':'REMOVEBG_NETWORK_ERROR',error:lastDetail},lastStatus);
    }finally{clearTimeout(timer);}
  }
  return json({ok:false,code:'REMOVEBG_UPSTREAM_ERROR',upstreamStatus:lastStatus,error:lastDetail},lastStatus>=500?502:lastStatus);
}
