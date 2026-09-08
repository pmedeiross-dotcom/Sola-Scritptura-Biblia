
import React, { useState, useEffect } from 'react';
import { STUDY_PLANS } from '../constants';
import { PlayCircle, Clock, CheckCircle2, ChevronLeft, ChevronRight, Book, Scroll, CheckCircle } from 'lucide-react';
import { StudyPlan, StudySession } from '../types';
import { getStudyProgress, updateStudyProgress } from '../services/db';

interface StudyDashboardProps {
  onJumpToBible: (book: string, chapter: number) => void;
  onJumpToConfession: () => void;
}

const StudyDashboard: React.FC<StudyDashboardProps> = ({ onJumpToBible, onJumpToConfession }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Record<string, string[]>>({});
  
  const selectedPlan = STUDY_PLANS.find(p => p.id === selectedPlanId);

  useEffect(() => {
    const loadAllProgress = async () => {
      const progressData: Record<string, string[]> = {};
      for (const plan of STUDY_PLANS) {
        progressData[plan.id] = await getStudyProgress(plan.id);
      }
      setCompletedIds(progressData);
    };
    loadAllProgress();
  }, []);

  const handleToggleSession = async (planId: string, sessionId: string) => {
    const current = completedIds[planId] || [];
    const updated = current.includes(sessionId) 
      ? current.filter(id => id !== sessionId)
      : [...current, sessionId];
    
    setCompletedIds({ ...completedIds, [planId]: updated });
    await updateStudyProgress(planId, updated);
  };

  const handleJump = (session: StudySession) => {
    if (session.type === 'bible' && session.book && session.chapter) {
      onJumpToBible(session.book, session.chapter);
    } else {
      onJumpToConfession();
    }
  };

  const getPlanProgress = (plan: StudyPlan) => {
    const completed = completedIds[plan.id]?.length || 0;
    return Math.round((completed / plan.totalSessions) * 100);
  };

  if (selectedPlan) {
    const currentCompleted = completedIds[selectedPlan.id] || [];
    return (
      <div className="flex flex-col h-full min-h-0 overflow-y-auto overscroll-y-contain bg-paper-50 dark:bg-navy-900 animate-fade-in">
        <div className="p-6">
          <button 
            onClick={() => setSelectedPlanId(null)}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-6 hover:text-petrol-600 transition-colors"
          >
            <ChevronLeft size={16} /> Voltar aos Planos
          </button>

          <div className="flex items-start gap-4 mb-8">
            <div className={`w-16 h-16 rounded-2xl ${selectedPlan.coverColor} flex items-center justify-center text-white shadow-lg`}>
              <Book size={32} />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-1">{selectedPlan.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-petrol-600 bg-petrol-50 px-2 py-0.5 rounded-full">
                  {getPlanProgress(selectedPlan)}% concluído
                </span>
                <span className="text-xs text-gray-400">{currentCompleted.length} de {selectedPlan.totalSessions} sessões</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {selectedPlan.sessions.map((session, idx) => {
              const isDone = currentCompleted.includes(session.id);
              return (
                <div 
                  key={session.id}
                  className={`bg-white dark:bg-navy-800 p-4 rounded-2xl border transition-all flex items-center justify-between group
                    ${isDone ? 'border-green-100 dark:border-green-900/30' : 'border-gray-100 dark:border-gray-700 hover:border-petrol-200'}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button 
                      onClick={() => handleToggleSession(selectedPlan.id, session.id)}
                      className={`p-2 rounded-xl transition-colors ${isDone ? 'bg-green-50 text-green-500' : 'bg-gray-50 dark:bg-navy-900 text-gray-300'}`}
                    >
                      <CheckCircle2 size={20} fill={isDone ? 'currentColor' : 'none'} className={isDone ? 'text-green-500' : ''} />
                    </button>
                    <div className="flex-1 cursor-pointer" onClick={() => handleJump(session)}>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5 flex items-center gap-1">
                        Sessão {idx + 1} • {session.type === 'bible' ? <Book size={10}/> : <Scroll size={10}/>} {session.reference}
                      </div>
                      <h3 className={`text-sm font-bold ${isDone ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                        {session.title}
                      </h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJump(session)}
                    className="p-2 text-gray-300 hover:text-petrol-600 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto overscroll-y-contain bg-paper-50 dark:bg-navy-900 pb-24">
      <div className="p-6">
        <h1 className="font-serif text-2xl font-bold text-petrol-900 dark:text-white mb-2">Planos de Estudo</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
           Trilhas guiadas unindo Bíblia e Confissão para aprofundamento teológico.
        </p>

        <div className="space-y-4">
          {STUDY_PLANS.map((plan) => {
            const progress = getPlanProgress(plan);
            return (
              <div 
                key={plan.id} 
                className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col group cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <div className={`h-2 w-full ${plan.coverColor}`}></div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-petrol-600 transition-colors">{plan.title}</h3>
                     {progress > 0 && (
                       <span className="text-xs font-bold text-petrol-600 bg-petrol-50 dark:bg-petrol-900/40 px-2 py-1 rounded-full">
                         {progress}%
                       </span>
                     )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {plan.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={14} /> {completedIds[plan.id]?.length || 0}/{plan.totalSessions} sessões
                      </span>
                    </div>
                    <div className="text-petrol-700 dark:text-petrol-300 font-bold flex items-center gap-1">
                      {progress === 0 ? 'Iniciar' : progress === 100 ? 'Revisar' : 'Continuar'} <PlayCircle size={14} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudyDashboard;
