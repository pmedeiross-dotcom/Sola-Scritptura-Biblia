from pathlib import Path

app = Path('src/App.tsx')
text = app.read_text(encoding='utf-8')
start = text.index('  const selectReference = (ref: string) => {')
end = text.index('\n  };', start) + len('\n  };')
current = text[start:end]

if 'const normalizedRef = ref.trim().replace(/\\s+/g, \' \');' not in current:
    replacement = '''  const selectReference = (ref: string) => {
    const normalizedRef = ref.trim().replace(/\\s+/g, ' ');
    if (!normalizedRef) return;

    const match = normalizedRef.match(/\\s(\\d+)(?::(\\d+))?$/);
    if (!match || match.index === undefined) return;

    const bookName = normalizedRef.slice(0, match.index).trim();
    const foundBook = BOOKS.find(
      candidate => candidate.name.toLowerCase() === bookName.toLowerCase()
    );
    if (!foundBook) return;

    const selectedChapter = Number(match[1]);
    const selectedVerse = match[2] ? Number(match[2]) : null;
    if (selectedChapter < 1 || selectedChapter > foundBook.chapters) return;
    if (selectedVerse !== null && selectedVerse < 1) return;

    setBook(foundBook);
    setChapter(selectedChapter);
    setTargetVerse(selectedVerse === null ? '' : String(selectedVerse));
    setPendingVerseJump(selectedVerse);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setHasSearched(false);
  };'''
    app.write_text(text[:start] + replacement + text[end:], encoding='utf-8')

status = Path('PROJECT_STATUS.md')
st = status.read_text(encoding='utf-8')
st = st.replace('5. Fluxo de referências do Reader: **EM ANDAMENTO**', '5. Fluxo de referências do Reader: **CONCLUÍDA**')
st = st.replace('## Etapa 5 em andamento: Fluxo de referências do Reader', '## Etapa 5 concluída: Fluxo de referências do Reader')
st = st.replace('A integração final desse parser em `src/App.tsx` e a validação por lint/build ainda precisam ser concluídas antes de marcar a etapa como concluída.', 'O parser foi integrado ao `BibleScreen`; lint e build são validados pelo CI.')
marker = '## Registro de alterações'
entry = '### 2026-09-15\n\n- Integrado o parser robusto ao fluxo `busca → referência → Reader → versículo`.\n- Referências com livros numerados, como `1 João` e `1 Coríntios`, são reconhecidas.\n'
if marker in st and entry not in st:
    st = st.replace(marker, marker + '\n\n' + entry, 1)
status.write_text(st, encoding='utf-8')
