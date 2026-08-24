const IMAGE_PRIMARY = '@cf/black-forest-labs/flux-2-klein-4b';
const IMAGE_FALLBACK = '@cf/black-forest-labs/flux-1-schnell';
const TEXT_MODEL = '@cf/zai-org/glm-4.7-flash';

function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || min));
}

function normalizeFormat(format = '1:1') {
  const presets = {
    '1:1': [1024, 1024],
    '16:9': [1344, 768],
    '9:16': [768, 1344],
    '4:5': [896, 1120],
  };
  return presets[format] || presets['1:1'];
}

function modelInfo(key) {
  if (key === 'flux1-schnell') {
    return { id: IMAGE_FALLBACK, key, label: 'FLUX.1 Schnell' };
  }
  return { id: IMAGE_PRIMARY, key: 'flux2-klein', label: 'FLUX.2 Klein 4B' };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('JSON inválido');
  }
}

function safePrompt(value, max = 2048) {
  return String(value || '').trim().slice(0, max);
}

function buildImagePrompt(input) {
  const prompt = safePrompt(input.prompt);
  const avoid = safePrompt(input.negative, 600);
  const format = String(input.format || '1:1');
  if (!prompt) throw new Error('Prompt vazio');
  const aspectHint = format === '16:9' ? 'wide landscape composition, 16:9 framing' :
    format === '9:16' ? 'vertical portrait composition, 9:16 framing' :
    format === '4:5' ? 'vertical editorial composition, 4:5 framing' :
    'square composition, 1:1 framing';
  return `${prompt}. ${aspectHint}.${avoid ? ` Avoid: ${avoid}.` : ''}`.slice(0, 2048);
}

async function runFlux2(env, prompt, width, height, seed) {
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', String(width));
  form.append('height', String(height));
  form.append('guidance', '3.5');
  if (Number.isFinite(seed)) form.append('seed', String(seed));

  const serialized = new Response(form);
  const result = await env.AI.run(IMAGE_PRIMARY, {
    multipart: {
      body: serialized.body,
      contentType: serialized.headers.get('content-type'),
    },
  });
  if (!result?.image) throw new Error('FLUX.2 não retornou imagem');
  return {
    image: `data:image/jpeg;base64,${result.image}`,
    model: IMAGE_PRIMARY,
    modelLabel: 'FLUX.2 Klein 4B',
  };
}

async function runFlux1(env, prompt, quality) {
  const steps = quality === 'Alto' ? 8 : quality === 'Rápido' ? 4 : 6;
  // Workers AI currently validates the FLUX.1 Schnell binding schema without
  // accepting `seed`, even though older examples referenced it. Keep the
  // fallback request limited to the schema-safe fields.
  const result = await env.AI.run(IMAGE_FALLBACK, {
    prompt,
    steps,
  });
  if (!result?.image) throw new Error('FLUX.1 não retornou imagem');
  return {
    image: `data:image/jpeg;base64,${result.image}`,
    model: IMAGE_FALLBACK,
    modelLabel: 'FLUX.1 Schnell',
  };
}

async function generateOne(env, input, index) {
  const [width, height] = normalizeFormat(input.format);
  const prompt = buildImagePrompt(input);
  const requested = input.model || 'auto';
  const hasSeed = input.seed !== null && input.seed !== undefined && String(input.seed).trim() !== '';
  const baseSeed = hasSeed ? Number(input.seed) : NaN;
  const seed = Number.isFinite(baseSeed) ? Math.abs(Math.trunc(baseSeed + index)) : null;

  const tryFlux2 = () => runFlux2(env, prompt, width, height, seed);
  const tryFlux1 = () => runFlux1(env, prompt, input.quality);

  if (requested === 'flux1-schnell') {
    try {
      return await tryFlux1();
    } catch (firstError) {
      try {
        const fallback = await tryFlux2();
        return { ...fallback, fallbackFrom: firstError?.message || 'FLUX.1 falhou' };
      } catch (secondError) {
        throw new Error(`FLUX.1: ${firstError?.message || 'falhou'} | FLUX.2 fallback: ${secondError?.message || 'falhou'}`);
      }
    }
  }

  try {
    return await tryFlux2();
  } catch (firstError) {
    try {
      const fallback = await tryFlux1();
      return { ...fallback, fallbackFrom: firstError?.message || 'FLUX.2 falhou' };
    } catch (secondError) {
      throw new Error(`FLUX.2: ${firstError?.message || 'falhou'} | FLUX.1 fallback: ${secondError?.message || 'falhou'}`);
    }
  }
}

function extractTextModelOutput(output) {
  if (!output) return '';
  if (typeof output === 'string') return output;
  if (typeof output.response === 'string') return output.response;
  if (typeof output.result === 'string') return output.result;
  const content = output?.choices?.[0]?.message?.content ?? output?.choices?.[0]?.text;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(x => x?.text || x?.content || '').join('\n');
  return '';
}

function parseLooseJson(text) {
  const raw = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(raw); } catch {}
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try { return JSON.parse(raw.slice(first, last + 1)); } catch {}
  }
  return null;
}

function fallbackArticleAnalysis(input) {
  const title = safePrompt(input.title, 240);
  const subtitle = safePrompt(input.subtitle, 500);
  const text = safePrompt(input.text, 4000);
  const subject = title || subtitle || text.slice(0, 180) || 'tema jornalístico';
  return {
    summary: subject,
    entities: [],
    mood: 'editorial, informativo e neutro',
    notes: 'Criar imagem ilustrativa e não representar a cena como fotografia factual do acontecimento.',
    concepts: [
      { title: 'Cena contextual', prompt: `Photorealistic editorial illustration inspired by: ${subject}. Contextual scene, neutral journalistic tone, no text, no watermark.` },
      { title: 'Detalhe simbólico', prompt: `Photorealistic symbolic editorial image about: ${subject}. Strong visual metaphor, clean composition, neutral news aesthetic, no text.` },
      { title: 'Ambiente de apoio', prompt: `Documentary-style contextual photograph illustrating the broader theme: ${subject}. Credible environment, natural light, no text, clearly illustrative.` },
    ],
    prompt: `Photorealistic editorial news illustration about ${subject}. Documentary realism, natural lighting, credible details, neutral composition, no text, no watermark, clearly illustrative rather than a factual record of a specific event.`,
    negative: 'text, watermark, logo, fake headline, distorted anatomy, sensationalized scene',
  };
}

async function analyzeArticle(env, input) {
  const title = safePrompt(input.title, 300);
  const subtitle = safePrompt(input.subtitle, 700);
  const text = safePrompt(input.text, 24000);
  const url = safePrompt(input.url, 1000);
  if (!title && !text) throw new Error('Título ou texto da matéria é obrigatório');

  const messages = [
    {
      role: 'system',
      content: `Você é o módulo editorial visual do FORMA DESIGN. Analise matérias jornalísticas em português e proponha imagens ilustrativas úteis para uma redação. Nunca trate uma imagem gerada como registro factual de um evento real. Evite inventar rostos, logos, placas, números ou fatos específicos. Retorne APENAS JSON válido com esta estrutura: {"summary":"...","entities":["..."],"mood":"...","notes":"...","concepts":[{"title":"...","prompt":"..."},{"title":"...","prompt":"..."},{"title":"...","prompt":"..."}],"prompt":"...","negative":"..."}. Os prompts de imagem devem ser em inglês, fotorealistas quando apropriado, sem texto e sem marca d'água.`
    },
    {
      role: 'user',
      content: `TÍTULO: ${title}\nSUBTÍTULO: ${subtitle}\nURL: ${url}\nMATÉRIA:\n${text}`,
    },
  ];

  try {
    const output = await env.AI.run(TEXT_MODEL, {
      messages,
      temperature: 0.25,
      max_completion_tokens: 1200,
    });
    const parsed = parseLooseJson(extractTextModelOutput(output));
    if (!parsed) throw new Error('Resposta editorial fora do formato esperado');
    const fallback = fallbackArticleAnalysis(input);
    return {
      summary: safePrompt(parsed.summary || fallback.summary, 1200),
      entities: Array.isArray(parsed.entities) ? parsed.entities.map(x => safePrompt(x, 120)).filter(Boolean).slice(0, 12) : [],
      mood: safePrompt(parsed.mood || fallback.mood, 500),
      notes: safePrompt(parsed.notes || fallback.notes, 1000),
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts.slice(0, 3).map((c, i) => ({
        title: safePrompt(c?.title || `Conceito ${i + 1}`, 160),
        prompt: safePrompt(c?.prompt || fallback.concepts[i]?.prompt || '', 2048),
      })) : fallback.concepts,
      prompt: safePrompt(parsed.prompt || fallback.prompt, 2048),
      negative: safePrompt(parsed.negative || fallback.negative, 600),
    };
  } catch {
    return fallbackArticleAnalysis(input);
  }
}

async function giphyProxy(request, env, mode) {
  if (!env.GIPHY_API_KEY) return json({ ok: false, error: 'GIPHY_API_KEY ainda não configurada no Worker' }, 503);
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 24));
  const rating = url.searchParams.get('rating') || 'g';
  const qs = new URLSearchParams({ api_key: env.GIPHY_API_KEY, limit: String(limit), rating });
  if (mode === 'search') {
    const q = (url.searchParams.get('q') || '').trim().slice(0, 50);
    if (!q) return json({ ok: false, error: 'Busca vazia' }, 400);
    qs.set('q', q);
    qs.set('lang', (url.searchParams.get('lang') || 'pt').slice(0, 5));
  }
  const endpoint = mode === 'search' ? 'https://api.giphy.com/v1/gifs/search' : 'https://api.giphy.com/v1/gifs/trending';
  const response = await fetch(`${endpoint}?${qs.toString()}`, { cf: { cacheTtl: 30, cacheEverything: false } });
  const data = await response.json();
  if (!response.ok || (data?.meta?.status && data.meta.status !== 200)) {
    return json({ ok: false, error: data?.meta?.msg || `GIPHY HTTP ${response.status}` }, response.status || 502);
  }
  return json({ ok: true, data });
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname === '/api/health') {
    return json({ ok: true, service: 'forma-design', version: '0.6.1', runtime: 'cloudflare-workers' });
  }

  if (url.pathname === '/api/ai/status' && request.method === 'GET') {
    if (!env.AI) return json({ ok: false, error: 'Workers AI binding ausente' }, 503);
    return json({
      ok: true,
      engine: 'FORMA AI Engine',
      provider: 'Cloudflare Workers AI',
      models: {
        imagePrimary: IMAGE_PRIMARY,
        imagePrimaryLabel: 'FLUX.2 Klein 4B',
        imageFallback: IMAGE_FALLBACK,
        imageFallbackLabel: 'FLUX.1 Schnell',
        text: TEXT_MODEL,
        textLabel: 'GLM-4.7-Flash',
      },
      capabilities: ['text-to-image', 'article-analysis', 'provider-fallback', 'seed-flux2-only'],
    });
  }

  if (url.pathname === '/api/ai/generate' && request.method === 'POST') {
    if (!env.AI) return json({ ok: false, error: 'Workers AI binding ausente' }, 503);
    try {
      const input = await readJson(request);
      const quantity = clamp(input.quantity || 1, 1, 4);
      const tasks = Array.from({ length: quantity }, (_, i) => generateOne(env, input, i));
      const results = await Promise.all(tasks);
      const modelsUsed = [...new Set(results.map(x => x.modelLabel))];
      return json({
        ok: true,
        images: results.map(x => x.image),
        model: results[0]?.model || modelInfo(input.model).id,
        modelLabel: modelsUsed.join(' + '),
        modelsUsed,
        fallbackUsed: results.some(x => x.fallbackFrom),
      });
    } catch (error) {
      return json({ ok: false, error: error?.message || 'Falha na geração' }, 500);
    }
  }

  if (url.pathname === '/api/ai/analyze' && request.method === 'POST') {
    if (!env.AI) return json({ ok: false, error: 'Workers AI binding ausente' }, 503);
    try {
      const input = await readJson(request);
      const analysis = await analyzeArticle(env, input);
      return json({ ok: true, analysis, model: TEXT_MODEL, modelLabel: 'GLM-4.7-Flash' });
    } catch (error) {
      return json({ ok: false, error: error?.message || 'Falha na análise editorial' }, 500);
    }
  }

  if (url.pathname === '/api/giphy/search' && request.method === 'GET') return giphyProxy(request, env, 'search');
  if (url.pathname === '/api/giphy/trending' && request.method === 'GET') return giphyProxy(request, env, 'trending');

  return json({ ok: false, error: 'Endpoint não encontrado' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
