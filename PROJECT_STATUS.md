# Sola Scriptura Bíblia - Registro do Projeto

> Registro operacional para manter o contexto técnico entre etapas. Atualizar este arquivo após mudanças estruturais relevantes.

## Estado de referência

- Branch de produção: `main`
- Aplicação: React + Vite + TypeScript
- Arquivo principal: `src/App.tsx`
- Home atualmente integrada: `HomeScreenV3`
- Deploy: Vercel acompanha `main`

## Estado atual

- Leitor bíblico: rolagem estruturada em uma única área principal; a área de versículos e o fallback Markdown não devem criar uma segunda rolagem.
- `screenScrollRef` é a área efetivamente rolável do leitor e também é usada para calcular o versículo visível.
- A tela ativa de Estudo é `StudyScreen` dentro de `src/App.tsx`; `components/StudyDashboard.tsx` é uma implementação paralela e não deve ser confundida com a tela ativa.
- O `StudyScreen` agora possui preparação para salvar o resultado da análise em Anotações por meio de `onAddNote`.
- A correção foi aplicada por workflow temporário `.github/workflows/fix-study-and-reader.yml`; esse workflow ainda precisa concluir validação e auto-remoção antes de considerar a etapa concluída.
- Não considerar CI/lint/build como aprovados até verificar os resultados reais do commit gerado.
- A auditoria mostrou dois mecanismos de persistência de anotações: o fluxo ativo de `App.tsx` usa `localStorage('notes')`, enquanto existe uma implementação paralela em `components/Library.tsx`/`services/db.ts` baseada em IndexedDB.
- Importante: a `LibraryScreen` atualmente renderizada pelo `App.tsx` recebe diretamente o estado `notes` do fluxo ativo. Portanto, não assumir que toda anotação criada no leitor está ausente da Biblioteca ativa. A divergência é principalmente entre a implementação ativa e a implementação paralela/legada de IndexedDB.

## Decisões já tomadas

1. Não fazer merge integral da PR #1 (`Refactor critical fixes`). Ela é draft, contém mudanças estruturais misturadas com alterações antigas e deve ser tratada apenas como fonte de correções aproveitáveis.
2. Não usar workflows do GitHub Actions para reescrever automaticamente código-fonte da aplicação como arquitetura permanente. Workflows temporários podem ser usados apenas como mecanismo controlado de transição e devem ser removidos depois.
3. Não iniciar outro redesign da Home antes de estabilizar as funções principais.
4. Evitar substituições completas de `src/App.tsx` por operações GitHub Contents, porque o arquivo é grande e uma edição incorreta pode quebrar o aplicativo.
5. Prioridade atual: estabilidade funcional antes de novas mudanças visuais.
6. Não migrar ou apagar a persistência das anotações sem primeiro preservar os dados existentes e confirmar qual implementação de Biblioteca deve permanecer como arquitetura oficial.

## Limpeza realizada

- O workflow `.github/workflows/apply-home-v4.yml` foi desativado para impedir alterações automáticas da Home.
- A Home V4 não está sendo considerada a implementação ativa.
- O workflow temporário `.github/workflows/fix-reader-scroll.yml` foi removido após aplicar a correção do leitor.

## Correções realizadas

### Leitor bíblico

- Implementada a arquitetura de rolagem única no leitor.
- `screenScrollRef` passou a ser a referência da área que efetivamente rola.
- `updateCurrentVisibleVerse` passou a calcular o versículo visível com base no contêiner principal.
- O listener de scroll passou a observar `screenScrollRef`.
- O contêiner estruturado dos versículos não possui mais `overflow-y-auto` nem `max-h-[64vh]`/`max-h-[78vh]`.
- O fallback Markdown também foi ajustado para não criar uma segunda área de rolagem.
- `verseContainerRef` permanece para localizar elementos dos versículos, não para controlar a rolagem.
- `goToVerse` continua localizando o versículo por `data-verse-number` e usando `scrollIntoView`.
- `activeCommentaryKey` e `saveCurrentLocation` continuam priorizando `currentVisibleVerse` quando disponível.

### Estudo

- A área ativa `StudyScreen` recebeu rolagem própria com `studyScrollRef`.
- Foram mantidos botões de ir ao topo/fim e atualização de visibilidade durante o scroll.
- As preferências de estudo continuam persistidas em `localStorage('study-analysis-preferences')`.
- O `StudyScreen` passou a aceitar `onAddNote`.
- Foi acrescentada a ação para salvar o resultado completo da análise em Anotações.
- O salvamento usa o mecanismo ativo do `App.tsx`, sem migrar ainda para IndexedDB.
- A persistência de sessões do `StudyDashboard` paralelo continua usando `getStudyProgress`/`updateStudyProgress`.

### Anotações

- Confirmado que o fluxo ativo `LibraryScreen` recebe `notes`, `onUpdateNote` e `onDeleteNote` do `App.tsx`.
- Confirmado que `components/Library.tsx` e `services/db.ts` constituem uma implementação paralela de notas em IndexedDB.
- A decisão atual é não migrar automaticamente para IndexedDB até mapear completamente o fluxo ativo, exportação/importação e compatibilidade com dados existentes.

## Pendências prioritárias

### P0 - Validação do leitor e estudo
- Verificar a execução real do workflow temporário e o commit produzido.
- Confirmar `npm run lint`.
- Confirmar `npm run build`.
- Testar manualmente rolagem do leitor no desktop e celular.
- Confirmar atualização do versículo atualmente visível durante a rolagem.
- Confirmar `Ir para versículo`.
- Confirmar salvamento/restauração da posição.
- Validar botões de rolagem superior/inferior do leitor.
- Testar rolagem da tela ativa de Estudo.
- Testar geração de análise e o botão `Salvar estudo em Anotações`.
- Recarregar a aplicação e confirmar recuperação da anotação salva.

### P0 - Anotações e persistência
- Mapear completamente `notes` no `App.tsx`: criação, edição, exclusão, tags, notebooks, destaque, exportação e importação.
- Confirmar que a anotação de estudo salva pelo novo fluxo aparece na `LibraryScreen` ativa.
- Avaliar a implementação paralela IndexedDB antes de decidir sua remoção, migração ou integração.
- Garantir que qualquer migração preserve dados existentes.

### P1 - Pesquisa
- Corrigir e validar navegação de referências no formato `Livro capítulo:versículo`.
- Preservar capítulo e versículo na navegação.

### P1 - Persistência
- Auditar localStorage e IndexedDB.
- Evitar limpeza silenciosa de dados do usuário.
- Validar exportação/importação e restauração.

### P1 - TypeScript/qualidade
- Manter `strict: true` somente se o projeto continuar compilando corretamente.
- Resolver erros reais de tipagem sem relaxar a configuração.
- Rodar `npm run lint`, `npm run build` e `npm run check` antes de considerar uma etapa concluída.

### P2 - Arquitetura
- Eliminar workflows/scripts temporários de correção depois de cumprirem sua finalidade.
- Reduzir código morto.
- Centralizar lógica duplicada, como perfil/objetivos de estudo.
- Avaliar code splitting de serviços estáticos.

### P2 - Home/UI
- Depois da estabilidade, avaliar evolução visual da Home V3.
- Preservar funcionalidades existentes.
- Não criar nova V4 por automação.

## Problemas conhecidos levantados anteriormente

- `selectReference` reconhece `Livro capítulo:versículo`; validar preservação efetiva do versículo no fluxo completo.
- O estado `targetVerse` não deve ser usado sozinho para representar o versículo atualmente visível.
- O rastreamento de atividade já foi identificado como desativado (`ENABLE_ACTIVITY_TRACKING = false`) e deve ser decidido: reativar corretamente ou remover a interface correspondente.
- O botão de IA das confissões foi identificado como sem implementação real e deve ser removido ou conectado a uma função válida.
- O parser Strong atualmente pode não aceitar sufixos como `{H1234a}`.
- O parser de versos pode confundir linhas de continuação iniciadas por números dependendo do formato importado.

## PR #1

- Título: `Refactor critical fixes`
- Base: `main`
- Estado: aberta/draft
- Não fazer merge integral sem revisão.
- Aproveitar seletivamente apenas correções compatíveis com a arquitetura atual.

## Critério de conclusão de cada etapa

Uma etapa só deve ser marcada como concluída quando:

1. O código foi alterado de forma localizada.
2. Não houve substituição destrutiva de arquivo grande.
3. A funcionalidade afetada foi revisada.
4. `npm run lint` passa.
5. `npm run build` passa.
6. Quando aplicável, `npm run check` passa.
7. O resultado foi registrado neste arquivo.
