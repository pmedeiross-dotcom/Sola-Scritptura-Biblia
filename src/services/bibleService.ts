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
    .map(line => {
      const match = line.match(/^(\d+)[\.:]?\s+(.+)$/);
      return match ? { verse: parseInt(match[1], 10), text: match[2].trim() } : null;
    })
    .filter((item): item is { verse: number; text: string } => item !== null);
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
  const opening = verses[0]?.text || text.split('\n')[0] || text;
  const themes = extractKeyTerms(text, 5);
  const hash = hashText(text);

  const intros = [
    'O trecho apresenta um movimento claro de revelação, correção e esperança.',
    'A passagem destaca a iniciativa de Deus e a resposta da fé no cotidiano.',
    'O texto conduz o coração para confiar mais em Deus do que em si mesmo.'
  ];
  const doctrinalOpeners = [
    'Doutrinariamente, vemos a centralidade da graça e da soberania de Deus.',
    'Numa leitura reformada, o texto afirma que Deus governa meios e fins.',
    'Teologicamente, a passagem sustenta a dependência total da obra do Senhor.'
  ];
  const applications = [
    'Na prática, isso nos chama a obediência humilde e perseverante.',
    'Como aplicação, somos convidados a trocar autossuficiência por oração.',
    'Pastoralmente, o texto aponta para arrependimento sincero e vida piedosa.'
  ];

  const selectedIntro = intros[hash % intros.length];
  const selectedDoctrine = doctrinalOpeners[hash % doctrinalOpeners.length];
  const selectedApplication = applications[hash % applications.length];
  const keywordLine = themes.length > 0
    ? `Termos dominantes observados: ${themes.join(', ')}.`
    : 'Termos dominantes observados: fé, graça, obediência e esperança.';

  return [
    '### Resumo',
    selectedIntro,
    `A ênfase principal aparece logo no início: "${opening}"`,
    '',
    '### Doutrina',
    selectedDoctrine,
    keywordLine,
    'Esse padrão reforça a visão bíblica de que a transformação do crente é fruto da ação de Deus.',
    '',
    '### Aplicação',
    selectedApplication,
    'Passo prático para hoje: escolha um versículo do capítulo, ore sobre ele e pratique uma obediência concreta ainda hoje.'
  ].join('\n');
};

export const searchBible = async (query: string): Promise<{ reference: string, excerpt: string }[]> => {
  const normalizedQuery = normalize(query);
  const tokens = toTokens(query);
  if (normalizedQuery.length === 0 || tokens.length === 0) return [];

  const topicalRefs: Array<{ key: string; refs: string[] }> = [
    { key: 'oracao', refs: ['Mateus 6:9', 'Filipenses 4:6', '1 Tessalonicenses 5:17'] },
    { key: 'graca', refs: ['Efésios 2:8', 'Romanos 5:8', 'Tito 3:5'] },
    { key: 'fe', refs: ['Hebreus 11:1', 'Romanos 10:17', '2 Coríntios 5:7'] },
    { key: 'ansiedade', refs: ['Filipenses 4:6', '1 Pedro 5:7', 'Mateus 6:34'] },
    { key: 'esperanca', refs: ['Romanos 15:13', 'Lamentações 3:21', 'Hebreus 10:23'] },
  ];

  const matchedTopic = topicalRefs.find(item => normalizedQuery.includes(item.key));
  if (matchedTopic) {
    const results = await Promise.all(matchedTopic.refs.map(resolveReferenceText));
    return results.filter((item): item is { reference: string; excerpt: string } => item !== null).slice(0, 10);
  }

  const curatedBooks = ['Salmos', 'Mateus', 'João', 'Romanos', 'Efésios', 'Provérbios', 'Gênesis'];
  const scored: Array<{ reference: string; excerpt: string; score: number }> = [];

  for (const bookName of curatedBooks) {
    const bookInfo = BOOKS.find(item => item.name === bookName);
    if (!bookInfo) continue;

    for (let chapter = 1; chapter <= bookInfo.chapters; chapter += 1) {
      const verses = await getLocalBibleChapter(bookName, chapter, 'ARC');
      if (verses.length === 0) continue;

      for (const verse of verses) {
        const normalizedVerse = normalize(verse.text);
        let score = 0;
        for (const token of tokens) {
          if (normalizedVerse.includes(token)) score += 1;
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
