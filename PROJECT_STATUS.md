# Sola Scriptura Bíblia - Registro do Projeto

> Registro operacional para manter o contexto técnico entre etapas. Atualizar este arquivo após mudanças estruturais relevantes.

## Estado de referência

- Branch de produção: `main`
- Aplicação: React + Vite + TypeScript
- Arquivo principal: `src/App.tsx`
- Home atualmente integrada: `HomeScreenV3`
- Deploy: Vercel acompanha `main`

## Estado atual

- A rolagem do leitor bíblico foi ajustada para usar uma única área principal de rolagem.
- O contêiner dos versículos deixou de ser uma segunda área de rolagem e não usa mais `max-h-[64vh]`/`max-h-[78vh]`.
- O cálculo do versículo atualmente visível e o listener de rolagem foram direcionados para `screenScrollRef`.
- O workflow temporário usado para aplicar a correção do leitor foi removido após a execução.
- A tela de Estudo recebeu ajuste de área de rolagem no `StudyDashboard` para permitir navegação vertical do conteúdo.
- A persistência de sessões de estudo continua usando `getStudyProgress`/`updateStudyProgress`.
- A validação automática do novo commit do leitor ainda precisa ser confirmada; não marcar a etapa como totalmente validada até conferir `lint` e `build`.
- A auditoria das anotações encontrou dois mecanismos de persistência diferentes: o fluxo antigo do `App.tsx` grava anotações em `localStorage('notes')`, enquanto a `Library` e o serviço `db.ts` usam IndexedDB no store `notes`.
- Essa divergência explica por que uma anotação criada no leitor pode não aparecer na Biblioteca, apesar de existir uma função `saveNote` no IndexedDB.

## Decisões já tomadas

1. Não fazer merge integral da PR #1 (`Refactor critical fixes`). Ela é draft, contém mudanças estruturais misturadas com alterações antigas e deve ser tratada apenas como fonte de correções aproveitáveis.
2. Não usar workflows do GitHub Actions para reescrever automaticamente código-fonte da aplicação como arquitetura permanente. O workflow temporário do leitor foi apenas um mecanismo controlado de transição e já foi removido.
3. Não iniciar outro redesign da Home antes de estabilizar as funções principais.
4. Evitar substituições completas de `src/App.tsx` por operações GitHub Contents, porque o arquivo é grande e uma edição incorreta pode quebrar o aplicativo.
5. Prioridade atual: estabilidade funcional antes de novas mudanças visuais.
6. Unificar a persistência das anotações antes de considerar a funcionalidade concluída. A solução deve preservar anotações existentes e evitar perda de dados.

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
- `verseContainerRef` permanece para localizar os elementos dos versículos, mas não deve voltar a ser um contêiner rolável.
- `goToVerse` continua localizando o versículo pelo atributo `data-verse-number` e usando `scrollIntoView`.
- `activeCommentaryKey` e `saveCurrentLocation` continuam priorizando `currentVisibleVerse` quando disponível.

### Estudo

- Ajustada a estrutura de rolagem do `StudyDashboard`.
- Mantida a lógica existente de seleção de plano, abertura de sessão e marcação de sessão concluída.
- Mantida a persistência de progresso por meio de `getStudyProgress` e `updateStudyProgress`.

### Anotações

- Confirmado que `services/db.ts` possui o store IndexedDB `notes`, além de `saveNote`, `getStoredNotes` e `deleteNote`.
- Confirmado que `components/Library.tsx` salva novas anotações diretamente no IndexedDB e carrega as anotações desse store.
- Confirmado que o fluxo legado do `App.tsx` mantém outro conjunto de anotações em `localStorage`.
- Próxima correção: migrar de forma segura as anotações legadas do `localStorage` para IndexedDB e então remover a duplicidade de persistência quando for possível fazê-lo sem risco de perda de dados.

## Pendências prioritárias

### P0 - Leitor bíblico
- Confirmar `npm run lint` e `npm run build` após a correção da rolagem.
- Testar manualmente rolagem no desktop e celular.
- Confirmar atualização do versículo atualmente visível durante a rolagem.
- Confirmar `Ir para versículo`.
- Confirmar salvamento/restauração da posição.
- Validar botões de rolagem superior/inferior.

### P0 - Estudo e anotações
- Testar rolagem da tela de estudo após a correção.
- Unificar a persistência das anotações entre leitor e Biblioteca.
- Migrar anotações legadas de `localStorage` sem perda de dados.
- Garantir persistência após recarregar a aplicação.

### P1 - Pesquisa
- Corrigir navegação de referências no formato `Livro capítulo:versículo`.
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
- Eliminar workflows/scripts temporários de redesign que não tenham função.
- Reduzir código morto.
- Centralizar lógica duplicada, como perfil/objetivos de estudo.
- Avaliar code splitting de serviços estáticos.

### P2 - Home/UI
- Depois da estabilidade, avaliar evolução visual da Home V3.
- Preservar funcionalidades existentes.
- Não criar nova V4 por automação.

## Problemas conhecidos levantados anteriormente

- `selectReference` reconhecia `Livro capítulo:versículo`, mas uma implementação anterior descartava o versículo.
- O estado `targetVerse` não deve ser usado sozinho para representar o versículo atualmente visível.
- O rastreamento de atividade já foi identificado como desativado (`ENABLE_ACTIVITY_TRACKING = false`) e deve ser decidido: reativar corretamente ou remover a interface correspondente.
- O botão de IA das confissões já foi identificado como sem implementação real e deve ser removido ou conectado a uma função válida.
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
