const COMMONS_API='https://commons.wikimedia.org/w/api.php';
const OPENVERSE_API='https://api.openverse.org/v1/images/';
const AGENCIA_FOTOS='https://agenciabrasil.ebc.com.br/fotos';
const FOTOS_PUBLICAS='https://www.fotospublicas.com/';
const MAX_RESULTS=24;
const PROVIDER_ORDER=['agencia-brasil','fotos-publicas','openverse','wikimedia','pexels','unsplash'];

function json(data,status=200,extraHeaders={}){
  return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extraHeaders}});
}

function clean(value,max=500){
  return String(value??'')
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&').replace(/&quot;|&#34;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)||32))
    .replace(/\s+/g,' ').trim().slice(0,max);
}

function normalizeText(value){
  return clean(value,1000).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

function queryTokens(query){return normalizeText(query).split(/[^a-z0-9]+/).filter(x=>x.length>=3).slice(0,12);}
function clampLimit(value,fallback=12){return Math.max(1,Math.min(MAX_RESULTS,Number(value)||fallback));}
function absUrl(value,base){try{return new URL(String(value||''),base).toString();}catch{return'';}}
function attr(tag,name){const match=String(tag||'').match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`,'i'));return match?match[1]:'';}
function firstSrcFromImg(tag){
  const src=attr(tag,'src')||attr(tag,'data-src')||attr(tag,'data-lazy-src');
  if(src&&!/^data:/i.test(src))return src;
  const srcset=attr(tag,'srcset')||attr(tag,'data-srcset');
  if(srcset){const candidates=srcset.split(',').map(x=>x.trim().split(/\s+/)[0]).filter(Boolean);return candidates.at(-1)||'';}
  return'';
}
function dedupe(items){const seen=new Set();return items.filter(item=>{const key=item.pageUrl||item.originalUrl||item.url||item.id;if(!key||seen.has(key))return false;seen.add(key);return true;});}
function relevancy(query,item){
  const tokens=queryTokens(query);if(!tokens.length)return 0;
  const hay=normalizeText([item.title,item.description,item.credit,item.author].filter(Boolean).join(' '));
  let score=0;for(const token of tokens){if(hay.includes(token))score+=8;}
  if(normalizeText(item.title).includes(normalizeText(query)))score+=25;
  return score;
}

const FIXED_IMAGE_HOSTS=new Set([
  'upload.wikimedia.org','images.pexels.com','images.unsplash.com','basefp.s3.us-east-1.amazonaws.com',
  'live.staticflickr.com','cdn.loc.gov','images.metmuseum.org','imagens.ebc.com.br','agenciabrasil.ebc.com.br'
]);
const IMAGE_HOST_SUFFIXES=['.ebc.com.br','.agenciabrasil.ebc.com.br','.staticflickr.com','.si.edu','.loc.gov','.wikimedia.org','.wordpress.com'];
const RESOLVABLE_SOURCE_HOSTS=new Set(['agenciabrasil.ebc.com.br','www.fotospublicas.com','fotospublicas.com']);
function safeImageTarget(value){
  try{
    const url=new URL(String(value||''));
    if(url.protocol!=='https:')return null;
    const host=url.hostname.toLowerCase();
    if(!FIXED_IMAGE_HOSTS.has(host)&&!IMAGE_HOST_SUFFIXES.some(suffix=>host.endsWith(suffix)))return null;
    return url;
  }catch{return null;}
}
function safeSourcePage(value){
  try{
    const url=new URL(String(value||''));
    if(url.protocol!=='https:'||!RESOLVABLE_SOURCE_HOSTS.has(url.hostname.toLowerCase()))return null;
    return url;
  }catch{return null;}
}
function proxyFor(value){const safe=safeImageTarget(value);return safe?`/api/free-images/file?url=${encodeURIComponent(safe.toString())}`:'';}

function resultBase(input){
  const thumbnailUrl=String(input.thumbnailUrl||input.thumbUrl||input.url||input.originalUrl||'');
  const assetUrl=String(input.assetUrl||input.originalUrl||input.url||thumbnailUrl||'');
  const thumbnailProxyUrl=proxyFor(thumbnailUrl);
  const assetProxyUrl=proxyFor(assetUrl);
  const proxyUrl=assetProxyUrl||thumbnailProxyUrl;
  return {
    id:String(input.id||input.pageUrl||input.url||crypto.randomUUID()),
    title:clean(input.title||'Imagem',240),description:clean(input.description||'',600),
    url:String(input.url||thumbnailUrl||assetUrl||''),originalUrl:String(input.originalUrl||assetUrl||thumbnailUrl||''),proxyUrl,
    thumbnailUrl,thumbnailProxyUrl,assetUrl,assetProxyUrl,
    pageUrl:String(input.pageUrl||''),source:String(input.source||''),provider:String(input.provider||''),origin:'free-bank',
    author:clean(input.author||'',220),credit:clean(input.credit||input.author||'',300),
    attribution:clean(input.attribution||[input.credit||input.author,input.source].filter(Boolean).join(' · '),500),
    license:clean(input.license||'',180),licenseUrl:String(input.licenseUrl||''),usage:clean(input.usage||'',220),
    rightsStatus:input.rightsStatus||'review',reviewBeforeUse:input.reviewBeforeUse!==false,
    autoUseAllowed:!!input.autoUseAllowed,insertable:!!(assetProxyUrl||thumbnailProxyUrl),
    factual:!!input.factual,score:Number(input.score)||0,downloadLocation:input.downloadLocation||'',
    resolvable:!!safeSourcePage(input.pageUrl||'')
  };
}

async function fetchText(url,options={}){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Math.max(1500,Number(options.timeout)||6500));
  try{
    const res=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml','User-Agent':'FORMA-DESIGN/0.9.7.5.48 editorial-image-search',...(options.headers||{})},redirect:'follow',signal:controller.signal});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);return await res.text();
  }finally{clearTimeout(timer);}
}

function extractLinkedCards(html,{base,hrefPattern,source,provider,factual=false,usage='',license='',rightsStatus='review',max=16}){
  const results=[];const anchorRe=/<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<\/a>/gi;let match;
  while((match=anchorRe.exec(html))&&results.length<max*3){
    const href=absUrl(match[1],base);if(!href||!hrefPattern.test(href))continue;
    const block=match[0];const imgTag=block.match(/<img\b[^>]*>/i)?.[0]||'';const rawImg=firstSrcFromImg(imgTag);if(!rawImg)continue;
    const image=absUrl(rawImg,base);if(!image)continue;
    const alt=attr(imgTag,'alt');const title=clean(alt||block,260);if(!title)continue;
    const surrounding=html.slice(Math.max(0,match.index-350),Math.min(html.length,anchorRe.lastIndex+350));
    const text=clean(surrounding,700);
    const creditMatch=text.match(/(?:Foto\s*:\s*)?([^|]{2,90}(?:Ag[eê]ncia Brasil|EBC|Fotos P[uú]blicas|\/PR|Stuckert|Pozzebom|Camargo|Pinto|R[eê]go|Fraz[aã]o))/i);
    const credit=clean(creditMatch?.[1]||'',180);
    results.push(resultBase({id:href,title,description:text,url:image,thumbnailUrl:image,assetUrl:image,originalUrl:image,pageUrl:href,source,provider,credit,attribution:[credit,source].filter(Boolean).join(' · '),license,usage,rightsStatus,reviewBeforeUse:true,autoUseAllowed:false,factual}));
  }
  return dedupe(results).slice(0,max);
}

async function agenciaBrasilSearch(query,limit=10){
  const candidates=[
    `${AGENCIA_FOTOS}?search_api_fulltext=${encodeURIComponent(query)}`,
    `${AGENCIA_FOTOS}?search_api_views_fulltext=${encodeURIComponent(query)}`,
    AGENCIA_FOTOS
  ];
  let best=[];
  for(const url of candidates){
    try{
      const html=await fetchText(url,{timeout:7000});
      let items=extractLinkedCards(html,{base:AGENCIA_FOTOS,hrefPattern:/agenciabrasil\.ebc\.com\.br\/foto\//i,source:'Agência Brasil · Foto Agência',provider:'agencia-brasil',factual:true,usage:'Uso editorial: verificar crédito e direitos indicados na página da foto.',license:'Crédito/origem preservados',rightsStatus:'editorial-review',max:limit});
      items=items.map(item=>({...item,score:120+relevancy(query,item)})).filter(item=>relevancy(query,item)>0||url!==AGENCIA_FOTOS);
      if(items.length>best.length)best=items;if(best.length>=Math.min(4,limit))break;
    }catch{}
  }
  return best.slice(0,limit);
}

async function fotosPublicasSearch(query,limit=10){
  const candidates=[`${FOTOS_PUBLICAS}?s=${encodeURIComponent(query)}`,`${FOTOS_PUBLICAS}acervo/?s=${encodeURIComponent(query)}`,FOTOS_PUBLICAS];
  let best=[];
  for(const url of candidates){
    try{
      const html=await fetchText(url,{timeout:7000});
      let items=extractLinkedCards(html,{base:FOTOS_PUBLICAS,hrefPattern:/fotospublicas\.com\/acervo\//i,source:'Fotos Públicas',provider:'fotos-publicas',factual:true,usage:'Editorial Jornalístico e Conteúdo Online · confira as condições da publicação.',license:'Condições informadas na página da foto',rightsStatus:'editorial-review',max:limit});
      items=items.map(item=>({...item,score:110+relevancy(query,item)})).filter(item=>relevancy(query,item)>0||url!==FOTOS_PUBLICAS);
      if(items.length>best.length)best=items;if(best.length>=Math.min(4,limit))break;
    }catch{}
  }
  return best.slice(0,limit);
}

function metaValue(meta,key){return clean(meta?.[key]?.value||'',1400);}
function acceptedCommonsLicense(value){const license=String(value||'').toLowerCase();return license.includes('cc0')||license.includes('public domain')||license.includes('domínio público')||license.includes('cc by')||license.includes('cc-by')||license.includes('creative commons attribution');}
async function commonsSearch(query,limit=10){
  const qs=new URLSearchParams({action:'query',format:'json',formatversion:'2',origin:'*',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:String(clampLimit(limit,10)),prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'1000'});
  const response=await fetch(`${COMMONS_API}?${qs}`,{headers:{Accept:'application/json','Api-User-Agent':'FormaOne/0.9.7.5.48 editorial free image search'}});if(!response.ok)throw new Error(`Wikimedia Commons HTTP ${response.status}`);
  const data=await response.json(),pages=Array.isArray(data?.query?.pages)?data.query.pages:[],results=[];
  for(const page of pages){const info=page?.imageinfo?.[0];if(!info||!/^image\/(jpeg|png|webp)$/i.test(String(info.mime||'')))continue;const meta=info.extmetadata||{};const license=clean(metaValue(meta,'LicenseShortName')||metaValue(meta,'UsageTerms')||'Licença não informada',140);if(!acceptedCommonsLicense(license))continue;const original=safeImageTarget(info.url),thumb=safeImageTarget(info.thumburl||info.url);if(!original||!thumb)continue;const artist=metaValue(meta,'Artist')||metaValue(meta,'Credit');const credit=metaValue(meta,'Credit');const pageUrl=`https://commons.wikimedia.org/wiki/${encodeURIComponent(String(page.title||'').replace(/ /g,'_'))}`;const item=resultBase({id:page.pageid||page.title,title:String(page.title||'').replace(/^File:/i,''),description:metaValue(meta,'ImageDescription'),url:thumb.toString(),thumbnailUrl:thumb.toString(),assetUrl:original.toString(),originalUrl:original.toString(),pageUrl,source:'Wikimedia Commons',provider:'wikimedia',author:artist,credit,attribution:[artist||credit,license].filter(Boolean).join(' · '),license,licenseUrl:metaValue(meta,'LicenseUrl'),rightsStatus:'open-license',reviewBeforeUse:true,autoUseAllowed:true});item.score=70+relevancy(query,item);results.push(item);}
  return results;
}

function openverseAcceptedLicense(license){return ['cc0','pdm','by','by-sa'].includes(String(license||'').toLowerCase());}
async function openverseSearch(query,limit=10){
  const qs=new URLSearchParams({q:query,page_size:String(clampLimit(limit,10)),mature:'false'});const res=await fetch(`${OPENVERSE_API}?${qs}`,{headers:{Accept:'application/json'}});if(!res.ok)throw new Error(`Openverse HTTP ${res.status}`);const data=await res.json();const results=[];
  for(const raw of (data?.results||[])){if(!openverseAcceptedLicense(raw.license))continue;const image=raw.thumbnail||raw.url;if(!image)continue;const license=[String(raw.license||'').toUpperCase(),raw.license_version].filter(Boolean).join(' ');const item=resultBase({id:raw.id,title:raw.title||'Openverse',url:image,thumbnailUrl:image,assetUrl:raw.url||image,originalUrl:raw.url||image,pageUrl:raw.foreign_landing_url||raw.detail_url||'',source:'Openverse',provider:'openverse',author:raw.creator||'',credit:raw.creator||'',attribution:[raw.creator,license].filter(Boolean).join(' · '),license,licenseUrl:raw.license_url||'',rightsStatus:'open-license',reviewBeforeUse:true,autoUseAllowed:true});item.score=80+relevancy(query,item);results.push(item);}
  return results.slice(0,limit);
}

async function pexelsSearch(query,limit,env){
  const key=String(env?.PEXELS_API_KEY||'').trim();if(!key)return[];const qs=new URLSearchParams({query,per_page:String(clampLimit(limit,10)),locale:'pt-BR'});const res=await fetch(`https://api.pexels.com/v1/search?${qs}`,{headers:{Authorization:key,Accept:'application/json'}});if(!res.ok)throw new Error(`Pexels HTTP ${res.status}`);const data=await res.json();return (data?.photos||[]).map(photo=>{const item=resultBase({id:photo.id,title:photo.alt||'Pexels',url:photo.src?.large||photo.src?.medium,thumbnailUrl:photo.src?.medium||photo.src?.large,assetUrl:photo.src?.original||photo.src?.large,originalUrl:photo.src?.original||photo.src?.large,pageUrl:photo.url,source:'Pexels',provider:'pexels',author:photo.photographer,credit:photo.photographer,attribution:`${photo.photographer||'Fotógrafo'} · Pexels`,license:'Pexels License',licenseUrl:'https://www.pexels.com/license/',rightsStatus:'stock-license',reviewBeforeUse:true,autoUseAllowed:true});item.score=58+relevancy(query,item);return item;}).slice(0,limit);
}

async function unsplashSearch(query,limit,env){
  const key=String(env?.UNSPLASH_ACCESS_KEY||'').trim();if(!key)return[];const qs=new URLSearchParams({query,per_page:String(clampLimit(limit,10)),content_filter:'high'});const res=await fetch(`https://api.unsplash.com/search/photos?${qs}`,{headers:{Authorization:`Client-ID ${key}`,Accept:'application/json','Accept-Version':'v1'}});if(!res.ok)throw new Error(`Unsplash HTTP ${res.status}`);const data=await res.json();return (data?.results||[]).map(photo=>{const author=photo.user?.name||photo.user?.username||'';const item=resultBase({id:photo.id,title:photo.alt_description||photo.description||'Unsplash',url:photo.urls?.regular||photo.urls?.small,thumbnailUrl:photo.urls?.small||photo.urls?.regular,assetUrl:photo.urls?.full||photo.urls?.regular,originalUrl:photo.urls?.full||photo.urls?.regular,pageUrl:photo.links?.html,source:'Unsplash',provider:'unsplash',author,credit:author,attribution:`${author||'Fotógrafo'} · Unsplash`,license:'Unsplash License',licenseUrl:'https://unsplash.com/license',rightsStatus:'stock-license',reviewBeforeUse:true,autoUseAllowed:true,downloadLocation:photo.links?.download_location||''});item.score=54+relevancy(query,item);return item;}).slice(0,limit);
}

function desiredProviders(url,env){
  const requested=String(url.searchParams.get('provider')||'all').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  if(!requested.length||requested.includes('all'))return PROVIDER_ORDER.filter(p=>p!=='pexels'||env?.PEXELS_API_KEY).filter(p=>p!=='unsplash'||env?.UNSPLASH_ACCESS_KEY);
  return requested.filter(p=>PROVIDER_ORDER.includes(p)).filter(p=>p!=='pexels'||env?.PEXELS_API_KEY).filter(p=>p!=='unsplash'||env?.UNSPLASH_ACCESS_KEY);
}

async function unifiedSearch(query,limit,providers,env){
  const perProvider=Math.max(4,Math.ceil(limit/Math.max(1,providers.length))+3);const tasks={
    'agencia-brasil':()=>agenciaBrasilSearch(query,perProvider),'fotos-publicas':()=>fotosPublicasSearch(query,perProvider),
    openverse:()=>openverseSearch(query,perProvider),wikimedia:()=>commonsSearch(query,perProvider),
    pexels:()=>pexelsSearch(query,perProvider,env),unsplash:()=>unsplashSearch(query,perProvider,env)
  };
  const settled=await Promise.allSettled(providers.map(async provider=>({provider,items:await tasks[provider]()})));
  const statuses={},items=[];
  settled.forEach((entry,index)=>{const provider=providers[index];if(entry.status==='fulfilled'){statuses[provider]={ok:true,count:entry.value.items.length};items.push(...entry.value.items);}else statuses[provider]={ok:false,count:0,error:clean(entry.reason?.message||entry.reason,180)};});
  const ranked=dedupe(items).sort((a,b)=>(b.score||0)-(a.score||0));return {results:ranked.slice(0,limit),statuses};
}

function metaContent(html,key){
  const wanted=String(key||'').toLowerCase();
  const tags=String(html||'').match(/<meta\b[^>]*>/gi)||[];
  for(const tag of tags){
    const name=String(attr(tag,'property')||attr(tag,'name')||'').toLowerCase();
    if(name!==wanted)continue;
    const content=attr(tag,'content');
    if(content)return clean(content,2000);
  }
  return '';
}

function sourceImageCandidates(html,base){
  const candidates=[];
  const add=(value,priority=0,label='')=>{const absolute=absUrl(value,base);const safe=safeImageTarget(absolute);if(!safe)return;candidates.push({url:safe.toString(),priority,label});};
  add(metaContent(html,'og:image'),95,'og:image');
  add(metaContent(html,'twitter:image'),90,'twitter:image');
  const anchorRe=/<a\b[^>]*href=[\"']([^\"']+)[\"'][^>]*>([\s\S]*?)<\/a>/gi;let match;
  while((match=anchorRe.exec(String(html||'')))){
    const label=clean(match[2],120);const href=match[1];
    if(/download\s*web/i.test(label))add(href,130,'download-web');
    else if(/download\s*original/i.test(label))add(href,125,'download-original');
    else if(/^download$/i.test(label))add(href,115,'download');
    else if(/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(href))add(href,75,'linked-image');
  }
  const imageRe=/<img\b[^>]*>/gi;let imageMatch;
  while((imageMatch=imageRe.exec(String(html||'')))){
    const tag=imageMatch[0],src=firstSrcFromImg(tag);if(!src)continue;
    const alt=clean(attr(tag,'alt'),180);const noisy=/logo|icon|avatar|calend[aá]rio|foto\s*$/i.test(alt);
    add(src,noisy?20:65,'img');
  }
  const seen=new Set();return candidates.sort((a,b)=>b.priority-a.priority).filter(item=>{if(seen.has(item.url))return false;seen.add(item.url);return true;});
}

async function resolveSourcePage(request){
  const requestUrl=new URL(request.url),page=safeSourcePage(requestUrl.searchParams.get('page'));if(!page)return json({ok:false,error:'Fonte não permitida para resolução direta'},400);
  try{
    const html=await fetchText(page.toString(),{timeout:8000});const candidates=sourceImageCandidates(html,page.toString());
    if(!candidates.length)return json({ok:false,error:'A fonte não expôs uma imagem direta utilizável'},404);
    const preferred=candidates[0],thumbnail=candidates.find(item=>item.label==='og:image'||item.label==='twitter:image')||preferred;
    return json({ok:true,pageUrl:page.toString(),assetUrl:preferred.url,assetProxyUrl:proxyFor(preferred.url),thumbnailUrl:thumbnail.url,thumbnailProxyUrl:proxyFor(thumbnail.url),resolvedBy:preferred.label,candidates:candidates.slice(0,5).map(item=>({url:item.url,proxyUrl:proxyFor(item.url),label:item.label}))},200,{'Cache-Control':'public, max-age=21600'});
  }catch(error){return json({ok:false,error:error instanceof Error?error.message:String(error)},502);}
}

function inferredImageType(url,type=''){
  const raw=String(type||'').toLowerCase().split(';')[0].trim();
  if(/^image\/(jpeg|jpg|png|webp|avif|gif)$/i.test(raw))return raw==='image/jpg'?'image/jpeg':raw;
  const path=String(url?.pathname||'').toLowerCase();
  if(path.endsWith('.jpg')||path.endsWith('.jpeg'))return 'image/jpeg';
  if(path.endsWith('.png'))return 'image/png';
  if(path.endsWith('.webp'))return 'image/webp';
  if(path.endsWith('.avif'))return 'image/avif';
  if(path.endsWith('.gif'))return 'image/gif';
  return '';
}

async function proxyImage(request){
  const url=new URL(request.url),target=safeImageTarget(url.searchParams.get('url'));if(!target)return json({ok:false,error:'Imagem não permitida pelo proxy seguro'},400);
  const response=await fetch(target.toString(),{headers:{Accept:'image/avif,image/webp,image/png,image/jpeg,image/jpg,image/gif,image/*;q=0.8,*/*;q=0.2','User-Agent':'FORMA-DESIGN/0.9.7.5.48 editorial image proxy'}});if(!response.ok)return json({ok:false,error:`Imagem indisponível: HTTP ${response.status}`},502);const type=inferredImageType(target,response.headers.get('content-type')||'');if(!type)return json({ok:false,error:'Formato de imagem não permitido'},415);return new Response(response.body,{status:200,headers:{'Content-Type':type,'Cache-Control':'public, max-age=21600','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*'}});
}

async function trackUnsplash(request,env){
  const key=String(env?.UNSPLASH_ACCESS_KEY||'').trim();if(!key)return json({ok:false,error:'Unsplash não configurado'},503);const input=await request.json().catch(()=>({}));let target;try{target=new URL(String(input.downloadLocation||''));}catch{return json({ok:false,error:'download_location inválido'},400);}if(target.hostname!=='api.unsplash.com'||!target.pathname.startsWith('/photos/'))return json({ok:false,error:'download_location não permitido'},400);const response=await fetch(target.toString(),{headers:{Authorization:`Client-ID ${key}`,'Accept-Version':'v1'}});return json({ok:response.ok,status:response.status},response.ok?200:502);
}

export async function handleFreeImagesApi(request,env={}){
  const url=new URL(request.url);
  if(url.pathname==='/api/free-images/resolve'&&request.method==='GET')return resolveSourcePage(request);
  if(url.pathname==='/api/free-images/file'&&request.method==='GET')return proxyImage(request);
  if(url.pathname==='/api/free-images/track/unsplash'&&request.method==='POST')return trackUnsplash(request,env);
  if(url.pathname!=='/api/free-images'||request.method!=='GET')return json({ok:false,error:'Endpoint do banco de imagens não encontrado'},404);
  const query=clean(url.searchParams.get('q'),120);if(query.length<2)return json({ok:false,error:'Informe pelo menos 2 caracteres para buscar imagens.'},400);
  const limit=clampLimit(url.searchParams.get('limit'),14),providers=desiredProviders(url,env);
  try{
    const {results,statuses}=await unifiedSearch(query,limit,providers,env);
    return json({ok:true,provider:'FORMA Editorial Image Hub',query,results,providers,statuses,nonGenerative:true,ranking:'factual-br-first',policy:{factualFirst:true,attributionPreserved:true,reviewBeforePublication:true,agencyBrasil:'Créditos e direitos devem ser conferidos na página da Foto Agência.',fotosPublicas:'Uso editorial e condições devem ser conferidos na publicação.',openverse:'Verifique a licença na fonte original.',stock:'Pexels/Unsplash seguem suas respectivas licenças e diretrizes de API.'}});
  }catch(error){return json({ok:false,error:error instanceof Error?error.message:String(error)},502);}
}
