// Script para dividir blocos de versículos em versículos individuais
// Execute com: node fix-verses-split.cjs

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
      // Para cada versículo
      return chapter.flatMap(versoArr => {
        // Junta tudo em uma string
        const texto = versoArr.join(' ');
        // Se já está separado, mantém
        if (/^\d+\..*/.test(texto.trim())) {
          // já está numerado, não mexe
          return [versoArr];
        }
        // Se tem múltiplos versículos juntos, separa
        const partes = texto.split(/ (?=\d+\.)/g);
        if (partes.length > 1) {
          changed = true;
          return partes.map(p => [p.trim()]);
        }
        return [versoArr];
      });
    });
    if (changed) {
      // Salva de volta
      const newContent = 'export default ' + JSON.stringify(arr, null, 2) + ';\n';
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Corrigido:', file);
    }
  }
});

console.log('Separação de versículos concluída!');
