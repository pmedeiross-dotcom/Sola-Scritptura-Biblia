
import { ConfessionItem, StudyPlan, Verse } from "./types";

export const LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#D4AF37;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#F9E27E;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M350 120 L450 150 C450 300 350 420 350 450 C350 420 250 300 250 150 L350 120" fill="#4a0404" stroke="url(#goldGrad)" stroke-width="8"/>
  <path d="M350 120 L350 450" stroke="url(#goldGrad)" stroke-width="4" opacity="0.3"/>
  <path d="M375 180 L405 180 M390 165 L390 210" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round"/>
  <path d="M290 170 Q310 170 320 210" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M100 380 Q180 350 260 380 L260 220 Q180 190 100 220 Z" fill="white" stroke="#333" stroke-width="2"/>
  <path d="M420 380 Q340 350 260 380 L260 220 Q340 190 420 220 Z" fill="white" stroke="#333" stroke-width="2"/>
  <path d="M100 380 L100 395 Q180 365 260 395 L260 380" fill="#e0e0e0" stroke="#333" stroke-width="2"/>
  <path d="M420 380 L420 395 Q340 365 260 395 L260 380" fill="#e0e0e0" stroke="#333" stroke-width="2"/>
  <path d="M230 360 L230 410 L250 410 L250 360 Z" fill="#A51C30"/>
  <path d="M245 140 L275 140 M260 110 L260 200" stroke="url(#goldGrad)" stroke-width="12" stroke-linecap="round"/>
</svg>
`)}`;

export interface BibleBookInfo {
  name: string;
  chapters: number;
  test: "AT" | "NT";
  abbr: string[];
}

export const BIBLE_BOOKS: BibleBookInfo[] = [
  { name: "Gênesis", chapters: 50, test: "AT", abbr: ["gn", "gen", "genesis"] },
  { name: "Êxodo", chapters: 40, test: "AT", abbr: ["ex", "exo", "exodo"] },
  { name: "Salmos", chapters: 150, test: "AT", abbr: ["sl", "sal", "ps", "salmos"] },
  { name: "Mateus", chapters: 28, test: "NT", abbr: ["mt", "mat", "mateus"] },
  { name: "Romanos", chapters: 16, test: "NT", abbr: ["rm", "rom", "romanos"] },
  { name: "Efésios", chapters: 6, test: "NT", abbr: ["ef", "efe", "efesios"] },
  { name: "Apocalipse", chapters: 22, test: "NT", abbr: ["ap", "apo", "apocalipse", "rev"] }
];

export const MOCK_VERSES: Verse[] = [
  { book: "Romanos", chapter: 8, verse: 1, text: "Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus, que não andam segundo a carne, mas segundo o Espírito.", version: "ARA" },
  { book: "Salmos", chapter: 23, verse: 1, text: "O SENHOR é o meu pastor, nada me faltará.", version: "ARA" }
];

const SOURCE_CFW = "Confissão de Fé de Westminster";

export const MOCK_CONFESSIONS: ConfessionItem[] = [
  // CAPÍTULO 1
  {
    id: "cfw-1-1",
    source: SOURCE_CFW,
    reference: "Cap. 1, Sec. 1",
    question: "Das Sagradas Escrituras",
    answer: "Ainda que a luz da natureza e as obras da criação e da providência manifestam de tal modo a bondade, a sabedoria e o poder de Deus, que os homens sejam inescusáveis, todavia não são suficientes para dar aquele conhecimento de Deus e de sua vontade, necessário à salvação; por isso agradou ao Senhor, em diversos tempos e diferentes modos, revelar-se e declarar à sua Igreja aquela sua vontade; e depois, para melhor preservação e propagação da verdade, para o mais seguro estabelecimento e conforto da Igreja contra a corrupção da carne e contra a maldade de Satanás e do mundo, foi igualmente servido fazê-la escrever toda. Isto torna as Escrituras Sagradas indispensáveis, tendo cessado aqueles antigos modos de Deus revelar a sua vontade ao seu povo.",
    tags: ["Escrituras", "Revelação"],
    popularity: 100
  },
  {
    id: "cfw-1-2",
    source: SOURCE_CFW,
    reference: "Cap. 1, Sec. 2",
    question: "O Cânon das Escrituras",
    answer: "Sob o nome de Escrituras Sagradas, ou Palavra de Deus escrita, incluem-se agora todos os livros do Antigo e do Novo Testamento... Todos eles são dados por inspiração de Deus para serem a regra de fé e prática.",
    tags: ["Escrituras", "Cânon"],
    popularity: 90
  },
  // CAPÍTULO 2
  {
    id: "cfw-2-1",
    source: SOURCE_CFW,
    reference: "Cap. 2, Sec. 1",
    question: "De Deus e da Santíssima Trindade",
    answer: "Há um só Deus vivo e verdadeiro, o qual é infinito em seu ser e em perfeição. Ele é um Espírito puríssimo, invisível, sem corpo, sem membros, não sujeito a paixões; é imutável, imenso, eterno, incompreensível, onipotente, onisciente, santíssimo, completamente livre e absoluto, e tudo faz segundo o conselho da sua própria vontade, que é reta e imutável, e para a sua própria glória.",
    tags: ["Teologia", "Atributos de Deus"],
    popularity: 98
  },
  {
    id: "cfw-2-3",
    source: SOURCE_CFW,
    reference: "Cap. 2, Sec. 3",
    question: "A Santíssima Trindade",
    answer: "Na unidade da Divindade há três pessoas de uma mesma substância, poder e eternidade: Deus o Pai, Deus o Filho e Deus o Espírito Santo. O Pai não é de ninguém: não é gerado, nem procedente; o Filho é eternamente gerado do Pai; o Espírito Santo é eternamente procedente do Pai e do Filho.",
    tags: ["Trindade", "Divindade"],
    popularity: 95
  },
  // CAPÍTULO 3
  {
    id: "cfw-3-1",
    source: SOURCE_CFW,
    reference: "Cap. 3, Sec. 1",
    question: "Dos Eternos Decretos de Deus",
    answer: "Desde toda a eternidade e pelo mui sábio e santo conselho de sua própria vontade, Deus ordenou livre e inalteravelmente tudo quanto acontece, porém de modo que nem Deus é o autor do pecado, nem violentada é a vontade da criatura, nem é tirada a liberdade ou contingência das causas secundárias, antes estabelecidas.",
    tags: ["Soberania", "Decretos"],
    popularity: 92
  },
  // CAPÍTULO 8
  {
    id: "cfw-8-1",
    source: SOURCE_CFW,
    reference: "Cap. 8, Sec. 1",
    question: "De Cristo, o Mediador",
    answer: "Aprouve a Deus, em seu eterno propósito, escolher e ordenar o Senhor Jesus, seu Filho Unigênito, para ser o Mediador entre Deus e o homem, o Profeta, Sacerdote e Rei, o Cabeça e Salvador de sua Igreja, o Herdeiro de todas as coisas e o Juiz do mundo; e deu-lhe, desde toda a eternidade, um povo para ser sua semente, e para, no tempo devido, ser por ele remido, chamado, justificado, santificado e glorificado.",
    tags: ["Cristologia", "Mediação"],
    popularity: 96
  },
  // CAPÍTULO 11
  {
    id: "cfw-11-1",
    source: SOURCE_CFW,
    reference: "Cap. 11, Sec. 1",
    question: "Da Justificação",
    answer: "Os que Deus chama eficazmente, também livremente justifica. Esta justificação não consiste em Deus infundir neles a justiça, mas em perdoar os seus pecados e em considerar e aceitá-los como justos. Deus não os justifica em razão de qualquer coisa neles operada ou por eles feita mas somente em consideração à obra de Cristo.",
    tags: ["Soteriologia", "Justificação"],
    popularity: 94
  },
  // CAPÍTULO 33
  {
    id: "cfw-33-1",
    source: SOURCE_CFW,
    reference: "Cap. 33, Sec. 1",
    question: "Do Juízo Final",
    answer: "Deus já determinou um dia no qual, com justiça, há de julgar o mundo por meio de Jesus Cristo a quem, pelo Pai, foram dados o poder e o juízo. Nesse dia não somente serão julgados os anjos apóstatas, mas igualmente todas as pessoas que tiverem vivido sobre a terra comparecerão ante o tribunal de Cristo.",
    tags: ["Escatologia", "Juízo"],
    popularity: 88
  },
  {
    id: "hc-1",
    source: "Catecismo de Heidelberg",
    reference: "P. 1",
    question: "Qual é o teu único consolo, na vida e na morte?",
    answer: "Que, de corpo e alma, tanto na vida como na morte, eu não pertenço a mim mesmo, mas ao meu fiel Salvador Jesus Cristo. Ele pagou plenamente todos os meus pecados com o seu precioso sangue...",
    tags: ["Consolo", "Salvação"],
    createdAt: 1704067200000,
    popularity: 98
  },
  {
    id: "wsc-1",
    source: "Breve Catecismo de Westminster",
    reference: "P. 1",
    question: "Qual é o fim principal do homem?",
    answer: "O fim principal do homem é glorificar a Deus, e gozá-lo para sempre.",
    tags: ["Doutrina", "Vida Cristã"],
    createdAt: 1704240000000,
    popularity: 95
  }
];

export const STUDY_PLANS: StudyPlan[] = [
  {
    id: "plan-cfw",
    title: "Fundamentos da Fé",
    description: "Estudo sistemático dos primeiros capítulos da Confissão de Fé de Westminster.",
    progress: 0,
    totalSessions: 3,
    completedSessions: 0,
    coverColor: "bg-crimson-700",
    sessions: [
      { id: "cfw1", title: "As Escrituras Sagradas", type: 'confession', reference: "CFW Cap. 1" },
      { id: "cfw2", title: "A Natureza de Deus", type: 'confession', reference: "CFW Cap. 2" },
      { id: "cfw3", title: "Os Decretos de Deus", type: 'confession', reference: "CFW Cap. 3" },
    ]
  },
  {
    id: "plan-efesios",
    title: "A Riqueza em Efésios",
    description: "Doutrinas da graça e vida cristã prática.",
    progress: 0,
    totalSessions: 6,
    completedSessions: 0,
    coverColor: "bg-petrol-500",
    sessions: [
      { id: "ef1", title: "Nossa Eleição em Cristo", type: 'bible', reference: "Efésios 1", book: "Efésios", chapter: 1 },
      { id: "ef2", title: "Vivos em Cristo pela Graça", type: 'bible', reference: "Efésios 2", book: "Efésios", chapter: 2 },
    ]
  }
];
