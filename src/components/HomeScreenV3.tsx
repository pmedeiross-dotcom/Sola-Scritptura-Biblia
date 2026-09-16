import { useEffect, useMemo, useState } from 'react';
import { Book, Search, History, Settings as SettingsIcon, ChevronRight, Share2, MessageSquare, Sparkles, Library, Bookmark, Highlighter, Calendar, Layers, Sun } from 'lucide-react';
import { getStudyPlanProgress, readStudyProgress, toggleStudyDay, writeStudyProgress, type StudyProgressState } from '../studyProgress';
import '../home-v3.css';
import '../home-v3-hierarchy.css';
import '../home-modern.css';

type ReadingPlan = { id: string; title: string; progress: number; days: number; currentDay: number };
type HomeScreenV3Props = { onNavigate: (screen: 'home' | 'bible' | 'study' | 'confessions' | 'library' | 'settings' | 'reading-plans') => void; onOpenPlan: (plan: ReadingPlan) => void };
const PLANS: ReadingPlan[] = [{ id: 'year', title: 'Bíblia em um Ano', progress: 0, days: 365, currentDay: 1 }, { id: 'reformation', title: 'Teologia da Reforma', progress: 0, days: 30, currentDay: 1 }, { id: 'psalms', title: 'Sabedoria dos Salmos', progress: 0, days: 150, currentDay: 1 }];
const DAILY_VERSES = [['João 3:16', 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.'], ['Romanos 8:1', 'Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus.'], ['Salmos 23:1', 'O Senhor é o meu pastor; nada me faltará.'], ['Efésios 2:8', 'Porque pela graça sois salvos, por meio da fé; e isso não vem de vós; é dom de Deus.'], ['Isaías 40:31', 'Mas os que esperam no Senhor renovarão as suas forças e subirão com asas como águias.'], ['Filipenses 4:6', 'Não estejais inquietos por coisa alguma; antes, as vossas petições sejam em tudo conhecidas diante de Deus.'], ['Hebreus 4:16', 'Cheguemos, pois, com confiança ao trono da graça, para que possamos alcançar misericórdia.'], ['2 Coríntios 5:17', 'Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram.'], ['Provérbios 3:5', 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.'], ['Josué 1:9', 'Não to mandei eu? Esforça-te e tem bom ânimo; não temas, porque o Senhor teu Deus é contigo.'], ['Mateus 11:28', 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.'], ['Salmos 119:105', 'Lâmpada para os meus pés e luz para o meu caminho.'], ['Romanos 12:2', 'E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento.'], ['1 Pedro 5:7', 'Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.'], ['João 14:6', 'Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.']];
const PLAN_REFERENCES: Record<string, string[]> = { year: ['Gênesis 1:1', 'Êxodo 3:14', 'Salmos 23:1', 'João 1:1'], reformation: ['Romanos 8:1', 'Efésios 2:8', 'Gálatas 2:20', 'João 17:17', '2 Timóteo 3:16'], psalms: ['Salmos 15:1', 'Salmos 23:1', 'Salmos 46:1', 'Salmos 51:1', 'Salmos 119:105'] };

export default function HomeScreenV3({ onNavigate, onOpenPlan }: HomeScreenV3Props) {
  const [dailyVerse, setDailyVerse] = useState(DAILY_VERSES[0]);
  const [lastLocation, setLastLocation] = useState<string | null>(null);
  const [studyProgress, setStudyProgress] = useState<StudyProgressState>(() => readStudyProgress());

  useEffect(() => {
    const index = Math.floor(Date.now() / 86400000) % DAILY_VERSES.length;
    setDailyVerse(DAILY_VERSES[index]);
    try {
      const locations = JSON.parse(localStorage.getItem('reading-locations') || '[]') as Array<{ label?: string }>;
      setLastLocation(locations[0]?.label || null);
    } catch {
      setLastLocation(null);
    }
  }, []);

  const shareVerse = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: 'Sola Scriptura', text: `“${dailyVerse[1]}” — ${dailyVerse[0]}` });
    } catch {
      // cancelled
    }
  };

  const handleCompletePlanDay = (plan: ReadingPlan) => {
    const progress = getStudyPlanProgress(studyProgress, plan.id, plan.days);
    const nextDay = Math.min(plan.days, progress.completedDays + 1);
    if (progress.completedDays >= plan.days) return;
    const nextState = toggleStudyDay(studyProgress, plan.id, nextDay);
    writeStudyProgress(nextState);
    setStudyProgress(nextState);
  };

  const plans = useMemo(() => PLANS.map(plan => {
    const progress = getStudyPlanProgress(studyProgress, plan.id, plan.days);
    const currentDay = Math.min(plan.days, progress.completedDays + 1);
    return { ...plan, progress: progress.progress, currentDay };
  }), [studyProgress]);

  const quickActions = useMemo(() => [{ label: 'Ler Bíblia', description: 'Leia e navegue pelas Escrituras', icon: Book, screen: 'bible' as const }, { label: 'Estudar', description: 'Análise bíblica e teológica', icon: Sparkles, screen: 'study' as const }, { label: 'Pesquisar', description: 'Encontre uma passagem', icon: Search, screen: 'bible' as const }, { label: 'Anotações', description: 'Registre suas reflexões', icon: MessageSquare, screen: 'library' as const }], []);
  const navItems = [{ label: 'Início', icon: Book, screen: 'home' as const }, { label: 'Bíblia', icon: Book, screen: 'bible' as const }, { label: 'Planos de Leitura', icon: Calendar, screen: 'reading-plans' as const }, { label: 'Estudo', icon: Sparkles, screen: 'study' as const }, { label: 'Confissões', icon: Library, screen: 'confessions' as const }, { label: 'Biblioteca', icon: Bookmark, screen: 'library' as const }, { label: 'Configurações', icon: SettingsIcon, screen: 'settings' as const }];
  const resources = [['Favoritos', Bookmark, 'library' as const], ['Marcações', Highlighter, 'library' as const], ['Histórico', History, 'library' as const], ['Traduções', Layers, 'bible' as const], ['Planos', Calendar, 'reading-plans' as const], ['Confissões', Library, 'confessions' as const], ['Biblioteca', Book, 'library' as const], ['Ajustes', SettingsIcon, 'settings' as const]] as const;

  return (
    <div className="ss-modern-home">
      <aside className="ss-modern-sidebar">
        <div className="ss-modern-brand">
          <span className="ss-modern-brand-mark"><Book className="w-5 h-5" /></span>
          <div><strong>SOLA SCRIPTURA</strong><small>Bíblia</small></div>
        </div>
        <nav className="ss-modern-nav" aria-label="Navegação principal">
          {navItems.map(({ label, icon: Icon, screen }) => (
            <button key={label} type="button" className={screen === 'home' ? 'active' : ''} onClick={() => onNavigate(screen)} title={label}>
              <Icon /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="ss-modern-sidebar-quote">“Toda a Escritura é inspirada por Deus...”<strong>2 Timóteo 3:16</strong></div>
      </aside>

      <main className="ss-modern-main">
        <div className="ss-modern-content">
          <header className="ss-modern-topbar">
            <div className="ss-modern-search"><Search className="w-5 h-5" /><span>Buscar na Bíblia (ex.: João 3:16, fé, graça, salvação...)</span></div>
            <div className="ss-modern-top-actions">
              <button type="button" className="ss-modern-icon-btn" onClick={() => onNavigate('settings')} aria-label="Configurações"><SettingsIcon className="w-5 h-5" /></button>
              <button type="button" className="ss-modern-icon-btn" onClick={() => onNavigate('settings')} aria-label="Tema"><Sun className="w-5 h-5" /></button>
            </div>
          </header>

          <section className="ss-modern-hero">
            <div className="ss-modern-hero-copy">
              <span className="ss-modern-kicker">BEM-VINDO AO</span>
              <h1>Sola Scriptura Bíblia</h1>
              <p>A Palavra de Deus sempre ao seu alcance.</p>
              <div className="ss-modern-hero-actions">
                <button type="button" className="ss-modern-primary-btn" onClick={() => onNavigate('bible')}>Ler a Bíblia <ChevronRight className="w-4 h-4" /></button>
                <button type="button" className="ss-modern-ghost-btn" onClick={() => onNavigate('study')}>Começar estudo <Sparkles className="w-4 h-4" /></button>
              </div>
            </div>
          </section>

          <section className="ss-modern-section">
            <div className="ss-modern-section-head"><div><span className="ss-modern-kicker">ACESSO RÁPIDO</span><h2>O que você quer fazer?</h2></div></div>
            <div className="ss-modern-actions-grid">
              {quickActions.map(({ label, description, icon: Icon, screen }) => (
                <button key={label} type="button" onClick={() => onNavigate(screen)} className="ss-modern-action">
                  <span className="ss-modern-action-icon"><Icon className="w-5 h-5" /></span>
                  <span><strong>{label}</strong><small>{description}</small></span>
                  <ChevronRight className="ss-modern-arrow w-4 h-4" />
                </button>
              ))}
            </div>
          </section>

          <section className="ss-modern-section">
            <div className="ss-modern-two-col">
              <article className="ss-modern-card ss-modern-verse">
                <span className="ss-modern-kicker">VERSÍCULO DO DIA</span>
                <blockquote>“{dailyVerse[1]}”<cite>{dailyVerse[0]}</cite></blockquote>
                <div className="ss-modern-verse-actions">
                  <button type="button" className="ss-modern-icon-btn" onClick={shareVerse} aria-label="Compartilhar versículo"><Share2 className="w-4 h-4" /></button>
                  <button type="button" className="ss-modern-icon-btn" onClick={() => onNavigate('bible')} aria-label="Abrir Bíblia"><Book className="w-4 h-4" /></button>
                </div>
              </article>
              <article className="ss-modern-card">
                <div className="ss-modern-section-head"><div><span className="ss-modern-kicker">SEU PROGRESSO</span><h2>Meu caminho</h2></div></div>
                <div className="ss-modern-progress-list">
                  {plans.map(plan => (
                    <div className="ss-modern-progress-item" key={plan.id}>
                      <div className="ss-modern-progress-top"><strong>{plan.title}</strong><span>{plan.progress}%</span></div>
                      <p>{plan.progress >= 100 ? 'Plano concluído' : `Dia ${plan.currentDay} de ${plan.days}`}</p>
                      <div className="ss-modern-progress-bar"><i style={{ width: `${plan.progress}%` }} /></div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="ss-modern-section">
            <div className="ss-modern-section-head"><div><span className="ss-modern-kicker">RECURSOS</span><h2>Tudo em um só lugar</h2></div><small>8 atalhos</small></div>
            <div className="ss-modern-resource-grid">
              {resources.map(([label, Icon, screen]) => <button key={label} type="button" onClick={() => onNavigate(screen)} className="ss-modern-resource"><span><Icon className="w-4 h-4" /></span><strong>{label}</strong></button>)}
            </div>
          </section>

          <section className="ss-modern-section">
            <div className="ss-modern-section-head"><div><span className="ss-modern-kicker">CONTINUE SEU CAMINHO</span><h2>Planos de leitura</h2></div><button type="button" className="ss-modern-ghost-btn" onClick={() => onNavigate('reading-plans')}>Ver todos <ChevronRight className="w-3 h-3" /></button></div>
            <div className="ss-modern-plans">
              {plans.map(plan => { const refs = PLAN_REFERENCES[plan.id] || []; const todayRef = refs[(plan.currentDay - 1) % Math.max(1, refs.length)] || 'Leitura de hoje'; const completed = plan.progress >= 100; return (
                <article key={plan.id} className="ss-modern-plan">
                  <div className="ss-modern-plan-top"><span><Calendar className="w-4 h-4" /></span><small>{completed ? 'Concluído' : `Dia ${plan.currentDay}/${plan.days}`}</small></div>
                  <h3>{plan.title}</h3><p>{completed ? 'Plano concluído' : `Hoje: ${todayRef}`}</p>
                  <div className="ss-modern-progress-bar"><i style={{ width: `${plan.progress}%` }} /></div>
                  <div className="ss-modern-plan-bottom"><small>{plan.progress}% concluído</small><div><button type="button" onClick={() => onOpenPlan(plan)}>Continuar</button><button type="button" onClick={() => handleCompletePlanDay(plan)} disabled={completed}>{completed ? 'Concluído' : 'Concluir dia'}</button></div></div>
                </article>
              ); })}
            </div>
          </section>

          <section className="ss-modern-section">
            <div className="ss-modern-resume">
              <span className="ss-modern-resume-icon"><Book className="w-5 h-5" /></span>
              <div><span className="ss-modern-kicker">SUA LEITURA</span><h2>{lastLocation ? `Continue em ${lastLocation}` : 'Comece sua leitura hoje'}</h2><p>{lastLocation ? 'Retome o ponto que você salvou.' : 'Abra a Bíblia e salve seu primeiro local de leitura.'}</p></div>
              <button type="button" onClick={() => onNavigate('bible')}>Abrir Bíblia <ChevronRight className="w-3 h-3" /></button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
