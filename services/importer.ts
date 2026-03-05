
import JSZip from 'jszip';
import { Verse, ConfessionItem, DictionaryEntry } from '../types';
import { BIBLE_BOOKS } from '../constants';

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
  return input.charAt(0).toUpperCase() + input.slice(1);
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

  // Detecta formato de "Dicionário de Texto" (chaves como conteúdo, valores null)
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

/**
 * Lógica específica para reconstruir arquivos como o enviado (CFW)
 * onde o texto está quebrado em chaves do objeto JSON.
 */
const reconstructConfessionFromFlatKeys = (data: Record<string, any>, fileName: string): { data: ConfessionItem[] } => {
  const fullText = Object.keys(data).join(" ");
  const sourceName = fileName.replace('.json', '');
  const items: ConfessionItem[] = [];
  
  // Divide por Capítulos
  const chapters = fullText.split(/CAPÍTULO\s+(\d+):/gi);
  
  // O primeiro elemento antes do primeiro capítulo costuma ser o título geral
  let currentSource = sourceName;
  if (chapters[0]?.trim()) {
    currentSource = chapters[0].split('\n')[0].trim() || sourceName;
  }

  for (let i = 1; i < chapters.length; i += 2) {
    const chapNum = chapters[i];
    const chapBody = chapters[i + 1];
    if (!chapBody) continue;

    // Tenta encontrar o título do capítulo (primeira linha do body)
    const lines = chapBody.trim().split('\n');
    const chapTitle = lines[0].trim().replace(/\.+/g, '').trim();

    // Divide por Seções (1., 2., 3., etc)
    const sections = chapBody.split(/\s+(\d+)\.\s+/g);
    
    for (let j = 1; j < sections.length; j += 2) {
      const secNum = sections[j];
      let secContent = sections[j + 1]?.trim() || "";
      
      // Limpeza de ruídos comuns em conversões (como "null", excesso de espaços)
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
    // Se não conseguiu parsear por capítulos, cria um item único com o texto todo
    items.push({
      id: `imp-raw-${Date.now()}`,
      source: sourceName,
      reference: "Documento Integral",
      question: "Texto Importado",
      answer: fullText.substring(0, 5000), // Limita para segurança
      tags: ["Importado"],
      createdAt: Date.now()
    });
  }

  return { data: items };
};

const processJSON = async (file: File) => {
  const text = await file.text();
  let data; try { data = JSON.parse(text); } catch (e) { throw new Error("JSON inválido."); }
  let verses: Verse[] = [];
  let meta = { code: 'IMP-' + Math.random().toString(36).substring(7).toUpperCase(), name: file.name.replace('.json', ''), language: 'pt', importedAt: Date.now() };
  if (data.metadata) meta = { ...meta, ...data.metadata };
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
    const SQL = await initSql({ locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}` });
    const db = new SQL.Database(new Uint8Array(await file.arrayBuffer()));
    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const likelyTable = tablesRes[0].values.map(v => String(v[0])).find(t => t.toLowerCase().includes('verse')) || 'verses';
    const stmt = db.prepare(`SELECT * FROM ${likelyTable}`);
    const verses: Verse[] = [];
    const meta = { code: `SQ-${Date.now().toString().slice(-4)}`, name: file.name.split('.')[0], importedAt: Date.now(), language: 'pt' };
    while (stmt.step()) {
        const row = stmt.getAsObject();
        verses.push({ book: normalizeBookName(String(row.book || row.book_name || 'Desconhecido')), chapter: Number(row.chapter || 0), verse: Number(row.verse || 0), text: String(row.text || ''), version: meta.code });
    }
    stmt.free(); db.close();
    return { meta, data: verses };
};

const processZip = async (file: File) => {
    const zip = await new JSZip().loadAsync(file);
    const files = Object.values(zip.files) as any[];
    const jsonFile = files.find(f => f.name.toLowerCase().endsWith('.json'));
    if (jsonFile) return processJSON(new File([await jsonFile.async('string')], jsonFile.name));
    throw new Error("ZIP sem JSON reconhecível.");
};
