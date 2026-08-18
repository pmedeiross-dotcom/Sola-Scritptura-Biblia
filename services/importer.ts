import JSZip from 'jszip';
import { Verse, ConfessionItem, DictionaryEntry } from '../types';
import { BIBLE_BOOKS } from '../constants';

const BOOK_NAME_ALIASES: Record<string, string> = {
  genesis: 'Gênesis', exodus: 'Êxodo', leviticus: 'Levítico', numbers: 'Números', deuteronomy: 'Deuteronômio',
  joshua: 'Josué', judges: 'Juízes', ruth: 'Rute', '1 samuel': '1 Samuel', '2 samuel': '2 Samuel',
  '1 kings': '1 Reis', '2 kings': '2 Reis', '1 chronicles': '1 Crônicas', '2 chronicles': '2 Crônicas',
  ezra: 'Esdras', nehemiah: 'Neemias', esther: 'Ester', job: 'Jó', psalms: 'Salmos',
  proverbs: 'Provérbios', ecclesiastes: 'Eclesiastes', 'song of songs': 'Cantares', 'song of solomon': 'Cantares',
  isaiah: 'Isaías', jeremiah: 'Jeremias', lamentations: 'Lamentações', ezekiel: 'Ezequiel', daniel: 'Daniel',
  hosea: 'Oseias', joel: 'Joel', amos: 'Amós', obadiah: 'Obadias', jonah: 'Jonas',
  micah: 'Miqueias', nahum: 'Naum', habakkuk: 'Habacuque', zephaniah: 'Sofonias', haggai: 'Ageu',
  zechariah: 'Zacarias', malachi: 'Malaquias', matthew: 'Mateus', mark: 'Marcos', luke: 'Lucas',
  john: 'João', acts: 'Atos', romans: 'Romanos', '1 corinthians': '1 Coríntios', '2 corinthians': '2 Coríntios',
  galatians: 'Gálatas', ephesians: 'Efésios', philippians: 'Filipenses', colossians: 'Colossenses',
  '1 thessalonians': '1 Tessalonicenses', '2 thessalonians': '2 Tessalonicenses',
  '1 timothy': '1 Timóteo', '2 timothy': '2 Timóteo', titus: 'Tito', philemon: 'Filemom',
  hebrews: 'Hebreus', james: 'Tiago', '1 peter': '1 Pedro', '2 peter': '2 Pedro',
  '1 john': '1 João', '2 john': '2 João', '3 john': '3 João', jude: 'Judas', revelation: 'Apocalipse',
};

const cleanString = (str: string): string => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const normalizeBookName = (input: string): string => {
  if (!input) return "Desconhecido";
  const cleaned = cleanString(String(input));
  let match = BIBLE_BOOKS.find(b => cleanString(b.name) === cleaned);
  if (match) return match.name;
  match = BIBLE_BOOKS.find(b => b.abbr.some(a => cleanString(a) === cleaned));
  if (match) return match.name;

  const alias = BOOK_NAME_ALIASES[cleaned];
  if (alias) return alias;

  const compact = cleaned.replace(/\s+/g, ' ');
  const compactAlias = BOOK_NAME_ALIASES[compact];
  if (compactAlias) return compactAlias;

  return input.charAt(0).toUpperCase() + input.slice(1);
};

const sanitizeVersionCode = (value: string) => {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
  return cleaned || `IMP-${Date.now().toString().slice(-6)}`;
};

const isStrongChapterArray = (value: any): boolean => {
  if (!Array.isArray(value) || value.length === 0) return false;
  const sample = value[0];
  return typeof sample === 'object' && sample !== null && ('v' in sample || 'verse' in sample || 't' in sample || 'text' in sample);
};

const isStrongNestedBibleShape = (value: any): boolean => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const books = Object.values(value);
  if (books.length === 0) return false;
  const firstBook = books.find(book => typeof book === 'object' && book !== null && !Array.isArray(book));
  if (!firstBook) return false;
  const chapters = Object.values(firstBook as Record<string, any>);
  const firstChapter = chapters.find(ch => Array.isArray(ch));
  return isStrongChapterArray(firstChapter);
};

const resolveStrongBibleRoot = (data: any): Record<string, any> | null => {
  if (isStrongNestedBibleShape(data)) return data as Record<string, any>;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const keys = ['ara', 'kjv', 'bible', 'data', 'verses'];
    for (const key of keys) {
      const candidate = data[key];
      if (isStrongNestedBibleShape(candidate)) return candidate;
    }
  }

  return null;
};

const processStrongNestedBibleJSON = (data: any, fileName: string): { meta: any, data: Verse[] } | null => {
  const root = resolveStrongBibleRoot(data);
  if (!root) return null;

  const lowerName = fileName.toLowerCase();
  const defaultCode = lowerName.includes('ara') ? 'ARA-STR' : lowerName.includes('kjv') ? 'KJV-STR' : 'STRONG-IMP';
  const meta = {
    code: sanitizeVersionCode(data?.metadata?.code || data?.code || defaultCode),
    name: data?.metadata?.name || fileName.replace(/\.[^.]+$/, ''),
    language: data?.metadata?.language || (lowerName.includes('kjv') ? 'en' : 'pt'),
    importedAt: Date.now(),
  };

  const verses: Verse[] = [];

  for (const [bookRaw, chapterMap] of Object.entries(root)) {
    if (!chapterMap || typeof chapterMap !== 'object' || Array.isArray(chapterMap)) continue;
    const normalizedBook = normalizeBookName(bookRaw);

    for (const [chapterRaw, verseList] of Object.entries(chapterMap as Record<string, any>)) {
      const chapter = Number(chapterRaw);
      if (!Number.isFinite(chapter) || chapter < 1 || !Array.isArray(verseList)) continue;

      for (const verseRaw of verseList) {
        if (!verseRaw || typeof verseRaw !== 'object') continue;

        const verse = Number(verseRaw.v ?? verseRaw.verse ?? verseRaw.numero ?? verseRaw.n);
        const textValue = verseRaw.t ?? verseRaw.text ?? verseRaw.texto;
        const text = typeof textValue === 'string' ? textValue.trim() : '';
        if (!Number.isFinite(verse) || verse < 1 || !text) continue;

        verses.push({
          book: normalizedBook,
          chapter,
          verse,
          text,
          version: meta.code,
        });
      }
    }
  }

  return verses.length > 0 ? { meta, data: verses } : null;
};

export const processFile = async (file: File, type: 'bible' | 'confession' | 'dictionary'): Promise<{ meta?: any, data: any[] }> => {
  if (!file || file.size === 0) throw new Error('Arquivo inválido ou vazio.');
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    if (type === 'confession') return await processConfessionJSON(file);
    if (type === 'dictionary') return await processDictionaryJSON(file);
    if (extension === 'json') return await processJSON(file);
    if (extension === 'sqlite' || extension === 'sqlite3') return await processSQLite(file);
    if (extension === 'zip') return await processZip(file);
    throw new Error(`Formato .${extension} não suportado.`);
  } catch (e: any) {
    console.error("Erro no processamento:", e);
    throw new Error(e.message || "Erro desconhecido ao processar arquivo.");
  }
};

const processDictionaryJSON = async (file: File): Promise<{ data: DictionaryEntry[] }> => {
  const text = await file.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error("JSON inválido."); }

  const rawItems = Array.isArray(data) ? data : (data.entries || data.items || []);
  if (rawItems.length === 0 && typeof data === 'object') {
    const processed: DictionaryEntry[] = Object.entries(data).map(([word, definition], idx) => ({
      id: `dict-${Date.now()}-${idx}`,
      word: String(word),
      definition: typeof definition === 'string' ? definition : JSON.stringify(definition),
      source: file.name
    }));
    return { data: processed };
  }

  const processed = rawItems.map((item: any, idx: number) => ({
    id: `dict-${Date.now()}-${idx}`,
    word: item.word || item.termo || "Sem título",
    definition: item.definition || item.definicao || "",
    source: item.source || file.name
  }));
  return { data: processed };
};

const processConfessionJSON = async (file: File): Promise<{ data: ConfessionItem[] }> => {
  const text = await file.text();
  let data: any;
  try { data = JSON.parse(text); } catch (e) { throw new Error("JSON de confissão inválido."); }

  if (!Array.isArray(data) && typeof data === 'object' && Object.values(data).every(v => v === null || v === undefined)) {
    return reconstructConfessionFromFlatKeys(data, file.name);
  }

  const items = Array.isArray(data) ? data : (data.items || data.confessions || []);
  const processed = items.map((item: any, idx: number) => ({
    id: item.id || `conf-${Date.now()}-${idx}`,
    source: item.source || "Fonte Desconhecida",
    reference: item.reference || `Seção ${idx + 1}`,
    question: item.question || item.title || "Tópico",
    answer: item.answer || item.text || item.content,
    tags: Array.isArray(item.tags) ? item.tags : []
  }));

  return { data: processed };
};

const reconstructConfessionFromFlatKeys = (data: Record<string, any>, fileName: string): { data: ConfessionItem[] } => {
  const fullText = Object.keys(data).join(" ");
  const sourceName = fileName.replace('.json', '');
  const items: ConfessionItem[] = [];

  const chapters = fullText.split(/CAPÍTULO\s+(\d+):/gi);

  let currentSource = sourceName;
  if (chapters[0]?.trim()) {
    currentSource = chapters[0].split('\n')[0].trim() || sourceName;
  }

  for (let i = 1; i < chapters.length; i += 2) {
    const chapNum = chapters[i];
    const chapBody = chapters[i + 1];
    if (!chapBody) continue;

    const lines = chapBody.trim().split('\n');
    const chapTitle = lines[0].trim().replace(/\.+/g, '').trim();

    const sections = chapBody.split(/\s+(\d+)\.\s+/g);

    for (let j = 1; j < sections.length; j += 2) {
      const secNum = sections[j];
      let secContent = sections[j + 1]?.trim() || "";

      secContent = secContent.replace(/\s+/g, ' ').replace(/null/g, '').trim();

      if (secContent) {
        items.push({
          id: `imp-cfw-${chapNum}-${secNum}-${Date.now()}`,
          source: currentSource,
          reference: `Cap. ${chapNum}, Sec. ${secNum}`,
          question: chapTitle,
          answer: secContent,
          tags: ["Confissão", chapTitle],
          createdAt: Date.now(),
          popularity: 50
        });
      }
    }
  }

  if (items.length === 0) {
    items.push({
      id: `imp-raw-${Date.now()}`,
      source: sourceName,
      reference: "Documento Integral",
      question: "Texto Importado",
      answer: fullText.substring(0, 5000),
      tags: ["Importado"],
      createdAt: Date.now()
    });
  }

  return { data: items };
};

const processJSON = async (file: File) => {
  const text = await file.text();
  let data; try { data = JSON.parse(text); } catch (e) { throw new Error("JSON inválido."); }

  const strongParsed = processStrongNestedBibleJSON(data, file.name);
  if (strongParsed) return strongParsed;

  let verses: Verse[] = [];
  let meta = { code: sanitizeVersionCode('IMP-' + Math.random().toString(36).substring(7).toUpperCase()), name: file.name.replace('.json', ''), language: 'pt', importedAt: Date.now() };
  if (data.metadata) meta = { ...meta, ...data.metadata };
  meta = { ...meta, code: sanitizeVersionCode(meta.code || 'IMP') };
  const list = Array.isArray(data) ? data : (data.verses || []);
  if (list.length > 0) {
    verses = list.map((v: any) => ({
      book: normalizeBookName(v.book || v.livro),
      chapter: parseInt(v.chapter || v.capitulo || 0),
      verse: parseInt(v.verse || v.versiculo || 0),
      text: String(v.text || v.texto || ""),
      version: meta.code
    }));
  }
  return { meta, data: verses };
};

const processSQLite = async (file: File) => {
  // @ts-ignore
  const initSql = window.initSqlJs || (window as any).SQL?.initSqlJs;
  const SQL = await initSql({ locateFile: (f: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}` });
  const db = new SQL.Database(new Uint8Array(await file.arrayBuffer()));
  const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  const likelyTable = tablesRes[0].values.map((v: any[]) => String(v[0])).find((t: string) => t.toLowerCase().includes('verse')) || 'verses';
  const stmt = db.prepare(`SELECT * FROM ${likelyTable}`);
  const verses: Verse[] = [];
  const meta = { code: `SQ-${Date.now().toString().slice(-4)}`, name: file.name.split('.')[0], importedAt: Date.now(), language: 'pt' };
  while (stmt.step()) {
    const row = stmt.getAsObject();
    verses.push({ book: normalizeBookName(String(row.book || row.book_name || 'Desconhecido')), chapter: Number(row.chapter || 0), verse: Number(row.verse || 0), text: String(row.text || ''), version: meta.code });
  }
  stmt.free();
  db.close();
  return { meta, data: verses };
};

const processZip = async (file: File) => {
  const zip = await new JSZip().loadAsync(file);
  const files = Object.values(zip.files) as JSZip.JSZipObject[];
  const jsonFile = files.find(f => f.name.toLowerCase().endsWith('.json'));
  if (jsonFile) return processJSON(new File([await jsonFile.async('string')], jsonFile.name));
  throw new Error("ZIP sem JSON reconhecível.");
};
