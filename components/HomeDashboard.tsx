import React from 'react';
import {
  AudioLines,
  BookMarked,
  BookOpen,
  Bookmark,
  CalendarDays,
  Clock3,
  GraduationCap,
  History,
  Highlighter,
  Library,
  Languages,
  Search,
  ScrollText,
  Sparkles,
  StickyNote,
  Tags,
} from 'lucide-react';
import { Tab } from '../types';
import { LOGO_SVG, MOCK_VERSES } from '../constants';
import '../src/modern.css';

interface HomeDashboardProps {
  onChangeTab: (tab: Tab) => void;
  userParams: { name: string };
}

type AccessItem = {
  label: string;
  description: string;
  icon: React.ElementType;
  tab: Tab;
  tone: string;
  featured?: boolean;
};

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onChangeTab, userParams }) => {
  const dailyVerse = MOCK_VERSES[0];

  const accessItems: AccessItem[] = [
    { label: 'Ler Bíblia', description: 'Abra as Escrituras', icon: BookOpen, tab: Tab.BIBLE, tone: 'amber', featured: true },
    { label: 'Pesquisar', description: 'Encontre uma passagem', icon: Search, tab: Tab.BIBLE, tone: 'violet' },
    { label: 'Favoritos', description: 'Versículos guardados', icon: Bookmark, tab: Tab.LIBRARY, tone: 'rose' },
    { label: 'Marcações', description: 'Destaques e marcações', icon: Highlighter, tab: Tab.LIBRARY, tone: 'orange' },
    { label: 'Anotações', description: 'Suas notas de estudo', icon: StickyNote, tab: Tab.LIBRARY, tone: 'blue' },
    { label: 'Histórico', description: 'Onde você esteve', icon: History, tab: Tab.LIBRARY, tone: 'slate' },
    { label: 'Traduções', description: 'Compare versões', icon: Languages, tab: Tab.BIBLE, tone: 'cyan' },
    { label: 'Plano de leitura', description: 'Continue seu plano', icon: CalendarDays, tab: Tab.STUDY, tone: 'emerald' },
    { label: 'Temas', description: 'Estude por assunto', icon: Tags, tab: Tab.STUDY, tone: 'fuchsia' },
    { label: 'Versículo do dia', description: 'Uma passagem para hoje', icon: BookMarked, tab: Tab.BIBLE, tone: 'gold' },
    { label: 'Estudo com IA', description: 'Explore o texto', icon: Sparkles, tab: Tab.AI, tone: 'indigo', featured: true },
    { label: 'Confissões', description: 'Doutrina e símbolos', icon: ScrollText, tab: Tab.CONFESSIONS, tone: 'teal' },
    { label: 'Biblioteca', description: 'Recursos de estudo', icon: Library, tab: Tab.LIBRARY, tone: 'purple' },
    { label: 'Áudio', description: 'Ouça as Escrituras', icon: AudioLines, tab: Tab.BIBLE, tone: 'green' },
    { label: 'Mesa de estudo', description: 'Retome seu estudo', icon: GraduationCap, tab: Tab.STUDY, tone: 'indigo' },
    { label: 'Sessões recentes', description: 'Continue de onde parou', icon: Clock3, tab: Tab.LIBRARY, tone: 'stone' },
  ];

  return (
    <main className="ss-home ss-home-access animate-fade-in">
      <header className="ss-home-header">
        <div className="ss-brand-mark">
          <img src={LOGO_SVG} alt="Sola Scriptura" />
        </div>
        <div className="min-w-0">
          <p className="ss-eyebrow">SOLA SCRIPTURA</p>
          <h1>Olá, <span>{userParams.name}</span></h1>
          <p className="ss-subtitle">Tudo o que você precisa para ler e estudar a Escritura.</p>
        </div>
      </header>

      <section className="ss-access-hero">
        <div>
          <span className="ss-access-kicker">Seu centro de acesso</span>
          <h2>O que você quer fazer?</h2>
          <p>Escolha uma ferramenta e vá direto para ela.</p>
        </div>
        <button onClick={() => onChangeTab(Tab.BIBLE)} className="ss-access-resume">
          <span className="ss-access-resume-icon"><BookOpen size={18} /></span>
          <span className="min-w-0 text-left">
            <strong>Continuar leitura</strong>
            <small>{dailyVerse.book} {dailyVerse.chapter}:{dailyVerse.verse}</small>
          </span>
          <span className="ss-access-resume-arrow">→</span>
        </button>
      </section>

      <section className="ss-access-section">
        <div className="ss-access-section-head">
          <div>
            <p className="ss-eyebrow">Acesso rápido</p>
            <h3>Explore o aplicativo</h3>
          </div>
          <span>16 ferramentas</span>
        </div>

        <div className="ss-access-grid">
          {accessItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onChangeTab(item.tab)}
                className={`ss-access-tile ss-access-tone-${item.tone} ${item.featured ? 'is-featured' : ''}`}
                aria-label={`${item.label}: ${item.description}`}
              >
                <span className="ss-access-icon"><Icon size={24} strokeWidth={1.9} /></span>
                <span className="ss-access-label">{item.label}</span>
                <span className="ss-access-description">{item.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="ss-access-bottom">
        <button onClick={() => onChangeTab(Tab.BIBLE)} className="ss-access-verse-card">
          <div className="ss-access-verse-icon"><BookMarked size={20} /></div>
          <div>
            <p className="ss-eyebrow">Versículo do dia</p>
            <blockquote>“{dailyVerse.text}”</blockquote>
            <span>{dailyVerse.book} {dailyVerse.chapter}:{dailyVerse.verse}</span>
          </div>
        </button>

        <button onClick={() => onChangeTab(Tab.STUDY)} className="ss-access-study-card">
          <span className="ss-access-study-icon"><GraduationCap size={21} /></span>
          <div>
            <p className="ss-eyebrow">Próximo passo</p>
            <strong>Continue seu estudo</strong>
            <span>Abra a Mesa de Estudo →</span>
          </div>
        </button>
      </section>

      <div className="pb-24" />
    </main>
  );
};

export default HomeDashboard;
