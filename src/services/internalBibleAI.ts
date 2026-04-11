import { BOOKS } from './bibleCatalog';
import { getStoredConfessions, getStoredDictionaries } from '../../services/db';
import { WESTMINSTER_CONFESSION } from '../data/westminsterConfession';
import { HEIDELBERG_CATECHISM } from '../data/heidelbergCatechism';
import { BELGIC_CONFESSION } from '../data/belgicConfession';
import strongsOpenScriptures from '../data/strongs-open-scriptures.json';
import { translateStrongDefinitionToPtBr } from './strongsTranslation';

type Scope = 'chapter' | 'book' | 'bible';
type VersionCode = string;

interface AnalysisOptions {
  enableSemanticExpansion: boolean;
  enableStemming: boolean;
  enableStrongLexical: boolean;
  enableAppKnowledge: boolean;
}

interface VerseRecord {
  reference: string;
  text: string;
}

interface QueryToken {
  raw: string;
  normalized: string;
  isPhrase: boolean;
  variants: string[];
}

interface RankedReference {
  reference: string;
  score: number;
}

interface TermReport {
  term: string;
  mode: 'word' | 'phrase';
  expandedWith: string[];
  occurrences: number;
  verses: number;
  references: string[];
  rankedReferences: RankedReference[];
}

interface StrongTermCross {
  term: string;
  verses: number;
}

interface StrongReport {
  code: string;
  occurrences: number;
  verses: number;
  references: string[];
  definition?: string;
  cooccurringTerms: StrongTermCross[];
}

interface KnowledgeInsight {
  sourceType: 'confession' | 'note';
  sourceName: string;
  reference: string;
  score: number;
  matchedTerms: string[];
  excerpt: string;
}

interface TheologyAxisScore {
  axisId: string;
  title: string;
  score: number;
  bibleHits: number;
  knowledgeHits: number;
  evidence: string[];
}

interface TokenAnalyzer {
  token: QueryToken;
  test: (normalizedVerseText: string) => { occurrences: number; forms: string[] };
}

export interface InternalBibleAIReport {
  scope: Scope;
  scopeLabel: string;
  version: VersionCode;
  options: AnalysisOptions;
  scannedVerses: number;
  termReports: TermReport[];
  strongReports: StrongReport[];
  knowledgeInsights: KnowledgeInsight[];
  theologyProfile: TheologyAxisScore[];
  crossReferences: string[];
  contextSnippets: string[];
}

interface KnowledgeRecord {
  sourceType: 'confession' | 'note';
  sourceName: string;
  reference: string;
  text: string;
}

const corpusCache = new Map<string, VerseRecord[]>();
let localBibleChapterLoader: ((book: string, chapter: number, version?: string) => Promise<{ verse: number; text: string }[]>) | null = null;
let strongDictionaryCache: Map<string, string> | null = null;
let staticConfessionCorpusCache: KnowledgeRecord[] | null = null;

const THEOLOGICAL_SYNONYMS: Record<string, string[]> = {
  fe: ['crer', 'crenca', 'fiel'],
  graca: ['favor', 'misericordia', 'benevolencia'],
  justificacao: ['justificado', 'justificar', 'justos'],
  santificacao: ['santificar', 'santo', 'santidade'],
  regeneracao: ['novo nascimento', 'nascer de novo'],
  alianca: ['pacto', 'testamento'],
  arrependimento: ['arrepender', 'conversao'],
  pecado: ['pecados', 'iniquidade', 'transgressao'],
  salvacao: ['salvar', 'redencao', 'resgate'],
  eleicao: ['eleito', 'predestinacao', 'predestinar']
};

const THEOLOGY_AXES: Array<{ axisId: string; title: string; keywords: string[] }> = [
  { axisId: 'soberania', title: 'Soberania de Deus', keywords: ['soberania', 'decretos', 'providencia', 'eleicao', 'predestinacao'] },
  { axisId: 'graca', title: 'Graça e Justificação', keywords: ['graca', 'justificacao', 'fe', 'redencao', 'imputacao'] },
  { axisId: 'santificacao', title: 'Santificação e Vida Cristã', keywords: ['santificacao', 'arrependimento', 'obediencia', 'santo', 'piedade'] },
  { axisId: 'pacto', title: 'Aliança e História da Redenção', keywords: ['alianca', 'pacto', 'promessa', 'testamento', 'mediador'] },
  { axisId: 'eclesiologia', title: 'Igreja e Meios de Graça', keywords: ['igreja', 'sacramentos', 'batismo', 'ceia', 'disciplina'] },
  { axisId: 'escatologia', title: 'Escatologia e Juízo', keywords: ['juizo', 'ressurreicao', 'eterno', 'gloria', 'consumacao'] },
];

const getLocalChapterLoader = async () => {
  if (!localBibleChapterLoader) {
    const module = await import('./bibleService');
    localBibleChapterLoader = module.getLocalBibleChapter;
  }
  return localBibleChapterLoader;
};

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const normalizeStrongCode = (value: string) => value.replace(/[{}\s]/g, '').toUpperCase();

const removeStrongTags = (text: string) => text.replace(/\{[HG]\d+\}/gi, '').replace(/\s{2,}/g, ' ').trim();

const extractStrongCodes = (text: string): string[] => {
  const matches = text.match(/\{([HG]\d+)\}/gi) || [];
  return matches.map(match => normalizeStrongCode(match));
};

const getStrongDictionaryMap = async (): Promise<Map<string, string>> => {
  if (strongDictionaryCache) return strongDictionaryCache;

  const map = new Map<string, string>();

  try {
    const entries = await getStoredDictionaries();
    for (const entry of entries) {
      const rawWord = typeof entry.word === 'string' ? entry.word : '';
      const word = normalizeStrongCode(rawWord);
      if (!/^[HG]\d+$/.test(word)) continue;
      const def = typeof entry.definition === 'string' ? entry.definition.trim() : '';
      if (!def) continue;
      map.set(word, def);
    }
  } catch {
    // If dictionary is unavailable, analysis still works using occurrence data only.
  }

  // Built-in fallback imported from OpenScriptures/strongs for offline lexical support.
  for (const [code, definition] of Object.entries(strongsOpenScriptures as Record<string, string>)) {
    const normalizedCode = normalizeStrongCode(code);
    if (!/^[HG]\d+$/.test(normalizedCode)) continue;
    if (map.has(normalizedCode)) continue;
    const def = typeof definition === 'string' ? definition.trim() : '';
    if (!def) continue;
    map.set(normalizedCode, translateStrongDefinitionToPtBr(def));
  }

  strongDictionaryCache = map;
  return map;
};

const splitIntoKnowledgeSegments = (text: string, maxLen = 380): string[] => {
  const paragraphs = text
    .replace(/\r/g, '')
    .split(/\n{2,}/)
    .map(item => item.trim())
    .filter(Boolean);

  const segments: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLen) {
      if (paragraph.length >= 35) segments.push(paragraph);
      continue;
    }

    const sentences = paragraph
      .split(/(?<=[.!?])\s+/)
      .map(item => item.trim())
      .filter(Boolean);

    let current = '';
    for (const sentence of sentences) {
      if ((current + ' ' + sentence).trim().length > maxLen) {
        if (current.trim().length >= 35) segments.push(current.trim());
        current = sentence;
      } else {
        current = `${current} ${sentence}`.trim();
      }
    }
    if (current.trim().length >= 35) segments.push(current.trim());
  }

  return segments;
};

const getStaticConfessionCorpus = (): KnowledgeRecord[] => {
  if (staticConfessionCorpusCache) return staticConfessionCorpusCache;

  const docs = [
    { sourceName: 'Confissão de Fé de Westminster', content: WESTMINSTER_CONFESSION },
    { sourceName: 'Catecismo de Heidelberg', content: HEIDELBERG_CATECHISM },
    { sourceName: 'Confissão Belga', content: BELGIC_CONFESSION },
  ];

  const records: KnowledgeRecord[] = [];
  for (const doc of docs) {
    const segments = splitIntoKnowledgeSegments(doc.content);
    segments.forEach((segment, index) => {
      records.push({
        sourceType: 'confession',
        sourceName: doc.sourceName,
        reference: `${doc.sourceName} §${index + 1}`,
        text: segment,
      });
    });
  }

  staticConfessionCorpusCache = records.slice(0, 2200);
  return staticConfessionCorpusCache;
};

const loadStoredConfessionCorpus = async (): Promise<KnowledgeRecord[]> => {
  try {
    const stored = await getStoredConfessions();
    return stored
      .map(item => {
        const heading = [item.source, item.reference, item.question].filter(Boolean).join(' | ');
        const body = String(item.answer || '').trim();
        const text = `${heading}\n${body}`.trim();
        if (!body || body.length < 20) return null;
        return {
          sourceType: 'confession' as const,
          sourceName: item.source || 'Confissão importada',
          reference: item.reference || item.id,
          text,
        };
      })
      .filter((item): item is Exclude<typeof item, null> => item !== null)
      .slice(0, 1200);
  } catch {
    return [];
  }
};

const loadNotesCorpus = (): KnowledgeRecord[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem('notes');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ reference?: string; content?: string }>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => {
        const content = String(item.content || '').trim();
        if (content.length < 8) return null;
        const reference = String(item.reference || `Nota ${index + 1}`);
        const excerpt = content.length > 460 ? `${content.slice(0, 457)}...` : content;
        return {
          sourceType: 'note' as const,
          sourceName: 'Notas do usuário',
          reference,
          text: excerpt,
        };
      })
      .filter((item): item is Exclude<typeof item, null> => item !== null)
      .slice(0, 600);
  } catch {
    return [];
  }
};

const buildKnowledgeInsights = (records: KnowledgeRecord[], analyzers: TokenAnalyzer[]): KnowledgeInsight[] => {
  if (records.length === 0 || analyzers.length === 0) return [];

  const insights: KnowledgeInsight[] = [];

  for (const record of records) {
    const normalizedText = normalize(removeStrongTags(record.text));
    const matchedTerms: string[] = [];
    let score = 0;

    for (const analyzer of analyzers) {
      const result = analyzer.test(normalizedText);
      if (result.occurrences > 0) {
        matchedTerms.push(analyzer.token.raw);
        score += result.occurrences;
      }
    }

    if (score === 0) continue;

    insights.push({
      sourceType: record.sourceType,
      sourceName: record.sourceName,
      reference: record.reference,
      score,
      matchedTerms,
      excerpt: record.text.length > 320 ? `${record.text.slice(0, 317)}...` : record.text,
    });
  }

  return insights
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
};

const countKeywordOccurrences = (normalizedText: string, keyword: string, useStemming: boolean): number => {
  const normalizedKeyword = normalize(keyword).trim();
  if (!normalizedKeyword) return 0;

  if (normalizedKeyword.includes(' ')) {
    const phraseRegex = new RegExp(escapeRegExp(normalizedKeyword), 'g');
    return (normalizedText.match(phraseRegex) || []).length;
  }

  const words = normalizedText.match(/[a-z0-9]+/g) || [];
  if (!useStemming) {
    return words.filter(word => word === normalizedKeyword).length;
  }

  const targetStem = stemWord(normalizedKeyword);
  let count = 0;
  for (const word of words) {
    if (word === normalizedKeyword) {
      count += 1;
      continue;
    }
    if (targetStem.length >= 4 && word.startsWith(targetStem)) {
      count += 1;
    }
  }
  return count;
};

const buildTheologyProfile = (
  corpus: VerseRecord[],
  knowledgeRecords: KnowledgeRecord[],
  options: AnalysisOptions
): TheologyAxisScore[] => {
  const profile: TheologyAxisScore[] = [];

  for (const axis of THEOLOGY_AXES) {
    let bibleHits = 0;
    let knowledgeHits = 0;
    const evidenceScores = new Map<string, number>();

    for (const verse of corpus) {
      const normalizedText = normalize(removeStrongTags(verse.text));
      let verseScore = 0;
      for (const keyword of axis.keywords) {
        verseScore += countKeywordOccurrences(normalizedText, keyword, options.enableStemming);
      }

      if (verseScore > 0) {
        bibleHits += verseScore;
        evidenceScores.set(verse.reference, (evidenceScores.get(verse.reference) || 0) + verseScore);
      }
    }

    for (const record of knowledgeRecords) {
      const normalizedText = normalize(removeStrongTags(record.text));
      let recordScore = 0;
      for (const keyword of axis.keywords) {
        recordScore += countKeywordOccurrences(normalizedText, keyword, options.enableStemming);
      }

      if (recordScore > 0) {
        knowledgeHits += recordScore;
        evidenceScores.set(record.reference, (evidenceScores.get(record.reference) || 0) + recordScore);
      }
    }

    const score = (bibleHits * 2) + knowledgeHits;
    const evidence = Array.from(evidenceScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reference]) => reference);

    profile.push({
      axisId: axis.axisId,
      title: axis.title,
      score,
      bibleHits,
      knowledgeHits,
      evidence,
    });
  }

  return profile.sort((a, b) => b.score - a.score);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getTokenRegexForTest = (token: QueryToken): RegExp => {
  const safe = escapeRegExp(token.normalized);
  if (token.isPhrase) return new RegExp(safe, 'i');
  return new RegExp(`\\b${safe}\\b`, 'i');
};

const stemWord = (word: string): string => {
  if (word.length <= 4) return word;

  const suffixes = [
    'mente', 'coes', 'cao', 'sao', 'ções', 'ção', 'sões', 'são',
    'idades', 'idade', 'ismos', 'ismo', 'istas', 'ista',
    'ando', 'endo', 'indo', 'ados', 'adas', 'ido', 'ida',
    'mente', 'amentos', 'amento', 'imentos', 'imento',
    'mente', 'veis', 'vel', 'mente', 's', 'es'
  ];

  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, -suffix.length);
    }
  }

  return word;
};

const expandWordVariants = (base: string, options: AnalysisOptions): string[] => {
  const variants = new Set<string>([base]);

  if (!options.enableSemanticExpansion) {
    return Array.from(variants);
  }

  if (THEOLOGICAL_SYNONYMS[base]) {
    for (const alias of THEOLOGICAL_SYNONYMS[base]) variants.add(normalize(alias));
  }

  for (const [root, aliases] of Object.entries(THEOLOGICAL_SYNONYMS)) {
    const normalizedAliases = aliases.map(alias => normalize(alias));
    if (normalizedAliases.includes(base) || root === base) {
      variants.add(root);
      for (const alias of normalizedAliases) variants.add(alias);
    }
  }

  return Array.from(variants).filter(item => item.length >= 2);
};

const parseReference = (reference: string): { book: string; chapter: number } | null => {
  const trimmed = reference.trim();
  const match = trimmed.match(/^(.*)\s+(\d+)$/);
  if (!match) return null;

  const chapter = parseInt(match[2], 10);
  if (Number.isNaN(chapter) || chapter < 1) return null;

  const bookCandidate = match[1].trim().toLowerCase();
  const found = BOOKS.find(book => book.name.toLowerCase() === bookCandidate);
  if (!found) return null;

  return { book: found.name, chapter };
};

const getQueryTokens = (input: string, options: AnalysisOptions): QueryToken[] => {
  const found: QueryToken[] = [];
  const seen = new Set<string>();

  const phraseRegex = /"([^"]+)"/g;
  const textWithoutPhrases = input.replace(phraseRegex, (_, phrase: string) => {
    const normalized = normalize(phrase).trim();
    if (normalized.length >= 3) {
      const key = `p:${normalized}`;
      if (!seen.has(key)) {
        seen.add(key);
        found.push({ raw: phrase.trim(), normalized, isPhrase: true, variants: [normalized] });
      }
    }
    return ' ';
  });

  const commaSeparated = textWithoutPhrases
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(Boolean);

  if (commaSeparated.length > 0) {
    for (const item of commaSeparated) {
      const normalized = normalize(item);
      if (normalized.length < 2) continue;
      const key = `w:${normalized}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ raw: item, normalized, isPhrase: false, variants: expandWordVariants(normalized, options) });
    }

    return found.slice(0, 10);
  }

  const words = normalize(textWithoutPhrases)
    .split(/\s+/)
    .map(item => item.trim())
    .filter(item => item.length >= 3);

  for (const word of words) {
    const key = `w:${word}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ raw: word, normalized: word, isPhrase: false, variants: expandWordVariants(word, options) });
    if (found.length >= 10) break;
  }

  return found;
};

const loadChapterCorpus = async (book: string, chapter: number, version: VersionCode): Promise<VerseRecord[]> => {
  const cacheKey = `chapter:${version}:${book}:${chapter}`;
  const cached = corpusCache.get(cacheKey);
  if (cached) return cached;

  const loadChapter = await getLocalChapterLoader();
  const verses = await loadChapter(book, chapter, version);
  const chapterCorpus = verses.map(v => ({
    reference: `${book} ${chapter}:${v.verse}`,
    text: v.text
  }));

  corpusCache.set(cacheKey, chapterCorpus);
  return chapterCorpus;
};

const loadBookCorpus = async (book: string, version: VersionCode): Promise<VerseRecord[]> => {
  const cacheKey = `book:${version}:${book}`;
  const cached = corpusCache.get(cacheKey);
  if (cached) return cached;

  const info = BOOKS.find(b => b.name === book);
  if (!info) return [];

  const all: VerseRecord[] = [];
  for (let chapter = 1; chapter <= info.chapters; chapter += 1) {
    const chapterCorpus = await loadChapterCorpus(book, chapter, version);
    if (chapterCorpus.length > 0) all.push(...chapterCorpus);
  }

  corpusCache.set(cacheKey, all);
  return all;
};

const loadBibleCorpus = async (version: VersionCode): Promise<VerseRecord[]> => {
  const cacheKey = `bible:${version}:all`;
  const cached = corpusCache.get(cacheKey);
  if (cached) return cached;

  const all: VerseRecord[] = [];
  for (const book of BOOKS) {
    const bookCorpus = await loadBookCorpus(book.name, version);
    if (bookCorpus.length > 0) all.push(...bookCorpus);
  }

  corpusCache.set(cacheKey, all);
  return all;
};

const createTokenAnalyzer = (token: QueryToken, options: AnalysisOptions): TokenAnalyzer => {
  if (token.isPhrase) {
    const phraseRegex = new RegExp(escapeRegExp(token.normalized), 'gi');
    return {
      token,
      test: (normalizedVerseText: string) => {
        const matches = normalizedVerseText.match(phraseRegex) || [];
        return {
          occurrences: matches.length,
          forms: matches.length > 0 ? [token.normalized] : []
        };
      }
    };
  }

  const exactForms = new Set(token.variants.map(v => normalize(v)));
  const stems = options.enableStemming
    ? new Set(Array.from(exactForms).map(stemWord).filter(stem => stem.length >= 4))
    : new Set<string>();

  return {
    token,
    test: (normalizedVerseText: string) => {
      const words = normalizedVerseText.match(/[a-z0-9]+/g) || [];
      let count = 0;
      const forms = new Set<string>();

      for (const word of words) {
        if (exactForms.has(word)) {
          count += 1;
          forms.add(word);
          continue;
        }

        let stemMatched = false;
        for (const stem of stems) {
          if (word.startsWith(stem)) {
            count += 1;
            forms.add(word);
            stemMatched = true;
            break;
          }
        }

        if (stemMatched) continue;
      }

      return { occurrences: count, forms: Array.from(forms) };
    }
  };
};

const collectTermStats = (corpus: VerseRecord[], analyzer: TokenAnalyzer): TermReport => {
  const token = analyzer.token;

  let occurrences = 0;
  const scoreByRef = new Map<string, number>();
  const formsFound = new Set<string>();

  for (const verse of corpus) {
    const normalizedVerseText = normalize(verse.text);
    const result = analyzer.test(normalizedVerseText);
    if (result.occurrences === 0) continue;

    occurrences += result.occurrences;
    scoreByRef.set(verse.reference, result.occurrences);
    result.forms.forEach(form => formsFound.add(form));
  }

  const rankedReferences = Array.from(scoreByRef.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([reference, score]) => ({ reference, score }));

  return {
    term: token.raw,
    mode: token.isPhrase ? 'phrase' : 'word',
    expandedWith: token.isPhrase ? [] : token.variants.filter(v => v !== token.normalized),
    occurrences,
    verses: rankedReferences.length,
    references: rankedReferences.map(item => item.reference).slice(0, 60),
    rankedReferences: rankedReferences.slice(0, 20),
    // keep only a short list to avoid noisy reports
    ...(formsFound.size > 0 ? {} : {})
  };
};

const buildCrossReferences = (corpus: VerseRecord[], analyzers: TokenAnalyzer[]): string[] => {
  if (analyzers.length < 2) return [];

  const cross: string[] = [];
  for (const verse of corpus) {
    const verseText = normalize(verse.text);
    const matched = analyzers.filter(item => item.test(verseText).occurrences > 0);
    if (matched.length >= 2) {
      cross.push(`${verse.reference} (${matched.map(m => m.token.raw).join(', ')})`);
    }
    if (cross.length >= 40) break;
  }

  return cross;
};

const buildContextSnippets = (corpus: VerseRecord[], termReports: TermReport[]): string[] => {
  const indexByRef = new Map<string, number>();
  corpus.forEach((verse, idx) => indexByRef.set(verse.reference, idx));

  const globalRanking = new Map<string, number>();
  for (const report of termReports) {
    for (const item of report.rankedReferences) {
      globalRanking.set(item.reference, (globalRanking.get(item.reference) || 0) + item.score);
    }
  }

  const topReferences = Array.from(globalRanking.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([reference]) => reference);

  const snippets: string[] = [];

  for (const reference of topReferences) {
    const centerIndex = indexByRef.get(reference);
    if (centerIndex === undefined) continue;

    const from = Math.max(0, centerIndex - 1);
    const to = Math.min(corpus.length - 1, centerIndex + 1);
    const context = corpus
      .slice(from, to + 1)
      .map((verse, idx) => {
        const isCenter = from + idx === centerIndex;
        return `${isCenter ? '-> ' : ''}${verse.reference} ${verse.text}`;
      })
      .join(' | ');

    snippets.push(context);
  }

  return snippets;
};

const buildStrongReports = async (corpus: VerseRecord[], termReports: TermReport[]): Promise<StrongReport[]> => {
  const verseByRef = new Map(corpus.map(verse => [verse.reference, verse]));
  const relevantReferences = new Set<string>();
  const termByReference = new Map<string, Set<string>>();

  for (const term of termReports) {
    for (const ref of term.references) {
      relevantReferences.add(ref);
      if (!termByReference.has(ref)) termByReference.set(ref, new Set<string>());
      termByReference.get(ref)?.add(term.term);
    }
  }

  if (relevantReferences.size === 0) return [];

  const occurrenceByCode = new Map<string, number>();
  const refsByCode = new Map<string, Set<string>>();
  const termsByCode = new Map<string, Map<string, number>>();

  for (const reference of relevantReferences) {
    const verse = verseByRef.get(reference);
    if (!verse) continue;

    const codes = extractStrongCodes(verse.text);
    if (codes.length === 0) continue;

    const terms = termByReference.get(reference) || new Set<string>();

    for (const code of codes) {
      occurrenceByCode.set(code, (occurrenceByCode.get(code) || 0) + 1);

      if (!refsByCode.has(code)) refsByCode.set(code, new Set<string>());
      refsByCode.get(code)?.add(reference);

      if (!termsByCode.has(code)) termsByCode.set(code, new Map<string, number>());
      const termMap = termsByCode.get(code)!;
      for (const term of terms) {
        termMap.set(term, (termMap.get(term) || 0) + 1);
      }
    }
  }

  if (occurrenceByCode.size === 0) return [];

  const dictionary = await getStrongDictionaryMap();

  const reports: StrongReport[] = Array.from(occurrenceByCode.entries())
    .map(([code, occurrences]) => {
      const refs = Array.from(refsByCode.get(code) || []);
      const terms = Array.from((termsByCode.get(code) || new Map<string, number>()).entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([term, verses]) => ({ term, verses }));

      return {
        code,
        occurrences,
        verses: refs.length,
        references: refs.slice(0, 20),
        definition: dictionary.get(code),
        cooccurringTerms: terms,
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 30);

  return reports;
};

export const runInternalBibleAI = async (params: {
  termsInput: string;
  scope: Scope;
  reference?: string;
  version?: VersionCode;
  options?: Partial<AnalysisOptions>;
}): Promise<InternalBibleAIReport> => {
  const version = params.version || 'ARC';
  const options: AnalysisOptions = {
    enableSemanticExpansion: params.options?.enableSemanticExpansion ?? true,
    enableStemming: params.options?.enableStemming ?? true,
    enableStrongLexical: params.options?.enableStrongLexical ?? true,
    enableAppKnowledge: params.options?.enableAppKnowledge ?? true,
  };
  const tokens = getQueryTokens(params.termsInput, options);
  if (tokens.length === 0) {
    return {
      scope: params.scope,
      scopeLabel: 'Entrada invalida',
      version,
      options,
      scannedVerses: 0,
      termReports: [],
      strongReports: [],
      knowledgeInsights: [],
      theologyProfile: [],
      crossReferences: [],
      contextSnippets: []
    };
  }

  let corpus: VerseRecord[] = [];
  let scopeLabel = '';

  if (params.scope === 'chapter') {
    const parsed = parseReference(params.reference || '');
    if (!parsed) {
      return {
        scope: params.scope,
        scopeLabel: 'Referencia invalida. Use o formato "Livro Capitulo" (ex: Romanos 8).',
        version,
        options,
        scannedVerses: 0,
        termReports: [],
        strongReports: [],
        knowledgeInsights: [],
        theologyProfile: [],
        crossReferences: [],
        contextSnippets: []
      };
    }

    corpus = await loadChapterCorpus(parsed.book, parsed.chapter, version);
    scopeLabel = `${parsed.book} ${parsed.chapter}`;
  }

  if (params.scope === 'book') {
    const parsed = parseReference(params.reference || '');
    if (!parsed) {
      return {
        scope: params.scope,
        scopeLabel: 'Referencia invalida. Use o formato "Livro Capitulo" para indicar o livro (ex: Joao 1).',
        version,
        options,
        scannedVerses: 0,
        termReports: [],
        strongReports: [],
        knowledgeInsights: [],
        theologyProfile: [],
        crossReferences: [],
        contextSnippets: []
      };
    }

    corpus = await loadBookCorpus(parsed.book, version);
    scopeLabel = parsed.book;
  }

  if (params.scope === 'bible') {
    corpus = await loadBibleCorpus(version);
    scopeLabel = 'Biblia inteira';
  }

  const analyzers = tokens.map(token => createTokenAnalyzer(token, options));
  const termReports = analyzers.map(analyzer => collectTermStats(corpus, analyzer));
  const strongReports = options.enableStrongLexical ? await buildStrongReports(corpus, termReports) : [];
  let knowledgeRecords: KnowledgeRecord[] = [];
  let knowledgeInsights: KnowledgeInsight[] = [];

  if (options.enableAppKnowledge) {
    const storedConfessions = await loadStoredConfessionCorpus();
    knowledgeRecords = [
      ...getStaticConfessionCorpus(),
      ...storedConfessions,
      ...loadNotesCorpus(),
    ];
    knowledgeInsights = buildKnowledgeInsights(knowledgeRecords, analyzers);
  }

  const theologyProfile = buildTheologyProfile(corpus, knowledgeRecords, options);

  const crossReferences = buildCrossReferences(corpus, analyzers);
  const contextSnippets = buildContextSnippets(corpus, termReports);

  return {
    scope: params.scope,
    scopeLabel,
    version,
    options,
    scannedVerses: corpus.length,
    termReports,
    strongReports,
    knowledgeInsights,
    theologyProfile,
    crossReferences,
    contextSnippets
  };
};

export const formatInternalBibleAIReportMarkdown = (report: InternalBibleAIReport): string => {
  if (report.scannedVerses === 0 || report.termReports.length === 0) {
    return [
      '## Estudo Interno',
      '',
      `Nao consegui analisar o escopo solicitado (${report.scopeLabel}) com dados suficientes.`,
      'Tente conferir a referencia, mudar o escopo ou selecionar outra versao.'
    ].join('\n');
  }

  const terms = report.termReports.map(item => item.term);
  const totalOccurrences = report.termReports.reduce((acc, item) => acc + item.occurrences, 0);
  const termsWithHits = report.termReports.filter(item => item.occurrences > 0);
  const termsWithoutHits = report.termReports.filter(item => item.occurrences === 0);

  const topAxes = report.theologyProfile.slice(0, 3);
  const topCross = report.crossReferences.slice(0, 4);
  const topStrong = report.strongReports.slice(0, 3);
  const topKnowledge = report.knowledgeInsights.slice(0, 3);
  const topContext = report.contextSnippets.slice(0, 2);

  const bibleSignal = topAxes.reduce((acc, axis) => acc + axis.bibleHits, 0);
  const knowledgeSignal = topAxes.reduce((acc, axis) => acc + axis.knowledgeHits, 0);

  const summaryLead = totalOccurrences > 0
    ? `Analisei ${report.scannedVerses} versiculos em ${report.scopeLabel} (${report.version}) e encontrei ocorrencias relevantes para ${termsWithHits.map(item => item.term).join(', ')}.`
    : `Analisei ${report.scannedVerses} versiculos em ${report.scopeLabel} (${report.version}), mas os termos pesquisados (${terms.join(', ')}) nao apareceram diretamente neste escopo.`;

  const cautionLine = totalOccurrences === 0 && topAxes.length > 0
    ? 'Mesmo sem ocorrencia literal dos termos, o perfil teologico abaixo foi inferido por proximidade conceitual e por correlacao com o conhecimento interno do app.'
    : '';

  const balanceLine = knowledgeSignal > bibleSignal
    ? 'Nesta leitura, o peso interpretativo veio mais de simbolos de fe/notas do que de ocorrencias textuais diretas do trecho.'
    : 'Nesta leitura, a inferencia ficou majoritariamente ancorada no proprio texto biblico analisado.';

  const axisLine = topAxes.length > 0
    ? `Os eixos que mais se destacaram foram: ${topAxes.map(axis => axis.title).join(', ')}.`
    : 'Nao houve eixo teologico dominante suficiente para uma sintese segura.';

  const referencesLine = termsWithHits.length > 0
    ? `As referencias mais fortes foram: ${termsWithHits.flatMap(item => item.references.slice(0, 3)).slice(0, 6).join('; ')}.`
    : 'Como nao houve correspondencia literal dos termos, recomendo ampliar o escopo para o livro inteiro ou Biblia inteira.';

  const lines: string[] = [];
  lines.push('## Estudo Interno');
  lines.push('');
  lines.push(summaryLead);
  if (cautionLine) lines.push(cautionLine);
  lines.push(axisLine);
  lines.push(balanceLine);
  lines.push(referencesLine);

  if (termsWithoutHits.length > 0) {
    lines.push('');
    lines.push(`Termos sem ocorrencia direta neste escopo: ${termsWithoutHits.map(item => item.term).join(', ')}.`);
  }

  lines.push('');
  lines.push('### Sintese Teologica');
  if (topAxes.length === 0) {
    lines.push('Nao foi possivel construir uma sintese teologica robusta com os dados atuais.');
  } else {
    for (const axis of topAxes) {
      const evidence = axis.evidence.slice(0, 3).join('; ');
      lines.push(`- ${axis.title}: score ${axis.score}. Evidencias principais: ${evidence || 'sem evidencia textual curta disponivel'}.`);
    }
  }

  lines.push('');
  lines.push('### Apoios de Estudo');
  if (topStrong.length > 0) {
    lines.push(`- Strong: ${topStrong.map(item => `${item.code} (${item.occurrences} ocorrencias)`).join('; ')}.`);
  } else {
    lines.push('- Strong: nao houve correspondencias lexicas relevantes neste escopo.');
  }

  if (topKnowledge.length > 0) {
    lines.push(`- Simbolos de Fe/Notas: ${topKnowledge.map(item => `${item.reference} (${item.sourceName})`).join('; ')}.`);
  } else {
    lines.push('- Simbolos de Fe/Notas: nenhuma correlacao direta encontrada para esta consulta.');
  }

  if (topCross.length > 0) {
    lines.push(`- Referencias cruzadas: ${topCross.join('; ')}.`);
  } else {
    lines.push('- Referencias cruzadas: sem coocorrencias suficientes para formar conexoes fortes.');
  }

  if (topContext.length > 0) {
    lines.push(`- Contexto imediato: ${topContext.map(item => item.replace(/\s*\|\s*/g, ' | ')).join(' || ')}.`);
  }

  lines.push('');
  lines.push('### Proximo Passo Sugerido');
  lines.push('Refaca a consulta com um termo biblicamente central (ou com expressao exata entre aspas) e compare o resultado entre capitulo, livro e Biblia inteira para obter uma leitura mais equilibrada.');

  return lines.join('\n');
};
