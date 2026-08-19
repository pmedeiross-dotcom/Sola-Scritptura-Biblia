import React from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Clock3, GraduationCap, Quote, ScrollText, Sparkles, Play, ShieldCheck } from 'lucide-react';
import { Tab } from '../types';
import { MOCK_CONFESSIONS, MOCK_VERSES, STUDY_PLANS, LOGO_SVG } from '../constants';
import '../src/modern.css';

interface HomeDashboardProps {
  onChangeTab: (tab: Tab) => void;
  userParams: { name: string };
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onChangeTab, userParams }) => {
  const activePlan = STUDY_PLANS[0];
  const dailyVerse = MOCK_VERSES[0];
  const dailyConfession = MOCK_CONFESSIONS[0];
  const openBible = () => onChangeTab(Tab.BIBLE);
  const openStudy = () => onChangeTab(Tab.STUDY);
  const openConfessions = () => onChangeTab(Tab.CONFESSIONS);
  const openLibrary = () => onChangeTab(Tab.LIBRARY);

  return (
    <main className="ss-home animate-fade-in">
      <header className="ss-home-header">
        <div className="ss-brand-mark"><img src={LOGO_SVG} alt="Sola Scriptura" /></div>
        <div className="min-w-0">
          <p className="ss-eyebrow">SOLA SCRIPTURA</p>
          <h1>Bem-vindo, <span>{userParams.name}</span></h1>
          <p className="ss-subtitle">Leia. Examine. Compreenda.</p>
        </div>
        <button onClick={openBible} className="ss-header-action" aria-label="Abrir Bíblia"><BookOpen size={19} /></button>
      </header>

      <section className="ss-hero-grid">
        <button onClick={openBible} className="ss-continue-card text-left">
          <div className="ss-card-noise" />
          <div className="relative z-10 flex items-start justify-between gap-5">
            <div><span className="ss-chip"><BookOpen size={13} /> Continuar leitura</span><h2>João 3</h2><p>Retome exatamente de onde parou e continue examinando o texto.</p></div>
            <span className="ss-round-action"><ArrowRight size={20} /></span>
          </div>
          <div className="relative z-10 mt-7"><div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/55 mb-2"><span>Progresso da leitura</span><span>12%</span></div><div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-[12%] rounded-full bg-amber-300" /></div></div>
        </button>

        <button onClick={openStudy} className="ss-command-card text-left">
          <div className="flex items-center justify-between mb-6"><span className="ss-icon-tile"><GraduationCap size={20} /></span><span className="ss-live-dot"><i /> Estudo</span></div>
          <p className="ss-eyebrow">Mesa de estudo</p><h2>{activePlan.title}</h2><p>{activePlan.description}</p>
          <div className="mt-auto flex items-center justify-between pt-6"><span className="text-xs font-bold text-gray-400">{activePlan.progress}% concluído</span><span className="ss-text-link">Abrir <ArrowRight size={14} /></span></div>
        </button>
      </section>

      <section className="ss-section-head"><div><p className="ss-eyebrow">Seu ambiente de estudo</p><h2>O texto no centro. O estudo ao redor.</h2></div><span className="hidden sm:block ss-section-note">Uma experiência construída para permanecer no texto.</span></section>

      <section className="ss-bento-grid">
        <button onClick={openBible} className="ss-bento ss-bento-scripture text-left">
          <div className="ss-bento-top"><span className="ss-icon-tile"><BookOpen size={18} /></span><span>Escrituras</span></div>
          <div className="mt-12 relative z-10"><p className="ss-scripture-quote">“{dailyVerse.text}”</p><div className="mt-5 flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-widest"><span>{dailyVerse.book} {dailyVerse.chapter}:{dailyVerse.verse}</span><span className="opacity-30">•</span><span>ARA</span></div></div>
          <span className="ss-bento-arrow"><ChevronRight size={17} /></span>
        </button>

        <button onClick={openConfessions} className="ss-bento ss-bento-doctrine text-left">
          <div className="ss-bento-top"><span className="ss-icon-tile"><ScrollText size={18} /></span><span>Doutrina</span></div>
          <div className="mt-10"><span className="ss-mini-label">{dailyConfession.source}</span><h3>{dailyConfession.question}</h3><p>{dailyConfession.answer}</p></div><span className="ss-bento-arrow"><ChevronRight size={17} /></span>
        </button>

        <button onClick={openStudy} className="ss-bento ss-bento-plan text-left">
          <div className="ss-bento-top"><span className="ss-icon-tile"><CheckCircle2 size={18} /></span><span>Caminhada</span></div><h3>{activePlan.title}</h3><div className="flex items-center gap-4 mt-5"><strong>{activePlan.progress}%</strong><span className="text-xs text-gray-400">concluído</span></div><div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden"><div className={`h-full rounded-full ${activePlan.coverColor}`} style={{ width: `${activePlan.progress}%` }} /></div><div className="mt-5 flex items-center gap-2 text-xs font-bold text-petrol-600 dark:text-petrol-300"><Clock3 size={14} /> Retomar sessão</div>
        </button>

        <button onClick={openLibrary} className="ss-bento ss-bento-library text-left">
          <div className="ss-bento-top"><span className="ss-icon-tile"><ShieldCheck size={18} /></span><span>Biblioteca</span></div><h3>Uma biblioteca para estudar a fé</h3><p>Confissões, catecismos, léxico e recursos em um só lugar.</p><span className="ss-text-link mt-5">Explorar <ArrowRight size={14} /></span>
        </button>
      </section>

      <section className="ss-principle"><div className="ss-principle-symbol"><Sparkles size={20} /></div><div><p className="ss-eyebrow">Princípio orientador</p><p className="ss-principle-text">“As Escrituras são a única regra infalível de fé e prática.”</p><p className="ss-principle-caption">Leia primeiro. Consulte as confissões. Compare tudo com o texto.</p></div><Quote className="hidden md:block ml-auto opacity-10" size={54} /></section>

      <section className="ss-quick-actions"><button onClick={openBible}><BookOpen size={17} /><span>Bíblia</span></button><button onClick={openStudy}><GraduationCap size={17} /><span>Estudar</span></button><button onClick={openConfessions}><ScrollText size={17} /><span>Confissões</span></button><button onClick={openLibrary}><ShieldCheck size={17} /><span>Biblioteca</span></button></section>
      <div className="pb-24" />
    </main>
  );
};

export default HomeDashboard;
