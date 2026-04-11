// Serviço para conectar ao GPT4All rodando localmente
// Certifique-se de que o GPT4All está com o servidor API HTTP ativado

export async function askGpt4All(prompt: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:4891/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt4all-j', // Altere para o nome do modelo baixado
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
        temperature: 0.7
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sem resposta.';
  } catch (error) {
    return 'Erro ao conectar ao GPT4All.';
  }
}
