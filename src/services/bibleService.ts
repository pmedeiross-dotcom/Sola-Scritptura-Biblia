import { GoogleGenAI } from "@google/genai";

let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

import { getStoredChapter } from "../../services/db";
import { MOCK_VERSES } from "../../constants";

export interface BibleContent {
  text: string;
  reference: string;
  summary?: string;
  context?: string;
  crossReferences?: string[];
}

export const getBibleContent = async (reference: string, version: string = 'ARC'): Promise<BibleContent> => {
  // Parse reference (e.g., "Romanos 8")
  const parts = reference.split(' ');
  const book = parts.slice(0, -1).join(' ');
  const chapter = parseInt(parts[parts.length - 1]);

  // 1. Try to fetch from IndexedDB
  try {
    const storedVerses = await getStoredChapter(version, book, chapter);
    if (storedVerses && storedVerses.length > 0) {
      return {
        text: storedVerses.map(v => `${v.verse} ${v.text}`).join('\n'),
        reference,
        summary: "Conteúdo carregado do armazenamento local.",
        context: "Esta versão foi importada para o seu dispositivo.",
        crossReferences: []
      };
    }
  } catch (dbError) {
    console.error("Error reading from IndexedDB:", dbError);
  }

  // 2. Try to fetch from MOCK_VERSES
  const mockVerses = MOCK_VERSES.filter(v => v.book === book && v.chapter === chapter && v.version === version);
  if (mockVerses.length > 0) {
    return {
      text: mockVerses.map(v => `${v.verse} ${v.text}`).join('\n'),
      reference,
      summary: "Conteúdo de demonstração.",
      context: "Este é um capítulo de exemplo disponível no app.",
      crossReferences: []
    };
  }

  // 3. Try to fetch from AI
  const ai = getAI();
  if (ai) {
    const prompt = `Atue como um servidor de API de Bíblia. Retorne o texto bíblico para a referência "${reference}" na versão "${version}". 
    Além do texto, forneça um breve resumo teológico do capítulo e o contexto histórico.
    Retorne em formato JSON com as chaves: "text" (o texto completo com números de versículos), "reference" (a referência formatada), "summary" (resumo), "context" (contexto histórico), "crossReferences" (lista de 3-5 referências cruzadas importantes).`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || '{}');
      return {
        text: data.text || "Texto não encontrado.",
        reference: data.reference || reference,
        summary: data.summary,
        context: data.context,
        crossReferences: data.crossReferences || []
      };
    } catch (error) {
      console.error("Error fetching Bible content from AI:", error);
    }
  }

  return {
    text: "Capítulo não encontrado localmente. Por favor, importe esta versão da Bíblia ou configure a chave da API do Gemini para leitura via IA.",
    reference: reference,
    summary: "Conteúdo indisponível.",
    context: "Não foi possível localizar este capítulo no banco de dados local ou via IA."
  };
};

export const getTheologicalAnalysis = async (text: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "O assistente teológico está indisponível sem uma chave de API.";

  const prompt = `Analise o seguinte texto bíblico sob uma perspectiva reformada histórica (Sola Scriptura). 
  Destaque as doutrinas da graça, a soberania de Deus e a aplicação prática para a vida cristã:
  
  "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "Não foi possível gerar a análise.";
  } catch (error) {
    return "Erro na análise teológica.";
  }
};

export const searchBible = async (query: string): Promise<{ reference: string, excerpt: string }[]> => {
  const ai = getAI();
  if (!ai) return [];

  const prompt = `Atue como um motor de busca bíblico. Para a consulta "${query}", retorne uma lista de até 10 referências bíblicas relevantes com um pequeno trecho do texto.
  Retorne APENAS um array JSON de objetos com as chaves: "reference" e "excerpt".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const data = JSON.parse(response.text || '[]');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error searching Bible:", error);
    return [];
  }
};

export const generateReadingPlan = async (topic: string): Promise<{ title: string, days: { day: number, reference: string, focus: string }[] }> => {
  const ai = getAI();
  if (!ai) return { title: "Plano Personalizado", days: [] };

  const prompt = `Crie um plano de leitura bíblica de 7 dias sobre o tema "${topic}" sob uma perspectiva reformada.
  Retorne APENAS um objeto JSON com as chaves: "title" (título do plano) e "days" (um array de 7 objetos com "day", "reference" e "focus" - uma breve explicação do porquê desta leitura).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (error) {
    console.error("Error generating reading plan:", error);
    return { title: "Plano Personalizado", days: [] };
  }
};

export const getSermonOutline = async (text: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "O gerador de esboços está indisponível sem uma chave de API.";

  const prompt = `Crie um esboço de sermão expositivo para o seguinte texto bíblico, seguindo uma estrutura homilética reformada (Introdução, Pontos Expositivos, Aplicação, Conclusão):
  
  "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "Não foi possível gerar o esboço.";
  } catch (error) {
    return "Erro ao gerar esboço de sermão.";
  }
};

export const getWordStudy = async (text: string, word: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "O estudo de palavras está indisponível sem uma chave de API.";

  const prompt = `Realize um estudo léxico da palavra "${word}" no contexto do seguinte texto bíblico. 
  Explique o termo original (Grego ou Hebraico), seu significado semântico e sua importância teológica no pensamento reformado:
  
  Texto: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "Não foi possível realizar o estudo da palavra.";
  } catch (error) {
    return "Erro no estudo da palavra.";
  }
};

export const getDailyDevotional = async (verse: { text: string, ref: string }): Promise<string> => {
  const ai = getAI();
  if (!ai) return "O devocional diário está indisponível sem uma chave de API.";

  const prompt = `Escreva uma meditação devocional diária curta e inspiradora baseada no versículo "${verse.ref}: ${verse.text}". 
  A meditação deve ser centrada no evangelho, pastoral e encorajadora, com uma oração final.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "Não foi possível gerar a meditação.";
  } catch (error) {
    return "Erro ao gerar devocional.";
  }
};

export const generateVerseImage = async (verse: string): Promise<string | null> => {
  const ai = getAI();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A beautiful, serene, high-quality cinematic background image for a Bible verse: "${verse}". The style should be atmospheric, peaceful, and artistic. No text in the image.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating verse image:", error);
    return null;
  }
};

export const BOOKS = [
  { name: 'Gênesis', chapters: 50 }, { name: 'Êxodo', chapters: 40 }, { name: 'Levítico', chapters: 27 },
  { name: 'Números', chapters: 36 }, { name: 'Deuteronômio', chapters: 34 }, { name: 'Josué', chapters: 24 },
  { name: 'Juízes', chapters: 21 }, { name: 'Rute', chapters: 4 }, { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 }, { name: '1 Reis', chapters: 22 }, { name: '2 Reis', chapters: 25 },
  { name: '1 Crônicas', chapters: 29 }, { name: '2 Crônicas', chapters: 36 }, { name: 'Esdras', chapters: 10 },
  { name: 'Neemias', chapters: 13 }, { name: 'Ester', chapters: 10 }, { name: 'Jó', chapters: 42 },
  { name: 'Salmos', chapters: 150 }, { name: 'Provérbios', chapters: 31 }, { name: 'Eclesiastes', chapters: 12 },
  { name: 'Cantares', chapters: 8 }, { name: 'Isaías', chapters: 66 }, { name: 'Jeremias', chapters: 52 },
  { name: 'Lamentações', chapters: 5 }, { name: 'Ezequiel', chapters: 48 }, { name: 'Daniel', chapters: 12 },
  { name: 'Oseias', chapters: 14 }, { name: 'Joel', chapters: 3 }, { name: 'Amós', chapters: 9 },
  { name: 'Obadias', chapters: 1 }, { name: 'Jonas', chapters: 4 }, { name: 'Miqueias', chapters: 7 },
  { name: 'Naum', chapters: 3 }, { name: 'Habacuque', chapters: 3 }, { name: 'Sofonias', chapters: 3 },
  { name: 'Ageu', chapters: 2 }, { name: 'Zacarias', chapters: 14 }, { name: 'Malaquias', chapters: 4 },
  { name: 'Mateus', chapters: 28 }, { name: 'Marcos', chapters: 16 }, { name: 'Lucas', chapters: 24 },
  { name: 'João', chapters: 21 }, { name: 'Atos', chapters: 28 }, { name: 'Romanos', chapters: 16 },
  { name: '1 Coríntios', chapters: 16 }, { name: '2 Coríntios', chapters: 13 }, { name: 'Gálatas', chapters: 6 },
  { name: 'Efésios', chapters: 6 }, { name: 'Filipenses', chapters: 4 }, { name: 'Colossenses', chapters: 4 },
  { name: '1 Tessalonicenses', chapters: 5 }, { name: '2 Tessalonicenses', chapters: 3 }, { name: '1 Timóteo', chapters: 6 },
  { name: '2 Timóteo', chapters: 4 }, { name: 'Tito', chapters: 3 }, { name: 'Filemom', chapters: 1 },
  { name: 'Hebreus', chapters: 13 }, { name: 'Tiago', chapters: 5 }, { name: '1 Pedro', chapters: 5 },
  { name: '2 Pedro', chapters: 3 }, { name: '1 João', chapters: 5 }, { name: '2 João', chapters: 1 },
  { name: '3 João', chapters: 1 }, { name: 'Judas', chapters: 1 }, { name: 'Apocalipse', chapters: 22 }
];
