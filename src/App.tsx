import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import './index.css';
import { 
  Book, 
  Search, 
  History, 
  Settings as SettingsIcon, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
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
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
const Markdown = React.lazy(() => import('react-markdown'));
// ...existing code...
import { BOOKS } from './services/bibleCatalog';
import type { BibleContent } from './services/bibleService';
import { getPericopeSections } from './services/pericopeData';
import { formatInternalBibleAIReportMarkdown, runInternalBibleAI } from './services/internalBibleAI';
import { translateStrongDefinitionToPtBr } from './services/strongsTranslation';
import { WESTMINSTER_CONFESSION } from './data/westminsterConfession';
import { HEIDELBERG_CATECHISM } from './data/heidelbergCatechism';
import { BELGIC_CONFESSION } from './data/belgicConfession';
import strongsOpenScriptures from './data/strongs-open-scriptures.json';
import OnboardingModal from './components/OnboardingModal';
import { processFile } from '../services/importer';
import { getStoredVersions, saveBibleVersion, saveDictionaries, searchInDictionary, type StoredBibleMeta } from '../services/db';
import type { DictionaryEntry } from '../types';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LazyMarkdown = ({ children }: { children: string }) => (
  <Suspense fallback={<p className="text-sm text-gray-400">Carregando...</p>}>
    <Markdown>{children}</Markdown>
  </Suspense>
);

const loadBibleService = () => import('./services/bibleService');

const getBibleContentLazy = async (reference: string, version?: string) => {
  const service = await loadBibleService();
  return service.getBibleContent(reference, version);
};

const getTheologicalAnalysisLazy = async (text: string) => {
  const service = await loadBibleService();
  return service.getTheologicalAnalysis(text);
};

const searchBibleLazy = async (query: string) => {
  const service = await loadBibleService();
  return service.searchBible(query);
};

const generateReadingPlanLazy = async (topic: string) => {
  const service = await loadBibleService();
  return service.generateReadingPlan(topic);
};

const getLocalBibleChapterLazy = async (book: string, chapter: number, version?: string) => {
  const service = await loadBibleService();
  return service.getLocalBibleChapter(book, chapter, version);
};

const DEFAULT_GITHUB_BIBLES_API = 'https://api.github.com/repos/pmedeiross-dotcom/Sola-Scritptura-Biblia/contents/versions';
const GITHUB_BIBLES_API = (import.meta.env.VITE_BIBLE_VERSIONS_API as string | undefined) || DEFAULT_GITHUB_BIBLES_API;

interface GitHubRepoFile {
  name: string;
  type: string;
  download_url: string | null;
}

interface GitHubVersionOption {
  fileName: string;
  code: string;
  url: string;
}

interface RepoBibleBook {
  name?: string;
  chapters?: unknown[];
}

interface ImportedVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

type RepoVerseValue = string | string[];

const normalizeKey = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const bookNameIndex = new Map(BOOKS.map(book => [normalizeKey(book.name), book.name]));

const normalizeBookNameFromCatalog = (bookName: string) => {
  const normalized = bookNameIndex.get(normalizeKey(bookName));
  return normalized || bookName;
};

const toVersionCodeFromFileName = (fileName: string) => {
  return fileName
    .replace(/\.json$/i, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 24);
};

const parseRepoBibleToVerses = (payload: unknown, versionCode: string): ImportedVerse[] => {
  if (!Array.isArray(payload)) return [];

  const verses: ImportedVerse[] = [];
  for (const bookRaw of payload as RepoBibleBook[]) {
    if (!bookRaw || !Array.isArray(bookRaw.chapters)) continue;
    const bookName = normalizeBookNameFromCatalog(String(bookRaw.name || 'Desconhecido'));

    bookRaw.chapters.forEach((chapterRaw, chapterIndex) => {
      if (!Array.isArray(chapterRaw)) return;

      chapterRaw.forEach((verseRaw, verseIndex) => {
        let text = '';
        if (typeof verseRaw === 'string') {
          text = verseRaw.trim();
        } else if (Array.isArray(verseRaw)) {
          // Some sources encode each verse as ["texto"] instead of "texto".
          const firstText = (verseRaw as RepoVerseValue[]).find(item => typeof item === 'string');
          text = typeof firstText === 'string' ? firstText.trim() : '';
        }

        if (!text || text === ' ') return;

        verses.push({
          book: bookName,
          chapter: chapterIndex + 1,
          verse: verseIndex + 1,
          text,
          version: versionCode,
        });
      });
    });
  }

  return verses;
};

const mapBundledStrongDictionaryToEntries = (): DictionaryEntry[] => {
  return Object.entries(strongsOpenScriptures as Record<string, string>)
    .map(([code, definition]) => ({
      id: code,
      word: code,
      definition: translateStrongDefinitionToPtBr(String(definition || '').trim()),
      source: 'OpenScriptures Strong (pt-BR auto)',
      category: code.startsWith('G') ? 'grego' : code.startsWith('H') ? 'hebraico' : 'strong'
    }))
    .filter(entry => entry.definition.length > 0);
};

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

interface DailyVerseReference {
  book: string;
  chapter: number;
  verse: number;
}

interface PlanReferenceTarget {
  bookName: string;
  chapter: number;
  verse: number;
  label: string;
}

interface CustomPlanScheduleItem {
  day: number;
  startBook: string;
  startChapter: number;
  endBook: string;
  endChapter: number;
  label: string;
}

interface CustomReadingPlan {
  id: string;
  title: string;
  mode: 'book' | 'portion';
  sourceStartBook: string;
  sourceStartChapter: number;
  sourceEndBook: string;
  sourceEndChapter: number;
  totalChapters: number;
  chaptersPerDay: number;
  minutesPerChapter: number;
  estimatedDays: number;
  estimatedHours: number;
  startDate: string;
  createdAt: number;
  schedule: CustomPlanScheduleItem[];
}

interface ConfessionChapter {
  id: string;
  heading: string;
  title: string;
  content: string;
}

const parseWestminsterChapters = (content: string): ConfessionChapter[] => {
  const matches = [...content.matchAll(/(CAPÍTULO\s+[IVXLCDM]+)([\s\S]*?)(?=\nCAPÍTULO\s+[IVXLCDM]+|$)/g)];

  return matches.map((match, index) => {
    const heading = match[1].trim();
    const block = match[2].trim();
    const blockLines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const title = blockLines[0] ?? '';

    return {
      id: `chapter-${index + 1}`,
      heading,
      title,
      content: `${heading}\n${block}`.trim(),
    };
  });
};

const parseHeidelbergDomingos = (content: string): ConfessionChapter[] => {
  const matches = [...content.matchAll(/(DOMINGO\s+\d+)([\s\S]*?)(?=\nDOMINGO\s+\d+|$)/g)];

  return matches.map((match, index) => {
    const heading = match[1].trim();
    const block = match[2].trim();
    const blockLines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const firstQuestion = blockLines.find(line => /^\d+[\.,]\s+/.test(line));
    const normalizedQuestion = firstQuestion?.replace(/^\d+[\.,]\s+/, '').trim();
    const rawTitle = normalizedQuestion ?? blockLines[0] ?? '';
    const shortTitle = rawTitle.length > 110 ? `${rawTitle.slice(0, 107).trimEnd()}...` : rawTitle;
    const headingNumber = heading.match(/\d+/)?.[0] ?? String(index + 1);
    const title = shortTitle ? `Domingo ${headingNumber}: ${shortTitle}` : `Domingo ${headingNumber}`;

    return {
      id: `domingo-${index + 1}`,
      heading,
      title,
      content: `${heading}\n${block}`.trim(),
    };
  });
};

const parseBelgicArticles = (content: string): ConfessionChapter[] => {
  const matches = [...content.matchAll(/(ARTIGO\s+\d+)([\s\S]*?)(?=\nARTIGO\s+\d+|$)/g)];

  return matches.map((match, index) => {
    const heading = match[1].trim();
    const block = match[2].trim();
    const blockLines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const rawTitle = blockLines[0] ?? '';
    const shortTitle = rawTitle.length > 110 ? `${rawTitle.slice(0, 107).trimEnd()}...` : rawTitle;
    const articleNumber = heading.match(/\d+/)?.[0] ?? String(index + 1);
    const title = shortTitle ? `Artigo ${articleNumber}: ${shortTitle}` : `Artigo ${articleNumber}`;

    return {
      id: `artigo-${index + 1}`,
      heading,
      title,
      content: `${heading}\n${block}`.trim(),
    };
  });
};

// --- Mock Data ---
const CONFESSIONS: Confession[] = [
  {
    id: 'westminster',
    title: 'Confissão de Fé de Westminster',
    year: '1647',
    description: 'O padrão doutrinário fundamental das igrejas presbiterianas.',
    content: WESTMINSTER_CONFESSION
  },
  {
    id: 'heidelberg',
    title: 'Catecismo de Heidelberg',
    year: '1563',
    description: 'Um dos documentos mais amados da Reforma, focado no consolo cristão.',
    content: HEIDELBERG_CATECHISM
  },
  {
    id: 'belgica',
    title: 'Confissão Belga',
    year: '1561',
    description: 'Uma exposição sistemática da fé reformada escrita por Guido de Brès.',
    content: BELGIC_CONFESSION
  }
];

const READING_PLANS: ReadingPlan[] = [
  { id: 'year', title: 'Bíblia em um Ano', progress: 35, days: 365, currentDay: 128 },
  { id: 'reformation', title: 'Teologia da Reforma', progress: 60, days: 30, currentDay: 18 },
  { id: 'psalms', title: 'Sabedoria dos Salmos', progress: 10, days: 150, currentDay: 15 }
];

const DAILY_VERSE_REFERENCES: DailyVerseReference[] = [
  { book: 'João', chapter: 3, verse: 16 },
  { book: 'Romanos', chapter: 8, verse: 1 },
  { book: 'Salmos', chapter: 23, verse: 1 },
  { book: 'Efésios', chapter: 2, verse: 8 },
  { book: 'Isaías', chapter: 40, verse: 31 },
  { book: 'Filipenses', chapter: 4, verse: 6 },
  { book: 'Hebreus', chapter: 4, verse: 16 },
  { book: '2 Coríntios', chapter: 5, verse: 17 },
  { book: 'Lamentações', chapter: 3, verse: 22 },
  { book: 'Provérbios', chapter: 3, verse: 5 },
  { book: 'Josué', chapter: 1, verse: 9 },
  { book: 'Mateus', chapter: 11, verse: 28 },
  { book: 'Salmos', chapter: 119, verse: 105 },
  { book: 'Romanos', chapter: 12, verse: 2 },
  { book: 'Isaías', chapter: 26, verse: 3 },
  { book: '1 Pedro', chapter: 5, verse: 7 },
  { book: 'Gálatas', chapter: 2, verse: 20 },
  { book: 'João', chapter: 14, verse: 6 },
  { book: 'Tiago', chapter: 1, verse: 5 },
  { book: 'Apocalipse', chapter: 21, verse: 4 },
];

const getDailyReferenceIndex = (date: Date) => {
  const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash = ((hash << 5) - hash + dayKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % DAILY_VERSE_REFERENCES.length;
};

const getPlanReferenceTarget = (plan: ReadingPlan): PlanReferenceTarget => {
  if (plan.id === 'psalms') {
    const chapter = Math.max(1, Math.min(150, plan.currentDay));
    return {
      bookName: 'Salmos',
      chapter,
      verse: 1,
      label: `Salmos ${chapter}:1`
    };
  }

  if (plan.id === 'reformation') {
    const references = [
      'Romanos 8:1', 'Efésios 2:8', 'Gálatas 2:20', 'João 17:17', 'Hebreus 11:1',
      'Salmos 119:105', '2 Timóteo 3:16', 'Atos 4:12', 'Filipenses 2:12', 'Tito 2:11'
    ];
    const pick = references[(plan.currentDay - 1) % references.length];
    const match = pick.match(/^(.+)\s(\d+):(\d+)$/);
    if (match) {
      return {
        bookName: match[1],
        chapter: parseInt(match[2], 10),
        verse: parseInt(match[3], 10),
        label: pick
      };
    }
  }

  const dayIndex = Math.max(0, plan.currentDay - 1);
  const book = BOOKS[dayIndex % BOOKS.length];
  const chapter = Math.min(book.chapters, Math.floor(dayIndex / BOOKS.length) + 1);
  return {
    bookName: book.name,
    chapter,
    verse: 1,
    label: `${book.name} ${chapter}:1`
  };
};

const buildChapterSequence = (
  startBookName: string,
  startChapter: number,
  endBookName: string,
  endChapter: number
) => {
  const startBookIndex = BOOKS.findIndex(book => book.name === startBookName);
  const endBookIndex = BOOKS.findIndex(book => book.name === endBookName);
  if (startBookIndex < 0 || endBookIndex < 0) return [] as Array<{ bookName: string; chapter: number }>;

  const sequence: Array<{ bookName: string; chapter: number }> = [];
  for (let bookIndex = startBookIndex; bookIndex <= endBookIndex; bookIndex += 1) {
    const book = BOOKS[bookIndex];
    const chapterStart = bookIndex === startBookIndex ? startChapter : 1;
    const chapterEnd = bookIndex === endBookIndex ? endChapter : book.chapters;

    for (let chapter = chapterStart; chapter <= chapterEnd; chapter += 1) {
      sequence.push({ bookName: book.name, chapter });
    }
  }

  return sequence;
};

const buildScheduleFromSequence = (
  sequence: Array<{ bookName: string; chapter: number }>,
  chaptersPerDay: number
) => {
  const schedule: CustomPlanScheduleItem[] = [];
  for (let i = 0; i < sequence.length; i += chaptersPerDay) {
    const chunk = sequence.slice(i, i + chaptersPerDay);
    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    schedule.push({
      day: schedule.length + 1,
      startBook: first.bookName,
      startChapter: first.chapter,
      endBook: last.bookName,
      endChapter: last.chapter,
      label: first.bookName === last.bookName
        ? `${first.bookName} ${first.chapter}-${last.chapter}`
        : `${first.bookName} ${first.chapter} - ${last.bookName} ${last.chapter}`,
    });
  }
  return schedule;
};

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const inputDateToTimestamp = (value: string) => {
  if (!value) return Date.now();
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
};

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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-safe z-50 lg:top-0 lg:bottom-0 lg:right-auto lg:w-24 lg:border-t-0 lg:border-r lg:pb-0">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2 lg:h-full lg:max-w-none lg:flex-col lg:justify-start lg:pt-6 lg:gap-2 lg:px-3">
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
                "flex flex-col items-center justify-center w-full h-full transition-all relative lg:h-auto lg:py-3 lg:rounded-2xl",
                isActive ? "text-petrol-500 dark:text-petrol-100" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-1 w-8 h-1 bg-petrol-500 dark:bg-petrol-100 rounded-full lg:top-auto lg:left-0 lg:w-1 lg:h-8 lg:rounded-r-full lg:rounded-l-none"
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
        <h1 className="text-lg font-bold tracking-tight text-petrol-900 dark:text-white truncate max-w-[200px] md:max-w-none">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </div>
  </header>
);

// --- Screens ---

const HomeScreen = ({
  onNavigate,
  onOpenPlan,
}: {
  onNavigate: (s: Screen) => void;
  onOpenPlan: (plan: ReadingPlan) => void;
}) => {
  const [verse, setVerse] = useState({ text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...", ref: "João 3:16" });
  const [lastReadingLocation, setLastReadingLocation] = useState<{ label: string; createdAt: number } | null>(null);

  useEffect(() => {
    let active = true;

    const loadVerseOfTheDay = async () => {
      try {
        const index = getDailyReferenceIndex(new Date());
        const dailyRef = DAILY_VERSE_REFERENCES[index];
        const preferredVersion = localStorage.getItem('preferred-bible-version') || 'ARC';

        const loadFromVersion = async (version: string) => {
          const chapterVerses = await getLocalBibleChapterLazy(dailyRef.book, dailyRef.chapter, version);
          const verseItem = chapterVerses.find(item => item.verse === dailyRef.verse);
          return verseItem?.text?.trim() || null;
        };

        const verseText = (await loadFromVersion(preferredVersion))
          || (preferredVersion !== 'ARC' ? await loadFromVersion('ARC') : null);

        if (!active || !verseText) return;

        setVerse({
          text: verseText,
          ref: `${dailyRef.book} ${dailyRef.chapter}:${dailyRef.verse}`,
        });
      } catch {
        // Keep default fallback verse if daily loading fails.
      }
    };

    void loadVerseOfTheDay();

    try {
      const locations = JSON.parse(localStorage.getItem('reading-locations') || '[]') as Array<{ label: string; createdAt: number }>;
      setLastReadingLocation(locations[0] ?? null);
    } catch {
      setLastReadingLocation(null);
    }

    return () => {
      active = false;
    };
  }, []);

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

  const handleResumeReading = () => {
    localStorage.setItem('pending-bible-resume', '1');
    onNavigate('bible');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-10 animate-fade-in">
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

      {lastReadingLocation && (
        <button
          onClick={handleResumeReading}
          className="w-full text-left p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-all"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-petrol-500">Continuar de onde parou</p>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{lastReadingLocation.label}</p>
          <p className="text-xs text-gray-500 mt-1">Último acesso em {new Date(lastReadingLocation.createdAt).toLocaleString()}</p>
        </button>
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
          {READING_PLANS.map(plan => {
            const todayTarget = getPlanReferenceTarget(plan);
            return (
            <div key={plan.id} className="flex-shrink-0 w-64 p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-petrol-50 dark:bg-petrol-900/30 text-petrol-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-400">Dia {plan.currentDay}/{plan.days}</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">{plan.title}</h3>
              <p className="text-[11px] font-semibold text-petrol-600 dark:text-petrol-300 mb-3">Hoje: {todayTarget.label}</p>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${plan.progress}%` }}
                  className="h-full bg-petrol-500"
                />
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{plan.progress}% Concluído</span>
                <button onClick={() => onOpenPlan(plan)} className="text-xs font-bold text-petrol-500">Continuar</button>
              </div>
            </div>
          );})}
        </div>
      </section>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

const ReadingPlansScreen = ({
  onBack,
  onOpenPlan,
  onOpenBibleTarget,
}: {
  onBack: () => void;
  onOpenPlan: (plan: ReadingPlan) => void;
  onOpenBibleTarget: (target: PlanReferenceTarget, eventLabel: string) => void;
}) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{ title: string, days: { day: number, reference: string, focus: string }[] } | null>(null);
  const [customPlans, setCustomPlans] = useState<CustomReadingPlan[]>(() => {
    try {
      const saved = localStorage.getItem('custom-reading-plans-v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customTitle, setCustomTitle] = useState('Meu Plano Personalizado');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState<'book' | 'portion'>('book');
  const [selectedBook, setSelectedBook] = useState(BOOKS[0].name);
  const [startBook, setStartBook] = useState(BOOKS[0].name);
  const [startChapter, setStartChapter] = useState(1);
  const [endBook, setEndBook] = useState(BOOKS[0].name);
  const [endChapter, setEndChapter] = useState(BOOKS[0].chapters);
  const [chaptersPerDay, setChaptersPerDay] = useState(2);
  const [minutesPerChapter, setMinutesPerChapter] = useState(7);
  const [customStartDate, setCustomStartDate] = useState(toInputDate(new Date()));
  const [customPlanError, setCustomPlanError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('custom-reading-plans-v1', JSON.stringify(customPlans));
  }, [customPlans]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const plan = await generateReadingPlanLazy(topic);
    setGeneratedPlan(plan);
    setLoading(false);
  };

  const createCustomPlan = () => {
    const safeChaptersPerDay = Math.max(1, chaptersPerDay);
    const safeMinutesPerChapter = Math.max(1, minutesPerChapter);
    const safeStartDate = customStartDate || toInputDate(new Date());
    let sourceStartBook = startBook;
    let sourceStartChapter = startChapter;
    let sourceEndBook = endBook;
    let sourceEndChapter = endChapter;

    let chapterSequence: Array<{ bookName: string; chapter: number }> = [];
    if (customMode === 'book') {
      const book = BOOKS.find(item => item.name === selectedBook);
      if (!book) {
        setCustomPlanError('Livro inválido para criação do plano.');
        return;
      }
      sourceStartBook = book.name;
      sourceStartChapter = 1;
      sourceEndBook = book.name;
      sourceEndChapter = book.chapters;
      chapterSequence = buildChapterSequence(book.name, 1, book.name, book.chapters);
    } else {
      const startBookIndex = BOOKS.findIndex(item => item.name === startBook);
      const endBookIndex = BOOKS.findIndex(item => item.name === endBook);
      if (startBookIndex < 0 || endBookIndex < 0 || endBookIndex < startBookIndex) {
        setCustomPlanError('Faixa de porção inválida. Verifique livro inicial e final.');
        return;
      }

      const startBookData = BOOKS[startBookIndex];
      const endBookData = BOOKS[endBookIndex];
      const boundedStartChapter = Math.min(Math.max(1, startChapter), startBookData.chapters);
      const boundedEndChapter = Math.min(Math.max(1, endChapter), endBookData.chapters);

      if (startBookIndex === endBookIndex && boundedEndChapter < boundedStartChapter) {
        setCustomPlanError('No mesmo livro, o capítulo final deve ser maior ou igual ao inicial.');
        return;
      }

      sourceStartBook = startBook;
      sourceStartChapter = boundedStartChapter;
      sourceEndBook = endBook;
      sourceEndChapter = boundedEndChapter;
      chapterSequence = buildChapterSequence(startBook, boundedStartChapter, endBook, boundedEndChapter);
    }

    if (chapterSequence.length === 0) {
      setCustomPlanError('Não foi possível montar a sequência de leitura para esse plano.');
      return;
    }

    const schedule = buildScheduleFromSequence(chapterSequence, safeChaptersPerDay);
    const totalChapters = chapterSequence.length;
    const estimatedDays = schedule.length;
    const estimatedHours = Number(((totalChapters * safeMinutesPerChapter) / 60).toFixed(1));

    const currentPlan = editingPlanId ? customPlans.find(item => item.id === editingPlanId) : null;

    const plan: CustomReadingPlan = {
      id: currentPlan?.id || `${Date.now()}`,
      title: customTitle.trim() || 'Plano Personalizado',
      mode: customMode,
      sourceStartBook,
      sourceStartChapter,
      sourceEndBook,
      sourceEndChapter,
      totalChapters,
      chaptersPerDay: safeChaptersPerDay,
      minutesPerChapter: safeMinutesPerChapter,
      estimatedDays,
      estimatedHours,
      startDate: safeStartDate,
      createdAt: currentPlan?.createdAt || Date.now(),
      schedule,
    };

    setCustomPlanError(null);
    setCustomPlans(prev => {
      if (editingPlanId) {
        return prev.map(item => item.id === editingPlanId ? plan : item);
      }
      return [plan, ...prev].slice(0, 20);
    });

    setEditingPlanId(null);
    setCustomTitle('Meu Plano Personalizado');
    setCustomMode('book');
    setSelectedBook(BOOKS[0].name);
    setStartBook(BOOKS[0].name);
    setStartChapter(1);
    setEndBook(BOOKS[0].name);
    setEndChapter(BOOKS[0].chapters);
    setChaptersPerDay(2);
    setMinutesPerChapter(7);
    setCustomStartDate(toInputDate(new Date()));
  };

  const getCurrentPlanDay = (plan: CustomReadingPlan) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startTimestamp = plan.startDate ? inputDateToTimestamp(plan.startDate) : plan.createdAt;
    const elapsedDays = Math.floor((now.getTime() - startTimestamp) / (24 * 60 * 60 * 1000));
    return Math.min(plan.estimatedDays, Math.max(1, elapsedDays + 1));
  };

  const editCustomPlan = (plan: CustomReadingPlan) => {
    const fallbackStartBook = plan.schedule[0]?.startBook || BOOKS[0].name;
    const fallbackStartChapter = plan.schedule[0]?.startChapter || 1;
    const fallbackEndBook = plan.schedule[plan.schedule.length - 1]?.endBook || BOOKS[0].name;
    const fallbackEndChapter = plan.schedule[plan.schedule.length - 1]?.endChapter || BOOKS[0].chapters;

    setEditingPlanId(plan.id);
    setCustomTitle(plan.title);
    setCustomMode(plan.mode);
    setSelectedBook(plan.sourceStartBook || fallbackStartBook);
    setStartBook(plan.sourceStartBook || fallbackStartBook);
    setStartChapter(plan.sourceStartChapter || fallbackStartChapter);
    setEndBook(plan.sourceEndBook || fallbackEndBook);
    setEndChapter(plan.sourceEndChapter || fallbackEndChapter);
    setChaptersPerDay(plan.chaptersPerDay);
    setMinutesPerChapter(plan.minutesPerChapter);
    setCustomStartDate(plan.startDate || toInputDate(new Date(plan.createdAt)));
    setCustomPlanError(null);
  };

  const cancelCustomPlanEdition = () => {
    setEditingPlanId(null);
    setCustomTitle('Meu Plano Personalizado');
    setCustomMode('book');
    setSelectedBook(BOOKS[0].name);
    setStartBook(BOOKS[0].name);
    setStartChapter(1);
    setEndBook(BOOKS[0].name);
    setEndChapter(BOOKS[0].chapters);
    setChaptersPerDay(2);
    setMinutesPerChapter(7);
    setCustomStartDate(toInputDate(new Date()));
    setCustomPlanError(null);
  };

  const openCustomPlanToday = (plan: CustomReadingPlan) => {
    const currentDay = getCurrentPlanDay(plan);
    const segment = plan.schedule[Math.min(currentDay - 1, plan.schedule.length - 1)];
    onOpenBibleTarget(
      {
        bookName: segment.startBook,
        chapter: segment.startChapter,
        verse: 1,
        label: `${segment.startBook} ${segment.startChapter}:1`
      },
      `Plano personalizado ${plan.title} dia ${currentDay}`
    );
  };

  const removeCustomPlan = (planId: string) => {
    setCustomPlans(prev => prev.filter(plan => plan.id !== planId));
  };

  return (
    <div className="animate-fade-in h-full min-h-0 flex flex-col">
      <Header title="Planos de Leitura" showBack onBack={onBack} />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch] p-4 space-y-6 pb-40 bg-paper-50 dark:bg-navy-900">
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

        {READING_PLANS.map(plan => {
          const todayTarget = getPlanReferenceTarget(plan);
          return (
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
            <p className="text-xs font-semibold text-petrol-600 dark:text-petrol-300 mb-3">Hoje: {todayTarget.label}</p>
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
            <button onClick={() => onOpenPlan(plan)} className="w-full mt-6 py-4 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/20 active:scale-[0.98] transition-all">
              Continuar Leitura
            </button>
          </div>
        );})}

        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Criar plano personalizado</h3>
          <p className="text-sm text-gray-500">Monte seu plano por livro inteiro ou por uma porção da Bíblia e veja em quanto tempo conclui.</p>

          {editingPlanId && (
            <div className="rounded-2xl border border-petrol-200 bg-petrol-50/70 dark:bg-petrol-900/20 dark:border-petrol-700 p-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-petrol-700 dark:text-petrol-200">Você está editando um plano personalizado.</p>
              <button onClick={cancelCustomPlanEdition} className="text-xs font-bold text-petrol-700 dark:text-petrol-200">Cancelar</button>
            </div>
          )}

          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Nome do plano"
            className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-gray-500">
              Tipo
              <select
                value={customMode}
                onChange={(e) => setCustomMode(e.target.value as 'book' | 'portion')}
                className="mt-1 w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm text-gray-700 dark:text-gray-200"
              >
                <option value="book">Livro completo</option>
                <option value="portion">Porção personalizada</option>
              </select>
            </label>

            <label className="text-xs text-gray-500">
              Capítulos por dia
              <input
                type="number"
                min={1}
                value={chaptersPerDay}
                onChange={(e) => setChaptersPerDay(parseInt(e.target.value || '1', 10))}
                className="mt-1 w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
              />
            </label>
          </div>

          <label className="text-xs text-gray-500 block">
            Minutos estimados por capítulo
            <input
              type="number"
              min={1}
              value={minutesPerChapter}
              onChange={(e) => setMinutesPerChapter(parseInt(e.target.value || '1', 10))}
              className="mt-1 w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
            />
          </label>

          <label className="text-xs text-gray-500 block">
            Data de início do plano
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="mt-1 w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
            />
          </label>

          {customMode === 'book' ? (
            <label className="text-xs text-gray-500 block">
              Livro
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="mt-1 w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm text-gray-700 dark:text-gray-200"
              >
                {BOOKS.map(book => (
                  <option key={book.name} value={book.name}>{book.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 block">
                  Livro inicial
                  <select
                    value={startBook}
                    onChange={(e) => {
                      const bookName = e.target.value;
                      const book = BOOKS.find(item => item.name === bookName);
                      setStartBook(bookName);
                      if (book) setStartChapter(prev => Math.min(prev, book.chapters));
                    }}
                    className="mt-1 w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm text-gray-700 dark:text-gray-200"
                  >
                    {BOOKS.map(book => (
                      <option key={book.name} value={book.name}>{book.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-gray-500 block">
                  Capítulo inicial
                  <input
                    type="number"
                    min={1}
                    max={BOOKS.find(item => item.name === startBook)?.chapters || 1}
                    value={startChapter}
                    onChange={(e) => setStartChapter(parseInt(e.target.value || '1', 10))}
                    className="mt-1 w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
                  />
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 block">
                  Livro final
                  <select
                    value={endBook}
                    onChange={(e) => {
                      const bookName = e.target.value;
                      const book = BOOKS.find(item => item.name === bookName);
                      setEndBook(bookName);
                      if (book) setEndChapter(prev => Math.min(prev, book.chapters));
                    }}
                    className="mt-1 w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm text-gray-700 dark:text-gray-200"
                  >
                    {BOOKS.map(book => (
                      <option key={book.name} value={book.name}>{book.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-gray-500 block">
                  Capítulo final
                  <input
                    type="number"
                    min={1}
                    max={BOOKS.find(item => item.name === endBook)?.chapters || 1}
                    value={endChapter}
                    onChange={(e) => setEndChapter(parseInt(e.target.value || '1', 10))}
                    className="mt-1 w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
                  />
                </label>
              </div>
            </div>
          )}

          {customPlanError && (
            <p className="text-xs text-red-500 dark:text-red-400">{customPlanError}</p>
          )}

          <button
            onClick={createCustomPlan}
            className="w-full py-3 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/20 active:scale-[0.98] transition-all"
          >
            {editingPlanId ? 'Salvar alterações do plano' : 'Criar plano personalizado'}
          </button>
        </div>

        {customPlans.map(plan => {
          const currentDay = getCurrentPlanDay(plan);
          const progress = Math.round((currentDay / plan.estimatedDays) * 100);
          const todaySegment = plan.schedule[Math.min(currentDay - 1, plan.schedule.length - 1)];

          return (
            <div key={plan.id} className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{plan.mode === 'book' ? 'Livro completo' : 'Porção personalizada'}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Início: {new Date(inputDateToTimestamp(plan.startDate || toInputDate(new Date(plan.createdAt)))).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => editCustomPlan(plan)}
                    className="text-xs font-bold text-petrol-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removeCustomPlan(plan.id)}
                    className="text-xs font-bold text-gray-500"
                  >
                    Excluir
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-paper-50 dark:bg-navy-900 p-3 border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-400 uppercase font-bold tracking-wider">Prazo estimado</p>
                  <p className="text-sm font-bold text-petrol-600 mt-1">{plan.estimatedDays} dias</p>
                </div>
                <div className="rounded-xl bg-paper-50 dark:bg-navy-900 p-3 border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-400 uppercase font-bold tracking-wider">Tempo de leitura</p>
                  <p className="text-sm font-bold text-petrol-600 mt-1">{plan.estimatedHours} h</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-petrol-600 dark:text-petrol-300 mt-4">Hoje: {todaySegment.label}</p>

              <div className="mt-3">
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <span>Progresso</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-petrol-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <button
                onClick={() => openCustomPlanToday(plan)}
                className="w-full mt-5 py-3 rounded-2xl bg-petrol-500 text-white font-bold shadow-lg shadow-petrol-500/20 active:scale-[0.98] transition-all"
              >
                Continuar plano personalizado
              </button>
            </div>
          );
        })}
        
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

const BibleScreen = ({
  onAddNote,
  availableVersions,
}: {
  onAddNote: (ref: string, content: string) => void;
  availableVersions: string[];
}) => {
  const [book, setBook] = useState(BOOKS[0]);
  const [chapter, setChapter] = useState(1);
  const [version, setVersion] = useState<string>(() => localStorage.getItem('preferred-bible-version') || 'ARC');
  const [showStrongNumbers, setShowStrongNumbers] = useState<boolean>(() => {
    const saved = localStorage.getItem('show-strong-numbers-v1');
    return saved ? saved === '1' : true;
  });
  const [content, setContent] = useState<BibleContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ reference: string, excerpt: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showStrongDictionary, setShowStrongDictionary] = useState(false);
  const [strongDictionaryQuery, setStrongDictionaryQuery] = useState('');
  const [strongDictionaryResults, setStrongDictionaryResults] = useState<DictionaryEntry[]>([]);
  const [isSearchingStrongDictionary, setIsSearchingStrongDictionary] = useState(false);
  const [strongDictionaryError, setStrongDictionaryError] = useState<string | null>(null);
  const [hasStrongDictionarySearch, setHasStrongDictionarySearch] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [showCommentaryModal, setShowCommentaryModal] = useState(false);
  const [commentaryText, setCommentaryText] = useState('');
  const [readingLocations, setReadingLocations] = useState<Array<{ id: string; label: string; bookName: string; chapter: number; verse: number; createdAt: number }>>([]);
  const [pendingVerseJump, setPendingVerseJump] = useState<number | null>(null);
  const [targetVerse, setTargetVerse] = useState('');
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [currentVisibleVerse, setCurrentVisibleVerse] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [scrollButtonsActive, setScrollButtonsActive] = useState(true);
  const [navHistory, setNavHistory] = useState<Array<{ bookName: string; chapter: number }>>([
    { bookName: BOOKS[0].name, chapter: 1 }
  ]);
  const [navHistoryIndex, setNavHistoryIndex] = useState(0);
  const isHistoryNavigation = useRef(false);
  const verseContainerRef = useRef<HTMLDivElement | null>(null);
  const screenScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollButtonsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const verses = useMemo(() => {
    if (!content?.text) return [] as Array<{ number: number; text: string }>;

    const lines = content.text
      .replace(/\r/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const parsed: Array<{ number: number; text: string }> = [];
    let current: { number: number; text: string } | null = null;

    for (const line of lines) {
      const match = line.match(/^(\d+)[\.:]?\s+(.+)$/);
      if (match) {
        if (current) parsed.push(current);
        current = { number: parseInt(match[1], 10), text: match[2].trim() };
      } else if (current) {
        current.text += ` ${line}`;
      }
    }

    if (current) parsed.push(current);
    return parsed;
  }, [content?.text]);

  const subtitleSections = useMemo(() => {
    if (verses.length === 0) return [] as Array<{ id: string; from: number; to: number; title: string }>;

    const maxVerse = verses[verses.length - 1].number;
    const pericopes = getPericopeSections(book.name, chapter, maxVerse);
    if (pericopes.length > 0) {
      return pericopes.map(section => ({
        id: `${section.from}-${section.to}`,
        from: section.from,
        to: section.to,
        title: section.title
      }));
    }

    const sectionSize = 8;
    const sections: Array<{ id: string; from: number; to: number; title: string }> = [];

    for (let i = 0; i < verses.length; i += sectionSize) {
      const chunk = verses.slice(i, i + sectionSize);
      const from = chunk[0].number;
      const to = chunk[chunk.length - 1].number;
      const teaser = chunk[0].text.slice(0, 46).trim();
      const title = teaser.length > 0 ? teaser : `Seção ${sections.length + 1}`;
      sections.push({ id: `${from}-${to}`, from, to, title });
    }

    return sections;
  }, [verses]);

  const renderVerseTextWithStrong = (text: string) => {
    if (!showStrongNumbers) {
      return text.replace(/\{[HG]\d+\}/gi, '').replace(/\s{2,}/g, ' ').trim();
    }

    const parts = text.split(/(\{[HG]\d+\})/gi).filter(Boolean);
    return parts.map((part, index) => {
      const strongMatch = part.match(/^\{([HG]\d+)\}$/i);
      if (strongMatch) {
        return (
          <sup
            key={`${part}-${index}`}
            className="ml-1 align-super text-[0.62em] font-bold text-petrol-600 dark:text-petrol-300"
            title={`Strong ${strongMatch[1].toUpperCase()}`}
          >
            {strongMatch[1].toUpperCase()}
          </sup>
        );
      }
      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    });
  };

  const activeCommentaryKey = useMemo(() => {
  const typedVerse = parseInt(targetVerse, 10);

  const safeVerse =
    currentVisibleVerse ??
    (!Number.isNaN(typedVerse) && typedVerse > 0 ? typedVerse : 1);

  return `${book.name}|${chapter}|${safeVerse}`;
}, [book.name, chapter, currentVisibleVerse, targetVerse]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const results = await searchBibleLazy(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca bíblica:', error);
      setSearchResults([]);
      setSearchError('Não foi possível concluir a busca agora. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookFilterChange = (bookName: string) => {
    const selected = BOOKS.find(b => b.name === bookName);
    if (!selected) return;
    setBook(selected);
    setChapter(prev => Math.min(prev, selected.chapters));
  };

  const handleStrongDictionarySearch = async () => {
    const query = strongDictionaryQuery.trim();
    if (!query) return;

    setIsSearchingStrongDictionary(true);
    setStrongDictionaryError(null);
    setHasStrongDictionarySearch(true);

    try {
      const results = await searchInDictionary(query);
      setStrongDictionaryResults(results);
    } catch (error) {
      console.error('Erro na busca do dicionário Strong:', error);
      setStrongDictionaryResults([]);
      setStrongDictionaryError('Não foi possível consultar o dicionário agora. Tente novamente.');
    } finally {
      setIsSearchingStrongDictionary(false);
    }
  };

  const handleChapterFilterChange = (chapterValue: number) => {
    if (Number.isNaN(chapterValue)) return;
    setChapter(Math.max(1, Math.min(chapterValue, book.chapters)));
  };

  const goToPreviousBook = () => {
    const currentBookIndex = BOOKS.findIndex(b => b.name === book.name);
    if (currentBookIndex <= 0) return;
    const previousBook = BOOKS[currentBookIndex - 1];
    setBook(previousBook);
    setChapter(prev => Math.min(prev, previousBook.chapters));
  };

  const goToNextBook = () => {
    const currentBookIndex = BOOKS.findIndex(b => b.name === book.name);
    if (currentBookIndex < 0 || currentBookIndex >= BOOKS.length - 1) return;
    const nextBook = BOOKS[currentBookIndex + 1];
    setBook(nextBook);
    setChapter(prev => Math.min(prev, nextBook.chapters));
  };

  const goToPreviousChapter = () => {
    if (chapter > 1) {
      setChapter(chapter - 1);
      return;
    }

    const currentBookIndex = BOOKS.findIndex(b => b.name === book.name);
    if (currentBookIndex > 0) {
      const previousBook = BOOKS[currentBookIndex - 1];
      setBook(previousBook);
      setChapter(previousBook.chapters);
    }
  };

  const goToNextChapter = () => {
    if (chapter < book.chapters) {
      setChapter(chapter + 1);
      return;
    }

    const currentBookIndex = BOOKS.findIndex(b => b.name === book.name);
    if (currentBookIndex >= 0 && currentBookIndex < BOOKS.length - 1) {
      const nextBook = BOOKS[currentBookIndex + 1];
      setBook(nextBook);
      setChapter(1);
    }
  };

  const navigateHistoryBack = () => {
    if (navHistoryIndex <= 0) return;
    const nextIndex = navHistoryIndex - 1;
    const target = navHistory[nextIndex];
    const targetBook = BOOKS.find(b => b.name === target.bookName);
    if (!targetBook) return;
    isHistoryNavigation.current = true;
    setNavHistoryIndex(nextIndex);
    setBook(targetBook);
    setChapter(target.chapter);
  };

  const navigateHistoryForward = () => {
    if (navHistoryIndex >= navHistory.length - 1) return;
    const nextIndex = navHistoryIndex + 1;
    const target = navHistory[nextIndex];
    const targetBook = BOOKS.find(b => b.name === target.bookName);
    if (!targetBook) return;
    isHistoryNavigation.current = true;
    setNavHistoryIndex(nextIndex);
    setBook(targetBook);
    setChapter(target.chapter);
  };

  const goToVerse = (verseNumber: number) => {
    if (verseNumber < 1) return;
    const verseElement = verseContainerRef.current?.querySelector<HTMLElement>(`[data-verse-number="${verseNumber}"]`);
    if (!verseElement) return;

    setHighlightedVerse(verseNumber);
    verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedVerse(current => (current === verseNumber ? null : current)), 1400);
  };

  const handleGoToVerse = () => {
    const verseNumber = parseInt(targetVerse, 10);
    if (Number.isNaN(verseNumber)) return;
    goToVerse(verseNumber);
  };

  const goToRandomVerse = () => {
    if (verses.length === 0) return;
    const randomIndex = Math.floor(Math.random() * verses.length);
    const verseNumber = verses[randomIndex].number;
    setTargetVerse(String(verseNumber));
    goToVerse(verseNumber);
  };

  const saveCurrentLocation = () => {
  const typedVerse = parseInt(targetVerse, 10);

  const safeVerse =
    currentVisibleVerse ??
    (!Number.isNaN(typedVerse) && typedVerse > 0 ? typedVerse : 1);

  setReadingLocations(prev => {
    const entry = {
      id: `${Date.now()}`,
      label: `${book.name} ${chapter}:${safeVerse}`,
      bookName: book.name,
      chapter,
      verse: safeVerse,
      createdAt: Date.now()
    };

    const filtered = prev.filter(
      loc =>
        !(
          loc.bookName === entry.bookName &&
          loc.chapter === entry.chapter &&
          loc.verse === entry.verse
        )
    );

    const next = [entry, ...filtered].slice(0, 30);

    localStorage.setItem(
      'reading-locations',
      JSON.stringify(next)
    );

    return next;
  });
};

  const restoreLocation = (location: { bookName: string; chapter: number; verse: number }) => {
    const foundBook = BOOKS.find(b => b.name === location.bookName);
    if (!foundBook) return;

    setBook(foundBook);
    setChapter(Math.max(1, Math.min(location.chapter, foundBook.chapters)));
    setTargetVerse(String(location.verse));
    setPendingVerseJump(location.verse);
    setShowLocationsModal(false);
  };

  const removeLocation = (id: string) => {
    setReadingLocations(prev => {
      const next = prev.filter(loc => loc.id !== id);
      localStorage.setItem('reading-locations', JSON.stringify(next));
      return next;
    });
  };

  const openCommentaryModal = () => {
    const allCommentary = JSON.parse(localStorage.getItem('verse-commentary') || '{}') as Record<string, string>;
    setCommentaryText(allCommentary[activeCommentaryKey] || '');
    setShowCommentaryModal(true);
  };

  const saveCommentary = () => {
    const allCommentary = JSON.parse(localStorage.getItem('verse-commentary') || '{}') as Record<string, string>;
    allCommentary[activeCommentaryKey] = commentaryText;
    localStorage.setItem('verse-commentary', JSON.stringify(allCommentary));
    setShowCommentaryModal(false);
  };

  const selectReference = (ref: string) => {
  // Basic parser for "Book Chapter:Verse" or "Book Chapter"
  const parts = ref.trim().split(' ');
  const chapterPart = parts.pop();
  const bookName = parts.join(' ');

  const foundBook = BOOKS.find(
    b => b.name.toLowerCase() === bookName.toLowerCase()
  );

  if (foundBook) {
    setBook(foundBook);

    const [chapterText, verseText] = (chapterPart || '1').split(':');
    const c = parseInt(chapterText || '1', 10);
    const v = verseText ? parseInt(verseText, 10) : null;

    setChapter(c);

    if (v !== null && !Number.isNaN(v)) {
      setTargetVerse(String(v));
      setPendingVerseJump(v);
    }

    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setHasSearched(false);
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
    setLoadError(null);

    try {
      const res = await getBibleContentLazy(`${b.name} ${c}`, version);
      setContent(res);
    } catch (error) {
      console.error('Falha ao carregar conteúdo bíblico:', error);
      setLoadError('Não foi possível carregar este capítulo agora. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(book, chapter);
  }, [book, chapter, version]);

  useEffect(() => {
    if (availableVersions.length === 0) return;
    if (!availableVersions.includes(version)) {
      setVersion(availableVersions[0]);
    }
  }, [availableVersions, version]);

  useEffect(() => {
    localStorage.setItem('preferred-bible-version', version);
  }, [version]);

  useEffect(() => {
    localStorage.setItem('show-strong-numbers-v1', showStrongNumbers ? '1' : '0');
  }, [showStrongNumbers]);

  useEffect(() => {
    const savedLocations = JSON.parse(localStorage.getItem('reading-locations') || '[]') as Array<{ id: string; label: string; bookName: string; chapter: number; verse: number; createdAt: number }>;
    setReadingLocations(savedLocations);
  }, []);

  useEffect(() => {
    const pendingRaw = localStorage.getItem('pending-bible-target');
    if (!pendingRaw) return;
    localStorage.removeItem('pending-bible-target');

    try {
      const pending = JSON.parse(pendingRaw) as { bookName: string; chapter: number; verse: number };
      const foundBook = BOOKS.find(b => b.name === pending.bookName);
      if (!foundBook) return;

      setBook(foundBook);
      setChapter(Math.max(1, Math.min(pending.chapter, foundBook.chapters)));
      setTargetVerse(String(pending.verse || 1));
      setPendingVerseJump(pending.verse || 1);
    } catch {
      // Ignore malformed target payload.
    }
  }, []);

  useEffect(() => {
    const shouldResume = localStorage.getItem('pending-bible-resume') === '1';
    if (!shouldResume) return;
    localStorage.removeItem('pending-bible-resume');

    try {
      const savedLocations = JSON.parse(localStorage.getItem('reading-locations') || '[]') as Array<{ bookName: string; chapter: number; verse: number }>;
      const latest = savedLocations[0];
      if (!latest) return;

      const foundBook = BOOKS.find(b => b.name === latest.bookName);
      if (!foundBook) return;

      setBook(foundBook);
      setChapter(Math.max(1, Math.min(latest.chapter, foundBook.chapters)));
      setTargetVerse(String(latest.verse));
      setPendingVerseJump(latest.verse);
    } catch {
      // Ignore malformed persisted locations.
    }
  }, []);

  useEffect(() => {
    if (!pendingVerseJump || verses.length === 0) return;
    const exists = verses.some(v => v.number === pendingVerseJump);
    if (!exists) {
      setPendingVerseJump(null);
      return;
    }

    goToVerse(pendingVerseJump);
    setPendingVerseJump(null);
  }, [pendingVerseJump, verses]);

  useEffect(() => {
    const currentRef = { bookName: book.name, chapter };

    if (isHistoryNavigation.current) {
      isHistoryNavigation.current = false;
      return;
    }

    const current = navHistory[navHistoryIndex];
    if (current && current.bookName === currentRef.bookName && current.chapter === currentRef.chapter) {
      return;
    }

    setNavHistory(prev => {
      const sliced = prev.slice(0, navHistoryIndex + 1);
      return [...sliced, currentRef];
    });
    setNavHistoryIndex(prev => prev + 1);
  }, [book, chapter]);

  useEffect(() => {
    const container = screenScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
  const maxScrollTop = container.scrollHeight - container.clientHeight;

  setShowScrollTop(container.scrollTop > 220);
  setShowScrollBottom(container.scrollTop < maxScrollTop - 120);
  setScrollButtonsActive(true);

  // Detecta o versículo atualmente mais próximo do centro da área de leitura.
  const verseElements = Array.from(
    verseContainerRef.current?.querySelectorAll<HTMLElement>('[data-verse-number]') || []
  );

  if (verseElements.length > 0) {
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    let closestVerse: number | null = null;
    let closestDistance = Infinity;

    verseElements.forEach(element => {
      const rect = element.getBoundingClientRect();

      // Ignora versículos que estão completamente fora da área visível.
      if (rect.bottom < containerRect.top || rect.top > containerRect.bottom) {
        return;
      }

      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        const verseNumber = Number(element.dataset.verseNumber);

        if (Number.isFinite(verseNumber) && verseNumber > 0) {
          closestVerse = verseNumber;
        }
      }
    });

    if (closestVerse !== null) {
      setCurrentVisibleVerse(closestVerse);
    }
  }

  if (scrollButtonsTimerRef.current) {
    clearTimeout(scrollButtonsTimerRef.current);
  }

  scrollButtonsTimerRef.current = setTimeout(
    () => setScrollButtonsActive(false),
    1200
  );
};

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollButtonsTimerRef.current) clearTimeout(scrollButtonsTimerRef.current);
    };
  }, [content, analysis, isFocusMode, showSearch]);

  const scrollToTop = () => {
    screenScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const container = screenScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  };

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
      const res = await getTheologicalAnalysisLazy(content.text);
      setAnalysis(res);
    } catch (error) {
      console.error('Falha ao gerar análise:', error);
      setAnalysis('Não foi possível gerar a análise agora. Tente novamente em instantes.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-paper-50 dark:bg-navy-900 transition-all", isFocusMode && "bg-white dark:bg-black")}>
      {!isFocusMode && (
        <Header 
          title={`${book.name} ${chapter}`} 
          actions={
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800">
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSubtitles(prev => !prev)}
                className={cn("p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800", showSubtitles && "text-petrol-500")}
                aria-label="Subtítulos"
              >
                <Layers className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowStrongNumbers(prev => !prev)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider border",
                  showStrongNumbers
                    ? "text-petrol-600 border-petrol-200 bg-petrol-50 dark:bg-petrol-900/30 dark:border-petrol-700"
                    : "text-gray-500 border-gray-200 bg-white dark:bg-navy-900 dark:border-gray-700"
                )}
                aria-label="Mostrar ou ocultar números Strong"
                title="Mostrar ou ocultar números Strong"
              >
                STR
              </button>
              <button
                onClick={() => setShowStrongDictionary(prev => !prev)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider border",
                  showStrongDictionary
                    ? "text-petrol-600 border-petrol-200 bg-petrol-50 dark:bg-petrol-900/30 dark:border-petrol-700"
                    : "text-gray-500 border-gray-200 bg-white dark:bg-navy-900 dark:border-gray-700"
                )}
                aria-label="Abrir consulta de dicionário Strong"
                title="Abrir consulta de dicionário Strong"
              >
                LEX
              </button>
              <button
                onClick={navigateHistoryBack}
                disabled={navHistoryIndex <= 0}
                className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800 disabled:opacity-35"
                aria-label="Navegação para trás"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={navigateHistoryForward}
                disabled={navHistoryIndex >= navHistory.length - 1}
                className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800 disabled:opacity-35"
                aria-label="Navegação para frente"
              >
                <ChevronRight className="w-5 h-5" />
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
              <button onClick={() => setShowLocationsModal(true)} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800" aria-label="Locais de leitura">
                <MapPin className="w-5 h-5" />
              </button>
              <button onClick={openCommentaryModal} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800" aria-label="Janela de comentário">
                <MessageSquare className="w-5 h-5" />
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
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

          {searchError && (
            <p className="mt-3 text-xs text-red-500 dark:text-red-400">{searchError}</p>
          )}

          {!isSearching && hasSearched && !searchError && searchResults.length === 0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Nenhum resultado encontrado para essa busca.</p>
          )}
        </div>
      )}

      {!isFocusMode && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-paper-50/95 dark:bg-navy-900/95 backdrop-blur-sm">
          <div className="max-w-6xl xl:max-w-[1280px] mx-auto space-y-2.5">
            <div className="grid grid-cols-[auto_1fr_auto] gap-2">
              <button
                onClick={goToPreviousBook}
                className="rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 text-gray-700 dark:text-gray-200 active:scale-95 transition-transform"
                aria-label="Livro anterior"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Livro</label>
                <select
                  value={book.name}
                  onChange={(e) => handleBookFilterChange(e.target.value)}
                  className="w-full rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  {BOOKS.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={goToNextBook}
                className="rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 text-gray-700 dark:text-gray-200 active:scale-95 transition-transform"
                aria-label="Próximo livro"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
            <div className="space-y-1 lg:col-span-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Capítulo</label>
              <div className="grid grid-cols-[auto_1fr_auto] gap-2">
                <button
                  onClick={goToPreviousChapter}
                  className="rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 text-gray-700 dark:text-gray-200 active:scale-95 transition-transform"
                  aria-label="Capítulo anterior"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <select
                  value={chapter}
                  onChange={(e) => handleChapterFilterChange(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  {Array.from({ length: book.chapters }, (_, i) => i + 1).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={goToNextChapter}
                  className="rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 text-gray-700 dark:text-gray-200 active:scale-95 transition-transform"
                  aria-label="Próximo capítulo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1 lg:col-span-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Versão</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                {availableVersions.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 lg:col-span-5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ir para versículo</label>
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <input
                  value={targetVerse}
                  onChange={(e) => setTargetVerse(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleGoToVerse()}
                  placeholder="Ex: 16"
                  className="w-full rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200"
                />
                <button
                  onClick={handleGoToVerse}
                  className="rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 text-xs font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition-transform"
                >
                  Ir
                </button>
                <button
                  onClick={goToRandomVerse}
                  className="rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 px-3 text-xs font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition-transform"
                >
                  Aleatório
                </button>
              </div>
            </div>
            </div>

            {showSubtitles && subtitleSections.length > 0 && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-navy-800 p-3 max-h-44 overflow-y-auto space-y-2">
                {subtitleSections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setTargetVerse(String(section.from));
                      goToVerse(section.from);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="text-xs font-bold text-petrol-500">{book.name} {chapter}:{section.from}-{section.to}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{section.title}</p>
                  </button>
                ))}
              </div>
            )}

            {showStrongDictionary && (
              <div className="rounded-2xl border border-petrol-200 dark:border-petrol-800 bg-white dark:bg-navy-800 p-3 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-petrol-500">Consulta Strong</p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <input
                    value={strongDictionaryQuery}
                    onChange={(e) => {
                      setStrongDictionaryQuery(e.target.value);
                      if (strongDictionaryError) setStrongDictionaryError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleStrongDictionarySearch()}
                    placeholder="Ex: G26, H430, spirit, covenant"
                    className="w-full rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm"
                  />
                  <button
                    onClick={handleStrongDictionarySearch}
                    disabled={isSearchingStrongDictionary || !strongDictionaryQuery.trim()}
                    className="rounded-xl bg-petrol-500 text-white px-4 py-2.5 text-sm font-bold disabled:opacity-60"
                  >
                    {isSearchingStrongDictionary ? 'Buscando...' : 'Consultar'}
                  </button>
                </div>

                {strongDictionaryError && (
                  <p className="text-xs text-red-500 dark:text-red-400">{strongDictionaryError}</p>
                )}

                {!isSearchingStrongDictionary && hasStrongDictionarySearch && strongDictionaryResults.length === 0 && !strongDictionaryError && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nenhuma entrada encontrada para essa busca.</p>
                )}

                {strongDictionaryResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {strongDictionaryResults.map(entry => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-navy-900/50 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black tracking-wide text-petrol-600 dark:text-petrol-300">{entry.word}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-petrol-500/10 text-petrol-700 dark:text-petrol-200">
                            {entry.category || 'strong'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{entry.definition}</p>
                        <p className="mt-1 text-[10px] text-gray-400">Fonte: {entry.source}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={screenScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch] p-3 sm:p-4 lg:p-5 pb-28 lg:pb-10">
        <div className={cn("max-w-6xl xl:max-w-[1280px] mx-auto space-y-5", isFocusMode && "pt-8") }>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-4 border-petrol-500/30 border-t-petrol-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Abrindo as Escrituras...</p>
            </div>
          ) : content ? (
            <div className="space-y-5">
              <div className="rounded-[1.75rem] bg-[#efe4c8] dark:bg-[#2a241d] border border-[#d7c7a2] dark:border-[#3a3228] shadow-inner px-4 sm:px-5 py-4 sm:py-5">
                {verses.length > 0 ? (
                  <div ref={verseContainerRef} className={cn("space-y-2.5 overflow-y-auto pr-1.5", isFocusMode ? "max-h-[78vh]" : "max-h-[64vh]")}>
                    {verses.map(v => (
                      <p
                        key={`${v.number}-${v.text.slice(0, 24)}`}
                        data-verse-number={v.number}
                        className={cn(
                          "text-[1.7rem] lg:text-[1.85rem] leading-[1.5] tracking-tight text-[#131313] dark:text-[#f1ece2] rounded-xl px-1 transition-colors",
                          highlightedVerse === v.number && "bg-amber-100/70 dark:bg-petrol-900/40"
                        )}
                      >
                        <span className="text-[#1f8d7a] dark:text-[#58d1b9] font-bold mr-2 align-top">{v.number}</span>
                        <span>{renderVerseTextWithStrong(v.text)}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className={cn("prose prose-slate dark:prose-invert max-w-none reading-text leading-loose text-lg overflow-y-auto pr-1.5", isFocusMode ? "max-h-[78vh]" : "max-h-[64vh]")}>
                    <LazyMarkdown>{content.text}</LazyMarkdown>
                  </div>
                )}
              </div>

              {!isFocusMode && (
                <div className="space-y-4 pt-5 border-t border-gray-200 dark:border-gray-800">
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
                        <LazyMarkdown>{analysis}</LazyMarkdown>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 px-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center space-y-4">
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Conteúdo indisponível no momento</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{loadError || 'O capítulo não pôde ser exibido.'}</p>
              <button
                onClick={() => fetchContent(book, chapter)}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-petrol-500 text-white font-semibold"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>

      {!showSelector && !showNoteModal && !showLocationsModal && !showCommentaryModal && (
        <div className={cn("fixed bottom-24 right-4 z-50 flex flex-col gap-2 transition-opacity duration-300 hover:opacity-100", scrollButtonsActive ? "opacity-100" : "opacity-45")}>
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="rounded-full bg-petrol-500 text-white p-3 shadow-lg shadow-petrol-500/30 hover:bg-petrol-600 active:scale-95 transition-all"
              aria-label="Voltar ao topo"
              title="Voltar ao topo"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          )}

          {showScrollBottom && (
            <button
              onClick={scrollToBottom}
              className="rounded-full bg-petrol-500 text-white p-3 shadow-lg shadow-petrol-500/30 hover:bg-petrol-600 active:scale-95 transition-all"
              aria-label="Ir ao fim"
              title="Ir ao fim"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

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

      {/* Reading Locations Modal */}
      <AnimatePresence>
        {showLocationsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[72] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-navy-900 rounded-[32px] p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Locais de leitura</h3>
                <button onClick={() => setShowLocationsModal(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={saveCurrentLocation}
                className="w-full py-3 rounded-2xl bg-petrol-500 text-white font-bold"
              >
                Salvar local atual
              </button>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {readingLocations.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhum local salvo ainda.</p>
                ) : (
                  readingLocations.map(location => (
                    <div key={location.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => restoreLocation(location)}
                        className="text-left flex-1"
                      >
                        <p className="text-sm font-bold text-petrol-500">{location.label}</p>
                        <p className="text-xs text-gray-500">{new Date(location.createdAt).toLocaleString()}</p>
                      </button>
                      <button
                        onClick={() => removeLocation(location.id)}
                        className="px-2 py-1 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800"
                      >
                        Excluir
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commentary Modal */}
      <AnimatePresence>
        {showCommentaryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[71] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-navy-900 rounded-[32px] p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Janela de comentário</h3>
                <button onClick={() => setShowCommentaryModal(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-bold text-petrol-500 uppercase tracking-widest">{activeCommentaryKey.replaceAll('|', ' ')}</p>
              <textarea
                value={commentaryText}
                onChange={(e) => setCommentaryText(e.target.value)}
                placeholder="Adicione seu comentário desta passagem..."
                className="w-full h-44 p-4 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm resize-none"
              />
              <button
                onClick={saveCommentary}
                className="w-full py-4 rounded-2xl bg-petrol-500 text-white font-bold"
              >
                Salvar comentário
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
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

const LibraryScreen = ({
  notes,
  onOpenReference,
  onUpdateNote,
  onDeleteNote,
}: {
  notes: Note[];
  onOpenReference: (reference: string) => void;
  onUpdateNote: (noteId: string, patch: Partial<Pick<Note, 'content' | 'tags' | 'notebook' | 'pinned'>>) => void;
  onDeleteNote: (noteId: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bookFilter, setBookFilter] = useState('all');
  const [notebookFilter, setNotebookFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'reference' | 'pinned'>('recent');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [newNotebook, setNewNotebook] = useState('');
  const [notebookDraftById, setNotebookDraftById] = useState<Record<string, string>>({});
  const [tagDraftById, setTagDraftById] = useState<Record<string, string>>({});

  const getBookFromReference = (reference: string) => {
    const match = reference.match(/^(.*)\s+(\d+)(?::\d+)?$/);
    return match?.[1]?.trim() || reference;
  };

  const normalizedNotes = useMemo(() => {
    return notes.map(note => ({
      ...note,
      tags: note.tags || [],
      notebook: note.notebook || 'Geral',
      pinned: !!note.pinned,
    }));
  }, [notes]);

  const availableBooks = useMemo(() => {
    return Array.from(new Set(normalizedNotes.map(note => getBookFromReference(note.reference)))).sort((a, b) => a.localeCompare(b));
  }, [normalizedNotes]);

  const availableNotebooks = useMemo(() => {
    return Array.from(new Set(normalizedNotes.map(note => note.notebook || 'Geral'))).sort((a, b) => a.localeCompare(b));
  }, [normalizedNotes]);

  const availableTags = useMemo(() => {
    return Array.from(new Set(normalizedNotes.flatMap(note => note.tags || []))).sort((a, b) => a.localeCompare(b));
  }, [normalizedNotes]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const notesThisWeek = normalizedNotes.filter(note => new Date(note.date).getTime() >= sevenDaysAgo).length;
    const pinnedCount = normalizedNotes.filter(note => note.pinned).length;
    const notebooksCount = new Set(normalizedNotes.map(note => note.notebook || 'Geral')).size;
    const bookCounts = new Map<string, number>();
    for (const note of normalizedNotes) {
      const book = getBookFromReference(note.reference);
      bookCounts.set(book, (bookCounts.get(book) || 0) + 1);
    }
    const topBook = Array.from(bookCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/D';

    return {
      notesThisWeek,
      pinnedCount,
      notebooksCount,
      topBook,
    };
  }, [normalizedNotes]);

  const revisitSuggestions = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    return normalizedNotes
      .filter(note => {
        const refDate = note.updatedAt || note.date;
        const ts = new Date(refDate).getTime();
        return ts <= sevenDaysAgo;
      })
      .sort((a, b) => {
        const aTs = new Date(a.updatedAt || a.date).getTime();
        const bTs = new Date(b.updatedAt || b.date).getTime();
        const aOlder = aTs <= thirtyDaysAgo ? 1 : 0;
        const bOlder = bTs <= thirtyDaysAgo ? 1 : 0;
        if (aOlder !== bOlder) return bOlder - aOlder;
        return aTs - bTs;
      })
      .slice(0, 4);
  }, [normalizedNotes]);

  const filteredNotes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let items = normalizedNotes.filter(note => {
      const matchesBook = bookFilter === 'all' || getBookFromReference(note.reference) === bookFilter;
      if (!matchesBook) return false;

      const matchesNotebook = notebookFilter === 'all' || (note.notebook || 'Geral') === notebookFilter;
      if (!matchesNotebook) return false;

      const matchesTag = tagFilter === 'all' || (note.tags || []).includes(tagFilter);
      if (!matchesTag) return false;

      if (!normalizedSearch) return true;
      return (
        note.reference.toLowerCase().includes(normalizedSearch)
        || note.content.toLowerCase().includes(normalizedSearch)
        || (note.tags || []).some(tag => tag.toLowerCase().includes(normalizedSearch))
        || (note.notebook || 'Geral').toLowerCase().includes(normalizedSearch)
      );
    });

    items = [...items].sort((a, b) => {
      if (sortBy === 'pinned') {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'reference') return a.reference.localeCompare(b.reference);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return items;
  }, [bookFilter, normalizedNotes, notebookFilter, searchTerm, sortBy, tagFilter]);

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const saveEditing = () => {
    if (!editingNoteId) return;
    const trimmed = editingContent.trim();
    if (!trimmed) return;
    onUpdateNote(editingNoteId, { content: trimmed });
    setEditingNoteId(null);
    setEditingContent('');
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const addNotebook = () => {
    const notebook = newNotebook.trim();
    if (!notebook) return;
    setNotebookFilter(notebook);
    setNewNotebook('');
  };

  const updateNoteNotebook = (noteId: string, notebook: string) => {
    onUpdateNote(noteId, { notebook });
  };

  const addTagToNote = (note: Note) => {
    const draft = (tagDraftById[note.id] || '').trim();
    if (!draft) return;
    const tags = Array.from(new Set([...(note.tags || []), draft]));
    onUpdateNote(note.id, { tags });
    setTagDraftById(prev => ({ ...prev, [note.id]: '' }));
  };

  const removeTagFromNote = (note: Note, tag: string) => {
    onUpdateNote(note.id, { tags: (note.tags || []).filter(item => item !== tag) });
  };

  const togglePinned = (note: Note) => {
    onUpdateNote(note.id, { pinned: !note.pinned });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-10 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-petrol-900 dark:text-white">Minha Biblioteca</h2>
        <p className="text-sm text-gray-500">Suas notas, destaques e meditações.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-4">
            <Bookmark className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold block">{normalizedNotes.length}</span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Notas</span>
          <p className="text-[11px] text-gray-500 mt-1">{metrics.notesThisWeek} novas nos últimos 7 dias</p>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-4">
            <Highlighter className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold block">{metrics.pinnedCount}</span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Destaques</span>
          <p className="text-[11px] text-gray-500 mt-1">Cadernos: {metrics.notebooksCount} • Livro foco: {metrics.topBook}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="font-bold px-1">Revisitar Hoje</h3>
        {revisitSuggestions.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-500">
            Sem sugestões por enquanto. Continue registrando suas meditações para criar revisões inteligentes.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {revisitSuggestions.map(note => (
              <button
                key={`revisit-${note.id}`}
                onClick={() => onOpenReference(note.reference)}
                className="text-left p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <p className="text-xs font-bold text-petrol-500">{note.reference}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.content}</p>
                <p className="text-[10px] text-gray-400 mt-2">Última revisão: {new Date(note.updatedAt || note.date).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-bold px-1">Notas Recentes</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por referência ou conteúdo"
            className="sm:col-span-2 w-full p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          />
          <select
            value={bookFilter}
            onChange={(e) => setBookFilter(e.target.value)}
            className="w-full p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          >
            <option value="all">Todos os livros</option>
            {availableBooks.map(book => (
              <option key={book} value={book}>{book}</option>
            ))}
          </select>
          <select
            value={notebookFilter}
            onChange={(e) => setNotebookFilter(e.target.value)}
            className="w-full p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          >
            <option value="all">Todos os cadernos</option>
            {availableNotebooks.map(notebook => (
              <option key={notebook} value={notebook}>{notebook}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          >
            <option value="all">Todas as tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <input
            type="text"
            value={newNotebook}
            onChange={(e) => setNewNotebook(e.target.value)}
            placeholder="Novo caderno (ex: Romanos)"
            className="w-full p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          />

          <button
            type="button"
            onClick={addNotebook}
            className="w-full p-3 rounded-2xl bg-petrol-500/10 border border-petrol-300 text-petrol-700 dark:text-petrol-200 text-sm font-semibold"
          >
            Criar/Filtrar caderno
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>{filteredNotes.length} nota(s) exibida(s)</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest' | 'reference' | 'pinned')}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="reference">Referência (A-Z)</option>
            <option value="pinned">Priorizar destaques</option>
          </select>
        </div>

        {normalizedNotes.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
            <Library className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">Nenhuma nota salva ainda.</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-400">Nenhuma nota encontrada com os filtros atuais.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map(note => (
              <div key={note.id} className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-petrol-500">{note.reference}</h4>
                  <span className="text-[10px] text-gray-400">{new Date(note.date).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{note.notebook || 'Geral'}</span>
                  {(note.tags || []).map(tag => (
                    <span key={`${note.id}-${tag}`} className="text-[10px] px-2 py-1 rounded-lg bg-petrol-500/10 text-petrol-700 dark:text-petrol-200">#{tag}</span>
                  ))}
                  {note.pinned && <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-100 text-amber-700">Destaque</span>}
                </div>

                {editingNoteId === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full min-h-28 p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-gray-700 text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={saveEditing}
                        className="px-3 py-2 rounded-xl bg-petrol-500 text-white text-xs font-semibold"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                      {note.content}
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={notebookDraftById[note.id] || note.notebook || 'Geral'}
                        onChange={(e) => {
                          const notebookValue = e.target.value;
                          setNotebookDraftById(prev => ({ ...prev, [note.id]: notebookValue }));
                          updateNoteNotebook(note.id, notebookValue);
                        }}
                        className="w-full p-2 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-gray-700 text-xs"
                      >
                        {availableNotebooks.map(notebook => (
                          <option key={`${note.id}-${notebook}`} value={notebook}>{notebook}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={tagDraftById[note.id] || ''}
                        onChange={(e) => setTagDraftById(prev => ({ ...prev, [note.id]: e.target.value }))}
                        placeholder="Adicionar tag"
                        className="w-full p-2 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-gray-700 text-xs"
                      />

                      <button
                        type="button"
                        onClick={() => addTagToNote(note)}
                        className="w-full p-2 rounded-xl border border-petrol-300 text-petrol-700 dark:text-petrol-200 text-xs font-semibold"
                      >
                        Salvar tag
                      </button>
                    </div>

                    {(note.tags || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(note.tags || []).map(tag => (
                          <button
                            key={`${note.id}-remove-${tag}`}
                            type="button"
                            onClick={() => removeTagFromNote(note, tag)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          >
                            remover #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenReference(note.reference)}
                        className="px-3 py-1.5 rounded-xl bg-petrol-500/10 border border-petrol-300 text-petrol-700 dark:text-petrol-200 text-xs font-semibold"
                      >
                        Abrir referência
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditing(note)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePinned(note)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold border",
                          note.pinned
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-gray-200 dark:border-gray-700"
                        )}
                      >
                        {note.pinned ? 'Desmarcar destaque' : 'Destacar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold"
                      >
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

const StudyScreen = ({
  goalTargets,
  onApplyGoalProfile,
  availableVersions,
}: {
  goalTargets: GoalTargets;
  onApplyGoalProfile: (profile: GoalProfile) => void;
  availableVersions: string[];
}) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<'chapter' | 'book' | 'bible'>('bible');
  const [version, setVersion] = useState<string>('ARC');
  const [enableSemanticExpansion, setEnableSemanticExpansion] = useState(true);
  const [enableStemming, setEnableStemming] = useState(true);
  const [enableStrongLexical, setEnableStrongLexical] = useState(true);
  const [enableAppKnowledge, setEnableAppKnowledge] = useState(true);
  const [referenceInput, setReferenceInput] = useState('Romanos 8');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [scrollButtonsActive, setScrollButtonsActive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const studyScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollButtonsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('study-analysis-preferences');
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        scope?: 'chapter' | 'book' | 'bible';
        version?: string;
        enableSemanticExpansion?: boolean;
        enableStemming?: boolean;
        enableStrongLexical?: boolean;
        enableAppKnowledge?: boolean;
        referenceInput?: string;
      };

      // Mantem o comportamento padrao solicitado: iniciar sempre com busca na Biblia inteira.
      setScope('bible');
      if (typeof parsed.version === 'string' && parsed.version.trim().length > 0) {
        setVersion(parsed.version);
      }
      if (typeof parsed.enableSemanticExpansion === 'boolean') {
        setEnableSemanticExpansion(parsed.enableSemanticExpansion);
      }
      if (typeof parsed.enableStemming === 'boolean') {
        setEnableStemming(parsed.enableStemming);
      }
      if (typeof parsed.enableStrongLexical === 'boolean') {
        setEnableStrongLexical(parsed.enableStrongLexical);
      }
      if (typeof parsed.enableAppKnowledge === 'boolean') {
        setEnableAppKnowledge(parsed.enableAppKnowledge);
      }
      if (typeof parsed.referenceInput === 'string' && parsed.referenceInput.trim().length > 0) {
        setReferenceInput(parsed.referenceInput);
      }
    } catch {
      // Ignore invalid persisted config and keep defaults.
    }
  }, []);

  useEffect(() => {
    const payload = {
      scope,
      version,
      enableSemanticExpansion,
      enableStemming,
      enableStrongLexical,
      enableAppKnowledge,
      referenceInput
    };
    localStorage.setItem('study-analysis-preferences', JSON.stringify(payload));
  }, [scope, version, enableSemanticExpansion, enableStemming, enableStrongLexical, enableAppKnowledge, referenceInput]);

  useEffect(() => {
    if (availableVersions.length === 0) return;
    if (!availableVersions.includes(version)) {
      setVersion(availableVersions[0]);
    }
  }, [availableVersions, version]);

  const resetAnalysisPreferences = () => {
    setScope('bible');
    setVersion('ARC');
    setEnableSemanticExpansion(true);
    setEnableStemming(true);
    setEnableStrongLexical(true);
    setEnableAppKnowledge(true);
    setReferenceInput('Romanos 8');
    localStorage.removeItem('study-analysis-preferences');
  };

  const handleStudy = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const report = await runInternalBibleAI({
        termsInput: query,
        scope,
        reference: referenceInput,
        version,
        options: {
          enableSemanticExpansion,
          enableStemming,
          enableStrongLexical,
          enableAppKnowledge,
        }
      });
      setResponse(formatInternalBibleAIReportMarkdown(report));
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

  useEffect(() => {
    const container = studyScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const maxScrollTop = container.scrollHeight - container.clientHeight;
      setShowScrollTop(container.scrollTop > 220);
      setShowScrollBottom(container.scrollTop < maxScrollTop - 120);
      setScrollButtonsActive(true);
      if (scrollButtonsTimerRef.current) clearTimeout(scrollButtonsTimerRef.current);
      scrollButtonsTimerRef.current = setTimeout(() => setScrollButtonsActive(false), 1200);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollButtonsTimerRef.current) clearTimeout(scrollButtonsTimerRef.current);
    };
  }, [response]);

  const scrollStudyTop = () => {
    studyScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollStudyBottom = () => {
    const container = studyScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  };

  const activeGoalProfile = useMemo((): GoalProfile | null => {
    if (goalTargets.sessions <= 10 && goalTargets.activeDays <= 4 && goalTargets.bibleViews <= 5) {
      return 'conservador';
    }
    if (goalTargets.sessions >= 20 && goalTargets.activeDays >= 6 && goalTargets.bibleViews >= 10) {
      return 'intensivo';
    }
    if (goalTargets.sessions >= 12 && goalTargets.activeDays >= 5 && goalTargets.bibleViews >= 7) {
      return 'crescimento';
    }
    return null;
  }, [goalTargets.activeDays, goalTargets.bibleViews, goalTargets.sessions]);

  return (
    <div ref={studyScrollRef} className="h-full min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch] p-4 sm:p-6 lg:p-8 space-y-6 pb-40 lg:pb-16 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-petrol-500/10 text-petrol-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white">Assistente de Estudo</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Modelo interno local: analisa Bíblia, cruza Strong, correlaciona Símbolos de Fé e notas pessoais. Use aspas para expressão exata.
        </p>

        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Perfil de meta (estudo)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => onApplyGoalProfile('conservador')}
              className={cn(
                "py-2 rounded-xl text-xs font-semibold border",
                activeGoalProfile === 'conservador'
                  ? "bg-petrol-500 text-white border-petrol-500"
                  : "bg-gray-50 dark:bg-navy-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
              )}
            >
              Conservador
            </button>
            <button
              onClick={() => onApplyGoalProfile('crescimento')}
              className={cn(
                "py-2 rounded-xl text-xs font-semibold border",
                activeGoalProfile === 'crescimento'
                  ? "bg-petrol-500 text-white border-petrol-500"
                  : "bg-gray-50 dark:bg-navy-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
              )}
            >
              Crescimento
            </button>
            <button
              onClick={() => onApplyGoalProfile('intensivo')}
              className={cn(
                "py-2 rounded-xl text-xs font-semibold border",
                activeGoalProfile === 'intensivo'
                  ? "bg-petrol-500 text-white border-petrol-500"
                  : "bg-gray-50 dark:bg-navy-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
              )}
            >
              Intensivo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Escopo</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as 'chapter' | 'book' | 'bible')}
              className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
            >
              <option value="chapter">Capítulo</option>
              <option value="book">Livro</option>
              <option value="bible">Bíblia inteira</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Versão</label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm"
            >
              {availableVersions.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Referência base</label>
            <input
              type="text"
              value={referenceInput}
              onChange={(e) => setReferenceInput(e.target.value)}
              placeholder="Ex: João 3"
              disabled={scope === 'bible'}
              className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 border-none focus:ring-2 focus:ring-petrol-500 text-sm disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">Expansão semântica</span>
            <input
              type="checkbox"
              checked={enableSemanticExpansion}
              onChange={(e) => setEnableSemanticExpansion(e.target.checked)}
              className="h-4 w-4 accent-petrol-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">Stemming (variações)</span>
            <input
              type="checkbox"
              checked={enableStemming}
              onChange={(e) => setEnableStemming(e.target.checked)}
              className="h-4 w-4 accent-petrol-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 text-sm sm:col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-200">Análise léxica Strong (ocorrências e cruzamento)</span>
            <input
              type="checkbox"
              checked={enableStrongLexical}
              onChange={(e) => setEnableStrongLexical(e.target.checked)}
              className="h-4 w-4 accent-petrol-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-navy-900 text-sm sm:col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-200">Usar Símbolos de Fé e notas no raciocínio</span>
            <input
              type="checkbox"
              checked={enableAppKnowledge}
              onChange={(e) => setEnableAppKnowledge(e.target.checked)}
              className="h-4 w-4 accent-petrol-500"
            />
          </label>
        </div>

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={resetAnalysisPreferences}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-navy-900 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
          >
            Restaurar padrão
          </button>
        </div>

        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'Ex: fe, graca, "novo nascimento"'}
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
            <LazyMarkdown>{response}</LazyMarkdown>
          </div>
          <div ref={scrollRef} />
        </motion.div>
      )}

      <div className={cn("fixed bottom-24 right-4 z-50 flex flex-col gap-2 transition-opacity duration-300 hover:opacity-100", scrollButtonsActive ? "opacity-100" : "opacity-45")}>
        {showScrollTop && (
          <button
            onClick={scrollStudyTop}
            className="rounded-full bg-petrol-500 text-white p-3 shadow-lg shadow-petrol-500/30 hover:bg-petrol-600 active:scale-95 transition-all"
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {showScrollBottom && (
          <button
            onClick={scrollStudyBottom}
            className="rounded-full bg-petrol-500 text-white p-3 shadow-lg shadow-petrol-500/30 hover:bg-petrol-600 active:scale-95 transition-all"
            aria-label="Ir ao fim"
            title="Ir ao fim"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const ConfessionsScreen = () => {
  const [selected, setSelected] = useState<Confession | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);
  const [studyResponse, setStudyResponse] = useState<string | null>(null);
  const [loadingStudy, setLoadingStudy] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [scrollButtonsActive, setScrollButtonsActive] = useState(true);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollButtonsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confessionSections = useMemo(() => {
    if (!selected) return [];
    if (selected.id === 'westminster') return parseWestminsterChapters(selected.content);
    if (selected.id === 'heidelberg') return parseHeidelbergDomingos(selected.content);
    if (selected.id === 'belgica') return parseBelgicArticles(selected.content);
    return [];
  }, [selected]);

  const hasStructuredIndex = confessionSections.length > 0;
  const indexTitle = selected?.id === 'heidelberg'
    ? 'Índice dos Domingos'
    : selected?.id === 'belgica'
      ? 'Índice dos Artigos'
      : 'Índice dos Capítulos';
  const indexDescription = selected?.id === 'heidelberg'
    ? 'Selecione um Domingo para abrir o texto.'
    : selected?.id === 'belgica'
      ? 'Selecione um Artigo para abrir o texto.'
      : 'Selecione um capítulo para abrir o texto.';

  useEffect(() => {
    const container = contentScrollRef.current;
    if (!selected || !container) {
      setShowScrollTop(false);
      setShowScrollBottom(false);
      return;
    }

    const handleScroll = () => {
      const maxScrollTop = container.scrollHeight - container.clientHeight;
      setShowScrollTop(container.scrollTop > 220);
      setShowScrollBottom(container.scrollTop < maxScrollTop - 120);
      setScrollButtonsActive(true);
      if (scrollButtonsTimerRef.current) clearTimeout(scrollButtonsTimerRef.current);
      scrollButtonsTimerRef.current = setTimeout(() => setScrollButtonsActive(false), 1200);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollButtonsTimerRef.current) clearTimeout(scrollButtonsTimerRef.current);
    };
  }, [selected]);

  const scrollToTop = () => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const container = contentScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  };

  const openChapter = (index: number) => {
    setSelectedChapterIndex(index);
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToChapterIndex = () => {
    setSelectedChapterIndex(null);
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (selected) {
    const handleStudyConfession = async () => {
      setLoadingStudy(true);
      try {
        setStudyResponse("Funcionalidade de IA removida do projeto.");
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStudy(false);
      }
    };

    return (
      <div className="animate-fade-in-right h-full min-h-0 flex flex-col">
        <Header title={selected.title} showBack onBack={() => { setSelected(null); setStudyResponse(null); }} />
        <div
          ref={contentScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y p-6 pb-40 bg-paper-50 dark:bg-navy-900 [-webkit-overflow-scrolling:touch]"
        >
          <div className="max-w-2xl mx-auto space-y-8">
            {hasStructuredIndex && selectedChapterIndex === null ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-petrol-900 dark:text-white">{indexTitle}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{indexDescription}</p>
                <div className="space-y-3">
                  {confessionSections.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => openChapter(index)}
                      className="w-full text-left p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:border-petrol-300 dark:hover:border-petrol-600 transition-colors"
                    >
                      <p className="text-sm font-semibold text-petrol-600 dark:text-petrol-300">{chapter.heading}</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{chapter.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {hasStructuredIndex && selectedChapterIndex !== null && (
                  <button
                    onClick={backToChapterIndex}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm font-semibold text-petrol-600 dark:text-petrol-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao índice
                  </button>
                )}

                <div className="prose prose-slate dark:prose-invert reading-text">
                  <LazyMarkdown>
                    {hasStructuredIndex && selectedChapterIndex !== null && confessionSections[selectedChapterIndex]
                      ? confessionSections[selectedChapterIndex].content
                      : selected.content}
                  </LazyMarkdown>
                </div>
              </div>
            )}
            
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
                    <LazyMarkdown>{studyResponse}</LazyMarkdown>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className={cn("fixed bottom-24 right-4 z-50 flex flex-col gap-2 transition-opacity duration-300 hover:opacity-100", scrollButtonsActive ? "opacity-100" : "opacity-45")}>
            {showScrollTop && (
              <button
                onClick={scrollToTop}
                className="rounded-full bg-petrol-500 text-white p-3 shadow-lg shadow-petrol-500/30 hover:bg-petrol-600 active:scale-95 transition-all"
                aria-label="Voltar ao topo"
                title="Voltar ao topo"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            )}

            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="rounded-full bg-petrol-500 text-white p-3 shadow-lg shadow-petrol-500/30 hover:bg-petrol-600 active:scale-95 transition-all"
                aria-label="Ir ao fim"
                title="Ir ao fim"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
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
          onClick={() => {
            setSelected(c);
            setSelectedChapterIndex(null);
            setStudyResponse(null);
          }}
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

const SettingsScreen = ({
  fontSize,
  onChangeFontSize,
  colorTheme,
  onChangeColorTheme,
  backgroundTheme,
  onChangeBackgroundTheme,
  reasoningMode,
  onChangeReasoningMode,
  onExportData,
  onImportData,
  onImportBibleVersion,
  onLoadMissingGithubVersions,
  onImportMissingGithubVersions,
  onImportStrongDictionary,
  onReloadDefaultStrongDictionary,
  onResetData,
  activityEvents,
  onClearActivity,
  goalTargets,
  onChangeGoalTarget,
  onRecalibrateGoals,
  onApplyGoalProfile,
  isImportingBibleVersion,
  bibleImportStatus,
  isImportingStrongDictionary,
  strongDictionaryImportStatus,
  bibleVersionCodes,
}: {
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  colorTheme: ColorTheme;
  onChangeColorTheme: (theme: ColorTheme) => void;
  backgroundTheme: BackgroundTheme;
  onChangeBackgroundTheme: (theme: BackgroundTheme) => void;
  reasoningMode: InternalReasoningMode;
  onChangeReasoningMode: (mode: InternalReasoningMode) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onImportBibleVersion: (file: File) => void;
  onLoadMissingGithubVersions: () => Promise<GitHubVersionOption[]>;
  onImportMissingGithubVersions: (versions: GitHubVersionOption[]) => Promise<void>;
  onImportStrongDictionary: (file: File) => void;
  onReloadDefaultStrongDictionary: () => Promise<void>;
  onResetData: () => void;
  activityEvents: ActivityEvent[];
  onClearActivity: () => void;
  goalTargets: GoalTargets;
  onChangeGoalTarget: (key: keyof GoalTargets, value: number) => void;
  onRecalibrateGoals: () => void;
  onApplyGoalProfile: (profile: GoalProfile) => void;
  isImportingBibleVersion: boolean;
  bibleImportStatus: string | null;
  isImportingStrongDictionary: boolean;
  strongDictionaryImportStatus: string | null;
  bibleVersionCodes: string[];
}) => {
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [isLoadingRemoteVersions, setIsLoadingRemoteVersions] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [availableVersionsToImport, setAvailableVersionsToImport] = useState<GitHubVersionOption[]>([]);
  const [selectedVersionCodes, setSelectedVersionCodes] = useState<string[]>([]);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const bibleImportInputRef = useRef<HTMLInputElement | null>(null);
  const strongDictionaryInputRef = useRef<HTMLInputElement | null>(null);
  const colorThemes = COLOR_THEME_OPTIONS;
  const backgroundThemes = BACKGROUND_THEME_OPTIONS;
  const weeklyEvents = useMemo(() => {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return activityEvents.filter(event => event.timestamp >= weekAgo);
  }, [activityEvents]);

  const topActions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of weeklyEvents) {
      counts.set(event.type, (counts.get(event.type) || 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [weeklyEvents]);

  const weeklyTrend = useMemo(() => {
    const buckets: Array<{ dayLabel: string; count: number; dayKey: string }> = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().slice(0, 10);
      const dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      buckets.push({ dayLabel, count: 0, dayKey });
    }

    for (const event of weeklyEvents) {
      const key = new Date(event.timestamp).toISOString().slice(0, 10);
      const bucket = buckets.find(item => item.dayKey === key);
      if (bucket) bucket.count += 1;
    }

    return buckets;
  }, [weeklyEvents]);

  const screenViews = useMemo(() => {
    const screenEvents = weeklyEvents.filter(event => event.type === 'screen_view');
    const counts = new Map<string, number>();
    for (const event of screenEvents) {
      const screenName = event.label.replace('Tela: ', '').trim() || 'desconhecida';
      counts.set(screenName, (counts.get(screenName) || 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [weeklyEvents]);

  const activeDaysThisWeek = useMemo(() => {
    const daySet = new Set(weeklyEvents.map(event => new Date(event.timestamp).toISOString().slice(0, 10)));
    return daySet.size;
  }, [weeklyEvents]);

  const bibleScreenViews = useMemo(() => {
    return weeklyEvents.filter(event => event.type === 'screen_view' && event.label.toLowerCase().includes('bible')).length;
  }, [weeklyEvents]);

  const activeDaysLast30 = useMemo(() => {
    const last30 = activityEvents.filter(event => event.timestamp >= Date.now() - (30 * 24 * 60 * 60 * 1000));
    const daySet = new Set(last30.map(event => new Date(event.timestamp).toISOString().slice(0, 10)));
    return daySet.size;
  }, [activityEvents]);

  const maxTrendCount = useMemo(() => {
    return Math.max(1, ...weeklyTrend.map(item => item.count));
  }, [weeklyTrend]);

  const previousWeekEventsCount = useMemo(() => {
    const now = Date.now();
    const startPrevious = now - (14 * 24 * 60 * 60 * 1000);
    const endPrevious = now - (7 * 24 * 60 * 60 * 1000);
    return activityEvents.filter(event => event.timestamp >= startPrevious && event.timestamp < endPrevious).length;
  }, [activityEvents]);

  const healthAlerts = useMemo(() => {
    const alerts: Array<{ level: 'ok' | 'warn' | 'info'; title: string; recommendation: string }> = [];
    const weekDropRatio = previousWeekEventsCount > 0
      ? (previousWeekEventsCount - weeklyEvents.length) / previousWeekEventsCount
      : 0;

    if (previousWeekEventsCount >= 10 && weekDropRatio >= 0.3) {
      alerts.push({
        level: 'warn',
        title: 'Queda de engajamento semanal',
        recommendation: 'Considere destacar um plano de leitura na Home e reforçar notificações de retorno.'
      });
    }

    if (activeDaysLast30 < 5) {
      alerts.push({
        level: 'warn',
        title: 'Baixa recorrência nos últimos 30 dias',
        recommendation: 'Estimule hábitos diários com metas simples e lembretes de progresso.'
      });
    }

    const lastEventAt = activityEvents[0]?.timestamp;
    const staleDays = lastEventAt ? Math.floor((Date.now() - lastEventAt) / (24 * 60 * 60 * 1000)) : null;
    if (staleDays !== null && staleDays >= 4) {
      alerts.push({
        level: 'info',
        title: 'Atividade recente baixa',
        recommendation: 'Mostrar atalho para “continuar de onde parou” pode melhorar retorno imediato.'
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        level: 'ok',
        title: 'Saúde de uso estável',
        recommendation: 'Mantenha o foco em velocidade e consistência da experiência atual.'
      });
    }

    return alerts.slice(0, 3);
  }, [activityEvents, activeDaysLast30, previousWeekEventsCount, weeklyEvents.length]);

  const weeklyGoals = useMemo(() => {
    return [
      {
        id: 'sessions',
        title: 'Aumentar sessões semanais',
        current: weeklyEvents.length,
        target: goalTargets.sessions,
      },
      {
        id: 'active-days',
        title: 'Alcançar 5 dias ativos',
        current: activeDaysThisWeek,
        target: goalTargets.activeDays,
      },
      {
        id: 'bible-views',
        title: '7 acessos à tela Bíblia',
        current: bibleScreenViews,
        target: goalTargets.bibleViews,
      }
    ];
  }, [activeDaysThisWeek, bibleScreenViews, goalTargets.activeDays, goalTargets.bibleViews, goalTargets.sessions, weeklyEvents.length]);

  const activeGoalProfile = useMemo((): GoalProfile | null => {
    if (goalTargets.sessions <= 10 && goalTargets.activeDays <= 4 && goalTargets.bibleViews <= 5) {
      return 'conservador';
    }
    if (goalTargets.sessions >= 20 && goalTargets.activeDays >= 6 && goalTargets.bibleViews >= 10) {
      return 'intensivo';
    }
    if (goalTargets.sessions >= 12 && goalTargets.activeDays >= 5 && goalTargets.bibleViews >= 7) {
      return 'crescimento';
    }
    return null;
  }, [goalTargets.activeDays, goalTargets.bibleViews, goalTargets.sessions]);

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const openVersionSelector = async () => {
    try {
      setIsLoadingRemoteVersions(true);
      const options = await onLoadMissingGithubVersions();
      setAvailableVersionsToImport(options);
      setSelectedVersionCodes([]);
      if (options.length > 0) setShowVersionSelector(true);
    } finally {
      setIsLoadingRemoteVersions(false);
    }
  };

  const toggleVersionSelection = (code: string) => {
    setSelectedVersionCodes(prev => (
      prev.includes(code)
        ? prev.filter(item => item !== code)
        : [...prev, code]
    ));
  };

  const confirmSelectedVersionImport = async () => {
    const selected = availableVersionsToImport.filter(item => selectedVersionCodes.includes(item.code));
    if (selected.length === 0) return;

    await onImportMissingGithubVersions(selected);
    setShowVersionSelector(false);
    setAvailableVersionsToImport([]);
    setSelectedVersionCodes([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-10 animate-fade-in">
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
              onChange={(e) => onChangeFontSize(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-petrol-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Tema Rápido</span>
              <span className="text-petrol-500 font-bold">{colorThemes.find(item => item.id === colorTheme)?.name || 'Clássico'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {colorThemes.map((themeOption) => {
                const isActive = colorTheme === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    type="button"
                    onClick={() => onChangeColorTheme(themeOption.id)}
                    className={cn(
                      'p-2 rounded-xl border transition-all',
                      isActive
                        ? 'border-petrol-500 ring-2 ring-petrol-200 dark:ring-petrol-800'
                        : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <div className="h-4 rounded-md" style={{ background: themeOption.preview }} />
                    <p className="mt-1 text-[10px] font-semibold text-gray-700 dark:text-gray-200 truncate">{themeOption.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Fundo do App</span>
              <span className="text-petrol-500 font-bold">{backgroundThemes.find(item => item.id === backgroundTheme)?.name || 'Papel'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {backgroundThemes.map((themeOption) => {
                const isActive = backgroundTheme === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    type="button"
                    onClick={() => onChangeBackgroundTheme(themeOption.id)}
                    className={cn(
                      'p-2 rounded-xl border transition-all',
                      isActive
                        ? 'border-petrol-500 ring-2 ring-petrol-200 dark:ring-petrol-800'
                        : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <div className="h-4 rounded-md" style={{ background: themeOption.preview }} />
                    <p className="mt-1 text-[10px] font-semibold text-gray-700 dark:text-gray-200 truncate">{themeOption.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Inteligência Interna</span>
              <span className="text-petrol-500 font-bold">
                {reasoningMode === 'auto'
                  ? 'Auto'
                  : reasoningMode === 'analitico'
                    ? 'Analítico'
                    : reasoningMode === 'didatico'
                      ? 'Didático'
                      : reasoningMode === 'socratico'
                        ? 'Socrático'
                        : reasoningMode === 'canonico'
                          ? 'Canônico'
                          : 'Pastoral'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChangeReasoningMode('auto')}
                className={cn(
                  'p-2 rounded-xl border text-xs font-semibold',
                  reasoningMode === 'auto'
                    ? 'border-petrol-500 bg-petrol-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                )}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => onChangeReasoningMode('pastoral')}
                className={cn(
                  'p-2 rounded-xl border text-xs font-semibold',
                  reasoningMode === 'pastoral'
                    ? 'border-petrol-500 bg-petrol-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                )}
              >
                Pastoral
              </button>
              <button
                type="button"
                onClick={() => onChangeReasoningMode('didatico')}
                className={cn(
                  'p-2 rounded-xl border text-xs font-semibold',
                  reasoningMode === 'didatico'
                    ? 'border-petrol-500 bg-petrol-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                )}
              >
                Didático
              </button>
              <button
                type="button"
                onClick={() => onChangeReasoningMode('analitico')}
                className={cn(
                  'p-2 rounded-xl border text-xs font-semibold',
                  reasoningMode === 'analitico'
                    ? 'border-petrol-500 bg-petrol-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                )}
              >
                Analítico
              </button>
              <button
                type="button"
                onClick={() => onChangeReasoningMode('socratico')}
                className={cn(
                  'p-2 rounded-xl border text-xs font-semibold',
                  reasoningMode === 'socratico'
                    ? 'border-petrol-500 bg-petrol-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                )}
              >
                Socrático
              </button>
              <button
                type="button"
                onClick={() => onChangeReasoningMode('canonico')}
                className={cn(
                  'p-2 rounded-xl border text-xs font-semibold',
                  reasoningMode === 'canonico'
                    ? 'border-petrol-500 bg-petrol-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                )}
              >
                Canônico
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Controla o estilo de raciocínio da IA local no comentário bíblico, mantendo tudo offline.
            </p>
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

      <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-4">Dados e Segurança</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Faça backup dos seus dados locais, importe em outro aparelho e restaure o aplicativo quando necessário.
        </p>

        <div className="mt-4 grid gap-3">
          <button
            onClick={onExportData}
            className="w-full py-3 rounded-2xl bg-petrol-500 text-white font-semibold"
          >
            Exportar backup
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="w-full py-3 rounded-2xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 font-semibold"
          >
            Importar backup
          </button>

          <button
            onClick={() => bibleImportInputRef.current?.click()}
            disabled={isImportingBibleVersion}
            className="w-full py-3 rounded-2xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 font-semibold disabled:opacity-60"
          >
            {isImportingBibleVersion ? 'Importando Bíblia...' : 'Importar Bíblia/Strong'}
          </button>

          <button
            onClick={openVersionSelector}
            disabled={isImportingBibleVersion || isLoadingRemoteVersions}
            className="w-full py-3 rounded-2xl bg-petrol-500/10 border border-petrol-300 text-petrol-700 dark:text-petrol-200 font-semibold disabled:opacity-60"
          >
            {isLoadingRemoteVersions ? 'Carregando versões...' : 'Importar versão'}
          </button>

          {showVersionSelector && (
            <div className="rounded-2xl border border-petrol-200 dark:border-petrol-800 bg-petrol-50/40 dark:bg-petrol-900/20 p-4 space-y-3">
              <p className="text-sm font-semibold text-petrol-800 dark:text-petrol-100">Selecione as versões para importar</p>

              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {availableVersionsToImport.map(item => {
                  const checked = selectedVersionCodes.includes(item.code);
                  return (
                    <label key={item.code} className="flex items-center gap-2 rounded-xl border border-petrol-100 dark:border-petrol-900 bg-white/80 dark:bg-gray-800/80 px-3 py-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleVersionSelection(item.code)}
                        className="accent-petrol-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-100">{item.code}</span>
                    </label>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVersionSelector(false);
                    setSelectedVersionCodes([]);
                    setAvailableVersionsToImport([]);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmSelectedVersionImport}
                  disabled={isImportingBibleVersion || selectedVersionCodes.length === 0}
                  className="w-full py-2.5 rounded-xl bg-petrol-600 text-white font-semibold disabled:opacity-60"
                >
                  Confirmar importação
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => strongDictionaryInputRef.current?.click()}
            disabled={isImportingStrongDictionary}
            className="w-full py-3 rounded-2xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 font-semibold disabled:opacity-60"
          >
            {isImportingStrongDictionary ? 'Importando Dicionário...' : 'Importar Dicionário Strong'}
          </button>

          <button
            onClick={() => void onReloadDefaultStrongDictionary()}
            disabled={isImportingStrongDictionary}
            className="w-full py-3 rounded-2xl bg-petrol-500/10 border border-petrol-300 text-petrol-700 dark:text-petrol-200 font-semibold disabled:opacity-60"
          >
            {isImportingStrongDictionary ? 'Importando Dicionário...' : 'Recarregar dicionário Strong padrão'}
          </button>

          <input
            ref={bibleImportInputRef}
            type="file"
            accept=".json,.zip,.sqlite,.sqlite3"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportBibleVersion(file);
              e.currentTarget.value = '';
            }}
          />

          <input
            ref={strongDictionaryInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportStrongDictionary(file);
              e.currentTarget.value = '';
            }}
          />

          {bibleImportStatus && (
            <p className="text-xs text-gray-600 dark:text-gray-300 rounded-xl bg-paper-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-3 py-2">{bibleImportStatus}</p>
          )}

          {strongDictionaryImportStatus && (
            <p className="text-xs text-gray-600 dark:text-gray-300 rounded-xl bg-paper-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-3 py-2">{strongDictionaryImportStatus}</p>
          )}

          <p className="text-xs text-gray-500">
            Versões disponíveis no leitor: {bibleVersionCodes.join(', ')}
          </p>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportData(file);
              e.currentTarget.value = '';
            }}
          />

          <button
            onClick={onResetData}
            className="w-full py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 font-semibold"
          >
            Limpar dados locais
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-4">Uso do Aplicativo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-paper-50 dark:bg-gray-700 p-4 border border-gray-100 dark:border-gray-600">
            <p className="text-xs uppercase tracking-wider text-gray-500">Eventos totais</p>
            <p className="text-2xl font-bold text-petrol-600 mt-1">{activityEvents.length}</p>
          </div>
          <div className="rounded-2xl bg-paper-50 dark:bg-gray-700 p-4 border border-gray-100 dark:border-gray-600">
            <p className="text-xs uppercase tracking-wider text-gray-500">Últimos 7 dias</p>
            <p className="text-2xl font-bold text-petrol-600 mt-1">{weeklyEvents.length}</p>
          </div>
        </div>

        {topActions.length > 0 && (
          <div className="mt-4 space-y-2">
            {topActions.map(([action, count]) => (
              <div key={action} className="flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-paper-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                <span className="font-medium text-gray-700 dark:text-gray-200">{action}</span>
                <span className="font-bold text-petrol-600">{count}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Tendência semanal</p>
          <div className="grid grid-cols-7 gap-2">
            {weeklyTrend.map(item => (
              <div key={item.dayKey} className="flex flex-col items-center gap-1">
                <div className="w-full h-16 rounded-lg bg-paper-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-end p-1">
                  <div
                    className="w-full rounded-md bg-petrol-500/80"
                    style={{ height: `${(item.count / maxTrendCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '0px' }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 uppercase">{item.dayLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-paper-50 dark:bg-gray-700 p-4 border border-gray-100 dark:border-gray-600">
            <p className="text-xs uppercase tracking-wider text-gray-500">Dias ativos (30d)</p>
            <p className="text-2xl font-bold text-petrol-600 mt-1">{activeDaysLast30}</p>
          </div>
          <div className="rounded-2xl bg-paper-50 dark:bg-gray-700 p-4 border border-gray-100 dark:border-gray-600">
            <p className="text-xs uppercase tracking-wider text-gray-500">Tela mais acessada</p>
            <p className="text-sm font-bold text-petrol-600 mt-2 truncate">{screenViews[0]?.[0] || 'N/D'}</p>
          </div>
        </div>

        {screenViews.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-gray-500">Distribuição por tela (7d)</p>
            {screenViews.map(([screenName, count]) => (
              <div key={screenName} className="flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-paper-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                <span className="font-medium text-gray-700 dark:text-gray-200">{screenName}</span>
                <span className="font-bold text-petrol-600">{count}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-gray-500">Metas semanais</p>
          {weeklyGoals.map(goal => {
            const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const completed = goal.current >= goal.target;

            return (
              <div key={goal.id} className="px-3 py-3 rounded-xl bg-paper-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-200">{goal.title}</span>
                  <span className={cn("font-bold", completed ? "text-emerald-600" : "text-petrol-600")}>{goal.current}/{goal.target}</span>
                </div>
                <div className="h-2 rounded-full bg-white/80 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", completed ? "bg-emerald-500" : "bg-petrol-500")}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-3 bg-white/70 dark:bg-gray-800/60 space-y-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">Personalizar metas</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => onApplyGoalProfile('conservador')}
                className={cn(
                  "py-2 rounded-lg text-xs font-semibold border",
                  activeGoalProfile === 'conservador'
                    ? "bg-petrol-500 text-white border-petrol-500"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100"
                )}
              >
                Conservador
              </button>
              <button
                onClick={() => onApplyGoalProfile('crescimento')}
                className={cn(
                  "py-2 rounded-lg text-xs font-semibold border",
                  activeGoalProfile === 'crescimento'
                    ? "bg-petrol-500 text-white border-petrol-500"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100"
                )}
              >
                Crescimento
              </button>
              <button
                onClick={() => onApplyGoalProfile('intensivo')}
                className={cn(
                  "py-2 rounded-lg text-xs font-semibold border",
                  activeGoalProfile === 'intensivo'
                    ? "bg-petrol-500 text-white border-petrol-500"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100"
                )}
              >
                Intensivo
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="text-[11px] text-gray-600 dark:text-gray-300">
                Sessões
                <input
                  type="number"
                  min={1}
                  value={goalTargets.sessions}
                  onChange={(e) => onChangeGoalTarget('sessions', parseInt(e.target.value || '1', 10))}
                  className="mt-1 w-full rounded-lg bg-paper-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-1.5"
                />
              </label>
              <label className="text-[11px] text-gray-600 dark:text-gray-300">
                Dias ativos
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={goalTargets.activeDays}
                  onChange={(e) => onChangeGoalTarget('activeDays', parseInt(e.target.value || '1', 10))}
                  className="mt-1 w-full rounded-lg bg-paper-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-1.5"
                />
              </label>
              <label className="text-[11px] text-gray-600 dark:text-gray-300">
                Tela Bíblia
                <input
                  type="number"
                  min={1}
                  value={goalTargets.bibleViews}
                  onChange={(e) => onChangeGoalTarget('bibleViews', parseInt(e.target.value || '1', 10))}
                  className="mt-1 w-full rounded-lg bg-paper-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-1.5"
                />
              </label>
            </div>

            <button
              onClick={onRecalibrateGoals}
              className="w-full py-2.5 rounded-xl bg-petrol-500 text-white text-sm font-semibold"
            >
              Recalibrar metas automaticamente
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-xs uppercase tracking-wider text-gray-500">Alertas de saúde do app</p>
          {healthAlerts.map((alert, index) => (
            <div
              key={`${alert.title}-${index}`}
              className={cn(
                "px-3 py-3 rounded-xl border",
                alert.level === 'warn' && "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
                alert.level === 'info' && "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800",
                alert.level === 'ok' && "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
              )}
            >
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{alert.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{alert.recommendation}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClearActivity}
          className="mt-4 w-full py-3 rounded-2xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 font-semibold"
        >
          Limpar histórico de uso
        </button>
      </section>
    </div>
  );
};

interface Note {
  id: string;
  reference: string;
  content: string;
  date: string;
  updatedAt?: string;
  tags?: string[];
  notebook?: string;
  pinned?: boolean;
}

interface ActivityEvent {
  id: string;
  type: string;
  label: string;
  timestamp: number;
}

const isUselessActivityEvent = (event: Pick<ActivityEvent, 'type' | 'label'>) => {
  return event.type === 'screen_view' && event.label.trim().toLowerCase() === 'tela: library';
};

interface GoalTargets {
  sessions: number;
  activeDays: number;
  bibleViews: number;
}

type GoalProfile = 'conservador' | 'crescimento' | 'intensivo';
type ColorTheme = 'petrol' | 'olive' | 'wine' | 'ocean' | 'graphite' | 'sand' | 'emerald';
type BackgroundTheme = 'paper' | 'mist' | 'sage' | 'rose' | 'midnight';
type InternalReasoningMode = 'auto' | 'pastoral' | 'didatico' | 'analitico' | 'socratico' | 'canonico';

const COLOR_THEME_STORAGE_KEY = 'color-theme-v1';
const BACKGROUND_THEME_STORAGE_KEY = 'app-background-v1';
const INTERNAL_REASONING_MODE_STORAGE_KEY = 'internal-ai-reasoning-mode-v1';
const COLOR_THEME_OPTIONS: Array<{ id: ColorTheme; name: string; preview: string }> = [
  { id: 'petrol', name: 'Clássico', preview: 'linear-gradient(135deg, #2c7a7b, #285e61)' },
  { id: 'olive', name: 'Oliva', preview: 'linear-gradient(135deg, #5f7a46, #455a2f)' },
  { id: 'wine', name: 'Vinho', preview: 'linear-gradient(135deg, #8b3a4a, #5f2131)' },
  { id: 'ocean', name: 'Oceano', preview: 'linear-gradient(135deg, #1f6fb2, #144b7a)' },
  { id: 'graphite', name: 'Grafite', preview: 'linear-gradient(135deg, #4b5563, #1f2937)' },
  { id: 'sand', name: 'Areia', preview: 'linear-gradient(135deg, #b08968, #8c6a50)' },
  { id: 'emerald', name: 'Esmeralda', preview: 'linear-gradient(135deg, #0f766e, #115e59)' },
];
const BACKGROUND_THEME_OPTIONS: Array<{ id: BackgroundTheme; name: string; preview: string }> = [
  { id: 'paper', name: 'Papel', preview: 'linear-gradient(135deg, #faf9f6, #f3f1ea)' },
  { id: 'mist', name: 'Névoa', preview: 'linear-gradient(135deg, #f0f4f8, #dde7f1)' },
  { id: 'sage', name: 'Sálvia', preview: 'linear-gradient(135deg, #f3f6ef, #dde8d2)' },
  { id: 'rose', name: 'Rosé', preview: 'linear-gradient(135deg, #f9f1f4, #eadbe2)' },
  { id: 'midnight', name: 'Noturno', preview: 'linear-gradient(135deg, #111827, #0b1220)' },
];
const isColorTheme = (value: string): value is ColorTheme => COLOR_THEME_OPTIONS.some(option => option.id === value);
const isBackgroundTheme = (value: string): value is BackgroundTheme => BACKGROUND_THEME_OPTIONS.some(option => option.id === value);
const isInternalReasoningMode = (value: string): value is InternalReasoningMode => ['auto', 'pastoral', 'didatico', 'analitico', 'socratico', 'canonico'].includes(value);
const ENABLE_ACTIVITY_TRACKING = false;

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding-complete-v1'));
  const [fontSize, setFontSize] = useState<number>(() => {
    const raw = localStorage.getItem('app-font-size');
    const parsed = raw ? parseInt(raw, 10) : 16;
    if (Number.isNaN(parsed)) return 16;
    return Math.max(12, Math.min(24, parsed));
  });
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    return saved && isColorTheme(saved) ? saved : 'petrol';
  });
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>(() => {
    const saved = localStorage.getItem(BACKGROUND_THEME_STORAGE_KEY);
    return saved && isBackgroundTheme(saved) ? saved : 'paper';
  });
  const [reasoningMode, setReasoningMode] = useState<InternalReasoningMode>(() => {
    const saved = localStorage.getItem(INTERNAL_REASONING_MODE_STORAGE_KEY);
    return saved && isInternalReasoningMode(saved) ? saved : 'auto';
  });
  const normalizeNote = (raw: any): Note | null => {
    if (!raw || typeof raw !== 'object') return null;
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : `${Date.now()}-${Math.random()}`;
    const reference = typeof raw.reference === 'string' ? raw.reference.trim() : '';
    const content = typeof raw.content === 'string' ? raw.content.trim() : '';
    if (!reference || !content) return null;

    const date = typeof raw.date === 'string' && raw.date ? raw.date : new Date().toISOString();
    const updatedAt = typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : undefined;
    const tags = Array.isArray(raw.tags)
  ? raw.tags
      .filter(
        (tag: unknown): tag is string =>
          typeof tag === 'string' && tag.trim().length > 0
      )
      .map((tag: string) => tag.trim())
  : [];
    const notebook = typeof raw.notebook === 'string' && raw.notebook.trim().length > 0 ? raw.notebook.trim() : 'Geral';
    const pinned = typeof raw.pinned === 'boolean' ? raw.pinned : false;

    return {
      id,
      reference,
      content,
      date,
      updatedAt,
      tags,
      notebook,
      pinned,
    };
  };

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('notes');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(item => normalizeNote(item))
        .filter((item): item is Note => item !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return [];
    }
  });
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [goalTargets, setGoalTargets] = useState<GoalTargets>(() => {
    const saved = localStorage.getItem('goal-targets-v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<GoalTargets>;
        return {
          sessions: Math.max(1, parsed.sessions ?? 12),
          activeDays: Math.max(1, Math.min(7, parsed.activeDays ?? 5)),
          bibleViews: Math.max(1, parsed.bibleViews ?? 7),
        };
      } catch {
        // ignore broken persisted goals
      }
    }

    return { sessions: 12, activeDays: 5, bibleViews: 7 };
  });
  const [bibleVersionCodes, setBibleVersionCodes] = useState<string[]>(['ARC', 'ARA', 'NVT', 'KJV']);
  const [isImportingBibleVersion, setIsImportingBibleVersion] = useState(false);
  const [bibleImportStatus, setBibleImportStatus] = useState<string | null>(null);
  const [isImportingStrongDictionary, setIsImportingStrongDictionary] = useState(false);
  const [strongDictionaryImportStatus, setStrongDictionaryImportStatus] = useState<string | null>(null);

  const GOAL_PROFILES: Record<GoalProfile, GoalTargets> = {
    conservador: { sessions: 8, activeDays: 4, bibleViews: 5 },
    crescimento: { sessions: 12, activeDays: 5, bibleViews: 7 },
    intensivo: { sessions: 20, activeDays: 6, bibleViews: 10 },
  };

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = (reference: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    const newNote: Note = {
      id: Date.now().toString(),
      reference,
      content: trimmed,
      date: now,
      updatedAt: now,
      tags: [],
      notebook: 'Geral',
      pinned: false,
    };
    setNotes(prev => [newNote, ...prev]);
    trackActivity('note_created', `Nota criada em ${reference}`);
  };

  const updateNote = (noteId: string, patch: Partial<Pick<Note, 'content' | 'tags' | 'notebook' | 'pinned'>>) => {
    setNotes(prev => prev.map(note => {
      if (note.id !== noteId) return note;

      const nextContent = typeof patch.content === 'string' ? patch.content.trim() : note.content;
      const nextTags = Array.isArray(patch.tags)
        ? patch.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).map((tag: string) => tag.trim())
        : note.tags || [];
      const nextNotebook = typeof patch.notebook === 'string' && patch.notebook.trim().length > 0
        ? patch.notebook.trim()
        : (note.notebook || 'Geral');
      const nextPinned = typeof patch.pinned === 'boolean' ? patch.pinned : !!note.pinned;

      return {
        ...note,
        content: nextContent,
        tags: nextTags,
        notebook: nextNotebook,
        pinned: nextPinned,
        updatedAt: new Date().toISOString(),
      };
    }));
    trackActivity('note_updated', 'Nota atualizada');
  };

  const deleteNote = (noteId: string) => {
    const found = notes.find(note => note.id === noteId);
    const confirmed = window.confirm('Deseja excluir esta nota?');
    if (!confirmed) return;
    setNotes(prev => prev.filter(note => note.id !== noteId));
    trackActivity('note_deleted', found ? `Nota excluída em ${found.reference}` : 'Nota excluída');
  };

  const openNoteReference = (reference: string) => {
    const match = reference.trim().match(/^(.*)\s+(\d+)(?::(\d+))?$/);
    if (!match) return;

    const rawBook = match[1].trim();
    const chapter = parseInt(match[2], 10);
    const verse = match[3] ? parseInt(match[3], 10) : 1;
    if (Number.isNaN(chapter) || Number.isNaN(verse)) return;

    const normalizeBook = (value: string) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const targetBook = BOOKS.find(item => normalizeBook(item.name) === normalizeBook(rawBook));
    if (!targetBook) return;

    localStorage.setItem('pending-bible-target', JSON.stringify({
      bookName: targetBook.name,
      chapter: Math.max(1, Math.min(chapter, targetBook.chapters)),
      verse: Math.max(1, verse),
      label: `${targetBook.name} ${chapter}:${Math.max(1, verse)}`,
    }));

    setScreen('bible');
    trackActivity('note_open_reference', `Nota aberta em ${reference}`);
  };

  const trackActivity = (type: string, label: string) => {
    if (!ENABLE_ACTIVITY_TRACKING) return;
    if (isUselessActivityEvent({ type, label })) return;

    setActivityEvents(prev => {
      const next = [{ id: `${Date.now()}-${Math.random()}`, type, label, timestamp: Date.now() }, ...prev].slice(0, 200);
      localStorage.setItem('activity-events-v1', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    localStorage.removeItem('activity-events-v1');
    setActivityEvents([]);
  }, []);

  const openPlanInBible = (plan: ReadingPlan) => {
    const target = getPlanReferenceTarget(plan);
    openBibleTarget(target, `Plano ${plan.id} em ${target.label}`);
  };

  const openBibleTarget = (target: PlanReferenceTarget, eventLabel: string) => {
    localStorage.setItem('pending-bible-target', JSON.stringify(target));
    setScreen('bible');
    trackActivity('reading_plan_continue', eventLabel);
  };

  const clearActivity = () => {
    localStorage.removeItem('activity-events-v1');
    setActivityEvents([]);
  };

  const changeGoalTarget = (key: keyof GoalTargets, value: number) => {
    const safe = Number.isNaN(value) ? 1 : value;
    setGoalTargets(prev => {
      const next = {
        ...prev,
        [key]: key === 'activeDays' ? Math.max(1, Math.min(7, safe)) : Math.max(1, safe),
      };
      localStorage.setItem('goal-targets-v1', JSON.stringify(next));
      return next;
    });
  };

  const recalibrateGoals = () => {
    const now = Date.now();
    const startPrevious = now - (14 * 24 * 60 * 60 * 1000);
    const endPrevious = now - (7 * 24 * 60 * 60 * 1000);
    const previousWeekEventsCount = activityEvents.filter(event => event.timestamp >= startPrevious && event.timestamp < endPrevious).length;
    const last30 = activityEvents.filter(event => event.timestamp >= now - (30 * 24 * 60 * 60 * 1000));
    const activeDays30 = new Set(last30.map(event => new Date(event.timestamp).toISOString().slice(0, 10))).size;

    const next: GoalTargets = {
      sessions: previousWeekEventsCount > 0 ? Math.max(12, Math.ceil(previousWeekEventsCount * 1.2)) : 12,
      activeDays: Math.max(3, Math.min(7, Math.round(activeDays30 / 4) || 5)),
      bibleViews: 7,
    };

    setGoalTargets(next);
    localStorage.setItem('goal-targets-v1', JSON.stringify(next));
  };

  const applyGoalProfile = (profile: GoalProfile) => {
    const preset = GOAL_PROFILES[profile];
    setGoalTargets(preset);
    localStorage.setItem('goal-targets-v1', JSON.stringify(preset));
    trackActivity('goal_profile_applied', `Perfil aplicado: ${profile}`);
  };

  const exportAppData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        notes,
        theme: localStorage.getItem('theme') || 'light',
        colorTheme: localStorage.getItem(COLOR_THEME_STORAGE_KEY) || colorTheme,
        backgroundTheme: localStorage.getItem(BACKGROUND_THEME_STORAGE_KEY) || backgroundTheme,
        reasoningMode: localStorage.getItem(INTERNAL_REASONING_MODE_STORAGE_KEY) || reasoningMode,
        fontSize: localStorage.getItem('app-font-size') || String(fontSize),
        readingLocations: localStorage.getItem('reading-locations') || '[]',
        verseCommentary: localStorage.getItem('verse-commentary') || '{}',
        studyPreferences: localStorage.getItem('study-analysis-preferences') || '{}',
        activityEvents: localStorage.getItem('activity-events-v1') || '[]',
        goalTargets: localStorage.getItem('goal-targets-v1') || '{}'
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sola-scriptura-backup-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const refreshBibleVersionCodes = async () => {
    try {
      const stored = await getStoredVersions();
      const dynamicCodes = stored
        .map(item => item.code)
        .filter(code => typeof code === 'string' && code.trim().length > 0);
      const merged = Array.from(new Set(['ARC', 'ARA', 'NVT', 'KJV', ...dynamicCodes]));
      setBibleVersionCodes(merged);
    } catch (error) {
      console.error('Falha ao carregar versões bíblicas locais:', error);
    }
  };

  const importBibleVersionData = async (file: File) => {
    try {
      setIsImportingBibleVersion(true);
      setBibleImportStatus(null);

      const result = await processFile(file, 'bible');
      if (!result?.data || result.data.length === 0) {
        throw new Error('Nenhum versículo válido foi encontrado no arquivo informado.');
      }

      const rawMeta = result.meta || {};
      const safeCode = String(rawMeta.code || file.name.replace(/\.[^.]+$/, '')).toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) || `IMP-${Date.now().toString().slice(-6)}`;
      const meta: StoredBibleMeta = {
        code: safeCode,
        name: String(rawMeta.name || file.name.replace(/\.[^.]+$/, '')),
        language: String(rawMeta.language || 'pt'),
        importedAt: Date.now(),
      };

      await saveBibleVersion(meta, result.data);
      await refreshBibleVersionCodes();

      setBibleImportStatus(`Importação concluída: ${result.data.length.toLocaleString()} versículos salvos em ${meta.code}.`);
      trackActivity('bible_import', `Versão ${meta.code} importada`);
    } catch (error: any) {
      console.error('Falha ao importar Bíblia:', error);
      setBibleImportStatus(`Falha na importação: ${error?.message || 'erro desconhecido'}`);
    } finally {
      setIsImportingBibleVersion(false);
    }
  };

  const loadMissingGithubVersions = async (): Promise<GitHubVersionOption[]> => {
    try {
      setBibleImportStatus('Consultando versões no GitHub...');

      const [stored, listingResponse] = await Promise.all([
        getStoredVersions(),
        fetch(GITHUB_BIBLES_API),
      ]);

      if (!listingResponse.ok) {
        throw new Error(`Falha ao consultar versões remotas (${listingResponse.status}).`);
      }

      const listing = await listingResponse.json() as GitHubRepoFile[];
      const remoteFiles: GitHubVersionOption[] = listing
        .filter(item => item.type === 'file' && /\.json$/i.test(item.name) && Boolean(item.download_url))
        .map(item => ({
          fileName: item.name,
          code: toVersionCodeFromFileName(item.name),
          url: String(item.download_url),
        }))
        .sort((a, b) => a.code.localeCompare(b.code));

      const existingCodes = new Set(stored.map(item => String(item.code || '').toUpperCase()));
      const missing = remoteFiles.filter(item => !existingCodes.has(item.code));

      if (missing.length === 0) {
        setBibleImportStatus('Nenhuma versão nova encontrada. Seu app já possui todas as versões do repositório remoto.');
      } else {
        setBibleImportStatus(`${missing.length} versão(ões) disponível(is) para importação.`);
      }

      return missing;
    } catch (error: any) {
      console.error('Falha ao consultar versões do GitHub:', error);
      setBibleImportStatus(`Falha ao listar versões remotas: ${error?.message || 'erro desconhecido'}`);
      return [];
    }
  };

  const importMissingGithubVersions = async (selectedVersions: GitHubVersionOption[]) => {
    try {
      if (!Array.isArray(selectedVersions) || selectedVersions.length === 0) {
        setBibleImportStatus('Nenhuma versão foi selecionada para importação.');
        return;
      }

      setIsImportingBibleVersion(true);

      let importedCount = 0;
      const importedCodes: string[] = [];
      const failures: string[] = [];

      for (const item of selectedVersions) {
        try {
          setBibleImportStatus(`Importando ${item.code} (${importedCount + 1}/${selectedVersions.length})...`);
          const response = await fetch(item.url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const payload = await response.json();
          const verses = parseRepoBibleToVerses(payload, item.code);
          if (verses.length === 0) throw new Error('formato sem versículos válidos');

          const meta: StoredBibleMeta = {
            code: item.code,
            name: item.code,
            language: 'pt',
            importedAt: Date.now(),
          };

          await saveBibleVersion(meta, verses);
          importedCount += 1;
          importedCodes.push(item.code);
          trackActivity('bible_import', `Versão ${item.code} importada do GitHub`);
        } catch (error: any) {
          console.error(`Falha ao importar versão ${item.code}:`, error);
          failures.push(`${item.code}: ${error?.message || 'erro desconhecido'}`);
        }
      }

      await refreshBibleVersionCodes();

      if (importedCount === 0) {
        setBibleImportStatus(`Nenhuma versão foi importada. Falhas: ${failures.join(' | ')}`);
        return;
      }

      const baseMessage = `Importação concluída: ${importedCount}/${selectedVersions.length} versão(ões) (${importedCodes.join(', ')}).`;
      setBibleImportStatus(failures.length > 0 ? `${baseMessage} Falhas: ${failures.join(' | ')}` : baseMessage);
    } catch (error: any) {
      console.error('Falha ao sincronizar versões do GitHub:', error);
      setBibleImportStatus(`Falha na sincronização automática: ${error?.message || 'erro desconhecido'}`);
    } finally {
      setIsImportingBibleVersion(false);
    }
  };

  const importStrongDictionaryData = async (file: File) => {
    try {
      setIsImportingStrongDictionary(true);
      setStrongDictionaryImportStatus(null);

      const result = await processFile(file, 'dictionary');
      if (!result?.data || result.data.length === 0) {
        throw new Error('Nenhuma entrada válida de dicionário foi encontrada.');
      }

      await saveDictionaries(result.data);
      setStrongDictionaryImportStatus(`Dicionário importado: ${result.data.length.toLocaleString()} entradas disponíveis para análise Strong.`);
      trackActivity('strong_dictionary_import', `Entradas: ${result.data.length}`);
    } catch (error: any) {
      console.error('Falha ao importar dicionário Strong:', error);
      setStrongDictionaryImportStatus(`Falha na importação do dicionário: ${error?.message || 'erro desconhecido'}`);
    } finally {
      setIsImportingStrongDictionary(false);
    }
  };

  const reloadDefaultStrongDictionary = async () => {
    try {
      setIsImportingStrongDictionary(true);
      setStrongDictionaryImportStatus(null);

      const entries = mapBundledStrongDictionaryToEntries();
      if (entries.length === 0) {
        throw new Error('Nenhuma entrada padrão foi encontrada.');
      }

      await saveDictionaries(entries);
      setStrongDictionaryImportStatus(`Dicionário padrão recarregado: ${entries.length.toLocaleString()} entradas disponíveis para análise Strong.`);
      trackActivity('strong_dictionary_import', `Padrão OpenScriptures: ${entries.length}`);
    } catch (error: any) {
      console.error('Falha ao recarregar dicionário Strong padrão:', error);
      setStrongDictionaryImportStatus(`Falha ao recarregar dicionário padrão: ${error?.message || 'erro desconhecido'}`);
    } finally {
      setIsImportingStrongDictionary(false);
    }
  };

  const importAppData = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        data?: {
          notes?: Note[];
          theme?: string;
          colorTheme?: string;
          backgroundTheme?: string;
          reasoningMode?: string;
          fontSize?: string;
          readingLocations?: string;
          verseCommentary?: string;
          studyPreferences?: string;
          activityEvents?: string;
          goalTargets?: string;
        };
      };

      if (!parsed?.data) {
        alert('Arquivo de backup inválido.');
        return;
      }

      if (Array.isArray(parsed.data.notes)) {
        const normalizedNotes = parsed.data.notes
          .map(item => normalizeNote(item))
          .filter((item): item is Note => item !== null)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNotes(normalizedNotes);
      }
      if (typeof parsed.data.theme === 'string') localStorage.setItem('theme', parsed.data.theme);
      if (typeof parsed.data.colorTheme === 'string' && isColorTheme(parsed.data.colorTheme)) {
        localStorage.setItem(COLOR_THEME_STORAGE_KEY, parsed.data.colorTheme);
      }
      if (typeof parsed.data.backgroundTheme === 'string' && isBackgroundTheme(parsed.data.backgroundTheme)) {
        localStorage.setItem(BACKGROUND_THEME_STORAGE_KEY, parsed.data.backgroundTheme);
      }
      if (typeof parsed.data.reasoningMode === 'string' && isInternalReasoningMode(parsed.data.reasoningMode)) {
        localStorage.setItem(INTERNAL_REASONING_MODE_STORAGE_KEY, parsed.data.reasoningMode);
      }
      if (typeof parsed.data.fontSize === 'string') localStorage.setItem('app-font-size', parsed.data.fontSize);
      if (typeof parsed.data.readingLocations === 'string') localStorage.setItem('reading-locations', parsed.data.readingLocations);
      if (typeof parsed.data.verseCommentary === 'string') localStorage.setItem('verse-commentary', parsed.data.verseCommentary);
      if (typeof parsed.data.studyPreferences === 'string') localStorage.setItem('study-analysis-preferences', parsed.data.studyPreferences);
      if (typeof parsed.data.activityEvents === 'string') localStorage.setItem('activity-events-v1', parsed.data.activityEvents);
      if (typeof parsed.data.goalTargets === 'string') localStorage.setItem('goal-targets-v1', parsed.data.goalTargets);

      alert('Backup importado com sucesso. O app será recarregado.');
      window.location.reload();
    } catch (error) {
      console.error('Falha ao importar backup:', error);
      alert('Não foi possível importar este arquivo.');
    }
  };

  const resetLocalData = () => {
    const confirmed = window.confirm('Deseja apagar todos os dados locais do app? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    localStorage.removeItem('notes');
    localStorage.removeItem('reading-locations');
    localStorage.removeItem('verse-commentary');
    localStorage.removeItem('study-analysis-preferences');
    localStorage.removeItem('onboarding-complete-v1');
    localStorage.removeItem('activity-events-v1');
    localStorage.removeItem('goal-targets-v1');
    localStorage.removeItem(COLOR_THEME_STORAGE_KEY);
    localStorage.removeItem(BACKGROUND_THEME_STORAGE_KEY);
    localStorage.removeItem(INTERNAL_REASONING_MODE_STORAGE_KEY);

    setNotes([]);
    setActivityEvents([]);
    setGoalTargets({ sessions: 12, activeDays: 5, bibleViews: 7 });
    setShowOnboarding(true);
    alert('Dados locais apagados com sucesso.');
  };

  useEffect(() => {
    localStorage.setItem('goal-targets-v1', JSON.stringify(goalTargets));
  }, [goalTargets]);

  useEffect(() => {
    void refreshBibleVersionCodes();
  }, []);

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-color-theme', colorTheme);
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-app-bg', backgroundTheme);
    localStorage.setItem(BACKGROUND_THEME_STORAGE_KEY, backgroundTheme);
  }, [backgroundTheme]);

  useEffect(() => {
    localStorage.setItem(INTERNAL_REASONING_MODE_STORAGE_KEY, reasoningMode);
  }, [reasoningMode]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--reading-font-size', `${fontSize}px`);
    localStorage.setItem('app-font-size', String(fontSize));
  }, [fontSize]);

  const completeOnboarding = () => {
    localStorage.setItem('onboarding-complete-v1', '1');
    setShowOnboarding(false);
    trackActivity('onboarding_completed', 'Onboarding concluído');
  };

  useEffect(() => {
    if (screen === 'library') return;
    trackActivity('screen_view', `Tela: ${screen}`);
  }, [screen]);

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={setScreen}
            onOpenPlan={openPlanInBible}
          />
        );
      case 'bible': return <BibleScreen onAddNote={addNote} availableVersions={bibleVersionCodes} />;
      case 'study': return <StudyScreen goalTargets={goalTargets} onApplyGoalProfile={applyGoalProfile} availableVersions={bibleVersionCodes} />;
      case 'confessions': return <ConfessionsScreen />;
      case 'library':
        return (
          <LibraryScreen
            notes={notes}
            onOpenReference={openNoteReference}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            colorTheme={colorTheme}
            onChangeColorTheme={setColorTheme}
            backgroundTheme={backgroundTheme}
            onChangeBackgroundTheme={setBackgroundTheme}
            reasoningMode={reasoningMode}
            onChangeReasoningMode={setReasoningMode}
            onExportData={exportAppData}
            onImportData={importAppData}
            onImportBibleVersion={importBibleVersionData}
            onLoadMissingGithubVersions={loadMissingGithubVersions}
            onImportMissingGithubVersions={importMissingGithubVersions}
            onImportStrongDictionary={importStrongDictionaryData}
            onReloadDefaultStrongDictionary={reloadDefaultStrongDictionary}
            onResetData={resetLocalData}
            activityEvents={activityEvents}
            onClearActivity={clearActivity}
            goalTargets={goalTargets}
            onChangeGoalTarget={changeGoalTarget}
            onRecalibrateGoals={recalibrateGoals}
            onApplyGoalProfile={applyGoalProfile}
            isImportingBibleVersion={isImportingBibleVersion}
            bibleImportStatus={bibleImportStatus}
            isImportingStrongDictionary={isImportingStrongDictionary}
            strongDictionaryImportStatus={strongDictionaryImportStatus}
            bibleVersionCodes={bibleVersionCodes}
          />
        );
      case 'reading-plans': return <ReadingPlansScreen onBack={() => setScreen('home')} onOpenPlan={openPlanInBible} onOpenBibleTarget={openBibleTarget} />;
      default:
        return (
          <HomeScreen
            onNavigate={setScreen}
            onOpenPlan={openPlanInBible}
          />
        );
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-paper-50 dark:bg-navy-900 transition-colors duration-500 overflow-hidden lg:pl-24">
      {!isOnline && (
        <div className="px-4 py-2 text-xs text-center font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800">
          Você está offline. Alguns recursos podem ficar indisponíveis temporariamente.
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch] relative lg:w-full lg:max-w-6xl lg:mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full min-h-0 lg:px-6 xl:px-10"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={screen} onChange={setScreen} />

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            onClose={completeOnboarding}
            onGoBible={() => {
              setScreen('bible');
              completeOnboarding();
            }}
            onGoConfessions={() => {
              setScreen('confessions');
              completeOnboarding();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
