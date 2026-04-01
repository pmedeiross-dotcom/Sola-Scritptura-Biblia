
import React from 'react';
import { Play, Book, ArrowRight, Sparkles, ShieldCheck, Quote } from 'lucide-react';
import { Tab } from '../types';
import { MOCK_CONFESSIONS, MOCK_VERSES, STUDY_PLANS, LOGO_SVG } from '../constants';

interface HomeDashboardProps {
  onChangeTab: (tab: Tab) => void;
  userParams: { name: string };
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onChangeTab, userParams }) => {
  const activePlan = STUDY_PLANS[0];
  const dailyVerse = MOCK_VERSES[0];
  const dailyConfession = MOCK_CONFESSIONS[0];

  return (
    <div className="space-y-10 animate-fade-in p-6 pb-20">
      {/* Welcome Section - Android 14 Header Style */}
      <section className="mt-2 text-center flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-petrol-500/20 blur-[60px] rounded-full" />
          <img src={LOGO_SVG} alt="Sola Scriptura Logo" className="w-32 h-32 object-contain relative logo-shadow animate-float" />
        </div>
        <h1 className="text-3xl font-serif font-black text-petrol-900 dark:text-white mb-2 tracking-tight">
          Paz seja convosco, <span className="text-petrol-600 dark:text-petrol-400">{userParams.name}</span>.
        </h1>
        <div className="flex items-center gap-2 justify-center text-gray-500 dark:text-gray-400 text-sm font-medium">
          <Sparkles size={14} className="text-gold-500" />
          <p>O temor do Senhor é o princípio da sabedoria.</p>
        </div>
      </section>

      {/* Compreensão Reformada - Nova Seção Doutrinária */}
      <section className="bg-petrol-50/50 dark:bg-navy-800/30 rounded-3xl p-6 border border-petrol-100 dark:border-petrol-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <ShieldCheck size={120} />
        </div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-petrol-600 dark:text-petrol-400 mb-3 flex items-center gap-2">
          <ShieldCheck size={14} /> Nossa Compreensão
        </h2>
        <p className="text-sm text-petrol-900 dark:text-gray-200 font-serif leading-relaxed italic opacity-80">
          "Partimos da compreensão de que as Escrituras são a única regra infalível de fé e prática, enquanto as Confissões são marcos seguros que resumem fielmente o que a Bíblia ensina."
        </p>
      </section>

      {/* Plan Card - Modern Surface Design */}
      <section>
        <div className="flex justify-between items-center mb-5 px-1">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            Caminhada de Estudo
          </h2>
          <button 
            onClick={() => onChangeTab(Tab.STUDY)} 
            className="text-petrol-700 dark:text-petrol-400 text-xs font-extrabold hover:underline flex items-center gap-1 active-ripple"
          >
            Ver todos <ArrowRight size={12} />
          </button>
        </div>
        
        <div 
          className="bg-white dark:bg-navy-800 rounded-3xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 p-6 relative overflow-hidden group cursor-pointer transition-all active:scale-[0.98] hover:shadow-xl hover:border-petrol-200"
          onClick={() => onChangeTab(Tab.STUDY)}
        >
          <div className={`absolute top-0 left-0 w-2.5 h-full ${activePlan.coverColor}`}></div>
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h3 className="font-serif text-xl font-black text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                {activePlan.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed italic">
                {activePlan.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Progresso</span>
                   <span className="text-[10px] font-black text-petrol-600 dark:text-petrol-400">{activePlan.progress}%</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={`h-full ${activePlan.coverColor} transition-all duration-1000 rounded-full shadow-[0_0_8px_rgba(0,109,119,0.2)]`} 
                    style={{ width: `${activePlan.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="bg-petrol-600 dark:bg-petrol-500 text-white p-4 rounded-2xl shadow-lg shadow-petrol-500/30 group-hover:scale-110 transition-transform">
              <Play size={24} fill="currentColor" className="ml-0.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Scripture Card - Android 14 Immersive Look */}
      <section>
         <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500 mb-5 px-1">
            Palavra de Hoje
          </h2>
          <div className="bg-gradient-to-br from-petrol-800 to-navy-900 dark:from-navy-800 dark:to-black rounded-4xl p-8 text-white relative shadow-2xl overflow-hidden group border border-white/5">
            <div className="absolute -bottom-12 -right-12 p-4 opacity-[0.04] group-hover:opacity-[0.08] transition-all duration-700 group-hover:rotate-0 rotate-12">
              <img src={LOGO_SVG} className="w-80 h-80 grayscale brightness-0 invert" alt="" />
            </div>
            
            <div className="absolute top-0 left-10 w-5 h-12 bg-crimson-600 rounded-b-xl shadow-lg border-x border-b border-black/10"></div>
            
            <p className="font-serif text-2xl italic leading-relaxed relative z-10 mb-8 pt-8 opacity-100 text-paper-50 drop-shadow-sm selection:bg-gold-500/30">
              "{dailyVerse.text}"
            </p>
            <div className="flex items-center gap-3 text-gold-500 font-black text-xs relative z-10">
              <div className="bg-gold-500/10 px-3 py-1.5 rounded-full border border-gold-500/20 tracking-[0.15em] uppercase">
                {dailyVerse.book} {dailyVerse.chapter}:{dailyVerse.verse}
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
              <span className="text-white/50 font-bold uppercase tracking-widest">Almeida ARC</span>
            </div>
          </div>
      </section>

      {/* Confession Section - Polished Finish */}
      <section className="pb-10">
        <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500 mb-5 px-1">
            Doutrina e Vida
        </h2>
        <div className="bg-paper-100 dark:bg-navy-800/40 rounded-3xl p-7 border border-gray-200/80 dark:border-gray-700/80 hover:border-gold-500/40 transition-all shadow-sm">
          <div className="flex items-center gap-3 mb-5">
             <div className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter bg-gold-600 text-white shadow-md">
               {dailyConfession.source}
             </div>
             <div className="h-1 w-1 rounded-full bg-gray-300"></div>
             <span className="text-xs font-extrabold text-gray-400 tracking-wider uppercase">{dailyConfession.reference}</span>
          </div>
          <h3 className="font-serif font-black text-gray-900 dark:text-gray-100 mb-4 leading-tight text-xl">
            {dailyConfession.question}
          </h3>
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4 mb-6 font-serif italic selection:bg-petrol-500/20">
            {dailyConfession.answer}
          </p>
          <button 
            onClick={() => onChangeTab(Tab.CONFESSIONS)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white dark:bg-navy-800 text-xs font-black uppercase tracking-[0.2em] text-petrol-800 dark:text-petrol-400 border border-gray-200 dark:border-gray-700 hover:bg-petrol-50 dark:hover:bg-navy-700 transition-all active:scale-95 active-ripple shadow-sm"
          >
            Aprofundar Estudo <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomeDashboard;
