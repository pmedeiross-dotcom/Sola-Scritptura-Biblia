
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Bookmark, Share2, X, Check, Tag, Loader2, BookOpen, ArrowUpDown, Clock, Zap, HelpCircle, Database, FileJson, ShieldCheck, Plus } from 'lucide-react';
import { MOCK_CONFESSIONS } from '../constants';
import { addToHistory, getStoredConfessions, saveConfessionHighlight, getStoredConfessionHighlights, deleteConfessionHighlight } from '../services/db';
import { HistoryEntry, ConfessionItem, ConfessionHighlight } from '../types';
import ImportBibleModal from './ImportBibleModal';

type SortOption = 'recent' | 'popular' | 'alpha';

const ConfessionsReader: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [confessions, setConfessions] = useState<ConfessionItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ id: string, message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [storedConfessions, storedHighlights] = await Promise.all([
      getStoredConfessions(),
      getStoredConfessionHighlights()
    ]);
    
    const uniqueItems = Array.from(new Map([...MOCK_CONFESSIONS, ...storedConfessions].map(item => [item.id, item])).values());
    setConfessions(uniqueItems as ConfessionItem[]);
    setSavedIds(new Set(storedHighlights.map(h => h.confessionId)));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const allSources = useMemo(() => Array.from(new Set(confessions.map(c => c.source))), [confessions]);
  const allTags = useMemo(() => Array.from(new Set(confessions.flatMap(c => c.tags))), [confessions]);

  const handleExpand = (item: ConfessionItem) => {
    if (expandedId !== item.id) {
       setExpandedId(item.id);
       const entry: HistoryEntry = {
         id: `hist-${Date.now()}`,
         type: 'confession',
         reference: `${item.source} - ${item.reference}`,
         timestamp: Date.now()
       };
       addToHistory(entry).catch(console.error);
    } else {
       setExpandedId(null);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, item: ConfessionItem) => {
    e.stopPropagation();
    const isSaved = savedIds.has(item.id);
    
    if (isSaved) {
      const highlights = await getStoredConfessionHighlights();
      const target = highlights.find(h => h.confessionId === item.id);
      if (target) {
        await deleteConfessionHighlight(target.id);
        const newSaved = new Set(savedIds);
        newSaved.delete(item.id);
        setSavedIds(newSaved);
        showFeedback(item.id, 'Removido');
      }
    } else {
      const hl: ConfessionHighlight = {
        id: `ch-${Date.now()}`,
        confessionId: item.id,
        question: item.question || '',
        answer: item.answer,
        source: item.source,
        reference: item.reference,
        createdAt: Date.now()
      };
      await saveConfessionHighlight(hl);
      const newSaved = new Set(savedIds);
      newSaved.add(item.id);
      setSavedIds(newSaved);
      showFeedback(item.id, 'Salvo!');
    }
  };

  const handleShare = async (e: React.MouseEvent, item: ConfessionItem) => {
    e.stopPropagation();
    const title = `${item.source} - ${item.reference}`;
    const text = `*${item.question || 'Confissão'}*\n\n${item.answer}\n\n— ${item.source} (${item.reference})\n\nCompartilhado via Sola Scriptura App`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: text,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(text);
        showFeedback(item.id, 'Copiado para área de transferência!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err);
      }
    }
  };

  const showFeedback = (id: string, message: string) => {
    setFeedback({ id, message });
    setTimeout(() => {
      setFeedback(prev => prev?.id === id ? null : prev);
    }, 2000);
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const filteredAndSortedConfessions = useMemo(() => {
    let result = confessions.filter(c => {
      const matchesSearch = searchTerm === '' ||
        c.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.source.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = selectedSources.length === 0 || selectedSources.includes(c.source);
      const matchesTags = selectedTags.length === 0 || c.tags.some(tag => selectedTags.includes(tag));
      return matchesSearch && matchesSource && matchesTags;
    });

    result.sort((a, b) => {
      if (sortBy === 'recent') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === 'popular') return (b.popularity || 0) - (a.popularity || 0);
      if (sortBy === 'alpha') return (a.question || '').localeCompare(b.question || '');
      return 0;
    });

    return result;
  }, [confessions, searchTerm, selectedSources, selectedTags, sortBy]);

  return (
    <div className="flex flex-col h-full bg-paper-50 dark:bg-navy-900 pb-24 relative">
      {/* Help Modal - Android 14 Style */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-navy-800 w-full max-w-sm rounded-4xl shadow-2xl p-7 border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2 text-petrol-600">
                 <HelpCircle size={24} />
                 <h2 className="text-xl font-serif font-black">Guia de Dados</h2>
               </div>
               <button onClick={() => setShowHelp(false)} className="p-2 bg-gray-100 dark:bg-navy-700 rounded-full active-ripple"><X size={20}/></button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-green-50 dark:bg-green-900/30 text-green-600 p-3 rounded-2xl shrink-0 h-fit">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1 text-gray-900 dark:text-gray-100">Privacidade Local</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Tudo fica no seu celular. Não usamos servidores externos para suas confissões pessoais.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 p-3 rounded-2xl shrink-0 h-fit">
                  <FileJson size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1 text-gray-900 dark:text-gray-100">Estrutura JSON</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">Formato ideal para importação:</p>
                  <pre className="text-[9px] bg-gray-100 dark:bg-navy-950 p-3 rounded-xl overflow-x-auto text-gray-600 dark:text-gray-400 font-mono">
{`[
  {
    "source": "Heidelberg",
    "reference": "P. 1",
    "question": "Seu consolo?",
    "answer": "Cristo...",
    "tags": ["Fé"]
  }
]`}
                  </pre>
                </div>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="w-full mt-8 py-4 bg-petrol-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg active-ripple">Entendido</button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportBibleModal 
          onClose={() => setShowImportModal(false)} 
          onSuccess={() => loadData()} 
        />
      )}

      {/* Sticky Header */}
      <div className="bg-white/90 dark:bg-navy-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 p-4 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-center mb-4">
           <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl font-bold text-petrol-900 dark:text-white">Confissões</h1>
              <button onClick={() => setShowHelp(true)} className="p-1 text-gray-300 hover:text-petrol-500 transition-colors active-ripple"><HelpCircle size={18} /></button>
           </div>
           <div className="flex items-center gap-2">
             <button 
              onClick={() => setShowImportModal(true)}
              className="p-2 bg-petrol-50 dark:bg-navy-800 text-petrol-600 dark:text-petrol-400 rounded-xl active-ripple flex items-center gap-1.5"
             >
               <Plus size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">Importar</span>
             </button>
             {(selectedSources.length > 0 || selectedTags.length > 0 || searchTerm !== '') && (
               <button onClick={() => { setSelectedSources([]); setSelectedTags([]); setSearchTerm(''); }} className="text-[10px] font-black uppercase tracking-widest text-petrol-600 bg-petrol-50 px-2.5 py-1.5 rounded-xl active-ripple">Limpar</button>
             )}
           </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar termo ou fonte..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-navy-800 rounded-2xl py-3.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-petrol-500 dark:text-white border-none shadow-inner" 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-3.5 rounded-2xl transition-all active-ripple ${showFilters || (selectedTags.length > 0) ? 'bg-petrol-600 text-white shadow-lg' : 'bg-white dark:bg-navy-800 text-gray-400 border border-gray-100 dark:border-gray-700 shadow-sm'}`}><Filter size={18} /></button>
        </div>

        {/* Source Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar">
          <button onClick={() => setSelectedSources([])} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 active-ripple ${selectedSources.length === 0 ? 'bg-petrol-600 text-white shadow-md' : 'bg-gray-50 dark:bg-navy-800 text-gray-500'}`}>Todas</button>
          {allSources.sort().map(source => (
            <button key={source} onClick={() => toggleSource(source)} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 active-ripple border ${selectedSources.includes(source) ? 'bg-petrol-100 border-petrol-200 text-petrol-700 dark:bg-petrol-900/40 dark:border-petrol-800 dark:text-petrol-300' : 'bg-white dark:bg-navy-800 border-gray-100 dark:border-gray-700 text-gray-500'}`}>{source}</button>
          ))}
        </div>

        {/* Sorting Chips */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-gray-50 dark:border-gray-800/50">
           <span className="text-[9px] font-black uppercase text-gray-400 shrink-0 tracking-tighter">Ordenar:</span>
           <button onClick={() => setSortBy('popular')} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all shrink-0 active-ripple ${sortBy === 'popular' ? 'bg-gold-500 text-white shadow-md' : 'text-gray-500 bg-gray-50 dark:bg-navy-800'}`}><Zap size={10} /> Popular</button>
           <button onClick={() => setSortBy('recent')} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all shrink-0 active-ripple ${sortBy === 'recent' ? 'bg-petrol-600 text-white shadow-md' : 'text-gray-500 bg-gray-50 dark:bg-navy-800'}`}><Clock size={10} /> Recentes</button>
           <button onClick={() => setSortBy('alpha')} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all shrink-0 active-ripple ${sortBy === 'alpha' ? 'bg-navy-800 text-white shadow-md' : 'text-gray-500 bg-gray-50 dark:bg-navy-800'}`}><ArrowUpDown size={10} /> A-Z</button>
        </div>

        {showFilters && (
          <div className="mt-4 space-y-4 animate-fade-in border-t border-gray-50 dark:border-gray-800 pt-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
            {allTags.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Filtrar por Assuntos</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(t => (
                    <button key={t} onClick={() => toggleTag(t)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all active-ripple ${selectedTags.includes(t) ? 'bg-gold-500 border-gold-500 text-white shadow-sm' : 'bg-white dark:bg-navy-900 text-gray-500 border-gray-200 dark:border-gray-700'}`}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 size={32} className="animate-spin text-petrol-600" /><p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Processando...</p></div>
        ) : filteredAndSortedConfessions.length === 0 ? (
          <div className="text-center py-24 bg-white/50 dark:bg-navy-800/50 rounded-4xl border-2 border-dashed border-gray-200 dark:border-gray-700 mx-4">
             <BookOpen size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
             <p className="text-gray-400 dark:text-gray-500 text-sm font-bold">Nenhum resultado para estes filtros.</p>
          </div>
        ) : (
          filteredAndSortedConfessions.map((item) => {
            const isExpanded = expandedId === item.id;
            const isSaved = savedIds.has(item.id);
            const hasFeedback = feedback?.id === item.id;
            return (
              <div key={item.id} className={`bg-white dark:bg-navy-800 rounded-3xl border transition-all duration-300 overflow-hidden relative ${isExpanded ? 'border-petrol-500 shadow-2xl scale-[1.02] z-10' : 'border-gray-100 dark:border-gray-800 shadow-sm'}`}>
                <div className="p-6 cursor-pointer active:bg-gray-50 dark:active:bg-navy-700 transition-colors" onClick={() => handleExpand(item)}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-white bg-petrol-600 px-2.5 py-1 rounded-lg shadow-sm">{item.source}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.reference}</span>
                    </div>
                    {isSaved && !isExpanded && <Bookmark size={14} className="text-petrol-600 fill-current" />}
                  </div>
                  <h3 className="font-serif font-black text-gray-900 dark:text-white leading-snug text-lg">{item.question}</h3>
                  {!isExpanded && (
                    <div className="mt-4 flex gap-2">
                      {item.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] font-black text-gray-400 border border-gray-100 dark:border-gray-700 px-2 py-0.5 rounded-md uppercase">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                {isExpanded && (
                  <div className="px-6 pb-6 animate-fade-in border-t border-gray-50 dark:border-gray-800/50 mt-1 pt-6">
                    <p className="font-serif text-gray-800 dark:text-gray-200 leading-loose text-justify text-lg italic opacity-95 mb-8">{item.answer}</p>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {item.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gold-600 bg-gold-50 dark:bg-gold-900/20 px-3 py-1.5 rounded-full border border-gold-100 dark:border-gold-900/40"><Tag size={10} /> {tag}</div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-gray-50 dark:border-gray-800">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.popularity && `Popularidade: ${item.popularity}%`}</span>
                      <div className="flex gap-6 relative">
                        {hasFeedback && (
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[11px] font-black text-petrol-600 animate-bounce bg-white dark:bg-navy-800 px-3 py-1 rounded-full shadow-lg border border-petrol-100 dark:border-petrol-900/50 whitespace-nowrap z-20">{feedback.message}</span>
                        )}
                        <button onClick={(e) => toggleFavorite(e, item)} className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all active-ripple ${isSaved ? 'text-petrol-600' : 'text-gray-400'}`}><Bookmark size={16} className={isSaved ? 'fill-current' : ''} /> {isSaved ? 'Salvo' : 'Salvar'}</button>
                        <button onClick={(e) => handleShare(e, item)} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 active-ripple"><Share2 size={16} /> Compartilhar</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConfessionsReader;
