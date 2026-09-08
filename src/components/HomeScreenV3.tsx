import { useEffect, useMemo, useState } from 'react';
import { Book, Search, History, Settings as SettingsIcon, ChevronRight, Share2, MessageSquare, Sparkles, Library, Bookmark, Highlighter, Calendar, Layers } from 'lucide-react';

type ReadingPlan = { id: string; title: string; progress: number; days: number; currentDay: number };
type HomeScreenV3Props = { onNavigate: (screen: 'home' | 'bible' | 'study' | 'confessions' | 'library' | 'settings' | 'reading-plans') => void; onOpenPlan: (plan: ReadingPlan) => void };
const PLANS: ReadingPlan[] = [
  { id: 'year', title: 'Bíblia em um Ano', progress: 35, days: 365, currentDay: 128 },
  { id: 'reformation', title: 'Teologia da Reforma', progress: 60, days: 30, currentDay: 18 },
  { id: 'psalms', title: 'Sabedoria dos Salmos', progress: 10, days: 150, currentDay: 15 },
];
const DAILY_VERSES = [
  ['João 3:16', 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.'],
  ['Romanos 8:1', 'Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus.'],
  ['Salmos 23:1', 'O Senhor é o meu pastor; nada me faltará.'],
  ['Efésios 2:8', 'Porque pela graça sois salvos, por meio da fé; e isso não vem de vós; é dom de Deus.'],
  ['Isaías 40:31', 'Mas os que esperam no Senhor renovarão as suas forças e subirão com asas como águias.'],
  ['Filipenses 4:6', 'Não estejais inquietos por coisa alguma; antes, as vossas petições sejam em tudo conhecidas diante de Deus.'],
  ['Hebreus 4:16', 'Cheguemos, pois, com confiança ao trono da graça, para que possamos alcançar misericórdia.'],
  ['2 Coríntios 5:17', 'Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram.'],
  ['Provérbios 3:5', 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.'],
  ['Josué 1:9', 'Não to mandei eu? Esforça-te e tem bom ânimo; não temas, porque o Senhor teu Deus é contigo.'],
  ['Mateus 11:28', 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.'],
  ['Salmos 119:105', 'Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.'],
  ['Romanos 12:2', 'E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento.'],
  ['1 Pedro 5:7', 'Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.'],
  ['João 14:6', 'Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.'],
];
const PLAN_REFERENCES: Record<string, string[]> = {
  year: ['Gênesis 1:1', 'Êxodo 3:14', 'Salmos 23:1', 'João 1:1'],
  reformation: ['Romanos 8:1', 'Efésios 2:8', 'Gálatas 2:20', 'João 17:17', '2 Timóteo 3:16'],
  psalms: ['Salmos 15:1', 'Salmos 23:1', 'Salmos 46:1', 'Salmos 51:1', 'Salmos 119:105'],
};

export default function HomeScreenV3({ onNavigate, onOpenPlan }: HomeScreenV3Props) {
  const [dailyVerse, setDailyVerse] = useState(DAILY_VERSES[0]);
  const [lastLocation, setLastLocation] = useState<string | null>(null);

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

  const quickActions = useMemo(() => [
    { label: 'Ler Bíblia', description: 'Leia e navegue pelas Escrituras', icon: Book, screen: 'bible' as const, tone: 'ss-v3-gold' },
    { label: 'Estudar', description: 'Análise bíblica e teológica', icon: Sparkles, screen: 'study' as const, tone: 'ss-v3-green' },
    { label: 'Pesquisar', description: 'Encontre uma passagem', icon: Search, screen: 'bible' as const, tone: 'ss-v3-blue' },
    { label: 'Anotações', description: 'Registre suas reflexões', icon: MessageSquare, screen: 'library' as const, tone: 'ss-v3-violet' },
  ], []);

  const resources = [
    ['Favoritos', Bookmark, 'library' as const],
    ['Marcações', Highlighter, 'library' as const],
    ['Histórico', History, 'library' as const],
    ['Traduções', Layers, 'bible' as const],
    ['Planos', Calendar, 'reading-plans' as const],
    ['Confissões', Library, 'confessions' as const],
    ['Biblioteca', Book, 'library' as const],
    ['Ajustes', SettingsIcon, 'settings' as const],
  ] as const;

  return (
    <div className="ss-v3-home"><div className="ss-v3-inner">
      <header className="ss-v3-header"><div><span className="ss-v3-eyebrow">SOLA SCRIPTURA</span><h1>Leia. Examine. Compreenda.</h1><p>Seu espaço para leitura bíblica e estudo da fé reformada.</p></div><button className="ss-v3-settings" onClick={() => onNavigate('settings')} aria-label="Configurações"><SettingsIcon className="w-5 h-5" /></button></header>
      <section className="ss-v3-hero"><div className="ss-v3-hero-copy"><span>VERSÍCULO DO DIA</span><p>“{dailyVerse[1]}”</p><strong>{dailyVerse[0]}</strong></div><div className="ss-v3-hero-actions"><button onClick={shareVerse} className="ss-v3-share" aria-label="Compartilhar versículo"><Share2 className="w-5 h-5" /></button><button onClick={() => onNavigate('bible')} className="ss-v3-read">Ler agora <ChevronRight className="w-4 h-4" /></button></div></section>
      <section className="ss-v3-section"><div className="ss-v3-section-head"><div><span className="ss-v3-eyebrow">ACESSO RÁPIDO</span><h2>O que você quer fazer?</h2></div></div><div className="ss-v3-primary-grid">{quickActions.map(({ label, description, icon: Icon, screen, tone }) => <button key={label} onClick={() => onNavigate(screen)} className={`ss-v3-primary ${tone}`}><span className="ss-v3-primary-icon"><Icon className="w-6 h-6" strokeWidth={1.9} /></span><span><strong>{label}</strong><small>{description}</small></span><ChevronRight className="ss-v3-arrow w-5 h-5" /></button>)}</div></section>
      <section className="ss-v3-section"><div className="ss-v3-section-head"><div><span className="ss-v3-eyebrow">RECURSOS</span><h2>Tudo em um só lugar</h2></div><span className="ss-v3-count">8 atalhos</span></div><div className="ss-v3-resource-grid">{resources.map(([label, Icon, screen]) => <button key={label} onClick={() => onNavigate(screen)} className="ss-v3-resource"><span><Icon className="w-5 h-5" strokeWidth={1.8} /></span><strong>{label}</strong></button>)}</div></section>
      <section className="ss-v3-section"><div className="ss-v3-section-head"><div><span className="ss-v3-eyebrow">CONTINUE SEU CAMINHO</span><h2>Planos de leitura</h2></div><button onClick={() => onNavigate('reading-plans')} className="ss-v3-see-all">Ver todos</button></div><div className="ss-v3-plans">{PLANS.map(plan => { const refs = PLAN_REFERENCES[plan.id] || []; const todayRef = refs[(plan.currentDay - 1) % Math.max(1, refs.length)] || 'Leitura de hoje'; return <article key={plan.id} className="ss-v3-plan"><div className="ss-v3-plan-top"><span><Calendar className="w-5 h-5" /></span><small>Dia {plan.currentDay}/{plan.days}</small></div><h3>{plan.title}</h3><p>Hoje: {todayRef}</p><div className="ss-v3-progress"><i style={{ width: `${plan.progress}%` }} /></div><div className="ss-v3-plan-bottom"><small>{plan.progress}% concluído</small><button onClick={() => onOpenPlan(plan)}>Continuar</button></div></article>; })}</div></section>
      <section className="ss-v3-resume"><span className="ss-v3-resume-icon"><Book className="w-6 h-6" /></span><div><span className="ss-v3-eyebrow">SUA LEITURA</span><h2>{lastLocation ? `Continue em ${lastLocation}` : 'Comece sua leitura hoje'}</h2><p>{lastLocation ? 'Retome o ponto que você salvou.' : 'Abra a Bíblia e salve seu primeiro local de leitura.'}</p></div><button onClick={() => onNavigate('bible')}>Abrir Bíblia <ChevronRight className="w-4 h-4" /></button></section>
    </div></div>
  );
}
