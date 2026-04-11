// Script final para separar versículos, numerando o primeiro se necessário
// Execute com: node fix-verses-split-final.cjs

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
    arr = arr.map(chapter => {
      let textoCap = chapter.map(v => v.join(' ')).join(' ');
      textoCap = textoCap.trim();
      // Se não começa com "1.", adiciona
      if (!/^1\./.test(textoCap)) {
        textoCap = '1. ' + textoCap;
      }
      // Split por "número ponto espaço"
      const versos = textoCap.split(/(?<=\d)\.\s/).map(v => v.trim()).filter(Boolean);
      if (versos.length !== chapter.length || !/^1\./.test(versos[0])) changed = true;
      return versos.map(v => [v]);
    });
    if (changed) {
      const newContent = 'export default ' + JSON.stringify(arr, null, 2) + ';\n';
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Corrigido:', file);
    }
  }
});

console.log('Separação final de versículos concluída!');
