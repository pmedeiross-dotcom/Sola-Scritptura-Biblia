
import { Verse, ConfessionItem, Note, Highlight, HistoryEntry, StudyPlan, ConfessionHighlight, DictionaryEntry } from '../types';

const DB_NAME = 'SolaScripturaDB';
const DB_VERSION = 5; // Incremented for dictionaries
const STORE_VERSES = 'verses';
const STORE_META = 'metadata';
const STORE_CONFESSIONS = 'confessions';
const STORE_NOTES = 'notes';
const STORE_HIGHLIGHTS = 'highlights';
const STORE_CONFESSION_HIGHLIGHTS = 'confession_highlights';
const STORE_HISTORY = 'history';
const STORE_STUDY_PROGRESS = 'study_progress';
const STORE_DICTIONARIES = 'dictionaries';

export interface StoredBibleMeta {
  code: string;
  name: string;
  language: string;
  importedAt: number;
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject('Erro ao abrir banco de dados');

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_VERSES)) {
        const verseStore = db.createObjectStore(STORE_VERSES, { keyPath: 'id' });
        verseStore.createIndex('version', 'version', { unique: false });
        verseStore.createIndex('locator', ['version', 'book', 'chapter'], { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'code' });
      }

      if (!db.objectStoreNames.contains(STORE_CONFESSIONS)) {
        db.createObjectStore(STORE_CONFESSIONS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_HIGHLIGHTS)) {
        db.createObjectStore(STORE_HIGHLIGHTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_CONFESSION_HIGHLIGHTS)) {
        const store = db.createObjectStore(STORE_CONFESSION_HIGHLIGHTS, { keyPath: 'id' });
        store.createIndex('confessionId', 'confessionId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_STUDY_PROGRESS)) {
        db.createObjectStore(STORE_STUDY_PROGRESS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_DICTIONARIES)) {
        const dictStore = db.createObjectStore(STORE_DICTIONARIES, { keyPath: 'id' });
        dictStore.createIndex('word', 'word', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
};

const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const putInStore = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(item);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Fix: Helper function to delete items from indexedDB and return a promise
const deleteFromStore = async (storeName: string, id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const saveDictionaries = async (entries: DictionaryEntry[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_DICTIONARIES], 'readwrite');
    const store = transaction.objectStore(STORE_DICTIONARIES);
    entries.forEach(entry => store.put(entry));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject('Erro ao salvar dicionários');
  });
};

export const searchInDictionary = async (query: string): Promise<DictionaryEntry[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_DICTIONARIES], 'readonly');
    const store = transaction.objectStore(STORE_DICTIONARIES);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as DictionaryEntry[];
      const lower = query.toLowerCase();
      resolve(all.filter(e => e.word.toLowerCase().includes(lower)).slice(0, 20));
    };
    request.onerror = () => resolve([]);
  });
};

export const getStoredVersions = () => getAllFromStore<StoredBibleMeta>(STORE_META);
export const getStoredConfessions = () => getAllFromStore<ConfessionItem>(STORE_CONFESSIONS);
export const getStoredNotes = () => getAllFromStore<Note>(STORE_NOTES);
export const getStoredHighlights = () => getAllFromStore<Highlight>(STORE_HIGHLIGHTS);
export const getStoredConfessionHighlights = () => getAllFromStore<ConfessionHighlight>(STORE_CONFESSION_HIGHLIGHTS);
export const getStoredHistory = () => getAllFromStore<HistoryEntry>(STORE_HISTORY);
export const getStoredDictionaries = () => getAllFromStore<DictionaryEntry>(STORE_DICTIONARIES);

export const saveNote = (note: Note) => putInStore(STORE_NOTES, note);

// Fix: Updated to return a Promise so .then() works in the caller
export const deleteNote = (id: string) => deleteFromStore(STORE_NOTES, id);

export const saveHighlight = (hl: Highlight) => putInStore(STORE_HIGHLIGHTS, hl);

// Fix: Updated to return a Promise so .then() works in the caller
export const deleteHighlight = (id: string) => deleteFromStore(STORE_HIGHLIGHTS, id);

export const saveConfessionHighlight = (hl: ConfessionHighlight) => putInStore(STORE_CONFESSION_HIGHLIGHTS, hl);

// Fix: Updated to return a Promise so .then() works in the caller
export const deleteConfessionHighlight = (id: string) => deleteFromStore(STORE_CONFESSION_HIGHLIGHTS, id);

export const saveBibleVersion = async (meta: StoredBibleMeta, verses: Verse[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_VERSES, STORE_META], 'readwrite');
    const metaStore = transaction.objectStore(STORE_META);
    metaStore.put(meta);
    const verseStore = transaction.objectStore(STORE_VERSES);
    verses.forEach(v => {
      const id = `${meta.code}-${v.book}-${v.chapter}-${v.verse}`;
      verseStore.put({ ...v, id, version: meta.code });
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject('Erro ao salvar Bíblia');
  });
};

export const saveConfessions = async (items: ConfessionItem[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CONFESSIONS], 'readwrite');
    const store = transaction.objectStore(STORE_CONFESSIONS);
    items.forEach(item => store.put(item));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject('Erro ao salvar Confissões');
  });
};

export const addToHistory = (entry: HistoryEntry) => putInStore(STORE_HISTORY, entry);
export const updateStudyProgress = (planId: string, sessionIds: string[]) => putInStore(STORE_STUDY_PROGRESS, { id: planId, completedSessionIds: sessionIds });
export const getStudyProgress = async (planId: string): Promise<string[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_STUDY_PROGRESS], 'readonly');
    const store = transaction.objectStore(STORE_STUDY_PROGRESS);
    const request = store.get(planId);
    request.onsuccess = () => resolve(request.result?.completedSessionIds || []);
    request.onerror = () => resolve([]);
  });
};

export const getStoredChapter = async (version: string, book: string, chapter: number): Promise<Verse[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_VERSES], 'readonly');
    const store = transaction.objectStore(STORE_VERSES);
    const index = store.index('locator');
    const request = index.getAll([version, book, chapter]);
    request.onsuccess = () => resolve((request.result as Verse[]).sort((a, b) => a.verse - b.verse));
    request.onerror = () => reject(request.error);
  });
};

export const searchVerses = async (query: string, version?: string): Promise<Verse[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_VERSES], 'readonly');
    const store = transaction.objectStore(STORE_VERSES);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as Verse[];
      const lower = query.toLowerCase();
      const filtered = all.filter(v => {
        const matchesQuery = v.text.toLowerCase().includes(lower);
        const matchesVersion = version ? v.version === version : true;
        return matchesQuery && matchesVersion;
      });
      resolve(filtered.slice(0, 50)); // Limit to 50 results for performance
    };
    request.onerror = () => resolve([]);
  });
};
