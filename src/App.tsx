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
  Layers,
  Trash2,
  BookOpen,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { getGeminiResponse } from './services/geminiService';
import { 
  getBibleContent, 
  getTheologicalAnalysis, 
  searchBible, 
  generateReadingPlan, 
  getSermonOutline,
  getWordStudy,
  getDailyDevotional,
  generateVerseImage,
  BOOKS, 
  BibleContent 
} from './services/bibleService';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  FirebaseUser,
  Timestamp
} from './firebase';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Screen = 'home' | 'bible' | 'ai' | 'confessions' | 'library' | 'settings' | 'reading-plans';

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
    { id: 'ai', icon: Sparkles, label: 'Super IA' },
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

const HomeScreen = ({ onNavigate, user }: { onNavigate: (s: Screen) => void, user: FirebaseUser | null }) => {
  const [verse, setVerse] = useState({ text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...", ref: "João 3:16" });
  const [devotional, setDevotional] = useState<string | null>(null);
  const [loadingDevotional, setLoadingDevotional] = useState(false);
  const [verseImage, setVerseImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

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

  const handleGenerateDevotional = async () => {
    setLoadingDevotional(true);
    const res = await getDailyDevotional(verse);
    setDevotional(res);
    setLoadingDevotional(false);
  };

  const handleGenerateImage = async () => {
    setLoadingImage(true);
    const res = await generateVerseImage(`${verse.ref}: ${verse.text}`);
    if (res) setVerseImage(res);
    setLoadingImage(false);
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-[40px] bg-navy-900 text-white shadow-2xl min-h-[300px] flex flex-col justify-end p-8">
        {verseImage ? (
          <img 
            src={verseImage} 
            alt="Verse Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-petrol-600 to-navy-950 opacity-80" />
        )}
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Versículo do Dia</span>
            <div className="flex gap-2">
              <button 
                onClick={handleGenerateImage}
                disabled={loadingImage}
                className="p-2 rounded-full bg-white/10 backdrop-blur-md active:scale-90 transition-all disabled:opacity-50"
                title="Gerar Imagem"
              >
                {loadingImage ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Layers className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleShare}
                className="p-2 rounded-full bg-white/10 backdrop-blur-md active:scale-90 transition-all"
                title="Compartilhar"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-2xl font-serif italic leading-relaxed mb-6">
            "{verse.text}"
          </p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg text-gold-400">{verse.ref}</span>
            <button 
              onClick={handleGenerateDevotional}
              disabled={loadingDevotional}
              className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
            >
              {loadingDevotional ? "Gerando..." : "Devocional IA"}
            </button>
          </div>
        </div>
      </div>

      {devotional && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4 text-petrol-500">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Meditação do Dia</h3>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{devotional}</Markdown>
          </div>
        </motion.div>
      )}

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
          onClick={() => onNavigate('ai')}
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

const ReadingPlansScreen = ({ onBack, user }: { onBack: () => void, user: FirebaseUser | null }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<ReadingPlan[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'readingPlans'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingPlan));
      setPlans(p);
    });
    return () => unsubscribe();
  }, [user]);

  const handleGenerate = async () => {
    if (!topic.trim() || !user) return;
    setLoading(true);
    const plan = await generateReadingPlan(topic);
    
    try {
      await addDoc(collection(db, 'readingPlans'), {
        uid: user.uid,
        title: plan.title,
        progress: 0,
        days: plan.days.length,
        currentDay: 1,
        isGenerated: true,
        planData: JSON.stringify(plan.days),
        createdAt: serverTimestamp()
      });
      setShowGenerator(false);
      setTopic('');
    } catch (err) {
      console.error("Erro ao salvar plano:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (planId: string, currentDay: number, totalDays: number) => {
    const nextDay = Math.min(currentDay + 1, totalDays);
    const progress = Math.round((nextDay / totalDays) * 100);
    
    try {
      await updateDoc(doc(db, 'readingPlans', planId), {
        currentDay: nextDay,
        progress
      });
    } catch (err) {
      console.error("Erro ao atualizar progresso:", err);
    }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <Header title="Planos de Leitura" showBack onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 bg-paper-50 dark:bg-navy-900">
        {plans.length === 0 && !loading && (
          <div className="p-8 text-center space-y-4 bg-white dark:bg-gray-800 rounded-[40px] border border-dashed border-gray-200 dark:border-gray-700">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">Você ainda não tem planos de leitura.</p>
          </div>
        )}

        {plans.map(plan => (
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
            <button 
              onClick={() => updateProgress(plan.id, plan.currentDay, plan.days)}
              className="w-full mt-6 py-4 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/20 active:scale-[0.98] transition-all"
            >
              {plan.currentDay === plan.days ? "Plano Concluído" : "Marcar Dia como Lido"}
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

const BibleScreen = ({ onAddNote, user, onReferenceChange }: { onAddNote: (ref: string, content: string) => void, user: FirebaseUser | null, onReferenceChange?: (ref: string) => void }) => {
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
  const [sermonOutline, setSermonOutline] = useState<string | null>(null);
  const [loadingSermon, setLoadingSermon] = useState(false);
  const [wordStudy, setWordStudy] = useState<string | null>(null);
  const [loadingWordStudy, setLoadingWordStudy] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [selection, setSelection] = useState<{ text: string, range: Range | null }>({ text: '', range: null });
  const [showAIModal, setShowAIModal] = useState(false);

  const handleSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      setSelection({
        text: sel.toString().trim(),
        range: sel.getRangeAt(0)
      });
    } else {
      setSelection({ text: '', range: null });
    }
  };

  const addHighlight = async (color: string) => {
    if (!user || !selection.text) return;
    try {
      await addDoc(collection(db, 'highlights'), {
        uid: user.uid,
        reference: `${book.name} ${chapter}`,
        text: selection.text,
        color,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
      setSelection({ text: '', range: null });
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      console.error("Erro ao salvar destaque:", err);
    }
  };

  const handleSermonOutline = async () => {
    if (!content) return;
    setLoadingSermon(true);
    const res = await getSermonOutline(content.text);
    setSermonOutline(res);
    setLoadingSermon(false);
  };

  const handleWordStudy = async () => {
    if (!content || !selectedWord) return;
    setLoadingWordStudy(true);
    const res = await getWordStudy(content.text, selectedWord);
    setWordStudy(res);
    setLoadingWordStudy(false);
  };

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
    if (onReferenceChange) onReferenceChange(`${book.name} ${chapter}`);
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

      <div className="flex-1 overflow-y-auto p-6 pb-32" onMouseUp={handleSelection} onTouchEnd={handleSelection}>
        <div className={cn("max-w-2xl mx-auto space-y-8", isFocusMode && "pt-12")}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-4 border-petrol-500/30 border-t-petrol-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Abrindo as Escrituras...</p>
            </div>
          ) : content ? (
            <div className="space-y-8">
              <AnimatePresence>
                {selection.text && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-navy-800 rounded-full shadow-2xl border border-gray-100 dark:border-gray-700 p-2 flex items-center gap-2"
                  >
                    <div className="flex gap-1 px-2 border-r border-gray-100 dark:border-gray-700">
                      {['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca'].map(color => (
                        <button 
                          key={color}
                          onClick={() => addHighlight(color)}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 active:scale-90 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        onAddNote(`${book.name} ${chapter}`, `Ref: ${selection.text}\n\n`);
                        setShowNoteModal(true);
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    >
                      <Bookmark className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setSelection({ text: '', range: null })}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="prose prose-slate dark:prose-invert max-w-none reading-text leading-loose text-lg">
                <Markdown>{content.text}</Markdown>
              </div>

              {/* Floating AI Study Button */}
              <button 
                onClick={() => setShowAIModal(true)}
                className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-petrol-900 text-white shadow-2xl flex items-center justify-center animate-bounce-subtle z-40"
              >
                <Sparkles className="w-6 h-6" />
              </button>

              {/* AI Analysis Modal */}
              <AnimatePresence>
                {showAIModal && (
                  <motion.div 
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-navy-800 rounded-t-[40px] shadow-2xl border-t border-gray-100 dark:border-gray-700 max-h-[80vh] overflow-y-auto p-8"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-petrol-500" />
                        <h3 className="text-xl font-bold">Super IA: {book.name} {chapter}</h3>
                      </div>
                      <button onClick={() => setShowAIModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 rounded-3xl bg-petrol-50 dark:bg-petrol-900/30">
                        <h4 className="font-bold text-petrol-900 dark:text-petrol-200 mb-2">Resumo Teológico</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{content.summary}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={async () => {
                            setLoadingAnalysis(true);
                            const res = await getTheologicalAnalysis(content.text);
                            setAnalysis(res);
                            setLoadingAnalysis(false);
                          }}
                          className="p-4 rounded-2xl bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-left"
                        >
                          <Layers className="w-5 h-5 text-petrol-500 mb-2" />
                          <span className="text-xs font-bold block">Análise Reformada</span>
                        </button>
                        <button 
                          onClick={async () => {
                            setLoadingAnalysis(true);
                            const res = await getSermonOutline(content.text);
                            setAnalysis(res);
                            setLoadingAnalysis(false);
                          }}
                          className="p-4 rounded-2xl bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-left"
                        >
                          <BookOpen className="w-5 h-5 text-petrol-500 mb-2" />
                          <span className="text-xs font-bold block">Esboço de Sermão</span>
                        </button>
                      </div>

                      {loadingAnalysis && (
                        <div className="flex items-center justify-center py-12">
                          <div className="w-8 h-8 border-4 border-petrol-500/30 border-t-petrol-500 rounded-full animate-spin" />
                        </div>
                      )}

                      {analysis && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-navy-900 p-6 rounded-3xl"
                        >
                          <Markdown>{analysis}</Markdown>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleAnalysis}
                      disabled={loadingAnalysis}
                      className="py-4 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/30 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                    >
                      {loadingAnalysis ? "..." : "Análise Reformada"}
                    </button>
                    <button 
                      onClick={handleSermonOutline}
                      disabled={loadingSermon}
                      className="py-4 rounded-2xl bg-navy-800 text-white font-bold shadow-lg shadow-navy-900/30 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                    >
                      {loadingSermon ? "..." : "Esboço de Sermão"}
                    </button>
                  </div>

                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gold-500 flex items-center gap-2">
                      <Search className="w-4 h-4" /> Estudo de Palavras
                    </h4>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={selectedWord}
                        onChange={(e) => setSelectedWord(e.target.value)}
                        placeholder="Digite uma palavra..."
                        className="flex-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-navy-900 border-none text-sm"
                      />
                      <button 
                        onClick={handleWordStudy}
                        disabled={loadingWordStudy}
                        className="px-4 py-2 rounded-xl bg-petrol-500 text-white font-bold text-xs disabled:opacity-50"
                      >
                        {loadingWordStudy ? "..." : "Estudar"}
                      </button>
                    </div>
                  </div>

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

                  {sermonOutline && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-3xl bg-navy-50 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-800"
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Markdown>{sermonOutline}</Markdown>
                      </div>
                    </motion.div>
                  )}

                  {wordStudy && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30"
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Markdown>{wordStudy}</Markdown>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Floating AI Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAIModal(true)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-2xl flex items-center justify-center border-4 border-white dark:border-navy-900"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {showAIModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md p-4 flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-paper-50 dark:bg-navy-900 rounded-[40px] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border border-white/20"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gold-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Super IA de Estudo</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{book.name} {chapter}</p>
                  </div>
                </div>
                <button onClick={() => setShowAIModal(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleAnalysis}
                    disabled={loadingAnalysis}
                    className="flex flex-col items-center gap-3 p-6 rounded-[32px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-petrol-500/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-petrol-500" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Análise Teológica</span>
                  </button>
                  <button 
                    onClick={handleSermonOutline}
                    disabled={loadingSermon}
                    className="flex flex-col items-center gap-3 p-6 rounded-[32px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-navy-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-navy-500" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Esboço de Sermão</span>
                  </button>
                </div>

                <div className="p-6 rounded-[32px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 flex items-center gap-2">
                    <Search className="w-3 h-3" /> Estudo de Palavras
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={selectedWord}
                      onChange={(e) => setSelectedWord(e.target.value)}
                      placeholder="Selecione ou digite uma palavra..."
                      className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none text-sm focus:ring-2 focus:ring-gold-500"
                    />
                    <button 
                      onClick={handleWordStudy}
                      disabled={loadingWordStudy || !selectedWord}
                      className="px-6 py-3 rounded-2xl bg-gold-500 text-white font-bold text-xs shadow-lg shadow-gold-500/20 disabled:opacity-50"
                    >
                      {loadingWordStudy ? "..." : "Estudar"}
                    </button>
                  </div>
                </div>

                {(loadingAnalysis || loadingSermon || loadingWordStudy) && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
                    <p className="text-xs font-medium text-gray-400 animate-pulse">Consultando as Escrituras...</p>
                  </div>
                )}

                {analysis && !loadingAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[40px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-6 bg-petrol-500 rounded-full" />
                      <h4 className="font-bold text-petrol-500">Análise Reformada</h4>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-gray-600 dark:text-gray-300">
                      <Markdown>{analysis}</Markdown>
                    </div>
                  </motion.div>
                )}

                {sermonOutline && !loadingSermon && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[40px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-6 bg-navy-500 rounded-full" />
                      <h4 className="font-bold text-navy-500">Esboço de Sermão</h4>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-gray-600 dark:text-gray-300">
                      <Markdown>{sermonOutline}</Markdown>
                    </div>
                  </motion.div>
                )}

                {wordStudy && !loadingWordStudy && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[40px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-6 bg-gold-500 rounded-full" />
                      <h4 className="font-bold text-gold-500">Estudo de Palavra: {selectedWord}</h4>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-gray-600 dark:text-gray-300">
                      <Markdown>{wordStudy}</Markdown>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

const LibraryScreen = ({ notes, user }: { notes: Note[], user: FirebaseUser | null }) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'highlights'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const h = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Highlight));
      setHighlights(h);
    });
    return () => unsubscribe();
  }, [user]);

  const deleteNote = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (err) {
      console.error("Erro ao deletar nota:", err);
    }
  };

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
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-4">
            <Highlighter className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold block">{highlights.length}</span>
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
              <div key={note.id} className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-petrol-500">{note.reference}</h4>
                  <div className="flex gap-2">
                    <span className="text-[10px] text-gray-400">{new Date(note.date).toLocaleDateString()}</span>
                    <button 
                      onClick={() => deleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-50 rounded-md transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-bold px-1">Destaques</h3>
        {highlights.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
            <Highlighter className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">Nenhum destaque salvo ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {highlights.map(h => (
              <div key={h.id} className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{h.reference}</span>
                <p className="text-sm leading-relaxed border-l-4 pl-3" style={{ borderColor: h.color }}>
                  {h.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const THEOLOGICAL_DICTIONARY = [
  { term: 'Justificação', definition: 'Ato judicial de Deus pelo qual Ele declara o pecador justo com base na justiça de Cristo imputada.' },
  { term: 'Santificação', definition: 'Obra da livre graça de Deus, pela qual somos renovados em todo o nosso ser, segundo a imagem de Deus.' },
  { term: 'Providência', definition: 'O cuidado de Deus sobre todas as Suas criaturas e todas as suas ações.' },
  { term: 'Graça Irresistível', definition: 'A doutrina de que a graça salvadora de Deus é aplicada de forma eficaz àqueles que Ele determinou salvar.' },
  { term: 'Sola Scriptura', definition: 'A Bíblia como a única autoridade infalível para fé e prática.' },
];

const AIIntelligenceCenter = ({ currentReference }: { currentReference?: string }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'lab' | 'knowledge' | 'dictionary'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleStudy = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const context = currentReference ? `Considerando o texto de ${currentReference}, ` : '';
      const res = await getGeminiResponse(`${context}Analise o seguinte tema sob uma perspectiva reformada histórica (Sola Scriptura), citando as Confissões de Fé se relevante: ${q}`);
      setResponse(res);
    } catch (err) {
      setResponse("Desculpe, ocorreu um erro ao processar seu estudo. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const labTools = [
    { title: 'Exegese Automática', icon: <BookOpen />, prompt: 'Faça uma exegese detalhada do capítulo atual, focando no contexto original e teologia.' },
    { title: 'Dicionário Teológico', icon: <Type />, prompt: 'Explique os principais termos teológicos encontrados no capítulo atual.' },
    { title: 'Harmonia Bíblica', icon: <Layers />, prompt: 'Como este texto se harmoniza com o restante das Escrituras e a Aliança da Graça?' },
    { title: 'Aplicação Pastoral', icon: <MessageSquare />, prompt: 'Quais são as aplicações práticas e pastorais deste texto para a igreja hoje?' },
  ];

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['chat', 'lab', 'knowledge', 'dictionary'].map((m) => (
          <button 
            key={m}
            onClick={() => setMode(m as any)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all", 
              mode === m ? "bg-petrol-500 text-white" : "bg-white dark:bg-gray-800 text-gray-500"
            )}
          >
            {m === 'chat' ? 'Chat Teológico' : m === 'lab' ? 'Laboratório IA' : m === 'knowledge' ? 'Cérebro Reformado' : 'Dicionário'}
          </button>
        ))}
      </div>

      {mode === 'chat' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-petrol-500/10 text-petrol-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white">Super IA de Estudo</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Sua inteligência interna para exegese e teologia sistemática.
          </p>
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentReference ? `Pergunte sobre ${currentReference}...` : "Ex: O que é a Predestinação?"}
              className="w-full h-32 p-4 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm resize-none dark:text-white"
            />
            <button
              onClick={() => handleStudy()}
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
      )}

      {mode === 'lab' && (
        <div className="grid grid-cols-1 gap-4">
          {labTools.map((tool, i) => (
            <button
              key={i}
              onClick={() => { setMode('chat'); handleStudy(tool.prompt); }}
              className="flex items-center gap-4 p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-all text-left"
            >
              <div className="p-3 rounded-2xl bg-petrol-50 dark:bg-petrol-900/30 text-petrol-500">
                {tool.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{tool.title}</h3>
                <p className="text-xs text-gray-500">Toque para iniciar análise</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {mode === 'knowledge' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-petrol-900 text-white shadow-xl">
            <h3 className="font-bold mb-2">Base de Conhecimento Interna</h3>
            <p className="text-xs text-petrol-200 leading-relaxed">
              O app utiliza as Confissões de Fé e o Catecismo de Westminster como base primária para todas as respostas da IA.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {['Sola Scriptura', 'Sola Fide', 'Sola Gratia', 'Solus Christus', 'Soli Deo Gloria'].map(sola => (
              <div key={sola} className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="font-bold text-sm">{sola}</span>
                <button onClick={() => { setMode('chat'); handleStudy(`Explique o conceito de ${sola}`); }} className="text-petrol-500">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'dictionary' && (
        <div className="space-y-4">
          {THEOLOGICAL_DICTIONARY.map((item) => (
            <div key={item.term} className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="font-bold text-petrol-500 mb-2">{item.term}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.definition}</p>
              <button 
                onClick={() => { setMode('chat'); handleStudy(`Aprofunde o estudo sobre ${item.term} na perspectiva reformada.`); }}
                className="mt-4 text-xs font-bold text-petrol-500 flex items-center gap-1"
              >
                Aprofundar com IA <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

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

const SettingsScreen = ({ user, onSignOut, onSignIn }: { user: FirebaseUser | null, onSignOut: () => void, onSignIn: () => void }) => {
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [fontSize, setFontSize] = useState(16);

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in">
      {/* Profile Section */}
      <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <HomeIcon className="w-5 h-5 text-petrol-500" />
          Perfil
        </h3>
        
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-12 h-12 rounded-full border-2 border-petrol-500"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{user.displayName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={onSignOut}
              className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold"
            >
              Sair
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">Sincronize suas notas e planos em todos os seus dispositivos.</p>
            <button 
              onClick={onSignIn}
              className="w-full py-4 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              Entrar com Google
            </button>
          </div>
        )}
      </section>
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
  uid?: string;
  reference: string;
  content: string;
  date: string;
  createdAt?: Timestamp;
}

interface ReadingPlan {
  id: string;
  uid?: string;
  title: string;
  progress: number;
  days: number;
  currentDay: number;
  isGenerated?: boolean;
  planData?: string;
  createdAt?: Timestamp;
}

interface Highlight {
  id: string;
  uid?: string;
  reference: string;
  text: string;
  color: string;
  date: string;
  createdAt?: Timestamp;
}

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentReference, setCurrentReference] = useState<string>('João 1');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        // Sync user profile to Firestore
        setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Notes from Firestore
  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }
    const q = query(collection(db, 'notes'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const n = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(n.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    return () => unsubscribe();
  }, [user]);

  // Sync Reading Plans from Firestore
  useEffect(() => {
    if (!user) {
      setReadingPlans([]);
      return;
    }
    const q = query(collection(db, 'readingPlans'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingPlan));
      setReadingPlans(p);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Erro ao entrar:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  const addNote = async (reference: string, content: string) => {
    if (!user) {
      // Fallback to local if not logged in (optional)
      const newNote: Note = {
        id: Date.now().toString(),
        reference,
        content,
        date: new Date().toISOString()
      };
      setNotes([newNote, ...notes]);
      return;
    }

    try {
      await addDoc(collection(db, 'notes'), {
        uid: user.uid,
        reference,
        content,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Erro ao salvar nota:", err);
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeScreen onNavigate={setScreen} user={user} />;
      case 'bible': return <BibleScreen onAddNote={addNote} user={user} onReferenceChange={setCurrentReference} />;
      case 'ai': return <AIIntelligenceCenter currentReference={currentReference} />;
      case 'confessions': return <ConfessionsScreen />;
      case 'library': return <LibraryScreen notes={notes} user={user} />;
      case 'settings': return <SettingsScreen user={user} onSignIn={handleSignIn} onSignOut={handleSignOut} />;
      case 'reading-plans': return <ReadingPlansScreen onBack={() => setScreen('home')} user={user} />;
      default: return <HomeScreen onNavigate={setScreen} user={user} />;
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
