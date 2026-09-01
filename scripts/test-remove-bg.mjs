
import { handleSecureRemoveBg } from '../src/forma/remove-bg.js';
const originalFetch=globalThis.fetch;let seenKey='';
globalThis.fetch=async (url,opts={})=>{if(String(url).includes('api.remove.bg')){seenKey=opts.headers?.['X-Api-Key']||'';return new Response(new Uint8Array([137,80,78,71]),{status:200,headers:{'Content-Type':'image/png'}});}throw new Error('unexpected url');};
const form=new FormData();form.append('image_file',new Blob([new Uint8Array([1,2,3])],{type:'image/png'}),'x.png');
const req=new Request('https://forma.local/api/remove-bg',{method:'POST',body:form});
const response=await handleSecureRemoveBg(req,{});
if(response.status!==200)throw new Error('status '+response.status);
if(!seenKey)throw new Error('fallback key not sent');
if(response.headers.get('X-Forma-Remove-Bg')!=='ok')throw new Error('missing success header');
console.log('REMOVE_BG_BACKEND_TEST: PASS');
globalThis.fetch=originalFetch;
