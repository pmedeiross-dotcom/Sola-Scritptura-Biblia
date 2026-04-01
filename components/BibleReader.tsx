
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MessageSquarePlus, Settings, Book, Heart, Check, X, Loader2, Type, Minus, Plus, Pencil, Save, MessageSquare, UploadCloud, LibraryBig, Search, Languages } from 'lucide-react';
import { MOCK_VERSES, BIBLE_BOOKS } from '../constants';
import { getTheologicalInsight, getBibleChapter } from '../services/geminiService';
import { getStoredChapter, getStoredVersions, StoredBibleMeta, addToHistory, saveHighlight, getStoredNotes, saveNote, deleteHighlight, getStoredHighlights, searchInDictionary } from '../services/db';
import { BibleVersion, Verse, HistoryEntry, Highlight, Note, DictionaryEntry } from '../types';
import ImportBibleModal from './ImportBibleModal';

interface BibleReaderProps {
  initialBook?: string;
  initialChapter?: number;
  onNavHandled?: () => void;
}

type FontType = 'serif' | 'sans' | 'mono';

const BibleReader: React.FC<BibleReaderProps> = ({ initialBook, initialChapter, onNavHandled }) => {
  const [chapter, setChapter] = useState(initialChapter || 8);
  const [book, setBook] = useState(initialBook || "Romanos");
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<FontType>('serif');
  const [showSettings, setShowSettings] = useState(false);
  const [isParallel, setIsParallel] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null); 
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const [primaryVersion, setPrimaryVersion] = useState<string>('ARC');
  const [secondaryVersion, setSecondaryVersion] = useState<string>('NA28');
  const [favorites, setFavorites] = useState<string[]>([]); 
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const [showVersionSelector, setShowVersionSelector] = useState<'primary' | 'secondary' | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [customVersions, setCustomVersions] = useState<StoredBibleMeta[]>([]);
  const [primaryContent, setPrimaryContent] = useState<Verse[]>([]);
  const [secondaryContent, setSecondaryContent] = useState<Verse[]>([]);
  const [isLoadingText, setIsLoadingText] = useState(false);

  const [showNav, setShowNav] = useState(false);
  const [navTab, setNavTab] = useState<'AT' | 'NT'>('NT');
  const [selectedBookForNav, setSelectedBookForNav] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 60;

  // Dictionary state
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictSearch, setDictSearch] = useState('');
  const [dictResults, setDictResults] = useState<DictionaryEntry[]>([]);
  const [dictLoading, setDictLoading] = useState(false);

  const triggerToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  };

  const currentBookInfo = useMemo(() => BIBLE_BOOKS.find(b => b.name === book), [book]);
  const maxChapters = currentBookInfo?.chapters ?? 1;

  // Scroll to top when book or chapter changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [book, chapter]);

  const goToPrevChapter = useCallback(() => {
    if (chapter > 1) {
      setChapter(c => c - 1);
    } else {
      // Go to last chapter of previous book
      const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === book);
      if (currentIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentIndex - 1];
        setBook(prevBook.name);
        setChapter(prevBook.chapters);
      }
    }
  }, [book, chapter]);

  const goToNextChapter = useCallback(() => {
    if (chapter < maxChapters) {
      setChapter(c => c + 1);
    } else {
      // Go to first chapter of next book
      const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === book);
      if (currentIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentIndex + 1];
        setBook(nextBook.name);
        setChapter(1);
      }
    }
  }, [book, chapter, maxChapters]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) goToNextChapter();
      else goToPrevChapter();
    }
    touchStartX.current = null;
  }, [goToNextChapter, goToPrevChapter]);

  const refreshVersions = async () => {
    try {
      const versions = await getStoredVersions();
      setCustomVersions(versions);
    } catch (e) {
      console.error("Erro ao carregar versões:", e);
    }
  };

  useEffect(() => {
    if (showVersionSelector) refreshVersions();
  }, [showVersionSelector]);

  useEffect(() => {
    if (initialBook && initialChapter) {
      setBook(initialBook);
      setChapter(initialChapter);
      onNavHandled?.();
    }
  }, [initialBook, initialChapter]);

  const handleBookSelect = (bookName: string) => {
    setSelectedBookForNav(bookName);
  };

  const handleChapterSelect = (chapNum: number) => {
    if (selectedBookForNav) {
      setBook(selectedBookForNav);
      setChapter(chapNum);
      setShowNav(false);
      setSelectedBookForNav(null);
    }
  };

  useEffect(() => {
    loadNotes();
    loadFavorites();
    refreshVersions();
    
    const savedSize = localStorage.getItem('bible-font-size');
    if (savedSize) setFontSize(parseInt(savedSize));
    
    const savedFont = localStorage.getItem('bible-font-family') as FontType;
    if (savedFont) setFontFamily(savedFont);
  }, []);

  useEffect(() => {
    if (showDictionary) {
      handleDictSearch();
    }
  }, [dictSearch]);

  const loadNotes = async () => {
    const notes = await getStoredNotes();
    setAllNotes(notes);
  };

  const loadFavorites = async () => {
    const hl = await getStoredHighlights();
    setFavorites(hl.map(h => h.verseKey));
  };

  useEffect(() => {
    const entry: HistoryEntry = {
      id: `hist-${Date.now()}`,
      type: 'bible',
      reference: `${book} ${chapter}`,
      timestamp: Date.now()
    };
    addToHistory(entry).catch(console.error);
  }, [book, chapter]);

  useEffect(() => {
    localStorage.setItem('bible-font-size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('bible-font-family', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoadingText(true);
      const fetchVersionText = async (vCode: string): Promise<Verse[]> => {
        const local = MOCK_VERSES.filter(v => v.book === book && v.chapter === chapter && v.version === vCode);
        if (local.length > 0) return local;
        try {
          const stored = await getStoredChapter(vCode, book, chapter);
          if (stored && stored.length > 0) return stored;
        } catch (e) { console.error(e); }
        const standardVersions = ['ARC', 'ARA', 'NVT', 'KJV', 'NA28', 'BHS'];
        if (standardVersions.includes(vCode)) {
          return await getBibleChapter(book, chapter, vCode as BibleVersion);
        }
        return [];
      };
      const pText = await fetchVersionText(primaryVersion);
      setPrimaryContent(pText);
      if (isParallel) {
        const sText = await fetchVersionText(secondaryVersion);
        setSecondaryContent(sText);
      }
      setIsLoadingText(false);
    };
    loadContent();
  }, [book, chapter, primaryVersion, secondaryVersion, isParallel]);

  const getVerseKey = (v: { book: string, chapter: number, verse: number }) => `${v.book}-${v.chapter}-${v.verse}`;
  const getVerseReference = (v: Verse) => `${v.book} ${v.chapter}:${v.verse}`;

  const handleVerseClick = (vKey: string, verseObj: Verse) => {
    if (selectedVerse === vKey) {
      setSelectedVerse(null);
      setAiInsight(null);
      setIsEditingNote(false);
    } else {
      setSelectedVerse(vKey);
      setAiInsight(null);
      setIsEditingNote(false);
      const ref = getVerseReference(verseObj);
      const existingNote = allNotes.find(n => n.reference === ref);
      setCurrentNoteText(existingNote?.content || "");
    }
  };

  const toggleFavorite = async (v: Verse) => {
    const vKey = getVerseKey(v);
    if (favorites.includes(vKey)) {
       const hl = await getStoredHighlights();
       const target = hl.find(h => h.verseKey === vKey);
       if (target) {
         await deleteHighlight(target.id);
         setFavorites(prev => prev.filter(k => k !== vKey));
         triggerToast("Removido dos favoritos");
       }
    } else {
       const hl: Highlight = {
         id: `hl-${Date.now()}`,
         verseKey: vKey,
         text: v.text,
         reference: `${v.book} ${v.chapter}:${v.verse} (${v.version})`,
         createdAt: Date.now()
       };
       await saveHighlight(hl);
       setFavorites(prev => [...prev, vKey]);
       triggerToast("Versículo favoritado!");
    }
  };

  const handleSavePersonalNote = async (verseObj: Verse) => {
    const ref = getVerseReference(verseObj);
    const existingNote = allNotes.find(n => n.reference === ref);
    const note: Note = {
      id: existingNote?.id || `note-${Date.now()}`,
      title: existingNote?.title || `Nota sobre ${ref}`,
      content: currentNoteText,
      reference: ref,
      createdAt: Date.now()
    };
    await saveNote(note);
    await loadNotes();
    setIsEditingNote(false);
    triggerToast("Anotação salva!");
  };

  const requestInsight = async (text: string) => {
    setLoadingAi(true);
    const insight = await getTheologicalInsight(
      `Explique teologicamente o versículo: "${text}" à luz da teologia reformada. Se houver termos no original (Grego/Hebraico) relevantes, mencione. Seja breve.`,
      'biblical'
    );
    setAiInsight(insight);
    setLoadingAi(false);
  };

  const handleDictSearch = async () => {
    if (!dictSearch.trim()) {
      setDictResults([]);
      return;
    }
    setDictLoading(true);
    const res = await searchInDictionary(dictSearch);
    setDictResults(res);
    setDictLoading(false);
  };

  const isRTL = (ver: string) => ver === 'BHS';
  
  const getFontSettings = (ver: string) => {
    // Aplicação dinâmica da tipografia selecionada
    const familyClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
    
    // Tratamento especial para línguas originais
    if (ver === 'BHS') return { className: 'font-serif leading-loose text-right font-medium tracking-wide', scale: 1.25 };
    if (ver === 'NA28') return { className: 'font-serif leading-relaxed tracking-wide', scale: 1.0 };
    
    return { className: `${familyClass} leading-loose text-left`, scale: 1.0 };
  };

  const allAvailableVersions = useMemo(() => [
    { code: 'ARC', label: 'Almeida Revista e Corrigida', type: 'system' },
    { code: 'ARA', label: 'Almeida Revista e Atualizada', type: 'system' },
    { code: 'NVT', label: 'Nova Versão Transformadora', type: 'system' },
    { code: 'KJV', label: 'King James Version', type: 'system' },
    { code: 'NA28', label: 'Nestle-Aland 28 (Grego)', type: 'system' },
    { code: 'BHS', label: 'Biblia Hebraica (Hebraico)', type: 'system' },
    ...customVersions.map(cv => ({ code: cv.code, label: cv.name, type: 'custom' }))
  ], [customVersions]);

  return (
    <div className="flex flex-col h-full bg-paper-50 dark:bg-navy-900 relative">
      {/* Toast Feedback */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 pointer-events-none ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'}`}>
        <div className="bg-navy-900/90 dark:bg-petrol-600/90 text-white px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3">
          <Check size={16} className="text-petrol-400 dark:text-white" />
          <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      </div>

      {/* Version Selection Modal */}
      {showVersionSelector && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={() => setShowVersionSelector(null)}>
          <div className="bg-white dark:bg-navy-900 w-full max-w-sm rounded-t-4xl sm:rounded-4xl shadow-2xl flex flex-col max-h-[70vh] animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-serif font-black text-petrol-900 dark:text-white">Selecione a Versão</h3>
              <button onClick={() => setShowVersionSelector(null)} className="p-2 bg-gray-50 dark:bg-navy-800 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {allAvailableVersions.map(v => (
                <button
                  key={v.code}
                  onClick={() => {
                    if (showVersionSelector === 'primary') setPrimaryVersion(v.code);
                    else setSecondaryVersion(v.code);
                    setShowVersionSelector(null);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    (showVersionSelector === 'primary' ? primaryVersion === v.code : secondaryVersion === v.code)
                      ? 'bg-petrol-50 border-petrol-200 dark:bg-petrol-900/30 dark:border-petrol-800 text-petrol-700 dark:text-petrol-300'
                      : 'bg-white dark:bg-navy-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div className="text-left">
                    <span className="block font-black text-xs uppercase tracking-widest">{v.code}</span>
                    <span className="text-sm font-medium opacity-70">{v.label}</span>
                  </div>
                  {v.type === 'custom' && <UploadCloud size={14} className="text-gray-300" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dictionary Drawer */}
      {showDictionary && (
        <div className="absolute inset-0 z-[90] bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowDictionary(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-[85%] bg-white dark:bg-navy-900 shadow-2xl flex flex-col pt-safe animate-fade-in-right" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                 <h2 className="text-lg font-serif font-black text-petrol-900 dark:text-white flex items-center gap-2">
                   <LibraryBig size={20} className="text-petrol-600" /> Dicionário
                 </h2>
                 <button onClick={() => setShowDictionary(false)} className="p-2 bg-gray-50 dark:bg-navy-800 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-4 bg-white dark:bg-navy-900 sticky top-0 z-10">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar termo..." 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-navy-800 border-none rounded-2xl text-sm"
                    value={dictSearch}
                    onChange={e => setDictSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {dictLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-petrol-600" /></div>
                ) : dictResults.length === 0 ? (
                  <div className="text-center py-20">
                     <LibraryBig size={40} className="mx-auto text-gray-100 dark:text-gray-800 mb-3" />
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{dictSearch ? 'Nenhum resultado' : 'Importe um dicionário'}</p>
                  </div>
                ) : (
                  dictResults.map(entry => (
                    <div key={entry.id} className="bg-white dark:bg-navy-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                       <h3 className="font-bold text-petrol-700 dark:text-petrol-400 text-lg mb-2">{entry.word}</h3>
                       <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">{entry.definition}</p>
                       <div className="mt-3 text-[9px] font-black uppercase tracking-widest text-gray-400">{entry.source}</div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      )}

      {/* Navigation Modal */}
      {showNav && (
        <div className="absolute inset-0 z-[70] bg-white dark:bg-navy-900 animate-fade-in flex flex-col pt-safe">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-navy-900 sticky top-0 z-20">
             {selectedBookForNav ? (
               <button onClick={() => setSelectedBookForNav(null)} className="flex items-center gap-1 text-gray-500 hover:text-petrol-600">
                 <ChevronLeft size={20} /> <span className="text-sm font-bold">Voltar aos Livros</span>
               </button>
             ) : (
               <h2 className="text-xl font-serif font-black text-petrol-900 dark:text-white">Navegar na Bíblia</h2>
             )}
             <button onClick={() => { setShowNav(false); setSelectedBookForNav(null); }} className="p-2 rounded-full bg-gray-50 dark:bg-navy-800 text-gray-500">
               <X size={20} />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedBookForNav ? (
              <div className="p-5 pb-32">
                <div className="flex bg-gray-100 dark:bg-navy-800 p-1.5 rounded-2xl mb-8 sticky top-2 z-10 shadow-sm">
                  {(['AT', 'NT'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setNavTab(tab)}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                        navTab === tab 
                          ? 'bg-white dark:bg-navy-700 text-petrol-700 dark:text-white shadow-md scale-[1.02]' 
                          : 'text-gray-400'
                      }`}
                    >
                      {tab === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {BIBLE_BOOKS.filter(b => b.test === navTab).map(b => (
                    <button 
                      key={b.name}
                      onClick={() => handleBookSelect(b.name)}
                      className="text-center px-2 py-5 rounded-2xl bg-white dark:bg-navy-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:border-petrol-200 active:scale-95 transition-all"
                    >
                      <span className="font-serif text-xs font-black text-gray-800 dark:text-gray-200 block truncate">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center mb-10">
                  <h3 className="font-serif text-3xl font-black text-petrol-900 dark:text-white mb-2">
                    {selectedBookForNav}
                  </h3>
                  <div className="h-1 w-12 bg-petrol-500 mx-auto rounded-full" />
                </div>
                <div className="grid grid-cols-5 gap-4">
                   {Array.from({ length: BIBLE_BOOKS.find(b => b.name === selectedBookForNav)?.chapters || 0 }, (_, i) => i + 1).map(chapNum => (
                     <button
                       key={chapNum}
                       onClick={() => handleChapterSelect(chapNum)}
                       className={`aspect-square rounded-full flex items-center justify-center font-bold text-base transition-all active:scale-90
                         ${(book === selectedBookForNav && chapter === chapNum)
                           ? 'bg-petrol-600 text-white shadow-xl scale-110' 
                           : 'bg-gray-50 dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
                         }
                       `}
                     >
                       {chapNum}
                     </button>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white/95 dark:bg-navy-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between z-10 sticky top-0">
         <div className="flex-1 flex items-center">
            <button 
              onClick={() => setShowVersionSelector('primary')}
              className="flex items-center gap-2 px-3 py-1.5 bg-petrol-50 dark:bg-navy-800 rounded-full border border-petrol-100 dark:border-navy-700 shadow-sm active:scale-95 transition-all active-ripple"
            >
              <Languages size={14} className="text-petrol-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-petrol-900 dark:text-petrol-400">
                {primaryVersion} {isParallel && <span className="mx-0.5 opacity-30 text-gray-400">|</span>} {isParallel && secondaryVersion}
              </span>
            </button>
         </div>

         <div className="flex-[2] flex items-center justify-center gap-1">
            <button onClick={goToPrevChapter} className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-full text-gray-400 active-ripple"><ChevronLeft size={20} /></button>
            <div 
              onClick={() => { setShowNav(true); setSelectedBookForNav(null); }}
              className="flex flex-col items-center cursor-pointer px-4 py-1.5 rounded-2xl transition-all hover:bg-petrol-50 dark:hover:bg-navy-800 active:scale-95"
            >
              <span className="font-serif font-black text-gray-900 dark:text-white text-base leading-none">
                {book} {chapter} - ARC
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-300 dark:text-gray-600 mt-1">Navegar</span>
            </div>
            <button onClick={goToNextChapter} className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-full text-gray-400 active-ripple"><ChevronRight size={20} /></button>
         </div>

         <div className="flex-1 flex items-center justify-end gap-0.5">
            <button onClick={() => setShowImportModal(true)} className="p-2.5 rounded-xl transition-all active-ripple text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800" title="Importar Bíblia"><UploadCloud size={18} /></button>
            <button onClick={() => setShowDictionary(!showDictionary)} className={`p-2.5 rounded-xl transition-all active-ripple ${showDictionary ? 'bg-gold-100 text-gold-700' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800'}`} title="Dicionário"><LibraryBig size={18} /></button>
            <button onClick={() => setIsParallel(!isParallel)} className={`p-2.5 rounded-xl transition-all active-ripple ${isParallel ? 'bg-petrol-100 text-petrol-700 dark:bg-petrol-900/50 dark:text-petrol-300' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800'}`} title="Modo Paralelo"><Book size={18} /></button>
            <button onClick={() => setShowSettings(!showSettings)} className={`p-2.5 rounded-xl transition-all active-ripple ${showSettings ? 'bg-petrol-100 text-petrol-700 dark:bg-petrol-900/50' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800'}`} title="Configurações"><Settings size={18} /></button>
         </div>
      </div>

      {/* Settings Panel com Seleção de Fonte */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-40 bg-white dark:bg-navy-800 p-5 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-64 animate-fade-in-down">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Personalização</h4>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                 <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Tamanho</span>
                 <span className="text-xs font-mono bg-gray-100 dark:bg-navy-900 px-1.5 py-0.5 rounded text-petrol-600">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="p-2 bg-gray-50 dark:bg-navy-900 rounded-xl text-gray-500"><Minus size={16} /></button>
                <input type="range" min="12" max="36" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none accent-petrol-600" />
                <button onClick={() => setFontSize(Math.min(36, fontSize + 1))} className="p-2 bg-gray-50 dark:bg-navy-900 rounded-xl text-gray-500"><Plus size={16} /></button>
              </div>
            </div>

            {/* Seletor de Tipo de Fonte */}
            <div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-3 block">Tipo de Fonte</span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setFontFamily('serif')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${fontFamily === 'serif' ? 'bg-petrol-50 border-petrol-200 text-petrol-600 dark:bg-petrol-900/30' : 'bg-gray-50 dark:bg-navy-900 border-gray-100 dark:border-gray-800 text-gray-400'}`}
                >
                  <span className="font-serif text-lg leading-none">Aa</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest">Serif</span>
                </button>
                <button 
                  onClick={() => setFontFamily('sans')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${fontFamily === 'sans' ? 'bg-petrol-50 border-petrol-200 text-petrol-600 dark:bg-petrol-900/30' : 'bg-gray-50 dark:bg-navy-900 border-gray-100 dark:border-gray-800 text-gray-400'}`}
                >
                  <span className="font-sans text-lg leading-none">Aa</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest">Sans</span>
                </button>
                <button 
                  onClick={() => setFontFamily('mono')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${fontFamily === 'mono' ? 'bg-petrol-50 border-petrol-200 text-petrol-600 dark:bg-petrol-900/30' : 'bg-gray-50 dark:bg-navy-900 border-gray-100 dark:border-gray-800 text-gray-400'}`}
                >
                  <span className="font-mono text-lg leading-none">Aa</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest">Mono</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Reader View */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-32" onClick={() => { setShowSettings(false); }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className={`mx-auto ${isParallel ? 'w-full max-w-6xl' : 'max-w-2xl'}`}>
          {isLoadingText ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 size={40} className="text-petrol-600 animate-spin" /><p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Invocando o Texto...</p></div>
          ) : (
            <div className="space-y-4">
              {primaryContent.map((verse) => {
                const vKey = getVerseKey(verse);
                const isSelected = selectedVerse === vKey;
                const isFav = favorites.includes(vKey);
                const secondaryVerseText = secondaryContent.find(v => v.verse === verse.verse)?.text;
                const pStyle = getFontSettings(primaryVersion);
                const sStyle = getFontSettings(secondaryVersion);
                const ref = getVerseReference(verse);
                const hasNote = allNotes.some(n => n.reference === ref);

                return (
                  <div key={vKey} className={`relative rounded-3xl transition-all duration-300 ${isSelected ? 'bg-white dark:bg-navy-800 shadow-2xl ring-1 ring-petrol-500/10 p-6 my-6 -mx-2 z-10' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}>
                    <div className={`grid ${isParallel ? 'grid-cols-1 md:grid-cols-2 gap-4 md:gap-8' : 'grid-cols-1'}`}>
                       <div className="pl-8 relative">
                         <span className={`text-[10px] font-black absolute left-0 top-1.5 w-6 text-gray-300 transition-colors ${isFav ? 'text-gold-500' : ''}`}>{verse.verse}</span>
                         <p onClick={() => handleVerseClick(vKey, verse)} dir={isRTL(primaryVersion) ? "rtl" : "ltr"} className={`${pStyle.className} text-gray-900 dark:text-gray-100 cursor-pointer selection:bg-petrol-500/20`} style={{ fontSize: `${fontSize * pStyle.scale}px` }}>{verse.text}</p>
                         {hasNote && !isSelected && (
                           <div className="absolute right-0 top-0 text-petrol-500 opacity-60">
                             <MessageSquare size={12} fill="currentColor" />
                           </div>
                         )}
                       </div>
                       {isParallel && (
                         <div className="pl-8 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0">
                            {secondaryVerseText ? (
                              <p onClick={() => handleVerseClick(vKey, verse)} dir={isRTL(secondaryVersion) ? "rtl" : "ltr"} className={`${sStyle.className} text-gray-500 dark:text-gray-400 cursor-pointer italic`} style={{ fontSize: `${fontSize * sStyle.scale}px` }}>{secondaryVerseText}</p>
                            ) : <span className="text-[10px] text-gray-300 italic">Omissão na versão secundária</span>}
                         </div>
                       )}
                    </div>
                    {isSelected && (
                      <div className="mt-6 flex flex-wrap gap-3 animate-fade-in pl-8 border-t border-gray-100 dark:border-gray-800 pt-5">
                        <button onClick={() => toggleFavorite(verse)} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all active:scale-95 ${isFav ? 'bg-gold-50 border-gold-200 text-gold-600' : 'bg-white dark:bg-navy-700 border-gray-200 dark:border-gray-600 text-gray-600'}`}><Heart size={14} fill={isFav ? "currentColor" : "none"} /> {isFav ? 'Salvo' : 'Favoritar'}</button>
                        <button onClick={() => setIsEditingNote(!isEditingNote)} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all active:scale-95 ${hasNote ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white dark:bg-navy-700 border-gray-200 dark:border-gray-600 text-gray-600'}`}><Pencil size={14} /> {hasNote ? 'Editar Nota' : 'Anotar'}</button>
                        <button onClick={() => requestInsight(verse.text)} className="flex items-center gap-2 px-5 py-2.5 bg-petrol-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg hover:bg-petrol-700 active:scale-95 transition-all"><MessageSquarePlus size={14} /> {loadingAi ? 'Analisando...' : 'Insight Gemini'}</button>
                      </div>
                    )}
                    {isSelected && isEditingNote && (
                      <div className="mt-5 ml-8 bg-gray-50 dark:bg-navy-900 rounded-3xl p-5 animate-fade-in border border-blue-100 dark:border-blue-900/30">
                        <textarea autoFocus value={currentNoteText} onChange={(e) => setCurrentNoteText(e.target.value)} placeholder="Reflexão pessoal..." className="w-full h-24 bg-transparent border-none focus:ring-0 text-sm font-serif italic text-gray-700 dark:text-gray-300 resize-none" />
                        <div className="mt-3 flex justify-end"><button onClick={() => handleSavePersonalNote(verse)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-md"><Save size={14} /> Salvar</button></div>
                      </div>
                    )}
                    {isSelected && aiInsight && (
                       <div className="mt-4 mx-8 p-5 bg-petrol-50 dark:bg-navy-900/50 rounded-3xl text-sm leading-relaxed animate-fade-in border border-petrol-100 dark:border-petrol-900">
                          <h4 className="font-black text-petrol-700 dark:text-petrol-300 mb-3 flex items-center gap-2 text-[9px] uppercase tracking-widest"><MessageSquarePlus size={14} /> Comentário Teológico</h4>
                          <div className="font-serif italic text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\n/g, '<br/>') }} />
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showImportModal && (
        <ImportBibleModal 
          onClose={() => setShowImportModal(false)} 
          onSuccess={() => {
            refreshVersions();
            triggerToast("Bíblia importada com sucesso!");
          }} 
        />
      )}
    </div>
  );
};

export default BibleReader;
