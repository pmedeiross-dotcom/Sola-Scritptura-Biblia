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
  FileText,
  Zap,
  ArrowRight,
  MessageCircle,
  FlaskConical,
  BrainCircuit,
  Send,
  User,
  Info,
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
    { id: 'ai', icon: Sparkles, label: 'Estudo IA' },
    { id: 'confessions', icon: Library, label: 'Símbolos' },
    { id: 'library', icon: Bookmark, label: 'Notas' },
    { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 z-50">
      <div className="max-w-md mx-auto bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-full shadow-2xl px-4 py-3 flex justify-between items-center transition-all duration-300">
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
                "relative p-3 rounded-full transition-all duration-300 group",
                isActive ? "text-petrol-500 scale-110" : "text-gray-400 hover:text-petrol-400"
              )}
            >
              <item.icon className="w-6 h-6" />
              {isActive && (
                <motion.div 
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-petrol-500/10 rounded-full -z-10 blur-md"
                />
              )}
              <span className={cn(
                "absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest opacity-0 transition-all duration-300",
                isActive && "opacity-100 -bottom-1"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const Header = ({ title, showBack, onBack, actions }: { title: string, showBack?: boolean, onBack?: () => void, actions?: React.ReactNode }) => (
  <header className="sticky top-0 z-40 bg-paper-50/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-4 py-4 flex items-center justify-between transition-all duration-300">
    <div className="flex items-center gap-3">
      {showBack && (
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-90">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-xl font-display font-bold text-petrol-900 dark:text-white tracking-tight">{title}</h1>
    </div>
    <div className="flex items-center gap-1">
      {actions}
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
    <div className="p-6 space-y-8 pb-32 animate-fade-in max-w-4xl mx-auto">
      {/* Hero Section - Editorial Style */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 text-white shadow-2xl min-h-[400px] flex flex-col justify-end p-8 md:p-12 transition-all duration-500 group">
        {verseImage ? (
          <img 
            src={verseImage} 
            alt="Verse Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-petrol-900/80 via-navy-950/90 to-black opacity-90" />
        )}
        
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gold-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-400/80">Palavra do Dia</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleGenerateImage}
                disabled={loadingImage}
                className="p-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 active:scale-90 transition-all disabled:opacity-50"
                title="Gerar Imagem"
              >
                {loadingImage ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Layers className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleShare}
                className="p-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 active:scale-90 transition-all"
                title="Compartilhar"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <blockquote className="space-y-4">
            <p className="text-3xl md:text-4xl font-display italic leading-[1.3] text-white/95 tracking-tight">
              "{verse.text}"
            </p>
            <footer className="flex items-center justify-between pt-4 border-t border-white/10">
              <cite className="not-italic font-bold text-xl text-gold-400 font-display">{verse.ref}</cite>
              <button 
                onClick={handleGenerateDevotional}
                disabled={loadingDevotional}
                className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gold-500 text-navy-950 text-xs font-bold uppercase tracking-widest hover:bg-gold-400 active:scale-95 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                {loadingDevotional ? "Sondando..." : "Meditação IA"}
              </button>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Devotional Card - Spans 2 columns if present */}
        {devotional ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-2 p-8 rounded-[2rem] bg-white dark:bg-navy-800 border border-black/5 dark:border-white/5 shadow-xl shadow-black/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-petrol-50 dark:bg-petrol-900/30 text-petrol-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-petrol-600 dark:text-petrol-400">Reflexão Teológica</h3>
            </div>
            <div className="reading-text prose prose-stone dark:prose-invert max-w-none">
              <Markdown>{devotional}</Markdown>
            </div>
          </motion.div>
        ) : (
          <div className="md:col-span-2 p-8 rounded-[2rem] bg-petrol-50/50 dark:bg-navy-800/50 border border-dashed border-petrol-200 dark:border-petrol-800 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-white dark:bg-navy-900 shadow-sm">
              <BookOpen className="w-8 h-8 text-petrol-400" />
            </div>
            <p className="text-sm text-petrol-600 dark:text-petrol-400 font-medium">Inicie sua meditação diária com auxílio da IA</p>
            <button 
              onClick={handleGenerateDevotional}
              className="text-xs font-bold uppercase tracking-widest text-petrol-600 hover:underline"
            >
              Gerar agora
            </button>
          </div>
        )}

        {/* Quick Access Column */}
        <div className="space-y-6">
          <button 
            onClick={() => onNavigate('bible')}
            className="w-full group flex flex-col items-start p-6 rounded-[2rem] bg-white dark:bg-navy-800 border border-black/5 dark:border-white/5 shadow-lg shadow-black/5 hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 mb-6 group-hover:scale-110 transition-transform">
              <Book className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl text-petrol-900 dark:text-white mb-1">Sagrada Escritura</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Continuar leitura de onde parou</span>
          </button>

          <button 
            onClick={() => onNavigate('ai')}
            className="w-full group flex flex-col items-start p-6 rounded-[2rem] bg-petrol-600 text-white shadow-lg shadow-petrol-900/20 hover:bg-petrol-700 transition-all active:scale-[0.98]"
          >
            <div className="p-4 rounded-2xl bg-white/10 text-white mb-6 group-hover:rotate-12 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl mb-1">Laboratório IA</span>
            <span className="text-xs text-petrol-100/70">Análise exegética e histórica</span>
          </button>
        </div>
      </div>

      {/* Reading Plans Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-petrol-500 rounded-full" />
            <h2 className="text-2xl font-display font-bold text-petrol-900 dark:text-white tracking-tight">Jornadas de Fé</h2>
          </div>
          <button 
            onClick={() => onNavigate('reading-plans')}
            className="flex items-center gap-2 text-xs font-bold text-petrol-500 uppercase tracking-widest hover:gap-3 transition-all"
          >
            Explorar Planos <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {READING_PLANS.map(plan => (
            <div 
              key={plan.id} 
              className="group p-6 rounded-[2rem] bg-white dark:bg-navy-800 border border-black/5 dark:border-white/5 shadow-lg shadow-black/5 hover:shadow-xl transition-all cursor-pointer"
              onClick={() => onNavigate('reading-plans')}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 text-petrol-600 group-hover:bg-petrol-500 group-hover:text-white transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Progresso</span>
                  <span className="text-sm font-bold text-petrol-600 dark:text-petrol-400">{plan.progress}%</span>
                </div>
              </div>
              
              <h3 className="font-display font-bold text-lg text-petrol-900 dark:text-white mb-4 line-clamp-1">{plan.title}</h3>
              
              <div className="space-y-3">
                <div className="w-full h-1.5 bg-gray-100 dark:bg-navy-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${plan.progress}%` }}
                    className="h-full bg-petrol-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>Dia {plan.currentDay} de {plan.days}</span>
                  <span className="text-petrol-500 group-hover:translate-x-1 transition-transform">Continuar →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
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
    try {
      const plan = await generateReadingPlan(topic);
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
      console.error("Erro ao gerar/salvar plano:", err);
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
    try {
      const res = await getSermonOutline(content.text);
      setSermonOutline(res);
    } catch (err) {
      console.error("Erro no esboço:", err);
      setSermonOutline("Ocorreu um erro ao gerar o esboço do sermão.");
    } finally {
      setLoadingSermon(false);
    }
  };

  const handleWordStudy = async () => {
    if (!content || !selectedWord) return;
    setLoadingWordStudy(true);
    try {
      const res = await getWordStudy(content.text, selectedWord);
      setWordStudy(res);
    } catch (err) {
      console.error("Erro no estudo de palavra:", err);
      setWordStudy("Ocorreu um erro ao realizar o estudo da palavra.");
    } finally {
      setLoadingWordStudy(false);
    }
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
    try {
      const res = await getBibleContent(`${b.name} ${c}`);
      setContent(res);
    } catch (err) {
      console.error("Erro ao carregar conteúdo:", err);
      setContent({ text: "Erro ao carregar o conteúdo da Bíblia. Verifique sua conexão.", reference: `${b.name} ${c}` });
    } finally {
      setLoading(false);
    }
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
    try {
      const res = await getTheologicalAnalysis(content.text);
      setAnalysis(res);
    } catch (err) {
      console.error("Erro na análise:", err);
      setAnalysis("Ocorreu um erro ao gerar a análise teológica.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-paper-50 dark:bg-navy-900 transition-all", isFocusMode && "bg-white dark:bg-black")}>
      {!isFocusMode && (
        <Header 
          title={`${book.name} ${chapter}`} 
          actions={
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                <Search className="w-5 h-5" />
              </button>
              <button onClick={handleShare} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={toggleAudio} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                {isReading ? <VolumeX className="w-5 h-5 text-petrol-500" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsFocusMode(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                <Maximize2 className="w-5 h-5" />
              </button>
              <button onClick={() => setShowNoteModal(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                <Bookmark className="w-5 h-5" />
              </button>
              <button onClick={() => setShowSelector(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          }
        />
      )}

      {isFocusMode && (
        <button 
          onClick={() => setIsFocusMode(false)}
          className="fixed top-8 right-8 z-50 p-4 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-black/10 transition-all active:scale-90"
        >
          <Minimize2 className="w-6 h-6" />
        </button>
      )}

      {!isFocusMode && showSearch && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-navy-900 border-b border-black/5 dark:border-white/5"
        >
          <div className="relative max-w-2xl mx-auto">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Pesquisar na Bíblia (ex: Amor, Fé, João 3)..."
              className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-gray-50 dark:bg-navy-800 border-none focus:ring-2 focus:ring-petrol-500 text-base shadow-inner"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            {isSearching && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-petrol-500/30 border-t-petrol-500 rounded-full animate-spin" />
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-6 space-y-3 max-h-80 overflow-y-auto px-2">
              {searchResults.map((res, i) => (
                <button 
                  key={i}
                  onClick={() => selectReference(res.reference)}
                  className="w-full text-left p-5 rounded-2xl bg-gray-50/50 dark:bg-navy-800/50 hover:bg-petrol-50 dark:hover:bg-petrol-900/20 transition-all group"
                >
                  <div className="font-display font-bold text-petrol-600 dark:text-petrol-400 mb-1 group-hover:translate-x-1 transition-transform">{res.reference}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 italic">"{res.excerpt}"</div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div 
        className={cn(
          "flex-1 overflow-y-auto px-6 py-10 md:px-12 md:py-16 transition-all duration-700",
          isFocusMode ? "max-w-3xl mx-auto" : "max-w-4xl mx-auto"
        )}
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
            <div className="w-12 h-12 border-4 border-petrol-500/20 border-t-petrol-500 rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-petrol-500">Sondando as Escrituras...</p>
          </div>
        ) : content ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-16 pb-32"
          >
            {/* Chapter Header */}
            <div className="text-center space-y-6 mb-20">
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block px-4 py-1.5 rounded-full bg-petrol-50 dark:bg-petrol-900/30 text-[10px] font-bold uppercase tracking-[0.4em] text-petrol-600 dark:text-petrol-400"
              >
                Capítulo {chapter}
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl font-display font-bold text-petrol-900 dark:text-white tracking-tighter leading-none"
              >
                {book.name}
              </motion.h2>
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="w-24 h-1 bg-gold-500 mx-auto rounded-full" 
              />
            </div>

            {/* Bible Text */}
            <div className="reading-text prose prose-stone dark:prose-invert max-w-none first-letter:text-8xl first-letter:font-display first-letter:font-bold first-letter:mr-4 first-letter:float-left first-letter:text-petrol-600 dark:first-letter:text-gold-500 first-letter:leading-none">
              <Markdown>{content.text}</Markdown>
            </div>
            {/* Selection Tools - Floating Glass */}
            <AnimatePresence>
              {selection.text && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 20, x: '-50%' }}
                  className="fixed bottom-32 left-1/2 z-50 glass-card rounded-full p-2 flex items-center gap-2 shadow-2xl border border-white/20 dark:border-white/10"
                >
                  <div className="flex gap-1.5 px-3 border-r border-black/5 dark:border-white/10">
                    {['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca'].map(color => (
                      <button 
                        key={color}
                        onClick={() => addHighlight(color)}
                        className="w-8 h-8 rounded-full border border-black/5 dark:border-white/10 active:scale-90 transition-transform shadow-inner"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      onAddNote(`${book.name} ${chapter}`, `Ref: ${selection.text}\n\n`);
                      setShowNoteModal(true);
                    }}
                    className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelection({ text: '', range: null })}
                    className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Insights Section - Bento Style */}
            {!isFocusMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-24">
                {content.summary && (
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-[2.5rem] bg-white dark:bg-navy-800 border border-black/5 dark:border-white/5 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-petrol-50 dark:bg-petrol-900/30 text-petrol-600">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-petrol-600 dark:text-petrol-400">Resumo Teológico</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{content.summary}</p>
                  </motion.div>
                )}

                {content.context && (
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-[2.5rem] bg-white dark:bg-navy-800 border border-black/5 dark:border-white/5 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600">
                        <History className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Contexto Histórico</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{content.context}</p>
                  </motion.div>
                )}

                {content.crossReferences && content.crossReferences.length > 0 && (
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="md:col-span-2 p-8 rounded-[2.5rem] bg-white dark:bg-navy-800 border border-black/5 dark:border-white/5 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Referências Cruzadas</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {content.crossReferences.map(ref => (
                        <button key={ref} className="px-5 py-2.5 rounded-2xl bg-gray-50 dark:bg-navy-900 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-petrol-50 dark:hover:bg-petrol-900/30 hover:text-petrol-600 transition-all border border-transparent hover:border-petrol-200">
                          {ref}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* AI Tools Bar - Floating style */}
            {!isFocusMode && (
              <div className="sticky bottom-10 left-0 right-0 flex justify-center pointer-events-none z-40">
                <div className="pointer-events-auto flex items-center gap-2 p-2 rounded-full bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-2xl">
                  <button 
                    onClick={handleAnalysis}
                    disabled={loadingAnalysis}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-petrol-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-petrol-700 transition-all disabled:opacity-50 shadow-lg shadow-petrol-600/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    {loadingAnalysis ? "Analisando..." : "Exegese IA"}
                  </button>
                  <button 
                    onClick={() => setShowAIModal(true)}
                    className="p-3.5 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700 transition-all"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {analysis && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-20 p-8 md:p-12 rounded-[3.5rem] bg-white dark:bg-navy-800 border border-black/5 dark:border-white/5 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-petrol-500 via-gold-500 to-crimson-500" />
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 rounded-2xl bg-petrol-50 dark:bg-petrol-900/30 text-petrol-600">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-petrol-600 dark:text-petrol-400">Análise Teológica Profunda</h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Perspectiva Reformada & Histórica</p>
                  </div>
                </div>
                <div className="reading-text prose prose-stone dark:prose-invert max-w-none">
                  <Markdown>{analysis}</Markdown>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </div>

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
    <div className="p-6 space-y-8 pb-32 animate-fade-in max-w-2xl mx-auto">
      <header className="space-y-2">
        <h2 className="text-4xl font-serif italic text-petrol-900 dark:text-white tracking-tight">Minha Biblioteca</h2>
        <p className="text-sm text-gray-500 font-medium uppercase tracking-widest opacity-70">Suas notas, destaques e meditações.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-[32px] bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center mb-4">
            <Bookmark className="w-6 h-6" />
          </div>
          <span className="text-3xl font-serif font-bold block text-gray-900 dark:text-white">{notes.length}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Notas Salvas</span>
        </div>
        <div className="p-6 rounded-[32px] bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center mb-4">
            <Highlighter className="w-6 h-6" />
          </div>
          <span className="text-3xl font-serif font-bold block text-gray-900 dark:text-white">{highlights.length}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Destaques</span>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-xl text-gray-900 dark:text-white">Notas Recentes</h3>
          <span className="text-[10px] font-bold text-petrol-500 uppercase tracking-widest">Ver Todas</span>
        </div>
        
        {notes.length === 0 ? (
          <div className="p-16 text-center space-y-4 bg-white/50 dark:bg-gray-800/50 rounded-[40px] border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto opacity-50">
              <Library className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Nenhuma nota salva ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <motion.div 
                layout
                key={note.id} 
                className="p-6 rounded-[32px] bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5 shadow-sm group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <h4 className="font-serif text-lg text-petrol-600 dark:text-petrol-400">{note.reference}</h4>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      {new Date(note.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-serif italic opacity-90">
                  "{note.content}"
                </p>
                <div className="absolute top-0 right-0 w-24 h-24 bg-petrol-500/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-xl text-gray-900 dark:text-white">Destaques</h3>
        </div>

        {highlights.length === 0 ? (
          <div className="p-16 text-center space-y-4 bg-white/50 dark:bg-gray-800/50 rounded-[40px] border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto opacity-50">
              <Highlighter className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Nenhum destaque salvo ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {highlights.map(h => (
              <div key={h.id} className="p-6 rounded-[32px] bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full" style={{ backgroundColor: h.color }} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{h.reference}</span>
                </div>
                <p className="text-base leading-relaxed font-serif text-gray-800 dark:text-gray-200 italic">
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
    { title: 'Exegese Automática', icon: <BookOpen className="w-5 h-5" />, prompt: 'Faça uma exegese detalhada do capítulo atual, focando no contexto original e teologia.' },
    { title: 'Dicionário Teológico', icon: <Type className="w-5 h-5" />, prompt: 'Explique os principais termos teológicos encontrados no capítulo atual.' },
    { title: 'Harmonia Bíblica', icon: <Layers className="w-5 h-5" />, prompt: 'Como este texto se harmoniza com o restante das Escrituras e a Aliança da Graça?' },
    { title: 'Aplicação Pastoral', icon: <MessageSquare className="w-5 h-5" />, prompt: 'Quais são as aplicações práticas e pastorais deste texto para a igreja hoje?' },
  ];

  const modes = [
    { id: 'chat', label: 'Chat Teológico', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'lab', label: 'Laboratório IA', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'knowledge', label: 'Cérebro Reformado', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'dictionary', label: 'Dicionário', icon: <Book className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-8 pb-32 animate-fade-in max-w-2xl mx-auto">
      <header className="space-y-2">
        <h2 className="text-4xl font-serif italic text-petrol-900 dark:text-white tracking-tight">Centro de Inteligência</h2>
        <p className="text-sm text-gray-500 font-medium uppercase tracking-widest opacity-70">Exegese e Teologia Reformada assistida por IA.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
        {modes.map((m) => (
          <button 
            key={m.id}
            onClick={() => setMode(m.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold whitespace-nowrap transition-all border", 
              mode === m.id 
                ? "bg-petrol-600 text-white border-petrol-600 shadow-lg shadow-petrol-600/20" 
                : "bg-white dark:bg-gray-800 text-gray-500 border-black/5 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'chat' && (
        <div className="bg-white dark:bg-gray-800 rounded-[40px] p-8 shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-petrol-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:bg-petrol-500/10 transition-all duration-700" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-petrol-500/10 text-petrol-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-gray-900 dark:text-white">Super IA de Estudo</h2>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Sola Scriptura Engine</p>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentReference ? `Pergunte sobre ${currentReference}...` : "Ex: O que é a Predestinação?"}
              className="w-full h-40 p-6 rounded-[32px] bg-gray-50 dark:bg-navy-900/50 border-none focus:ring-2 focus:ring-petrol-500/20 text-base font-serif italic resize-none dark:text-white placeholder:text-gray-300"
            />
            <button
              onClick={() => handleStudy()}
              disabled={loading}
              className="absolute bottom-4 right-4 p-4 rounded-2xl bg-petrol-600 text-white shadow-xl shadow-petrol-600/30 disabled:opacity-50 active:scale-95 transition-all hover:bg-petrol-700"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
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
              className="flex items-center gap-6 p-6 rounded-[32px] bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left group"
            >
              <div className="p-4 rounded-2xl bg-petrol-50 dark:bg-petrol-900/20 text-petrol-500 group-hover:scale-110 transition-transform">
                {tool.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl text-gray-900 dark:text-white">{tool.title}</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Toque para iniciar análise</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-petrol-500 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {mode === 'knowledge' && (
        <div className="space-y-6">
          <div className="p-8 rounded-[40px] bg-petrol-900 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <h3 className="font-serif text-2xl mb-3">Base de Conhecimento</h3>
            <p className="text-sm text-petrol-200 leading-relaxed font-serif italic opacity-80">
              O app utiliza as Confissões de Fé e o Catecismo de Westminster como base primária para todas as respostas da IA, garantindo fidelidade à tradição reformada.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {['Sola Scriptura', 'Sola Fide', 'Sola Gratia', 'Solus Christus', 'Soli Deo Gloria'].map(sola => (
              <button 
                key={sola} 
                onClick={() => { setMode('chat'); handleStudy(`Explique o conceito de ${sola}`); }}
                className="p-5 rounded-[24px] bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
              >
                <span className="font-serif text-lg text-gray-800 dark:text-gray-200">{sola}</span>
                <div className="w-8 h-8 rounded-full bg-petrol-50 dark:bg-petrol-900/20 flex items-center justify-center text-petrol-500 group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'dictionary' && (
        <div className="space-y-4">
          {THEOLOGICAL_DICTIONARY.map((item) => (
            <div key={item.term} className="p-8 rounded-[40px] bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5 shadow-sm group">
              <h3 className="font-serif text-2xl text-petrol-600 dark:text-petrol-400 mb-3">{item.term}</h3>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed font-serif italic">{item.definition}</p>
              <button 
                onClick={() => { setMode('chat'); handleStudy(`Aprofunde o estudo sobre ${item.term} na perspectiva reformada.`); }}
                className="mt-6 text-xs font-bold text-petrol-500 flex items-center gap-2 uppercase tracking-[0.2em] hover:gap-3 transition-all"
              >
                Aprofundar com IA <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {response && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-[40px] p-8 shadow-sm border border-black/5 dark:border-white/5 relative"
        >
          <div className="absolute top-6 right-8 text-[10px] font-bold text-petrol-500 uppercase tracking-widest">Resposta da IA</div>
          <div className="prose prose-sm dark:prose-invert max-w-none reading-text pt-4">
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
      <div className="animate-fade-in-right h-full flex flex-col bg-paper-50 dark:bg-navy-900">
        <Header title={selected.title} showBack onBack={() => { setSelected(null); setStudyResponse(null); }} />
        <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-32">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4 mb-16">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-petrol-600 dark:text-petrol-400">Documento Histórico</span>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-petrol-900 dark:text-white tracking-tight leading-tight">{selected.title}</h2>
              <div className="w-16 h-1 bg-gold-500 mx-auto rounded-full" />
            </div>

            <div className="reading-text prose prose-stone dark:prose-invert max-w-none first-letter:text-7xl first-letter:font-display first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-petrol-600 dark:first-letter:text-gold-500">
              <Markdown>{selected.content}</Markdown>
            </div>
            
            <div className="pt-12 border-t border-black/5 dark:border-white/5">
              <button 
                onClick={handleStudyConfession}
                disabled={loadingStudy}
                className="w-full py-5 rounded-3xl bg-petrol-600 text-white font-bold shadow-xl shadow-petrol-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                <Sparkles className="w-5 h-5" />
                {loadingStudy ? "Analisando..." : "Exegese IA"}
              </button>

              {studyResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-10 p-8 md:p-10 rounded-[3rem] bg-white dark:bg-navy-800 border border-black/5 dark:border-white/5 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gold-500" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-gold-50 dark:bg-gold-900/20 text-gold-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gold-600 dark:text-gold-400">Comentário Teológico</h4>
                  </div>
                  <div className="reading-text prose prose-sm dark:prose-invert max-w-none leading-relaxed">
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
    <div className="p-8 space-y-8 pb-32 animate-fade-in max-w-5xl mx-auto">
      <div className="mb-10 space-y-2">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-petrol-900 dark:text-white tracking-tight">Símbolos de Fé</h2>
        <p className="text-sm text-gray-500 font-medium tracking-wide">Documentos históricos da tradição reformada e cristã.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CONFESSIONS.map(c => (
          <motion.button
            key={c.id}
            whileHover={{ y: -5 }}
            onClick={() => setSelected(c)}
            className="w-full flex flex-col items-start p-8 rounded-[2.5rem] bg-white dark:bg-navy-800 border border-black/5 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all text-left relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-6 h-6 text-petrol-500" />
            </div>
            <div className="flex justify-between w-full mb-6">
              <span className="text-[10px] font-bold text-petrol-600 bg-petrol-50 dark:bg-petrol-900/30 px-3 py-1.5 rounded-full uppercase tracking-widest">
                {c.year}
              </span>
            </div>
            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{c.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-3">{c.description}</p>
          </motion.button>
        ))}
      </div>
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
    <div className="p-6 space-y-8 pb-32 animate-fade-in max-w-2xl mx-auto">
      <header className="space-y-2">
        <h2 className="text-4xl font-serif italic text-petrol-900 dark:text-white tracking-tight">Configurações</h2>
        <p className="text-sm text-gray-500 font-medium uppercase tracking-widest opacity-70">Personalize sua experiência de estudo.</p>
      </header>

      {/* Profile Section */}
      <section className="bg-white dark:bg-gray-800 rounded-[40px] p-8 shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-petrol-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:bg-petrol-500/10 transition-all duration-700" />
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-petrol-500/10 text-petrol-500">
            <User className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl text-gray-900 dark:text-white">Perfil</h3>
        </div>
        
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-3xl border-2 border-petrol-500/20 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-xl text-gray-900 dark:text-white leading-none">{user.displayName}</p>
                <p className="text-xs text-gray-400 font-medium tracking-wide">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={onSignOut}
              className="px-5 py-2.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
            >
              Sair
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <p className="text-sm text-gray-500 font-serif italic leading-relaxed">Sincronize suas notas, destaques e planos de leitura em todos os seus dispositivos.</p>
            <button 
              onClick={onSignIn}
              className="w-full py-4 rounded-[24px] bg-petrol-600 text-white font-bold shadow-xl shadow-petrol-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-petrol-700"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Entrar com Google
            </button>
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-[40px] p-8 shadow-sm border border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-petrol-500/10 text-petrol-500">
            <Type className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl text-gray-900 dark:text-white">Aparência</h3>
        </div>
        
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl transition-all",
                darkMode ? "bg-navy-900 text-amber-400" : "bg-amber-50 text-amber-600"
              )}>
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <span className="font-serif text-lg text-gray-900 dark:text-white block">Modo Escuro</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Visual Noturno</span>
              </div>
            </div>
            <button 
              onClick={toggleDark}
              className={cn(
                "w-14 h-7 rounded-full transition-all duration-300 relative p-1",
                darkMode ? "bg-petrol-600" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm",
                darkMode ? "translate-x-7" : "translate-x-0"
              )} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <span className="font-serif text-lg text-gray-900 dark:text-white block">Tamanho da Fonte</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ajuste de Leitura</span>
              </div>
              <span className="text-petrol-600 font-bold font-serif text-xl">{fontSize}px</span>
            </div>
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-petrol-600"
            />
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-[40px] p-8 shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-petrol-500/10 text-petrol-500">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl text-gray-900 dark:text-white">Sobre</h3>
        </div>
        <p className="text-base text-gray-500 leading-relaxed font-serif italic opacity-80">
          Sola Scriptura é um projeto dedicado a promover o estudo bíblico e a teologia reformada através da tecnologia, unindo a tradição histórica com a inovação digital.
        </p>
        <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Versão</span>
            <span className="text-sm font-serif text-gray-600 dark:text-gray-300">1.2.0 Editorial</span>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Copyright</span>
            <span className="text-sm font-serif text-gray-600 dark:text-gray-300">© 2024 Sola Scriptura</span>
          </div>
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
