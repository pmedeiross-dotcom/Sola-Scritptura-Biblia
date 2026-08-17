/**
 * Database Service - IndexedDB abstraction layer
 * Gerencia armazenamento local de versões bíblicas, dicionários Strong e confissões
 */

interface BibleChapter {
  version: string;
  book: string;
  chapter: number;
  verses: Array<{ verse: number; text: string }>;
}

interface BibleVersion {
  code: string;
  name: string;
  language: string;
  importedAt: number;
}

interface StrongDictionary {
  code: string;
  word: string;
  definition: string;
}

interface StoredConfession {
  id: string;
  source: string;
  reference: string;
  question?: string;
  answer: string;
}

const DB_NAME = 'SolaScriptura';
const DB_VERSION = 1;

const STORES = {
  CHAPTERS: 'chapters',
  VERSIONS: 'versions',
  DICTIONARIES: 'dictionaries',
  CONFESSIONS: 'confessions',
  NOTES: 'notes',
};

let db: IDBDatabase | null = null;

/**
 * Inicializa conexão com IndexedDB
 */
export const initDB = async (): Promise<IDBDatabase> => {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Chapters store: [version:book:chapter]
      if (!database.objectStoreNames.contains(STORES.CHAPTERS)) {
        const chaptersStore = database.createObjectStore(STORES.CHAPTERS, { keyPath: 'id' });
        chaptersStore.createIndex('version', 'version', { unique: false });
        chaptersStore.createIndex('book', 'book', { unique: false });
        chaptersStore.createIndex('versionBookChapter', ['version', 'book', 'chapter'], { unique: true });
      }

      // Versions store
      if (!database.objectStoreNames.contains(STORES.VERSIONS)) {
        database.createObjectStore(STORES.VERSIONS, { keyPath: 'code' });
      }

      // Dictionaries store
      if (!database.objectStoreNames.contains(STORES.DICTIONARIES)) {
        const dictStore = database.createObjectStore(STORES.DICTIONARIES, { keyPath: 'code' });
        dictStore.createIndex('word', 'word', { unique: false });
      }

      // Confessions store
      if (!database.objectStoreNames.contains(STORES.CONFESSIONS)) {
        database.createObjectStore(STORES.CONFESSIONS, { keyPath: 'id' });
      }

      // Notes store
      if (!database.objectStoreNames.contains(STORES.NOTES)) {
        database.createObjectStore(STORES.NOTES, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Salva capítulo bíblico no IndexedDB
 */
export const saveChapterToIndexedDB = async (
  version: string,
  book: string,
  chapter: number,
  verses: Array<{ verse: number; text: string }>
): Promise<void> => {
  const database = await initDB();
  const tx = database.transaction([STORES.CHAPTERS], 'readwrite');
  const store = tx.objectStore(STORES.CHAPTERS);

  const id = `${version}:${book}:${chapter}`;
  const data: BibleChapter = { version, book, chapter, verses };

  return new Promise((resolve, reject) => {
    const request = store.put({ ...data, id });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Recupera capítulo bíblico do IndexedDB
 */
export const getStoredChapter = async (
  version: string,
  book: string,
  chapter: number
): Promise<Array<{ verse: number; text: string }>> => {
  try {
    const database = await initDB();
    const tx = database.transaction([STORES.CHAPTERS], 'readonly');
    const store = tx.objectStore(STORES.CHAPTERS);
    const index = store.index('versionBookChapter');

    return new Promise((resolve, reject) => {
      const request = index.get([version, book, chapter]);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.verses || []);
      };
    });
  } catch (error) {
    console.error('Erro ao recuperar capítulo do IndexedDB:', error);
    return [];
  }
};

/**
 * Lista todas as versões bíblicas armazenadas
 */
export const getStoredVersions = async (): Promise<BibleVersion[]> => {
  try {
    const database = await initDB();
    const tx = database.transaction([STORES.VERSIONS], 'readonly');
    const store = tx.objectStore(STORES.VERSIONS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  } catch (error) {
    console.error('Erro ao recuperar versões:', error);
    return [];
  }
};

/**
 * Salva versão bíblica
 */
export const saveVersion = async (version: BibleVersion): Promise<void> => {
  const database = await initDB();
  const tx = database.transaction([STORES.VERSIONS], 'readwrite');
  const store = tx.objectStore(STORES.VERSIONS);

  return new Promise((resolve, reject) => {
    const request = store.put(version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Recupera dicionário Strong do IndexedDB
 */
export const getStoredDictionaries = async (): Promise<StrongDictionary[]> => {
  try {
    const database = await initDB();
    const tx = database.transaction([STORES.DICTIONARIES], 'readonly');
    const store = tx.objectStore(STORES.DICTIONARIES);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  } catch (error) {
    console.error('Erro ao recuperar dicionário Strong:', error);
    return [];
  }
};

/**
 * Salva dicionário Strong
 */
export const saveDictionary = async (entry: StrongDictionary): Promise<void> => {
  const database = await initDB();
  const tx = database.transaction([STORES.DICTIONARIES], 'readwrite');
  const store = tx.objectStore(STORES.DICTIONARIES);

  return new Promise((resolve, reject) => {
    const request = store.put(entry);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Recupera confissões armazenadas
 */
export const getStoredConfessions = async (): Promise<StoredConfession[]> => {
  try {
    const database = await initDB();
    const tx = database.transaction([STORES.CONFESSIONS], 'readonly');
    const store = tx.objectStore(STORES.CONFESSIONS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  } catch (error) {
    console.error('Erro ao recuperar confissões:', error);
    return [];
  }
};

/**
 * Salva confissão
 */
export const saveConfession = async (confession: StoredConfession): Promise<void> => {
  const database = await initDB();
  const tx = database.transaction([STORES.CONFESSIONS], 'readwrite');
  const store = tx.objectStore(STORES.CONFESSIONS);

  return new Promise((resolve, reject) => {
    const request = store.put(confession);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Exporta todos os dados do usuário
 */
export const exportUserData = async (): Promise<{
  chapters: BibleChapter[];
  versions: BibleVersion[];
  dictionaries: StrongDictionary[];
  confessions: StoredConfession[];
  exportedAt: number;
}> => {
  const database = await initDB();
  const tx = database.transaction(
    [STORES.CHAPTERS, STORES.VERSIONS, STORES.DICTIONARIES, STORES.CONFESSIONS],
    'readonly'
  );

  const getStore = (storeName: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(storeName).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  };

  const [chapters, versions, dictionaries, confessions] = await Promise.all([
    getStore(STORES.CHAPTERS),
    getStore(STORES.VERSIONS),
    getStore(STORES.DICTIONARIES),
    getStore(STORES.CONFESSIONS),
  ]);

  return {
    chapters,
    versions,
    dictionaries,
    confessions,
    exportedAt: Date.now(),
  };
};

/**
 * Importa dados do usuário
 */
export const importUserData = async (data: {
  chapters?: BibleChapter[];
  versions?: BibleVersion[];
  dictionaries?: StrongDictionary[];
  confessions?: StoredConfession[];
}): Promise<void> => {
  const database = await initDB();
  const tx = database.transaction(
    [STORES.CHAPTERS, STORES.VERSIONS, STORES.DICTIONARIES, STORES.CONFESSIONS],
    'readwrite'
  );

  const saveToStore = async (storeName: string, items: any[]): Promise<void> => {
    if (!items || items.length === 0) return;

    const store = tx.objectStore(storeName);
    for (const item of items) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(item);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  };

  await Promise.all([
    saveToStore(STORES.CHAPTERS, data.chapters || []),
    saveToStore(STORES.VERSIONS, data.versions || []),
    saveToStore(STORES.DICTIONARIES, data.dictionaries || []),
    saveToStore(STORES.CONFESSIONS, data.confessions || []),
  ]);
};

/**
 * Limpa todos os dados (reset)
 */
export const clearAllData = async (): Promise<void> => {
  const database = await initDB();
  const tx = database.transaction(
    [STORES.CHAPTERS, STORES.VERSIONS, STORES.DICTIONARIES, STORES.CONFESSIONS, STORES.NOTES],
    'readwrite'
  );

  const storeNames = [STORES.CHAPTERS, STORES.VERSIONS, STORES.DICTIONARIES, STORES.CONFESSIONS, STORES.NOTES];
  for (const storeName of storeNames) {
    await new Promise<void>((resolve, reject) => {
      const request = tx.objectStore(storeName).clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
};

/**
 * Obtém estatísticas de armazenamento
 */
export const getStorageStats = async (): Promise<{
  chaptersCount: number;
  versionsCount: number;
  dictionariesCount: number;
  confessionsCount: number;
}> => {
  const database = await initDB();
  const tx = database.transaction(
    [STORES.CHAPTERS, STORES.VERSIONS, STORES.DICTIONARIES, STORES.CONFESSIONS],
    'readonly'
  );

  const countStore = (storeName: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(storeName).count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || 0);
    });
  };

  const [chaptersCount, versionsCount, dictionariesCount, confessionsCount] = await Promise.all([
    countStore(STORES.CHAPTERS),
    countStore(STORES.VERSIONS),
    countStore(STORES.DICTIONARIES),
    countStore(STORES.CONFESSIONS),
  ]);

  return {
    chaptersCount,
    versionsCount,
    dictionariesCount,
    confessionsCount,
  };
};
