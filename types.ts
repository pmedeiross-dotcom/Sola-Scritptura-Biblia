
export enum Tab {
  HOME = 'home',
  BIBLE = 'bible',
  CONFESSIONS = 'confessions',
  STUDY = 'study',
  AI = 'ai',
  LIBRARY = 'library'
}

export type BibleVersion = 'ARA' | 'NVT' | 'KJV' | 'NA28' | 'BHS' | string;

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: BibleVersion;
  highlighted?: boolean;
}

export interface DictionaryEntry {
  id: string;
  word: string;
  definition: string;
  source: string;
  category?: string;
}

export interface ConfessionItem {
  id: string;
  source: string; 
  reference: string; 
  question?: string;
  answer: string;
  tags: string[];
  createdAt?: number;
  popularity?: number;
}

export interface ConfessionHighlight {
  id: string;
  confessionId: string;
  question: string;
  answer: string;
  source: string;
  reference: string;
  createdAt: number;
}

export interface StudySession {
  id: string;
  title: string;
  type: 'bible' | 'confession';
  reference: string;
  book?: string;
  chapter?: number;
  isCompleted?: boolean;
}

export interface StudyPlan {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalSessions: number;
  completedSessions: number;
  coverColor: string;
  sessions: StudySession[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  reference: string;
  createdAt: number;
}

export interface Highlight {
  id: string;
  verseKey: string;
  text: string;
  reference: string;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  type: 'bible' | 'confession';
  reference: string;
  timestamp: number;
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}
