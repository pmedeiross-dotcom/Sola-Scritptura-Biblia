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

const STOP_WORDS = new Set([
  'a', 'o', 'e', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
  'para', 'por', 'com', 'sem', 'que', 'se', 'um', 'uma', 'ao', 'aos', 'as', 'os',
  'eu', 'tu', 'ele', 'ela', 'nos', 'vos', 'eles', 'elas', 'como', 'mais', 'mas',
  'foi', 'era', 'ser', 'tem', 'ha', 'sao', 'lhe', 'isso', 'isto', 'este', 'essa',
]);

type ReasoningMode = 'auto' | 'pastoral' | 'didatico' | 'analitico' | 'socratico' | 'canonico';
type TheologicalAxisId = 'graca' | 'fe' | 'santidade' | 'esperanca' | 'oracao' | 'soberania';

const REASONING_MODE_STORAGE_KEY = 'internal-ai-reasoning-mode-v1';

const THEOLOGICAL_AXES: Array<{ id: TheologicalAxisId; title: string; hints: string[]; summary: string; practical: string }> = [
  {
    id: 'graca',
    title: 'Graça e Redenção',
    hints: ['graca', 'misericordia', 'perdao', 'salvacao', 'justificacao', 'cristo', 'cruz', 'sangue'],
    summary: 'A passagem aponta para a iniciativa salvadora de Deus, não para mérito humano.',
    practical: 'Responda com gratidão ativa: confissão sincera, oração e obediência concreta.'
  },
  {
    id: 'fe',
    title: 'Fé e Confiança',
    hints: ['fe', 'confiar', 'crer', 'esperar', 'duvida', 'firmes', 'promessa'],
    summary: 'O texto convoca a confiar na Palavra, mesmo sob tensão e incerteza.',
    practical: 'Identifique uma área de medo e substitua por uma decisão de confiança em Deus.'
  },
  {
    id: 'santidade',
    title: 'Santidade e Obediência',
    hints: ['santo', 'obediencia', 'pecado', 'arrependimento', 'pureza', 'justo', 'mandamento'],
    summary: 'Há um chamado ético claro para abandonar o pecado e viver em conformidade com Deus.',
    practical: 'Escolha uma prática de obediência para hoje e mantenha constância por 7 dias.'
  },
  {
    id: 'esperanca',
    title: 'Esperança e Consolação',
    hints: ['esperanca', 'consolo', 'paz', 'alegria', 'descanso', 'fortaleza', 'renovo'],
    summary: 'A passagem sustenta o coração com esperança firme no caráter e nas promessas de Deus.',
    practical: 'Memorize um versículo de esperança e use-o como resposta nos momentos de aflição.'
  },
  {
    id: 'oracao',
    title: 'Oração e Dependência',
    hints: ['oracao', 'orar', 'clamar', 'suplicar', 'pedir', 'buscar', 'vigiar'],
    summary: 'O texto direciona para dependência prática de Deus por meio da oração perseverante.',
    practical: 'Estruture um momento diário de oração com adoração, confissão, gratidão e petição.'
  },
  {
    id: 'soberania',
    title: 'Soberania e Providência',
    hints: ['soberano', 'proposito', 'vontade', 'governa', 'eleito', 'chamado', 'providencia'],
    summary: 'A ênfase recai sobre a ação soberana de Deus na história e na vida do seu povo.',
    practical: 'Ore submetendo seus planos ao Senhor e confie no tempo e no governo dEle.'
  },
];

const QUERY_EXPANSIONS: Record<string, string[]> = {
  oracao: ['orar', 'clamar', 'suplicar', 'intercessao', 'pedir'],
  graca: ['misericordia', 'favor', 'perdao', 'salvacao', 'justificacao'],
  fe: ['confianca', 'crer', 'esperar', 'firmeza'],
  ansiedade: ['medo', 'inquietacao', 'preocupacao', 'aflicao'],
  esperanca: ['consolo', 'paz', 'renovo', 'fortaleza'],
  santidade: ['obediencia', 'pureza', 'arrependimento', 'justica'],
};

const TOPICAL_REF_BANK: Array<{ key: string; refs: string[] }> = [
  { key: 'oracao', refs: ['Mateus 6:9', 'Filipenses 4:6', '1 Tessalonicenses 5:17', 'Tiago 5:16'] },
  { key: 'graca', refs: ['Efésios 2:8', 'Romanos 5:8', 'Tito 3:5', '2 Coríntios 12:9'] },
  { key: 'fe', refs: ['Hebreus 11:1', 'Romanos 10:17', '2 Coríntios 5:7', 'Marcos 9:24'] },
  { key: 'ansiedade', refs: ['Filipenses 4:6', '1 Pedro 5:7', 'Mateus 6:34', 'Salmos 94:19'] },
  { key: 'esperanca', refs: ['Romanos 15:13', 'Lamentações 3:21', 'Hebreus 10:23', 'Isaías 40:31'] },
  { key: 'santidade', refs: ['1 Pedro 1:15', 'Romanos 12:1', '1 João 2:1', 'Hebreus 12:14'] },
];

const TOPIC_PLAN_TEMPLATES: Array<{ key: string; title: string; refs: string[]; focus: string[] }> = [
  {
    key: 'oracao',
    title: 'Plano de 7 Dias: Vida de Oração',
    refs: ['Mateus 6:9', 'Lucas 11:9', 'Salmos 5:3', 'Filipenses 4:6', '1 Tessalonicenses 5:17', 'Hebreus 4:16', 'Tiago 5:16'],
    focus: ['Dependência diária de Deus', 'Perseverança no pedir', 'Buscar ao Senhor no início do dia', 'Ansiedade entregue em oração', 'Constância espiritual', 'Confiança no trono da graça', 'Intercessão e comunhão']
  },
  {
    key: 'graca',
    title: 'Plano de 7 Dias: Graça e Salvação',
    refs: ['Efésios 2:8', 'Romanos 3:23', 'Romanos 5:8', 'Tito 3:5', 'João 1:16', '2 Coríntios 12:9', 'Hebreus 12:15'],
    focus: ['Salvação como dom', 'Realidade do pecado', 'Amor redentor de Cristo', 'Nova vida pela misericórdia', 'Plenitude da graça', 'Força na fraqueza', 'Permanecer na graça']
  },
  {
    key: 'fe',
    title: 'Plano de 7 Dias: Caminho de Fé',
    refs: ['Hebreus 11:1', 'Romanos 10:17', 'Marcos 9:24', 'Salmos 46:1', 'Provérbios 3:5', '2 Coríntios 5:7', 'Judas 1:20'],
    focus: ['Natureza da fé bíblica', 'Fé alimentada pela Palavra', 'Fé sincera em meio à luta', 'Refúgio em Deus', 'Confiar além da lógica', 'Andar por fé', 'Fortalecer-se no Espírito']
  },
];

const hashText = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const toTokens = (value: string) => normalize(value)
  .split(/[^a-z0-9]+/)
  .filter(token => token.length > 2 && !STOP_WORDS.has(token));

const extractKeyTerms = (value: string, limit = 4) => {
  const counts = new Map<string, number>();
  for (const token of toTokens(value)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(entry => entry[0]);
};

const parseVerseLines = (value: string) => {
  return value
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .reduce<Array<{ verse: number; text: string }>>((parsed, line) => {
      const match = line.match(/^(\d{1,3})(?:[\.:]\s+|\s+)(.+)$/);
      const candidate = match ? Number(match[1]) : null;
      const current = parsed[parsed.length - 1];
      const isVerseStart = Boolean(
        match &&
        Number.isInteger(candidate) &&
        candidate > 0 &&
        (!current || candidate === current.verse + 1)
      );

      if (match && isVerseStart) {
        parsed.push({ verse: candidate as number, text: match[2].trim() });
      } else if (current) {
        current.text += ` ${line}`;
      }
      return parsed;
    }, []);
};

const resolveReferenceText = async (reference: string) => {
  const match = reference.match(/^(.*)\s(\d+)(?::(\d+))?$/);
  if (!match) return null;

  const book = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : null;
  if (Number.isNaN(chapter)) return null;

  const chapterVerses = await getLocalBibleChapter(book, chapter, 'ARC');
  if (chapterVerses.length === 0) return null;

  const picked = verse ? chapterVerses.find(item => item.verse === verse) : chapterVerses[0];
  if (!picked) return null;

  return {
    reference,
    excerpt: picked.text.length > 180 ? `${picked.text.slice(0, 177)}...` : picked.text,
  };
};

const findPlanTemplate = (topic: string) => {
  const normalizedTopic = normalize(topic);
  return TOPIC_PLAN_TEMPLATES.find(template => normalizedTopic.includes(template.key));
};

const isReasoningMode = (value: string): value is ReasoningMode => ['auto', 'pastoral', 'didatico', 'analitico', 'socratico', 'canonico'].includes(value);

const getReasoningMode = (): ReasoningMode => {
  if (typeof window === 'undefined') return 'auto';
  const saved = window.localStorage.getItem(REASONING_MODE_STORAGE_KEY) || '';
  return isReasoningMode(saved) ? saved : 'auto';
};

const countHits = (normalizedText: string, term: string) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'g');
  return (normalizedText.match(regex) || []).length;
};

const excerptText = (value: string, max = 110) => (value.length > max ? `${value.slice(0, max - 3)}...` : value);

const buildTheologicalProfile = (text: string, verses: Array<{ verse: number; text: string }>) => {
  const normalizedText = normalize(text);

  return THEOLOGICAL_AXES
    .map(axis => {
      const score = axis.hints.reduce((acc, hint) => acc + countHits(normalizedText, hint), 0);

      const evidence = verses
        .map(item => {
          const normalizedVerse = normalize(item.text);
          const verseScore = axis.hints.reduce((acc, hint) => acc + (normalizedVerse.includes(hint) ? 1 : 0), 0);
          return { verse: item.verse, text: item.text, score: verseScore };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => `v.${item.verse}: "${excerptText(item.text)}"`);

      return {
        ...axis,
        score,
        evidence,
      };
    })
    .sort((a, b) => b.score - a.score);
};

const expandSemanticTokens = (query: string) => {
  const normalizedQuery = normalize(query);
  const baseTokens = toTokens(query);
  const expanded = new Set(baseTokens);

  for (const [key, synonyms] of Object.entries(QUERY_EXPANSIONS)) {
    if (normalizedQuery.includes(key) || baseTokens.includes(key)) {
      expanded.add(key);
      synonyms.forEach(item => expanded.add(item));
    }
  }

  for (const token of baseTokens) {
    const synonyms = QUERY_EXPANSIONS[token];
    if (synonyms) synonyms.forEach(item => expanded.add(item));
  }

  return Array.from(expanded);
};

const inferCandidateBooks = (normalizedQuery: string): string[] => {
  const base = ['Salmos', 'Provérbios', 'Mateus', 'João', 'Romanos', 'Efésios', 'Hebreus'];
  const byTheme: Array<{ key: string; books: string[] }> = [
    { key: 'oracao', books: ['Salmos', 'Mateus', 'Lucas', 'Tiago'] },
    { key: 'graca', books: ['Romanos', 'Efésios', 'Gálatas', 'Tito'] },
    { key: 'fe', books: ['Hebreus', 'Romanos', 'Marcos', 'Habacuque'] },
    { key: 'ansiedade', books: ['Filipenses', 'Mateus', '1 Pedro', 'Salmos'] },
    { key: 'esperanca', books: ['Romanos', 'Isaías', 'Lamentações', 'Hebreus'] },
    { key: 'santidade', books: ['1 Pedro', 'Romanos', 'Levítico', 'Hebreus'] },
  ];

  const pool = new Set(base);
  for (const item of byTheme) {
    if (normalizedQuery.includes(item.key)) item.books.forEach(book => pool.add(book));
  }

  return Array.from(pool);
};

const resolveEffectiveReasoningMode = (
  selectedMode: ReasoningMode,
  topAxes: Array<{ score: number }>,
  versesCount: number
): Exclude<ReasoningMode, 'auto'> => {
  if (selectedMode !== 'auto') return selectedMode;

  if (versesCount >= 25) return 'analitico';
  const highestScore = topAxes[0]?.score || 0;
  const secondScore = topAxes[1]?.score || 0;
  if (highestScore >= 4 && secondScore >= 3) return 'canonico';
  if (highestScore >= 3 && secondScore <= 1) return 'socratico';
  return 'didatico';
};

const buildTensionLine = (topAxes: Array<{ title: string }>) => {
  if (topAxes.length < 2) return 'O texto foca em um eixo dominante sem tensão temática relevante aparente.';
  return `Tensão central identificada: ${topAxes[0].title} em diálogo com ${topAxes[1].title}.`;
};

const buildCanonicalSynthesis = (topAxes: Array<{ title: string; summary: string }>) => {
  if (topAxes.length === 0) {
    return 'Síntese canônica: a passagem confirma a unidade bíblica entre revelação de Deus e resposta de fé.';
  }

  if (topAxes.length === 1) {
    return `Síntese canônica: o eixo ${topAxes[0].title.toLowerCase()} aparece de forma consistente com o testemunho geral das Escrituras.`;
  }

  return `Síntese canônica: ${topAxes[0].summary} Em conjunto, ${topAxes[1].summary.toLowerCase()}`;
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
  const verses = parseVerseLines(text);
  const opening = verses[0]?.text || text.split('\n')[0] || '';
  const themes = extractKeyTerms(text, 6);
  const hash = hashText(text);
  const selectedMode = getReasoningMode();
  const profile = buildTheologicalProfile(text, verses);
  const topAxes = profile.filter(item => item.score > 0).slice(0, 2);
  const mode = resolveEffectiveReasoningMode(selectedMode, topAxes, verses.length);

  const modeOpeners: Record<Exclude<ReasoningMode, 'auto'>, string[]> = {
    pastoral: [
      'A leitura revela o cuidado de Deus com o coração e com a caminhada diária do crente.',
      'Este trecho conforta, corrige e convida a uma confiança mais profunda no Senhor.',
      'A passagem nos conduz da ansiedade para a confiança, da culpa para a graça.'
    ],
    didatico: [
      'Observando a estrutura do texto, vemos um ensino progressivo: verdade, resposta e prática.',
      'A passagem organiza sua mensagem em doutrina, chamado e aplicação concreta.',
      'Há coerência interna entre o que Deus declara e o que Ele exige do seu povo.'
    ],
    analitico: [
      'O texto apresenta um eixo central e subtemas secundários que convergem para uma tese teológica.',
      'A distribuição dos termos indica um foco principal acompanhado de implicações éticas diretas.',
      'A análise lexical sugere relação entre identidade em Deus e resposta prática de obediência.'
    ],
    socratico: [
      'A passagem convida a perguntas profundas: o que Deus revela sobre si, sobre nós e sobre o caminho de obediência?',
      'A leitura socrática destaca questões que expõem motivações do coração e decisões práticas de fé.',
      'O texto pede reflexão guiada: o que precisa ser abandonado, crido e praticado hoje?'
    ],
    canonico: [
      'O trecho se integra ao fio canônico da Escritura, unindo promessa, cumprimento e resposta do povo de Deus.',
      'A leitura canônica mostra continuidade entre a mensagem local do texto e a teologia bíblica global.',
      'A passagem não é isolada: ela participa de um testemunho maior sobre a obra redentora de Deus.'
    ]
  };

  const reasoningLead = modeOpeners[mode][hash % modeOpeners[mode].length];
  const termsLine = themes.length > 0
    ? `Termos mais recorrentes no trecho: ${themes.join(', ')}.`
    : 'Termos recorrentes: fé, graça, obediência e esperança.';

  const evidenceLines = topAxes
    .flatMap(axis => axis.evidence.map(item => `- ${axis.title}: ${item}`))
    .slice(0, 5);

  const doctrinalLines = topAxes.length > 0
    ? topAxes.map((axis, index) => `${index + 1}. ${axis.summary}`)
    : ['1. O texto aponta para a ação de Deus como fundamento da transformação humana.'];

  const practicalLines = topAxes.length > 0
    ? topAxes.map((axis, index) => `${index + 1}. ${axis.practical}`)
    : ['1. Separe 10 minutos hoje para oração e leitura atenta do capítulo.'];

  const toneHint = mode === 'analitico'
    ? 'Modo analítico ativo: foco em coerência textual e inferência doutrinária.'
    : mode === 'didatico'
      ? 'Modo didático ativo: foco em clareza e progressão de ensino.'
      : mode === 'socratico'
        ? 'Modo socrático ativo: foco em perguntas diagnósticas e decisões espirituais.'
        : mode === 'canonico'
          ? 'Modo canônico ativo: foco na unidade bíblica e síntese teológica ampla.'
          : 'Modo pastoral ativo: foco em consolo, exortação e vida prática.';

  const socraticQuestions = [
    `1. O que este texto revela sobre Deus que confronta minhas expectativas atuais?`,
    `2. Qual verdade desta passagem eu já conheço, mas ainda não obedeço com consistência?`,
    `3. Qual passo de fé concreto devo praticar nas próximas 24 horas?`
  ];

  const canonicalSynthesis = buildCanonicalSynthesis(topAxes);
  const tensionLine = buildTensionLine(topAxes);
  const confidence = topAxes.length === 0 ? 'Baixa' : topAxes[0].score >= 4 ? 'Alta' : 'Média';

  const response = [
    '### Leitura Guiada',
    reasoningLead,
    opening ? `Entrada do texto: "${excerptText(opening, 160)}"` : 'Entrada do texto: trecho não identificado com clareza.',
    selectedMode === 'auto' ? `Modo automático escolheu: ${mode}.` : '',
    toneHint,
    '',
    '### Evidências do Texto',
    termsLine,
    ...(evidenceLines.length > 0 ? evidenceLines : ['- Não foi possível extrair versos-evidência suficientes deste conteúdo.']),
    '',
    '### Tensão Interpretativa',
    tensionLine,
    '',
    '### Raciocínio Teológico',
    ...doctrinalLines,
    '',
    '### Síntese Canônica',
    canonicalSynthesis,
    `Nível de confiança da inferência: ${confidence}.`,
    '',
    '### Aplicação Prática (Hoje)',
    ...practicalLines,
    'Passo final: ore com base em um dos versículos-evidência e registre em uma nota a decisão tomada.'
  ];

  if (mode === 'socratico') {
    response.push('', '### Perguntas Socráticas', ...socraticQuestions);
  }

  return response.filter(Boolean).join('\n');
};

export const searchBible = async (query: string): Promise<{ reference: string, excerpt: string }[]> => {
  const normalizedQuery = normalize(query);
  const semanticTokens = expandSemanticTokens(query);
  if (normalizedQuery.length === 0 || semanticTokens.length === 0) return [];

  const matchedTopic = TOPICAL_REF_BANK.find(item => normalizedQuery.includes(item.key));
  if (matchedTopic) {
    const results = await Promise.all(matchedTopic.refs.map(resolveReferenceText));
    return results.filter((item): item is { reference: string; excerpt: string } => item !== null).slice(0, 10);
  }

  const candidateBooks = inferCandidateBooks(normalizedQuery);
  const scored: Array<{ reference: string; excerpt: string; score: number }> = [];

  for (const bookName of candidateBooks) {
    const bookInfo = BOOKS.find(item => item.name === bookName);
    if (!bookInfo) continue;

    for (let chapter = 1; chapter <= bookInfo.chapters; chapter += 1) {
      const verses = await getLocalBibleChapter(bookName, chapter, 'ARC');
      if (verses.length === 0) continue;

      for (const verse of verses) {
        const normalizedVerse = normalize(verse.text);
        let score = normalizedVerse.includes(normalizedQuery) ? 6 : 0;
        for (const token of semanticTokens) {
          if (normalizedVerse.includes(token)) {
            score += token.length >= 7 ? 3 : 2;
          }
          if (token.length >= 5 && normalizedVerse.split(' ').some(word => word.startsWith(token.slice(0, 5)))) {
            score += 1;
          }
        }
        if (score === 0) continue;

        scored.push({
          reference: `${bookName} ${chapter}:${verse.verse}`,
          excerpt: verse.text.length > 180 ? `${verse.text.slice(0, 177)}...` : verse.text,
          score,
        });
      }
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => ({ reference: item.reference, excerpt: item.excerpt }));
  };

export const generateReadingPlan = async (topic: string): Promise<{ title: string, days: { day: number, reference: string, focus: string }[] }> => {
  const template = findPlanTemplate(topic);

  if (template) {
    return {
      title: template.title,
      days: template.refs.map((reference, index) => ({
        day: index + 1,
        reference,
        focus: template.focus[index] || 'Medite no texto e aplique uma verdade prática hoje.',
      })),
    };
  }

  const normalizedTopic = normalize(topic);
  const dominantAxis = THEOLOGICAL_AXES
    .map(axis => ({ axis, score: axis.hints.reduce((acc, hint) => acc + (normalizedTopic.includes(hint) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)[0];

  const axisPlans: Record<TheologicalAxisId, { title: string; refs: string[]; focus: string[] }> = {
    graca: {
      title: 'Plano de 7 Dias: Graça que Transforma',
      refs: ['Efésios 2:8', 'Romanos 5:1', 'Tito 3:5', 'João 1:16', '2 Coríntios 12:9', 'Hebreus 4:16', 'Romanos 8:1'],
      focus: ['Salvação é dom', 'Paz com Deus em Cristo', 'Regeneração pela misericórdia', 'Plenitude da graça', 'Força na fraqueza', 'Acesso ao trono da graça', 'Viver sem condenação']
    },
    fe: {
      title: 'Plano de 7 Dias: Fé que Persevera',
      refs: ['Hebreus 11:1', 'Romanos 10:17', 'Marcos 9:24', 'Provérbios 3:5', '2 Coríntios 5:7', 'Salmos 46:1', 'Judas 1:20'],
      focus: ['Fundamento da fé', 'Fé nasce da Palavra', 'Fé em meio à fragilidade', 'Confiar no Senhor', 'Andar por fé', 'Refúgio nas lutas', 'Fortalecer a vida espiritual']
    },
    santidade: {
      title: 'Plano de 7 Dias: Santidade no Cotidiano',
      refs: ['1 Pedro 1:15', 'Romanos 12:1', 'Efésios 4:22', 'Colossenses 3:12', 'Tiago 1:22', 'Hebreus 12:14', '1 João 1:9'],
      focus: ['Chamado à santidade', 'Culto racional com a vida', 'Abandonar o velho homem', 'Vestir-se de virtudes cristãs', 'Praticar a Palavra', 'Buscar a santificação', 'Confissão e restauração']
    },
    esperanca: {
      title: 'Plano de 7 Dias: Esperança que Sustenta',
      refs: ['Romanos 15:13', 'Lamentações 3:22', 'Isaías 40:31', 'Salmos 42:11', 'Hebreus 10:23', '2 Coríntios 4:16', 'Apocalipse 21:5'],
      focus: ['Esperança pelo Espírito', 'Misericórdias renovadas', 'Força para quem espera', 'Esperança na adversidade', 'Fidelidade das promessas', 'Renovação interior', 'Esperança final em Cristo']
    },
    oracao: {
      title: 'Plano de 7 Dias: Dependência em Oração',
      refs: ['Mateus 6:9', 'Lucas 11:9', 'Salmos 5:3', 'Filipenses 4:6', '1 Tessalonicenses 5:17', 'Hebreus 4:16', 'Tiago 5:16'],
      focus: ['Modelo de oração', 'Perseverança no pedir', 'Buscar a Deus no início do dia', 'Entregar ansiedade ao Senhor', 'Constância na oração', 'Confiança no trono da graça', 'Intercessão eficaz']
    },
    soberania: {
      title: 'Plano de 7 Dias: Soberania e Providência',
      refs: ['Romanos 8:28', 'Efésios 1:11', 'Salmos 103:19', 'Isaías 46:10', 'Gênesis 50:20', 'Provérbios 16:9', 'Daniel 4:35'],
      focus: ['Deus coopera para o bem', 'Deus opera conforme seu propósito', 'Reino soberano do Senhor', 'Fins decretados por Deus', 'Providência em meio ao mal', 'Planos humanos sob direção divina', 'Nenhum poder limita Deus']
    },
  };

  if (dominantAxis?.score > 0) {
    const plan = axisPlans[dominantAxis.axis.id];
    return {
      title: plan.title,
      days: plan.refs.map((reference, index) => ({
        day: index + 1,
        reference,
        focus: plan.focus[index],
      })),
    };
  }

  const genericRefs = ['Salmos 1:1', 'João 15:5', 'Romanos 12:2', 'Mateus 6:33', 'Provérbios 3:5', 'Hebreus 11:6', 'Apocalipse 21:5'];
  const genericFocus = [
    'Comece firmando sua vida na Palavra de Deus.',
    'Permaneça em Cristo e busque fruto espiritual.',
    'Renove a mente para discernir a vontade do Senhor.',
    'Priorize o Reino de Deus no cotidiano.',
    'Confie no Senhor de todo o coração.',
    'Caminhe por fé mesmo em dias difíceis.',
    'Olhe para a esperança final em Cristo.'
  ];

  const topicTerms = extractKeyTerms(topic, 3);
  const suffix = topicTerms.length > 0 ? ` (${topicTerms.join(', ')})` : '';

  return {
    title: `Plano de 7 Dias sobre ${topic}${suffix}`,
    days: genericRefs.map((reference, index) => ({
      day: index + 1,
      reference,
      focus: genericFocus[index],
    })),
  };
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
