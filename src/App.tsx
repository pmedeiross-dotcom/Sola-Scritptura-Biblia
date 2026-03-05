import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { 
  Book, 
  Search, 
  History, 
  Settings as SettingsIcon, 
  ChevronRight, 
  Moon, 
  Sun, 
  Share2, 
  MessageSquare,
  Sparkles,
  Library,
  Home as HomeIcon,
  X,
  Menu,
  Type,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bookmark,
  Highlighter,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { getGeminiResponse } from './services/geminiService';
import { getBibleContent, getTheologicalAnalysis, searchBible, generateReadingPlan, BOOKS, BibleContent } from './services/bibleService';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Screen = 'home' | 'bible' | 'study' | 'confessions' | 'library' | 'settings' | 'reading-plans';

interface Confession {
  id: string;
  title: string;
  year: string;
  description: string;
  content: string;
}

interface ReadingPlan {
  id: string;
  title: string;
  progress: number;
  days: number;
  currentDay: number;
}

// --- Mock Data ---
const CONFESSIONS: Confession[] = [
  {
    id: 'westminster',
    title: 'Confissão de Fé de Westminster',
    year: '1647',
    description: 'O padrão doutrinário fundamental das igrejas presbiterianas.',
    content: '# Capítulo I - Das Escrituras Sagradas\n\n1. Ainda que a luz da natureza e as obras da criação e da providência manifestem de tal modo a bondade, a sabedoria e o poder de Deus, que deixam os homens inescusáveis, contudo, não são suficientes para dar aquele conhecimento de Deus e da sua vontade, que é necessário para a salvação...'
  },
  {
    id: 'heidelberg',
    title: 'Catecismo de Heidelberg',
    year: '1563',
    description: 'Um dos documentos mais amados da Reforma, focado no consolo cristão.',
    content: '# Pergunta 1: Qual é o teu único consolo, na vida e na morte?\n\nResposta: Que eu, de corpo e alma, tanto na vida como na morte, não pertenço a mim mesmo, mas ao meu fiel Salvador Jesus Cristo...'
  },
  {
    id: 'belgica',
    title: 'Confissão Belga',
    year: '1561',
    description: 'Uma exposição sistemática da fé reformada escrita por Guido de Brès.',
    content: '# Artigo 1: Há um só Deus\n\nTodos nós cremos com o coração e confessamos com a boca que há um só e único Ser espiritual, ao qual chamamos Deus...'
  }
];

const READING_PLANS: ReadingPlan[] = [
  { id: 'year', title: 'Bíblia em um Ano', progress: 35, days: 365, currentDay: 128 },
  { id: 'reformation', title: 'Teologia da Reforma', progress: 60, days: 30, currentDay: 18 },
  { id: 'psalms', title: 'Sabedoria dos Salmos', progress: 10, days: 150, currentDay: 15 }
];

// --- Components ---

const BottomNav = ({ active, onChange }: { active: Screen, onChange: (s: Screen) => void }) => {
  const items = [
    { id: 'home', icon: HomeIcon, label: 'Início' },
    { id: 'bible', icon: Book, label: 'Bíblia' },
    { id: 'study', icon: Sparkles, label: 'Estudo' },
    { id: 'confessions', icon: Library, label: 'Símbolos' },
    { id: 'library', icon: Bookmark, label: 'Notas' },
    { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(5);
                onChange(item.id as Screen);
              }}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all relative",
                isActive ? "text-petrol-500 dark:text-petrol-100" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-1 w-8 h-1 bg-petrol-500 dark:bg-petrol-100 rounded-full"
                />
              )}
              <item.icon className={cn("w-5 h-5 mb-1 transition-transform", isActive && "scale-110")} />
              <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const Header = ({ title, showBack, onBack, actions }: { title: string, showBack?: boolean, onBack?: () => void, actions?: React.ReactNode }) => (
  <header className="sticky top-0 left-0 right-0 bg-paper-50/80 dark:bg-navy-900/80 backdrop-blur-xl z-40 pt-safe border-b border-gray-200/50 dark:border-gray-800/50">
    <div className="h-16 flex items-center px-4 max-w-4xl mx-auto justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-lg font-bold tracking-tight text-petrol-900 dark:text-white truncate max-w-[200px]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </div>
  </header>
);

// --- Screens ---

const HomeScreen = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => {
  const [verse, setVerse] = useState({ text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...", ref: "João 3:16" });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sola Scriptura',
          text: `"${verse.text}" - ${verse.ref}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-petrol-500 to-petrol-700 p-8 text-white shadow-2xl shadow-petrol-500/20">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Versículo do Dia</span>
          <p className="mt-4 text-2xl font-serif italic leading-relaxed">
            "{verse.text}"
          </p>
          <div className="mt-6 flex items-center justify-between">
            <span className="font-bold text-lg">{verse.ref}</span>
            <button 
              onClick={handleShare}
              className="p-3 rounded-full bg-white/20 backdrop-blur-md active:scale-90 transition-transform"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reading Plans */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Planos de Leitura</h2>
          <button 
            onClick={() => onNavigate('reading-plans')}
            className="text-xs font-bold text-petrol-500 uppercase tracking-wider"
          >
            Ver Todos
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
          {READING_PLANS.map(plan => (
            <div key={plan.id} className="flex-shrink-0 w-64 p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-petrol-50 dark:bg-petrol-900/30 text-petrol-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-400">Dia {plan.currentDay}/{plan.days}</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">{plan.title}</h3>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${plan.progress}%` }}
                  className="h-full bg-petrol-500"
                />
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{plan.progress}% Concluído</span>
                <button className="text-xs font-bold text-petrol-500">Continuar</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('bible')}
          className="flex flex-col items-start p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-all"
        >
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 mb-4">
            <Book className="w-6 h-6" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">Bíblia</span>
          <span className="text-xs text-gray-500">Leitura diária</span>
        </button>
        <button 
          onClick={() => onNavigate('study')}
          className="flex flex-col items-start p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-all"
        >
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">Estudo IA</span>
          <span className="text-xs text-gray-500">Análise profunda</span>
        </button>
      </div>
    </div>
  );
};

const ReadingPlansScreen = ({ onBack }: { onBack: () => void }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{ title: string, days: { day: number, reference: string, focus: string }[] } | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const plan = await generateReadingPlan(topic);
    setGeneratedPlan(plan);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <Header title="Planos de Leitura" showBack onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 bg-paper-50 dark:bg-navy-900">
        {generatedPlan && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-[40px] bg-white dark:bg-gray-800 border-2 border-petrol-500 shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-petrol-600">{generatedPlan.title}</h3>
              <button onClick={() => setGeneratedPlan(null)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {generatedPlan.days.map(d => (
                <div key={d.day} className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-navy-900">
                  <div className="w-10 h-10 rounded-full bg-petrol-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {d.day}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{d.reference}</p>
                    <p className="text-xs text-gray-500 mt-1">{d.focus}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {READING_PLANS.map(plan => (
          <div key={plan.id} className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-petrol-50 dark:bg-petrol-900/30 text-petrol-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-sm font-bold block text-gray-900 dark:text-white">Dia {plan.currentDay}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold">de {plan.days} dias</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{plan.title}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Progresso</span>
                <span>{plan.progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${plan.progress}%` }}
                  className="h-full bg-petrol-500 shadow-[0_0_10px_rgba(13,148,136,0.5)]"
                />
              </div>
            </div>
            <button className="w-full mt-6 py-4 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/20 active:scale-[0.98] transition-all">
              Continuar Leitura
            </button>
          </div>
        ))}
        
        <div className="p-8 rounded-[40px] bg-gradient-to-br from-navy-800 to-navy-950 text-white text-center space-y-4">
          <Sparkles className="w-10 h-10 text-gold-400 mx-auto" />
          <h3 className="text-xl font-bold">Novo Plano com IA</h3>
          <p className="text-sm text-gray-400">Crie um plano de leitura personalizado baseado em um tema ou livro específico.</p>
          <button 
            onClick={() => setShowGenerator(true)}
            className="px-8 py-3 rounded-full bg-white text-navy-900 font-bold text-sm active:scale-95 transition-all"
          >
            Gerar Plano
          </button>
        </div>
      </div>

      {/* Generator Modal */}
      <AnimatePresence>
        {showGenerator && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-navy-900 rounded-[32px] p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Gerar Plano de Estudo</h3>
                <button onClick={() => setShowGenerator(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500">Sobre qual tema você gostaria de estudar?</p>
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Soberania de Deus, Oração, Salmos..."
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
              />
              <button 
                onClick={() => {
                  handleGenerate();
                  setShowGenerator(false);
                }}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Gerando..." : "Gerar Plano de 7 Dias"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BibleScreen = ({ onAddNote }: { onAddNote: (ref: string, content: string) => void }) => {
  const [book, setBook] = useState(BOOKS[0]);
  const [chapter, setChapter] = useState(1);
  const [content, setContent] = useState<BibleContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ reference: string, excerpt: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchBible(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const selectReference = (ref: string) => {
    // Basic parser for "Book Chapter:Verse" or "Book Chapter"
    const parts = ref.split(' ');
    const chapterPart = parts.pop();
    const bookName = parts.join(' ');
    
    const foundBook = BOOKS.find(b => b.name.toLowerCase() === bookName.toLowerCase());
    if (foundBook) {
      setBook(foundBook);
      const c = parseInt(chapterPart?.split(':')[0] || '1');
      setChapter(c);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleShare = async () => {
    if (navigator.share && content) {
      try {
        await navigator.share({
          title: `Sola Scriptura - ${book.name} ${chapter}`,
          text: content.text,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    }
  };

  const fetchContent = async (b: typeof BOOKS[0], c: number) => {
    setLoading(true);
    setContent(null);
    setAnalysis(null);
    const res = await getBibleContent(`${b.name} ${c}`);
    setContent(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchContent(book, chapter);
  }, [book, chapter]);

  const toggleAudio = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    } else if (content) {
      const utterance = new SpeechSynthesisUtterance(content.text);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setIsReading(false);
      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  const handleAnalysis = async () => {
    if (!content) return;
    setLoadingAnalysis(true);
    const res = await getTheologicalAnalysis(content.text);
    setAnalysis(res);
    setLoadingAnalysis(false);
  };

  return (
    <div className={cn("flex flex-col h-full bg-paper-50 dark:bg-navy-900 transition-all", isFocusMode && "bg-white dark:bg-black")}>
      {!isFocusMode && (
        <Header 
          title={`${book.name} ${chapter}`} 
          actions={
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800">
                <Search className="w-5 h-5" />
              </button>
              <button onClick={handleShare} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={toggleAudio} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800">
                {isReading ? <VolumeX className="w-5 h-5 text-petrol-500" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsFocusMode(true)} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800">
                <Maximize2 className="w-5 h-5" />
              </button>
              <button onClick={() => setShowNoteModal(true)} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800">
                <Bookmark className="w-5 h-5" />
              </button>
              <button onClick={() => setShowSelector(true)} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          }
        />
      )}

      {isFocusMode && (
        <button 
          onClick={() => setIsFocusMode(false)}
          className="fixed top-6 right-6 z-50 p-3 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-md"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}

      {!isFocusMode && showSearch && (
        <div className="p-4 bg-white dark:bg-navy-900 border-b border-gray-100 dark:border-gray-800 animate-slide-down">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Pesquisar na Bíblia (ex: Amor, Fé, João 3)..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-navy-800 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-petrol-500/30 border-t-petrol-500 rounded-full animate-spin" />
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((res, i) => (
                <button 
                  key={i}
                  onClick={() => selectReference(res.reference)}
                  className="w-full text-left p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                >
                  <span className="text-xs font-bold text-petrol-500 block mb-1">{res.reference}</span>
                  <p className="text-xs text-gray-500 line-clamp-1 italic">"{res.excerpt}"</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className={cn("max-w-2xl mx-auto space-y-8", isFocusMode && "pt-12")}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-4 border-petrol-500/30 border-t-petrol-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Abrindo as Escrituras...</p>
            </div>
          ) : content ? (
            <div className="space-y-8">
              <div className="prose prose-slate dark:prose-invert max-w-none reading-text leading-loose text-lg">
                <Markdown>{content.text}</Markdown>
              </div>

              {!isFocusMode && (
                <div className="space-y-6 pt-8 border-t border-gray-200 dark:border-gray-800">
                  {content.summary && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-petrol-500 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Resumo Teológico
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{content.summary}</p>
                    </div>
                  )}

                  {content.context && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4" /> Contexto Histórico
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{content.context}</p>
                    </div>
                  )}

                  {content.crossReferences && content.crossReferences.length > 0 && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Referências Cruzadas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {content.crossReferences.map(ref => (
                          <button key={ref} className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-navy-900 text-xs font-bold text-gray-600 dark:text-gray-400">
                            {ref}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleAnalysis}
                    disabled={loadingAnalysis}
                    className="w-full py-4 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loadingAnalysis ? "Analisando..." : "Gerar Análise Reformada"}
                  </button>

                  {analysis && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-3xl bg-petrol-50 dark:bg-petrol-900/20 border border-petrol-100 dark:border-petrol-800"
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Markdown>{analysis}</Markdown>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Note Modal */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-navy-900 rounded-[32px] p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Nova Nota</h3>
                <button onClick={() => setShowNoteModal(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-bold text-petrol-500 uppercase tracking-widest">{book.name} {chapter}</p>
              <textarea 
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="O que Deus falou ao seu coração hoje?"
                className="w-full h-40 p-4 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm resize-none"
              />
              <button 
                onClick={() => {
                  onAddNote(`${book.name} ${chapter}`, noteContent);
                  setNoteContent('');
                  setShowNoteModal(false);
                }}
                className="w-full py-4 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/20 active:scale-95 transition-all"
              >
                Salvar Nota
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selector Modal */}
      <AnimatePresence>
        {showSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-xl font-bold">Selecionar Passagem</h3>
                <button onClick={() => setShowSelector(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Livro</label>
                  <div className="space-y-1">
                    {BOOKS.map(b => (
                      <button 
                        key={b.name}
                        onClick={() => { setBook(b); setChapter(1); }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                          book.name === b.name ? "bg-petrol-500 text-white" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Capítulo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(c => (
                      <button 
                        key={c}
                        onClick={() => { setChapter(c); setShowSelector(false); }}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-colors",
                          chapter === c ? "bg-petrol-500 text-white" : "bg-gray-50 dark:bg-gray-800"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LibraryScreen = ({ notes }: { notes: Note[] }) => {
  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-petrol-900 dark:text-white">Minha Biblioteca</h2>
        <p className="text-sm text-gray-500">Suas notas, destaques e meditações.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-4">
            <Bookmark className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold block">{notes.length}</span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Notas</span>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm opacity-50">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-4">
            <Highlighter className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold block">0</span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Destaques</span>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="font-bold px-1">Notas Recentes</h3>
        {notes.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
            <Library className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">Nenhuma nota salva ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-petrol-500">{note.reference}</h4>
                  <span className="text-[10px] text-gray-400">{new Date(note.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const StudyScreen = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleStudy = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await getGeminiResponse(`Analise o seguinte texto ou tema bíblico sob uma perspectiva reformada histórica (Sola Scriptura): ${query}`);
      setResponse(res);
    } catch (err) {
      setResponse("Desculpe, ocorreu um erro ao processar seu estudo. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (response && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-petrol-500/10 text-petrol-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white">Assistente de Estudo</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Faça perguntas teológicas, peça comentários sobre versículos ou explore as doutrinas da graça.
        </p>
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: O que significa a Justificação pela Fé?"
            className="w-full h-32 p-4 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm resize-none dark:text-white"
          />
          <button
            onClick={handleStudy}
            disabled={loading}
            className="absolute bottom-3 right-3 p-3 rounded-xl bg-petrol-500 text-white shadow-lg shadow-petrol-500/30 disabled:opacity-50 active:scale-90 transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {response && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none reading-text">
            <Markdown>{response}</Markdown>
          </div>
          <div ref={scrollRef} />
        </motion.div>
      )}
    </div>
  );
};

const ConfessionsScreen = () => {
  const [selected, setSelected] = useState<Confession | null>(null);

  if (selected) {
    const [studyResponse, setStudyResponse] = useState<string | null>(null);
    const [loadingStudy, setLoadingStudy] = useState(false);

    const handleStudyConfession = async () => {
      setLoadingStudy(true);
      try {
        const res = await getGeminiResponse(`Explique a importância teológica e o contexto deste trecho da ${selected.title}: \n\n ${selected.content}`);
        setStudyResponse(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStudy(false);
      }
    };

    return (
      <div className="animate-fade-in-right h-full flex flex-col">
        <Header title={selected.title} showBack onBack={() => { setSelected(null); setStudyResponse(null); }} />
        <div className="flex-1 overflow-y-auto p-6 pb-24 bg-paper-50 dark:bg-navy-900">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="prose prose-slate dark:prose-invert reading-text">
              <Markdown>{selected.content}</Markdown>
            </div>
            
            <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
              <button 
                onClick={handleStudyConfession}
                disabled={loadingStudy}
                className="w-full py-4 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {loadingStudy ? "Analisando..." : "Estudar com IA"}
              </button>

              {studyResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Markdown>{studyResponse}</Markdown>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-petrol-900 dark:text-white">Símbolos de Fé</h2>
        <p className="text-sm text-gray-500">Documentos históricos da tradição reformada.</p>
      </div>
      
      {CONFESSIONS.map(c => (
        <button
          key={c.id}
          onClick={() => setSelected(c)}
          className="w-full flex flex-col items-start p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-all text-left"
        >
          <div className="flex justify-between w-full mb-2">
            <span className="text-xs font-bold text-petrol-500 bg-petrol-50 dark:bg-petrol-900/30 px-2 py-1 rounded-md">
              {c.year}
            </span>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{c.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{c.description}</p>
        </button>
      ))}
    </div>
  );
};

const SettingsScreen = () => {
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [fontSize, setFontSize] = useState(16);

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in">
      <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <Type className="w-5 h-5 text-petrol-500" />
          Aparência
        </h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span className="font-medium">Modo Escuro</span>
            </div>
            <button 
              onClick={toggleDark}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                darkMode ? "bg-petrol-500" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                darkMode ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Tamanho da Fonte</span>
              <span className="text-petrol-500 font-bold">{fontSize}px</span>
            </div>
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-petrol-500"
            />
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-4">Sobre</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Sola Scriptura é um projeto dedicado a promover o estudo bíblico e a teologia reformada através da tecnologia.
        </p>
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-400">
          <span>Versão 1.1.0</span>
          <span>© 2024 Sola Scriptura</span>
        </div>
      </section>
    </div>
  );
};

interface Note {
  id: string;
  reference: string;
  content: string;
  date: string;
}

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('notes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = (reference: string, content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      reference,
      content,
      date: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
  };

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeScreen onNavigate={setScreen} />;
      case 'bible': return <BibleScreen onAddNote={addNote} />;
      case 'study': return <StudyScreen />;
      case 'confessions': return <ConfessionsScreen />;
      case 'library': return <LibraryScreen notes={notes} />;
      case 'settings': return <SettingsScreen />;
      case 'reading-plans': return <ReadingPlansScreen onBack={() => setScreen('home')} />;
      default: return <HomeScreen onNavigate={setScreen} />;
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-paper-50 dark:bg-navy-900 transition-colors duration-500 overflow-hidden">
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={screen} onChange={setScreen} />
    </div>
  );
}
