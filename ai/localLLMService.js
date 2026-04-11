// Serviço Node.js para rodar modelo LLM local via llama.cpp
// Requer: binário llama.cpp e modelo .gguf em ai/model/
// Exemplo de uso: node ai/localLLMService.js "Sua pergunta aqui"

const { spawn } = require('child_process');
const path = require('path');

const MODEL_PATH = path.join(__dirname, 'model', 'tinyllama-1b-chat.gguf'); // Altere para o nome do modelo
const LLAMA_BIN = path.join(__dirname, 'llama.cpp', 'main.exe'); // Caminho do binário llama.cpp

function askLLM(prompt) {
  return new Promise((resolve, reject) => {
    const proc = spawn(LLAMA_BIN, [
      '-m', MODEL_PATH,
      '-p', prompt,
      '--n', '128', // número de tokens gerados
      '--temp', '0.7'
    ]);
    let output = '';
    proc.stdout.on('data', data => { output += data.toString(); });
    proc.stderr.on('data', data => { /* ignore */ });
    proc.on('close', code => {
      if (code === 0) resolve(output.trim());
      else reject('Erro ao rodar o modelo.');
    });
  });
}

// CLI usage
if (require.main === module) {
  const prompt = process.argv.slice(2).join(' ');
  askLLM(prompt).then(console.log).catch(console.error);
}

module.exports = { askLLM };
