export interface PericopeSection {
  from: number;
  to: number;
  title: string;
}

const PERICOPE_DATA: Record<string, Record<number, PericopeSection[]>> = {
  'Gênesis': {
    1: [
      { from: 1, to: 5, title: 'A criação da luz' },
      { from: 6, to: 8, title: 'A separação das águas' },
      { from: 9, to: 13, title: 'Terra e mares' },
      { from: 14, to: 19, title: 'Luzeiros no firmamento' },
      { from: 20, to: 25, title: 'Animais das águas e da terra' },
      { from: 26, to: 31, title: 'A criação do homem' }
    ],
    2: [
      { from: 1, to: 3, title: 'O descanso de Deus' },
      { from: 4, to: 17, title: 'O jardim do Eden' },
      { from: 18, to: 25, title: 'A formação da mulher' }
    ],
    3: [
      { from: 1, to: 7, title: 'A queda do homem' },
      { from: 8, to: 13, title: 'Deus chama o homem' },
      { from: 14, to: 19, title: 'As consequências do pecado' },
      { from: 20, to: 24, title: 'Expulsão do Eden' }
    ]
  },
  'Salmos': {
    23: [
      { from: 1, to: 3, title: 'O Senhor e meu pastor' },
      { from: 4, to: 4, title: 'Seguranca no vale da sombra' },
      { from: 5, to: 6, title: 'Bondade e misericordia' }
    ]
  },
  'Mateus': {
    1: [
      { from: 1, to: 17, title: 'Genealogia de Jesus Cristo' },
      { from: 18, to: 25, title: 'Nascimento de Jesus' }
    ],
    2: [
      { from: 1, to: 12, title: 'Os magos do Oriente' },
      { from: 13, to: 15, title: 'Fuga para o Egito' },
      { from: 16, to: 18, title: 'Morte dos meninos em Belem' },
      { from: 19, to: 23, title: 'Volta para Nazare' }
    ],
    3: [
      { from: 1, to: 12, title: 'Pregacao de Joao Batista' },
      { from: 13, to: 17, title: 'Batismo de Jesus' }
    ],
    4: [
      { from: 1, to: 11, title: 'Tentacao de Jesus' },
      { from: 12, to: 17, title: 'Inicio do ministerio na Galileia' },
      { from: 18, to: 22, title: 'Chamado dos primeiros discipulos' },
      { from: 23, to: 25, title: 'Jesus ensina e cura' }
    ],
    5: [
      { from: 1, to: 12, title: 'As bem-aventurancas' },
      { from: 13, to: 16, title: 'Sal e luz' },
      { from: 17, to: 20, title: 'Jesus e a Lei' },
      { from: 21, to: 48, title: 'A justica do Reino' }
    ],
    6: [
      { from: 1, to: 4, title: 'A esmola em secreto' },
      { from: 5, to: 15, title: 'A oracao do Pai Nosso' },
      { from: 16, to: 18, title: 'O jejum' },
      { from: 19, to: 24, title: 'Tesouros no ceu' },
      { from: 25, to: 34, title: 'Ansiedade e confianca em Deus' }
    ],
    7: [
      { from: 1, to: 6, title: 'Nao julgueis' },
      { from: 7, to: 12, title: 'Pedir, buscar e bater' },
      { from: 13, to: 14, title: 'A porta estreita' },
      { from: 15, to: 23, title: 'Falsos profetas' },
      { from: 24, to: 29, title: 'Casa sobre a rocha' }
    ],
    13: [
      { from: 1, to: 23, title: 'Parabola do semeador' },
      { from: 24, to: 30, title: 'Joio e trigo' },
      { from: 31, to: 35, title: 'Grao de mostarda e fermento' },
      { from: 36, to: 43, title: 'Explicacao do joio' },
      { from: 44, to: 52, title: 'Tesouro escondido e perola' },
      { from: 53, to: 58, title: 'Jesus rejeitado em Nazare' }
    ],
    24: [
      { from: 1, to: 14, title: 'Sinais do fim' },
      { from: 15, to: 28, title: 'A grande tribulacao' },
      { from: 29, to: 35, title: 'Vinda do Filho do Homem' },
      { from: 36, to: 51, title: 'Vigiai' }
    ],
    28: [
      { from: 1, to: 10, title: 'Ressurreicao de Jesus' },
      { from: 11, to: 15, title: 'Suborno dos guardas' },
      { from: 16, to: 20, title: 'A grande comissao' }
    ]
  },
  'Marcos': {
    1: [
      { from: 1, to: 8, title: 'Joao Batista prepara o caminho' },
      { from: 9, to: 13, title: 'Batismo e tentacao de Jesus' },
      { from: 14, to: 20, title: 'Chamado dos primeiros discipulos' },
      { from: 21, to: 34, title: 'Ensino e curas em Cafarnaum' },
      { from: 35, to: 39, title: 'Jesus ora e prega' },
      { from: 40, to: 45, title: 'Cura de um leproso' }
    ],
    2: [
      { from: 1, to: 12, title: 'Cura do paralitico' },
      { from: 13, to: 17, title: 'Chamado de Levi' },
      { from: 18, to: 22, title: 'Pergunta sobre o jejum' },
      { from: 23, to: 28, title: 'Jesus e o sabado' }
    ],
    15: [
      { from: 1, to: 15, title: 'Jesus diante de Pilatos' },
      { from: 16, to: 32, title: 'Crucificacao de Jesus' },
      { from: 33, to: 41, title: 'Morte de Jesus' },
      { from: 42, to: 47, title: 'Sepultamento de Jesus' }
    ],
    16: [
      { from: 1, to: 8, title: 'Ressurreicao' },
      { from: 9, to: 20, title: 'Aparicoes e comissao' }
    ]
  },
  'Lucas': {
    1: [
      { from: 1, to: 25, title: 'Anuncio do nascimento de Joao Batista' },
      { from: 26, to: 38, title: 'Anuncio do nascimento de Jesus' },
      { from: 39, to: 56, title: 'Maria visita Isabel' },
      { from: 57, to: 80, title: 'Nascimento de Joao Batista' }
    ],
    2: [
      { from: 1, to: 20, title: 'Nascimento de Jesus' },
      { from: 21, to: 40, title: 'Apresentacao no templo' },
      { from: 41, to: 52, title: 'Jesus aos doze anos' }
    ],
    15: [
      { from: 1, to: 7, title: 'Parabola da ovelha perdida' },
      { from: 8, to: 10, title: 'Parabola da dracma perdida' },
      { from: 11, to: 32, title: 'Parabola do filho prodigo' }
    ],
    24: [
      { from: 1, to: 12, title: 'Ressurreicao de Jesus' },
      { from: 13, to: 35, title: 'No caminho de Emaus' },
      { from: 36, to: 49, title: 'Jesus aparece aos discipulos' },
      { from: 50, to: 53, title: 'Ascensao de Jesus' }
    ]
  },
  'João': {
    1: [
      { from: 1, to: 18, title: 'O Verbo se fez carne' },
      { from: 19, to: 34, title: 'Testemunho de Joao Batista' },
      { from: 35, to: 42, title: 'Primeiros discipulos' },
      { from: 43, to: 51, title: 'Chamado de Filipe e Natanael' }
    ],
    3: [
      { from: 1, to: 21, title: 'Jesus e Nicodemos' },
      { from: 22, to: 30, title: 'O testemunho de Joao Batista' },
      { from: 31, to: 36, title: 'A supremacia de Cristo' }
    ],
    10: [
      { from: 1, to: 21, title: 'O bom pastor' },
      { from: 22, to: 42, title: 'Jesus e rejeitado pelos judeus' }
    ],
    14: [
      { from: 1, to: 14, title: 'O caminho, a verdade e a vida' },
      { from: 15, to: 31, title: 'Promessa do Consolador' }
    ],
    17: [
      { from: 1, to: 5, title: 'Jesus ora por si mesmo' },
      { from: 6, to: 19, title: 'Jesus ora pelos discipulos' },
      { from: 20, to: 26, title: 'Jesus ora por todos os crentes' }
    ],
    20: [
      { from: 1, to: 10, title: 'O tumulo vazio' },
      { from: 11, to: 18, title: 'Jesus aparece a Maria Madalena' },
      { from: 19, to: 23, title: 'Jesus aparece aos discipulos' },
      { from: 24, to: 29, title: 'Jesus e Tome' },
      { from: 30, to: 31, title: 'Proposito do Evangelho' }
    ]
  },
  'Atos': {
    1: [
      { from: 1, to: 11, title: 'Ascensao de Jesus' },
      { from: 12, to: 26, title: 'Eleicao de Matias' }
    ],
    2: [
      { from: 1, to: 13, title: 'Pentecostes' },
      { from: 14, to: 41, title: 'Pregacao de Pedro' },
      { from: 42, to: 47, title: 'Vida da igreja primitiva' }
    ],
    9: [
      { from: 1, to: 19, title: 'Conversao de Saulo' },
      { from: 20, to: 31, title: 'Saulo prega em Damasco e Jerusalem' },
      { from: 32, to: 43, title: 'Milagres por Pedro' }
    ],
    15: [
      { from: 1, to: 21, title: 'Concilio de Jerusalem' },
      { from: 22, to: 35, title: 'Carta aos gentios' },
      { from: 36, to: 41, title: 'Separacao de Paulo e Barnabe' }
    ],
    17: [
      { from: 1, to: 9, title: 'Paulo em Tessalonica' },
      { from: 10, to: 15, title: 'Paulo em Bereia' },
      { from: 16, to: 34, title: 'Paulo em Atenas' }
    ]
  },
  'Romanos': {
    3: [
      { from: 1, to: 8, title: 'Fidelidade de Deus' },
      { from: 9, to: 20, title: 'Todos estao debaixo do pecado' },
      { from: 21, to: 31, title: 'Justificacao pela fe' }
    ],
    5: [
      { from: 1, to: 11, title: 'Paz com Deus' },
      { from: 12, to: 21, title: 'Adao e Cristo' }
    ],
    8: [
      { from: 1, to: 17, title: 'Vida no Espirito' },
      { from: 18, to: 30, title: 'Esperanca da gloria futura' },
      { from: 31, to: 39, title: 'Mais que vencedores' }
    ],
    12: [
      { from: 1, to: 2, title: 'Culto racional' },
      { from: 3, to: 8, title: 'Dons espirituais' },
      { from: 9, to: 21, title: 'Vida crista pratica' }
    ]
  },
  '1 Coríntios': {
    13: [
      { from: 1, to: 3, title: 'Sem amor nada vale' },
      { from: 4, to: 7, title: 'Caracteristicas do amor' },
      { from: 8, to: 13, title: 'A permanencia do amor' }
    ],
    15: [
      { from: 1, to: 11, title: 'Evangelho e testemunhas da ressurreicao' },
      { from: 12, to: 34, title: 'A ressurreicao dos mortos' },
      { from: 35, to: 58, title: 'Corpo glorificado e vitoria final' }
    ]
  },
  '2 Coríntios': {
    4: [
      { from: 1, to: 6, title: 'Tesouro em vasos de barro' },
      { from: 7, to: 15, title: 'Poder de Deus na fraqueza humana' },
      { from: 16, to: 18, title: 'O eterno peso de gloria' }
    ],
    5: [
      { from: 1, to: 10, title: 'Nossa habitacao celestial' },
      { from: 11, to: 17, title: 'Ministerio da reconciliacao' },
      { from: 18, to: 21, title: 'Embaixadores de Cristo' }
    ],
    12: [
      { from: 1, to: 10, title: 'Espinho na carne' },
      { from: 11, to: 21, title: 'Amor pastoral de Paulo' }
    ]
  },
  'Gálatas': {
    1: [
      { from: 1, to: 10, title: 'Nao ha outro evangelho' },
      { from: 11, to: 24, title: 'Chamado e historia de Paulo' }
    ],
    2: [
      { from: 1, to: 10, title: 'Evangelho confirmado em Jerusalem' },
      { from: 11, to: 21, title: 'Justificados pela fe' }
    ],
    5: [
      { from: 1, to: 15, title: 'Liberdade em Cristo' },
      { from: 16, to: 26, title: 'Obras da carne e fruto do Espirito' }
    ],
    6: [
      { from: 1, to: 10, title: 'Levai as cargas uns dos outros' },
      { from: 11, to: 18, title: 'Gloriar-se na cruz' }
    ]
  },
  'Efésios': {
    2: [
      { from: 1, to: 10, title: 'Salvos pela graca' },
      { from: 11, to: 22, title: 'Unidade em Cristo' }
    ],
    6: [
      { from: 1, to: 9, title: 'Relacionamentos no lar e trabalho' },
      { from: 10, to: 20, title: 'Armadura de Deus' },
      { from: 21, to: 24, title: 'Saudacoes finais' }
    ]
  },
  'Colossenses': {
    1: [
      { from: 1, to: 14, title: 'Acao de gracas e oracao' },
      { from: 15, to: 23, title: 'Supremacia de Cristo' },
      { from: 24, to: 29, title: 'Ministerio apostolico' }
    ],
    2: [
      { from: 1, to: 7, title: 'Firmes em Cristo' },
      { from: 8, to: 15, title: 'Plenitude em Cristo' },
      { from: 16, to: 23, title: 'Contra legalismo e ascetismo' }
    ],
    3: [
      { from: 1, to: 11, title: 'Nova vida' },
      { from: 12, to: 17, title: 'Virtudes cristas' },
      { from: 18, to: 25, title: 'Vida no lar' }
    ],
    4: [
      { from: 1, to: 6, title: 'Conduta e oracao' },
      { from: 7, to: 18, title: 'Saudacoes finais' }
    ]
  },
  '1 Tessalonicenses': {
    1: [
      { from: 1, to: 10, title: 'Exemplo dos tessalonicenses' }
    ],
    4: [
      { from: 1, to: 12, title: 'Santificacao e vida fraterna' },
      { from: 13, to: 18, title: 'Esperanca na volta de Cristo' }
    ],
    5: [
      { from: 1, to: 11, title: 'Vigiar e ser sobrios' },
      { from: 12, to: 28, title: 'Exortacoes finais' }
    ]
  },
  '2 Tessalonicenses': {
    1: [
      { from: 1, to: 12, title: 'Consolo na perseguicao' }
    ],
    2: [
      { from: 1, to: 12, title: 'O homem da iniquidade' },
      { from: 13, to: 17, title: 'Permanecei firmes' }
    ],
    3: [
      { from: 1, to: 5, title: 'Pedido de oracao' },
      { from: 6, to: 15, title: 'Advertencia aos desordeiros' },
      { from: 16, to: 18, title: 'Bencao final' }
    ]
  },
  '1 Timóteo': {
    1: [
      { from: 1, to: 11, title: 'Combate ao falso ensino' },
      { from: 12, to: 20, title: 'Graca a Paulo e boa consciencia' }
    ],
    2: [
      { from: 1, to: 7, title: 'Oracoes por todos' },
      { from: 8, to: 15, title: 'Ordem no culto' }
    ],
    3: [
      { from: 1, to: 13, title: 'Qualificacoes de lideres' },
      { from: 14, to: 16, title: 'Misterio da piedade' }
    ],
    4: [
      { from: 1, to: 10, title: 'Apostasia e boa doutrina' },
      { from: 11, to: 16, title: 'Exemplo do ministro fiel' }
    ],
    6: [
      { from: 1, to: 10, title: 'Piedade e contentamento' },
      { from: 11, to: 16, title: 'Combate o bom combate' },
      { from: 17, to: 21, title: 'Instrucao aos ricos' }
    ]
  },
  '2 Timóteo': {
    1: [
      { from: 1, to: 7, title: 'Encorajamento a Timoteo' },
      { from: 8, to: 18, title: 'Nao te envergonhes do evangelho' }
    ],
    2: [
      { from: 1, to: 13, title: 'Soldado, atleta e lavrador' },
      { from: 14, to: 26, title: 'Obreiro aprovado' }
    ],
    3: [
      { from: 1, to: 9, title: 'Ultimos dias' },
      { from: 10, to: 17, title: 'Permanecer nas Escrituras' }
    ],
    4: [
      { from: 1, to: 8, title: 'Prega a Palavra' },
      { from: 9, to: 22, title: 'Palavras finais de Paulo' }
    ]
  },
  'Tito': {
    1: [
      { from: 1, to: 9, title: 'Presbiteros irrepreensiveis' },
      { from: 10, to: 16, title: 'Refutar falsos mestres' }
    ],
    2: [
      { from: 1, to: 10, title: 'Doutrina e vida santa' },
      { from: 11, to: 15, title: 'Graca educadora' }
    ],
    3: [
      { from: 1, to: 8, title: 'Boas obras e renovacao' },
      { from: 9, to: 15, title: 'Evitar contendas' }
    ]
  },
  'Filemom': {
    1: [
      { from: 1, to: 7, title: 'Saudacao e louvor' },
      { from: 8, to: 22, title: 'Intercessao por Onesimo' },
      { from: 23, to: 25, title: 'Saudacoes finais' }
    ]
  },
  'Filipenses': {
    2: [
      { from: 1, to: 11, title: 'Humildade de Cristo' },
      { from: 12, to: 18, title: 'Brilhai como luzeiros' },
      { from: 19, to: 30, title: 'Timoteo e Epafrodito' }
    ],
    4: [
      { from: 1, to: 9, title: 'Exortacoes finais' },
      { from: 10, to: 20, title: 'Contentamento em toda situacao' },
      { from: 21, to: 23, title: 'Saudacoes finais' }
    ]
  },
  'Hebreus': {
    1: [
      { from: 1, to: 4, title: 'Deus falou pelo Filho' },
      { from: 5, to: 14, title: 'Superioridade do Filho aos anjos' }
    ],
    11: [
      { from: 1, to: 3, title: 'Definicao de fe' },
      { from: 4, to: 31, title: 'Exemplos de fe' },
      { from: 32, to: 40, title: 'Perseveranca dos fieis' }
    ],
    12: [
      { from: 1, to: 3, title: 'Corrida com perseveranca' },
      { from: 4, to: 13, title: 'Disciplina do Senhor' },
      { from: 14, to: 29, title: 'Adoracao reverente' }
    ]
  },
  'Tiago': {
    1: [
      { from: 1, to: 18, title: 'Provas e sabedoria' },
      { from: 19, to: 27, title: 'Praticantes da Palavra' }
    ]
  },
  '1 Pedro': {
    1: [
      { from: 1, to: 12, title: 'Viva esperanca' },
      { from: 13, to: 25, title: 'Santos em todo procedimento' }
    ],
    2: [
      { from: 1, to: 10, title: 'Pedras vivas e sacerdocio real' },
      { from: 11, to: 25, title: 'Testemunho e submissao' }
    ],
    5: [
      { from: 1, to: 11, title: 'Pastoreio e humildade' },
      { from: 12, to: 14, title: 'Saudacoes finais' }
    ]
  },
  '2 Pedro': {
    1: [
      { from: 1, to: 11, title: 'Crescimento nas virtudes' },
      { from: 12, to: 21, title: 'Confirmacao da profecia' }
    ],
    2: [
      { from: 1, to: 22, title: 'Falsos mestres e seu juizo' }
    ],
    3: [
      { from: 1, to: 13, title: 'Dia do Senhor' },
      { from: 14, to: 18, title: 'Crescei na graca' }
    ]
  },
  '1 João': {
    1: [
      { from: 1, to: 4, title: 'O Verbo da vida' },
      { from: 5, to: 10, title: 'Andar na luz' }
    ],
    2: [
      { from: 1, to: 11, title: 'Cristo, nosso Advogado' },
      { from: 12, to: 17, title: 'Nao ameis o mundo' },
      { from: 18, to: 29, title: 'Anticristos e permanencia' }
    ],
    4: [
      { from: 1, to: 6, title: 'Provar os espiritos' },
      { from: 7, to: 21, title: 'Deus e amor' }
    ],
    5: [
      { from: 1, to: 12, title: 'Vitoria da fe' },
      { from: 13, to: 21, title: 'Seguranca da vida eterna' }
    ]
  },
  '2 João': {
    1: [
      { from: 1, to: 6, title: 'Amor e verdade' },
      { from: 7, to: 11, title: 'Contra enganadores' },
      { from: 12, to: 13, title: 'Saudacoes finais' }
    ]
  },
  '3 João': {
    1: [
      { from: 1, to: 8, title: 'Fidelidade de Gaio' },
      { from: 9, to: 12, title: 'Diotrefes e Demetrio' },
      { from: 13, to: 15, title: 'Saudacoes finais' }
    ]
  },
  'Judas': {
    1: [
      { from: 1, to: 4, title: 'Convite a batalhar pela fe' },
      { from: 5, to: 16, title: 'Advertencia contra falsos mestres' },
      { from: 17, to: 23, title: 'Exortacoes aos fieis' },
      { from: 24, to: 25, title: 'Doxologia' }
    ]
  },
  'Apocalipse': {
    1: [
      { from: 1, to: 8, title: 'Prologo e saudacao' },
      { from: 9, to: 20, title: 'Visao do Filho do Homem' }
    ],
    21: [
      { from: 1, to: 8, title: 'Novo ceu e nova terra' },
      { from: 9, to: 27, title: 'A nova Jerusalem' }
    ],
    22: [
      { from: 1, to: 5, title: 'Rio da vida' },
      { from: 6, to: 21, title: 'Testemunho e convite final' }
    ]
  }
};

export const getPericopeSections = (book: string, chapter: number, maxVerse: number): PericopeSection[] => {
  const sections = PERICOPE_DATA[book]?.[chapter] || [];
  if (sections.length === 0) return [];

  return sections
    .map(section => ({
      ...section,
      from: Math.max(1, Math.min(section.from, maxVerse)),
      to: Math.max(1, Math.min(section.to, maxVerse))
    }))
    .filter(section => section.from <= section.to)
    .sort((a, b) => a.from - b.from);
};
