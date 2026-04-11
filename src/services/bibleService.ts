// ...existing code...
import { MOCK_VERSES } from '../../constants';
import { getStoredChapter, getStoredVersions } from '../../services/db';

const ARC_FILE_MAP: Record<string, string> = {
  'Gênesis': 'Gn', 'Êxodo': 'Ex', 'Levítico': 'Lv', 'Números': 'Nm', 'Deuteronômio': 'Dt',
  'Josué': 'Js', 'Juízes': 'Jz', 'Rute': 'Rt', '1 Samuel': '1Sm', '2 Samuel': '2Sm',
  '1 Reis': '1Rs', '2 Reis': '2Rs', '1 Crônicas': '1Cr', '2 Crônicas': '2Cr',
  'Esdras': 'Ed', 'Neemias': 'Ne', 'Ester': 'Et', 'Jó': 'Jó', 'Salmos': 'Sl',
  'Provérbios': 'Pv', 'Eclesiastes': 'Ec', 'Cantares': 'Ct', 'Isaías': 'Is',
  'Jeremias': 'Jr', 'Lamentações': 'Lm', 'Ezequiel': 'Ez', 'Daniel': 'Dn',
  'Oseias': 'Os', 'Joel': 'Jl', 'Amós': 'Am', 'Obadias': 'Ob', 'Jonas': 'Jn',
  'Miquéias': 'Mq', 'Miqueias': 'Mq', 'Naum': 'Na', 'Habacuque': 'Hc', 'Sofonias': 'Sf', 'Ageu': 'Ag',
  'Zacarias': 'Zc', 'Malaquias': 'Ml', 'Mateus': 'Mt', 'Marcos': 'Mc', 'Lucas': 'Lc',
  'João': 'Jo', 'Atos': 'At', 'Romanos': 'Rm', '1 Coríntios': '1Co', '2 Coríntios': '2Co',
  'Gálatas': 'Gl', 'Efésios': 'Ef', 'Filipenses': 'Fp', 'Colossenses': 'Cl',
  '1 Tessalonicenses': '1Ts', '2 Tessalonicenses': '2Ts', '1 Timóteo': '1Tm', '2 Timóteo': '2Tm',
  'Tito': 'Tt', 'Filemom': 'Fm', 'Hebreus': 'Hb', 'Tiago': 'Tg', '1 Pedro': '1Pe',
  '2 Pedro': '2Pe', '1 João': '1Jo', '2 João': '2Jo', '3 João': '3Jo', 'Judas': 'Jd', 'Apocalipse': 'Ap'
};

const ARC_RAW_FILES = import.meta.glob('../Biblia-ARC-master/*.js', {
  query: '?raw',
  import: 'default'
}) as Record<string, () => Promise<string>>;

const ARC_BOOK_CACHE = new Map<string, any[]>();
const ARC_CHAPTER_CACHE = new Map<string, { verse: number; text: string }[]>();

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const parseArcArrayLiteral = (literal: string): any[] | null => {
  try {
    return JSON.parse(literal) as any[];
  } catch {
    try {
      // Fallback para arquivos JS que não são JSON estrito, mas ainda são literais de array.
      const value = Function(`"use strict"; return (${literal});`)();
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }
};

const extractLivroArrayLiteral = (raw: string): string | null => {
  const markerIndex = raw.indexOf('livro');
  if (markerIndex === -1) return null;

  const equalsIndex = raw.indexOf('=', markerIndex);
  if (equalsIndex === -1) return null;

  const arrayStart = raw.indexOf('[', equalsIndex);
  if (arrayStart === -1) return null;

  let depth = 0;
  let inString = false;
  let quote = '';

  for (let i = arrayStart; i < raw.length; i += 1) {
    const ch = raw[i];
    const prev = i > 0 ? raw[i - 1] : '';

    if (inString) {
      if (ch === quote && prev !== '\\') {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === '[') depth += 1;
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(arrayStart, i + 1);
      }
    }
  }

  return null;
};

const loadArcBookFromSource = async (code: string): Promise<any[] | null> => {
  const cached = ARC_BOOK_CACHE.get(code);
  if (cached) return cached;

  const fileKey = `../Biblia-ARC-master/${code}.js`;
  const loadRaw = ARC_RAW_FILES[fileKey];
  if (!loadRaw) return null;

  const raw = await loadRaw();
  const literal = extractLivroArrayLiteral(raw);
  if (!literal) return null;

  const parsed = parseArcArrayLiteral(literal);
  if (!parsed || !Array.isArray(parsed)) return null;

  ARC_BOOK_CACHE.set(code, parsed);
  return parsed;
};

const loadArcChapterFromSourceFiles = async (book: string, chapter: number): Promise<{ verse: number; text: string }[]> => {
  const code = ARC_FILE_MAP[book];
  if (!code) return [];

  const chapterCacheKey = `${code}:${chapter}`;
  const cachedChapter = ARC_CHAPTER_CACHE.get(chapterCacheKey);
  if (cachedChapter) return cachedChapter;

  try {
    const parsedBook = await loadArcBookFromSource(code);
    if (!parsedBook) return [];

    const chapterArr = parsedBook[chapter];
    if (!Array.isArray(chapterArr)) return [];

    const normalizedVerses = chapterArr
      .map((v: any) => {
        const text = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
        return text.trim();
      });

    // Arquivos ARC costumam ter um placeholder vazio no início do capítulo.
    const startIndex = normalizedVerses.length > 1 && normalizedVerses[0].length === 0 ? 1 : 0;

    const parsedChapter = normalizedVerses
      .slice(startIndex)
      .filter(text => text.length > 0)
      .map((text, idx) => ({ verse: idx + 1, text }));

    ARC_CHAPTER_CACHE.set(chapterCacheKey, parsedChapter);
    return parsedChapter;
  } catch (e) {
    console.error('Falha ao carregar capítulo ARC dos arquivos-fonte:', e);
    return [];
  }
};

export interface BibleContent {
  text: string;
  reference: string;
  summary?: string;
  context?: string;
  crossReferences?: string[];
}

const LOCAL_LLM_URL = (import.meta.env.VITE_LOCAL_LLM_URL as string | undefined) || 'http://localhost:11434/api/generate';
const LOCAL_LLM_MODEL = (import.meta.env.VITE_LOCAL_LLM_MODEL as string | undefined) || 'gemma2:2b';
const REMOTE_LLM_URL = (import.meta.env.VITE_REMOTE_LLM_URL as string | undefined) || '';
const REMOTE_LLM_MODEL = (import.meta.env.VITE_REMOTE_LLM_MODEL as string | undefined) || 'gemma2:2b';
const REMOTE_LLM_TOKEN = (import.meta.env.VITE_REMOTE_LLM_TOKEN as string | undefined) || '';

const extractFirstJsonBlock = (raw: string) => {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw;
};

const askLocalGemma = async (prompt: string, temperature = 0.35): Promise<string> => {
  const response = await fetch(LOCAL_LLM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LOCAL_LLM_MODEL,
      prompt,
      stream: false,
      options: {
        temperature,
        num_predict: 512,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM local indisponível (${response.status})`);
  }

  const data = await response.json() as { response?: string };
  return String(data?.response || '').trim();
};

const askRemoteGemma = async (prompt: string, temperature = 0.35): Promise<string> => {
  if (!REMOTE_LLM_URL) {
    throw new Error('Endpoint remoto não configurado');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (REMOTE_LLM_TOKEN) {
    headers.Authorization = `Bearer ${REMOTE_LLM_TOKEN}`;
  }

  const response = await fetch(REMOTE_LLM_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: REMOTE_LLM_MODEL,
      prompt,
      stream: false,
      options: {
        temperature,
        num_predict: 512,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM remoto indisponível (${response.status})`);
  }

  const data = await response.json() as { response?: string };
  return String(data?.response || '').trim();
};

const askGemma = async (prompt: string, temperature = 0.35): Promise<string> => {
  if (REMOTE_LLM_URL) {
    return askRemoteGemma(prompt, temperature);
  }
  return askLocalGemma(prompt, temperature);
};

// Função para ler capítulo localmente
export const getLocalBibleChapter = async (book: string, chapter: number, version: string = 'ARC'): Promise<{ verse: number, text: string }[]> => {
  if (version === 'ARC') {
    const arcFromFiles = await loadArcChapterFromSourceFiles(book, chapter);
    if (arcFromFiles.length > 0) return arcFromFiles;
  }

  try {
    const storedVersions = await getStoredVersions();
    const versionCandidates = Array.from(new Set([
      version,
      'ARC',
      'ARA',
      'NVT',
      'KJV',
      ...storedVersions.map(v => v.code)
    ]));

    for (const vCode of versionCandidates) {
      const stored = await getStoredChapter(vCode, book, chapter);
      if (stored.length > 0) {
        return stored.map(v => ({ verse: v.verse, text: v.text }));
      }
    }
  } catch (e) {
    console.error('Falha ao carregar capítulo do IndexedDB:', e);
  }

  const normalizedBook = normalize(book);

  const chapterVerses = MOCK_VERSES
    .filter(v => normalize(v.book) === normalizedBook && v.chapter === chapter && v.version === version)
    .sort((a, b) => a.verse - b.verse);

  // Fallback para qualquer versão disponível, caso a solicitada não exista localmente.
  const fallbackVerses = chapterVerses.length > 0
    ? chapterVerses
    : MOCK_VERSES
      .filter(v => normalize(v.book) === normalizedBook && v.chapter === chapter)
        .sort((a, b) => a.verse - b.verse);

  return fallbackVerses.map(v => ({ verse: v.verse, text: v.text }));
};

export const getBibleContent = async (reference: string, version: string = 'ARC'): Promise<BibleContent> => {
  // Extrai o capítulo no fim da string para suportar livros com nome composto.
  const normalizedRef = reference.trim();
  const match = normalizedRef.match(/^(.*)\s+(\d+)$/);
  const book = match?.[1]?.trim() || normalizedRef;
  const chapter = match ? parseInt(match[2], 10) : NaN;
  if (!book || Number.isNaN(chapter)) {
    return {
      text: 'Referência inválida. Use o formato "Livro Capítulo", por exemplo: "Gênesis 1".',
      reference,
      summary: undefined,
      context: undefined,
      crossReferences: []
    };
  }

  const verses = await getLocalBibleChapter(book, chapter, version);

  if (verses.length === 0) {
    return {
      text: `Sem conteúdo local para ${book} ${chapter}. Importe uma Bíblia com esse capítulo para leitura offline.`,
      reference,
      summary: undefined,
      context: undefined,
      crossReferences: []
    };
  }

  return {
    text: verses.map(v => `${v.verse} ${v.text}`).join('\n'),
    reference,
    summary: undefined,
    context: undefined,
    crossReferences: []
  };
};

export const getTheologicalAnalysis = async (text: string): Promise<string> => {
  const prompt = `Você é um assistente bíblico reformado. Analise o texto abaixo de forma clara e objetiva.

Regras:
- Foque em soberania de Deus, graça, fé, arrependimento e aplicação prática.
- Não invente referências.
- Responda em português com 3 seções: "Resumo", "Doutrina" e "Aplicação".

Texto bíblico:
"""
${text}
"""`;

  try {
    const answer = await askGemma(prompt, 0.3);
    if (!answer) throw new Error('resposta vazia');
    return answer;
  } catch {
    return 'Análise teológica indisponível no momento. Verifique se o Ollama está rodando com o modelo gemma2:2b.';
  }
};

export const searchBible = async (query: string): Promise<{ reference: string, excerpt: string }[]> => {
  const prompt = `Atue como um motor de busca bíblico para a consulta: "${query}".

Retorne APENAS um objeto JSON válido no formato:
{
  "results": [
    { "reference": "Livro 1:1", "excerpt": "trecho curto" }
  ]
}

Limites:
- No máximo 10 resultados
- Excerpt com até 180 caracteres
- Sem texto fora do JSON`;

  try {
    const raw = await askGemma(prompt, 0.2);
    const parsed = JSON.parse(extractFirstJsonBlock(raw)) as { results?: Array<{ reference?: string; excerpt?: string }> };
    const results = Array.isArray(parsed.results) ? parsed.results : [];
    return results
      .map(item => ({
        reference: String(item.reference || '').trim(),
        excerpt: String(item.excerpt || '').trim(),
      }))
      .filter(item => item.reference.length > 0 && item.excerpt.length > 0)
      .slice(0, 10);
  } catch {
    return [];
  }
  };

export const generateReadingPlan = async (topic: string): Promise<{ title: string, days: { day: number, reference: string, focus: string }[] }> => {
  const prompt = `Crie um plano de leitura bíblica de 7 dias sobre "${topic}".

Retorne APENAS um objeto JSON válido no formato:
{
  "title": "texto",
  "days": [
    { "day": 1, "reference": "Livro 1", "focus": "explicação breve" }
  ]
}

Regras:
- Exatamente 7 itens em days
- Referências bíblicas reais
- focus curto e prático
- Sem texto fora do JSON`;

  try {
    const raw = await askGemma(prompt, 0.25);
    const parsed = JSON.parse(extractFirstJsonBlock(raw)) as {
      title?: string;
      days?: Array<{ day?: number; reference?: string; focus?: string }>;
    };

    const days = (Array.isArray(parsed.days) ? parsed.days : [])
      .map((item, index) => ({
        day: Number(item.day) || (index + 1),
        reference: String(item.reference || '').trim(),
        focus: String(item.focus || '').trim(),
      }))
      .filter(item => item.reference.length > 0 && item.focus.length > 0)
      .slice(0, 7);

    if (days.length === 0) {
      return { title: 'Plano Personalizado', days: [] };
    }

    return {
      title: String(parsed.title || `Plano sobre ${topic}`),
      days,
    };
  } catch {
    return { title: 'Plano Personalizado', days: [] };
  }
  };

export const BOOKS = [
  { name: 'Gênesis', chapters: 50 }, { name: 'Êxodo', chapters: 40 }, { name: 'Levítico', chapters: 27 },
  { name: 'Números', chapters: 36 }, { name: 'Deuteronômio', chapters: 34 }, { name: 'Josué', chapters: 24 },
  { name: 'Juízes', chapters: 21 }, { name: 'Rute', chapters: 4 }, { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 }, { name: '1 Reis', chapters: 22 }, { name: '2 Reis', chapters: 25 },
  { name: '1 Crônicas', chapters: 29 }, { name: '2 Crônicas', chapters: 36 }, { name: 'Esdras', chapters: 10 },
  { name: 'Neemias', chapters: 13 }, { name: 'Ester', chapters: 10 }, { name: 'Jó', chapters: 42 },
  { name: 'Salmos', chapters: 150 }, { name: 'Provérbios', chapters: 31 }, { name: 'Eclesiastes', chapters: 12 },
  { name: 'Cantares', chapters: 8 }, { name: 'Isaías', chapters: 66 }, { name: 'Jeremias', chapters: 52 },
  { name: 'Lamentações', chapters: 5 }, { name: 'Ezequiel', chapters: 48 }, { name: 'Daniel', chapters: 12 },
  { name: 'Oseias', chapters: 14 }, { name: 'Joel', chapters: 3 }, { name: 'Amós', chapters: 9 },
  { name: 'Obadias', chapters: 1 }, { name: 'Jonas', chapters: 4 }, { name: 'Miqueias', chapters: 7 },
  { name: 'Naum', chapters: 3 }, { name: 'Habacuque', chapters: 3 }, { name: 'Sofonias', chapters: 3 },
  { name: 'Ageu', chapters: 2 }, { name: 'Zacarias', chapters: 14 }, { name: 'Malaquias', chapters: 4 },
  { name: 'Mateus', chapters: 28 }, { name: 'Marcos', chapters: 16 }, { name: 'Lucas', chapters: 24 },
  { name: 'João', chapters: 21 }, { name: 'Atos', chapters: 28 }, { name: 'Romanos', chapters: 16 },
  { name: '1 Coríntios', chapters: 16 }, { name: '2 Coríntios', chapters: 13 }, { name: 'Gálatas', chapters: 6 },
  { name: 'Efésios', chapters: 6 }, { name: 'Filipenses', chapters: 4 }, { name: 'Colossenses', chapters: 4 },
  { name: '1 Tessalonicenses', chapters: 5 }, { name: '2 Tessalonicenses', chapters: 3 }, { name: '1 Timóteo', chapters: 6 },
  { name: '2 Timóteo', chapters: 4 }, { name: 'Tito', chapters: 3 }, { name: 'Filemom', chapters: 1 },
  { name: 'Hebreus', chapters: 13 }, { name: 'Tiago', chapters: 5 }, { name: '1 Pedro', chapters: 5 },
  { name: '2 Pedro', chapters: 3 }, { name: '1 João', chapters: 5 }, { name: '2 João', chapters: 1 },
  { name: '3 João', chapters: 1 }, { name: 'Judas', chapters: 1 }, { name: 'Apocalipse', chapters: 22 }
];
