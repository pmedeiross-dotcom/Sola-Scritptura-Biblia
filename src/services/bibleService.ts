import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface BibleContent {
  text: string;
  reference: string;
  summary?: string;
  context?: string;
  crossReferences?: string[];
}

export const getBibleContent = async (reference: string, version: string = 'ARA'): Promise<BibleContent> => {
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
    console.error("Error fetching Bible content:", error);
    return {
      text: "Erro ao carregar o texto bíblico. Verifique sua conexão.",
      reference: reference
    };
  }
};

export const getTheologicalAnalysis = async (text: string): Promise<string> => {
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
