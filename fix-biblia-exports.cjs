// Script para converter arquivos da pasta src/Biblia-ARC-master para export default
// Execute com: node fix-biblia-exports.js

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'Biblia-ARC-master');

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    // Só converte se começar com "livro = ["
    if (content.trim().startsWith('livro = [')) {
      content = content.replace(/^livro = /, 'const livro = ');
      if (!content.trim().endsWith('export default livro;')) {
        content += '\n\nexport default livro;\n';
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Convertido:', file);
    }
  }
});

console.log('Conversão concluída!');
