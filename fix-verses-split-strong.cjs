// Script para separar todos os versículos agrupados em linhas individuais
// Execute com: node fix-verses-split-strong.cjs

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'Biblia-ARC-master');

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    // Extrai o array principal
    const match = content.match(/export default (\[.*\]);?$/s);
    if (!match) return;
    let arr = eval(match[1]);
    let changed = false;
    // Para cada capítulo
    arr = arr.map(chapter => {
      // Junta todos os textos do capítulo em uma string
      const textoCap = chapter.map(v => v.join(' ')).join(' ');
      // Separa por padrão de versículo (ex: 1. ... 2. ... 3. ...)
      const versos = textoCap.split(/ (?=\d+\.)/g).map(v => v.trim()).filter(Boolean);
      if (versos.length !== chapter.length) changed = true;
      return versos.map(v => [v]);
    });
    if (changed) {
      const newContent = 'export default ' + JSON.stringify(arr, null, 2) + ';\n';
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Corrigido:', file);
    }
  }
});

console.log('Separação forte de versículos concluída!');
