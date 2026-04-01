import { GoogleGenAI, Type } from "@google/genai";
import { Verse, BibleVersion } from "../types";
import { getStoredChapter } from "./db";
import { MOCK_VERSES } from "../constants";

// Initialize Gemini Client lazily to avoid crash if key is missing
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

export const getTheologicalInsight = async (query: string, context: 'biblical' | 'confessional' | 'general' = 'general'): Promise<string> => {
  const ai = getAI();
  if (!ai) return "O assistente teológico está indisponível no momento.";
  try {
    const systemPrompt = `
      Você é um assistente teológico especializado na Fé Reformada Clássica.
      Suas respostas devem ser baseadas nas Escrituras Sagradas como norma suprema,
      e subsidiadas pelas Três Formas de Unidade (Confissão Belga, Catecismo de Heidelberg, Cânones de Dort)
      e pelos Padrões de Westminster.
      
      Mantenha um tom pastoral, acadêmico, porém acessível.
      Responda em Português do Brasil.
      Seja conciso e use formatação Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: query }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    return response.text || "Não foi possível gerar uma resposta no momento.";
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "Ocorreu um erro ao conectar com o assistente teológico.";
  }
};

export const getBibleAssistantResponse = async (query: string, bibleContext: Verse[]): Promise<string> => {
  const ai = getAI();
  if (!ai) return "O assistente bíblico está indisponível no momento.";
  try {
    const contextText = bibleContext.length > 0 
      ? `Contexto Bíblico Encontrado:\n${bibleContext.map(v => `[${v.book} ${v.chapter}:${v.verse}] ${v.text}`).join('\n')}`
      : "Nenhum versículo específico foi encontrado na busca local, mas responda com base no seu conhecimento geral das Escrituras.";

    const systemPrompt = `
      Você é um assistente de estudo bíblico inteligente.
      Sua tarefa é ajudar o usuário a entender as Escrituras.
      
      Se o usuário estiver buscando uma palavra ou conceito, use o contexto fornecido para explicar o significado e como ele se aplica.
      Sempre cite as referências bíblicas.
      Mantenha uma perspectiva teológica reformada.
      Responda de forma clara e encorajadora em Português do Brasil.
      Use Markdown para formatação.
    `;

    const userMessage = `
      Pergunta do Usuário: ${query}
      
      ${contextText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
      }
    });

    return response.text || "Não foi possível processar sua pergunta.";
  } catch (error) {
    console.error("Erro no Assistente Bíblico:", error);
    return "Houve um problema ao processar sua pergunta com a IA.";
  }
};

export const getBibleChapter = async (book: string, chapter: number, version: BibleVersion): Promise<Verse[]> => {
  // 1. Try local IndexedDB
  try {
    const stored = await getStoredChapter(version, book, chapter);
    if (stored && stored.length > 0) return stored;
  } catch (e) {
    console.error("Error fetching from local DB:", e);
  }

  // 2. Try MOCK_VERSES
  const local = MOCK_VERSES.filter(v => v.book === book && v.chapter === chapter && v.version === version);
  if (local.length > 0) return local;

  // 3. Try AI
  const ai = getAI();
  if (!ai) return [];
  // Mapeamento de nomes de versões para instruções mais claras ao modelo
  const versionMap: Record<BibleVersion, string> = {
    'ARA': 'Almeida Revista e Atualizada (Português)',
    'NVT': 'Nova Versão Transformadora (Português)',
    'KJV': 'King James Version (Inglês)',
    'NA28': 'Nestle-Aland 28 (Grego Koiné)',
    'BHS': 'Biblia Hebraica Stuttgartensia (Hebraico)'
  };

  const prompt = `
    Forneça o texto completo da Bíblia para o livro de ${book}, capítulo ${chapter}, usando exatamente a versão "${versionMap[version] || version}".
    Certifique-se de que o texto corresponda fielmente à versão solicitada.
    Se for Grego ou Hebraico, use os caracteres originais.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              verse: { type: Type.INTEGER },
              text: { type: Type.STRING }
            },
            required: ["verse", "text"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const parsedData = JSON.parse(jsonText) as { verse: number, text: string }[];
    
    return parsedData.map(item => ({
      book,
      chapter,
      verse: item.verse,
      text: item.text,
      version
    }));

  } catch (error) {
    console.error("Erro ao buscar capítulo da Bíblia:", error);
    return [];
  }
};