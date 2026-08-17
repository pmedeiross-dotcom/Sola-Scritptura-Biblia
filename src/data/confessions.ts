/**
 * Estrutura de dados para Confissão de Fé de Westminster
 * Versão simplificada com capítulos principais
 */

export interface ConfessionChapter {
  number: number;
  title: string;
  sections: ConfessionSection[];
}

export interface ConfessionSection {
  number: string;
  text: string;
}

export interface Confession {
  id: string;
  title: string;
  year: number;
  language: string;
  chapters: ConfessionChapter[];
}

export const WESTMINSTER_CONFESSION_STRUCTURED: Confession = {
  id: 'westminster-1646',
  title: 'Confissão de Fé de Westminster',
  year: 1646,
  language: 'pt-BR',
  chapters: [
    {
      number: 1,
      title: 'Sobre a Sagrada Escritura',
      sections: [
        {
          number: '1.1',
          text: 'A autoridade da Sagrada Escritura depende, não de qualquer testemunho de homem ou de Igreja, mas depende unicamente de Deus (que é a verdade em si mesmo), seu autor; portanto há de ser recebida, porque é a Palavra de Deus.'
        },
        {
          number: '1.2',
          text: 'Argumentamos que a Sagrada Escritura não depende de qualquer ser humano ou instituição eclesiástica, mas que sua autoridade vem de Deus, o qual não pode mentir. Portanto, sua autoridade é absoluta, infinita e indiscutível.'
        },
      ]
    },
    {
      number: 2,
      title: 'Sobre Deus e da Santíssima Trindade',
      sections: [
        {
          number: '2.1',
          text: 'Há um só Deus vivo e verdadeiro, que é infinito em ser e perfeição: um Espírito puramente simples, invisível, sem corpo, sem partes, imutável, imortal, onisciente, todo-poderoso, cuja vontade é absolutamente livre e infalível.'
        },
        {
          number: '2.2',
          text: 'Deus tem toda a vida, glória, bondade e bem-aventurança em e para si mesmo; e é suficiente para si mesmo, não necessitando de criatura alguma, nem recebendo honra delas, mas manifestando sua própria glória nelas, por elas, em elas e sobre elas.'
        },
        {
          number: '2.3',
          text: 'Há três pessoas no Godhead: o Pai, o Filho e o Espírito Santo; um só Deus em substância, poder e eternidade; cada pessoa tendo toda a divindade em si mesma, porém uma só divindade na Trindade.'
        },
      ]
    },
    {
      number: 3,
      title: 'Sobre o Eterno Decreto de Deus',
      sections: [
        {
          number: '3.1',
          text: 'Deus desde toda a eternidade, pelo muito sábio e santo conselho de sua própria vontade, livremente, e imutavelmente ordenou tudo quanto acontece; todavia, de tal jeito que nem Deus é autor do pecado, nem lhe é tirada a liberdade aos agentes voluntários.'
        },
        {
          number: '3.4',
          text: 'Os homens caídos em pecado são privados de toda a vida espiritual e inteiramente indispostos, desabilitados e, por oposição contrária, são incapazes de converter-se a si mesmos de qualquer modo.'
        },
      ]
    },
    {
      number: 4,
      title: 'Sobre a Criação',
      sections: [
        {
          number: '4.1',
          text: 'No princípio, foi Deus quem criou de nada todos os universos; sendo eles muito bons, sábios e poderosos; até que ficassem toda a sua glória e poder visíveis, invisíveis, materiais e imaterial. Tudo foi realizado em razão exclusiva de sua glória.'
        },
      ]
    },
    {
      number: 5,
      title: 'Sobre a Providência de Deus',
      sections: [
        {
          number: '5.1',
          text: 'Deus, o grande Criador, conserva, dirige, dispõe, e governa todas as criaturas e todas as coisas, desde o maior até o menor, por sua providência sapientíssima, como também pelas forças e pelos poderes naturais delas: mas, de tal jeito que nem a liberdade, nem a contingência das causas secundárias é tirada, nem é violada a necessidade dos eventos.'
        },
      ]
    },
  ]
};

export const HEIDELBERG_CATECHISM_STRUCTURED: Confession = {
  id: 'heidelberg-1563',
  title: 'Catecismo de Heidelberg',
  year: 1563,
  language: 'pt-BR',
  chapters: [
    {
      number: 1,
      title: 'Sobre a Miséria do Homem',
      sections: [
        {
          number: '1',
          text: 'Qual é teu único consolo na vida e na morte? Que eu, com corpo e alma, tanto na vida como na morte, não sou meu, mas pertenço ao meu fiel Salvador Jesus Cristo; o qual, por seu precioso sangue, pagou plena satisfação por todos os meus pecados, e me redimiu de todo o domínio do diabo; e assim me conserva que nem um fio de cabelo pode cair da minha cabeça sem a vontade de meu Pai que está nos céus; antes todas as coisas devem cooperar para minha salvação. Por isso também, pelo seu Espírito Santo, me assegura da vida eterna, e me faz pronto e disposto de todo o coração a viver para ele.'
        },
        {
          number: '2',
          text: 'Quantas coisas é necessário saberes para viveres nesta consolo? Três: primeira, quão grande é minha miséria; segunda, como sou libertado dela; terceira, que grata devo ser-lhe por tal libertação.'
        },
      ]
    },
    {
      number: 2,
      title: 'Sobre a Redenção do Homem',
      sections: [
        {
          number: '25',
          text: 'Por que se chama filho de Deus Jesus Cristo, que era segundo a carne descendente de Davi? Porque ele é a eterna e natural filialidade de Deus; mas também porque Deus o fez seu filho, nos adotou por seus filhos, e assim nos fez seus herdeiros.'
        },
      ]
    },
    {
      number: 3,
      title: 'Sobre a Gratidão ao Deus Trino',
      sections: [
        {
          number: '86',
          text: 'Já que fomos redimidos por Cristo e vivificados pelo seu Espírito, como devemos viver? Pelo verdadeiro arrependimento e pela fé: primeiro matando a velha natureza e resistindo ao pecado; segundo, por seres revestidos do novo homem.'
        },
      ]
    },
  ]
};

export const BELGIC_CONFESSION_STRUCTURED: Confession = {
  id: 'belgic-1561',
  title: 'Confissão Belga',
  year: 1561,
  language: 'pt-BR',
  chapters: [
    {
      number: 1,
      title: 'Sobre o Conhecimento de Deus',
      sections: [
        {
          number: '1',
          text: 'Cremos em um só Deus, eterno, todo-poderoso, infinito em sabedoria, bondade, justiça, misericórdia; em uma palavra, infinito em todas as perfeições; o qual é único, único em essência, indivisível, e de grandeza incompreensível, ainda que incompreenso.'
        },
        {
          number: '2',
          text: 'Este Deus nos é conhecido por duas maneiras: primeira, por sua criação, conservação e governo do universo; porque esse universo serve como um nobilíssimo livro, no qual todas as criaturas grandes e pequenas são como letras para nos levar a contemplar os perfeiçãos invisíveis de Deus, a saber, seu eterno poder e sua divindade.'
        },
      ]
    },
    {
      number: 2,
      title: 'Sobre as Sagradas Escrituras',
      sections: [
        {
          number: '3',
          text: 'Nós recebemos todos estes livros, e a estes somente, como sagrados e canônicos, para regular, fundar, e confirmar nossa fé; e cremos sem dúvida que eles contêm plenamente a vontade de Deus, e que tudo o que o homem precisa conhecer para a salvação está suficientemente ensinado neles.'
        },
      ]
    },
    {
      number: 3,
      title: 'Sobre a Santíssima Trindade',
      sections: [
        {
          number: '8',
          text: 'Conformemente a esta verdade e à palavra de Deus, cremos em três pessoas distintas ou subsistências de um só Deus verdadeiro: a saber, Deus Pai, Deus Filho e Deus Espírito Santo; verdadeiramente e eternamente distintas pela propriedade peculiar de cada uma, da qual cada uma delas possuiu seus atributos incomunicáveis.'
        },
      ]
    },
  ]
};
