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

export async function getGeminiResponse(prompt: string): Promise<string> {
  const ai = getAI();
  if (!ai) return "O assistente de IA está desativado no momento. Por favor, use o conteúdo local ou configure a chave nas configurações para ativar as funções de IA.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um teólogo reformado erudito, fiel às Escrituras (Sola Scriptura) e aos Símbolos de Fé de Westminster. Responda de forma pastoral, clara e profunda, sempre citando referências bíblicas. Use Markdown para formatar a resposta.",
      },
    });

    return response.text || "Não foi possível obter uma resposta.";
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    return "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.";
  }
}
