# Sola Scriptura Bíblia - Registro do Projeto

> Registro operacional para manter o contexto técnico entre etapas. Atualizar este arquivo após mudanças estruturais relevantes.

## Estado de referência

- Branch de produção: `main`
- Aplicação: React + Vite + TypeScript
- Arquivo principal: `src/App.tsx`
- Home atualmente integrada: `HomeScreenV3`
- Deploy: Vercel acompanha `main`

## Etapas do plano

1. Leitor: rolagem e navegação: **CONCLUÍDA**
2. Estudo: rolagem e controles: **CONCLUÍDA**
3. Salvar Estudo em Anotações: **CONCLUÍDA**
4. Auditoria de Anotações e persistência: **PENDENTE**
5. Importação/exportação: **PENDENTE**
6. Progresso de estudo: **PENDENTE**
7. Rastreamento de atividade: **PENDENTE**
8. Parser bíblico e Strong: **PENDENTE**
9. Confissões/IA: **PENDENTE**
10. Arquitetura e performance: **PENDENTE**
11. Qualidade, CI e Vercel: **EM ANDAMENTO**
12. Evolução visual da Home: **PENDENTE**

## Etapa 1 concluída: Leitor bíblico

- Implementada arquitetura de rolagem única no leitor.
- `screenScrollRef` é a área efetivamente rolável e também é usada para calcular o versículo visível.
- `updateCurrentVisibleVerse` observa o contêiner principal.
- O listener de scroll usa `screenScrollRef`.
- O contêiner estruturado dos versículos não possui `overflow-y-auto` nem `max-h-[64vh]`/`max-h-[78vh]`.
- O fallback Markdown foi ajustado para não criar uma segunda área de rolagem.
- `verseContainerRef` permanece para localizar elementos dos versículos, não para controlar a rolagem.
- `goToVerse` continua usando `data-verse-number` e `scrollIntoView`.
- `activeCommentaryKey` e `saveCurrentLocation` priorizam `currentVisibleVerse` quando disponível.
- A estrutura foi validada pelo CI estável no commit `15d8fdd99adf03b481bbee6306ca37f5aa67ebad`.
- Não foi feita substituição destrutiva de `src/App.tsx`.

## Etapa 2 concluída: Estudo - rolagem e controles

- A tela ativa é `StudyScreen` dentro de `src/App.tsx`.
- `studyScrollRef` é o contêiner principal de rolagem da tela de Estudo.
- O `<main>` externo do `App.tsx` fica com `overflow-hidden` quando `screen === 'study'`, evitando rolagem aninhada.
- Os controles de topo e fim usam o mesmo contêiner `studyScrollRef`.
- Lint e build foram validados com sucesso.
- O workflow temporário usado para aplicar a correção foi removido.

## Etapa 3 concluída: Salvar Estudos em Anotações

- `StudyScreen` recebe `onAddNote` da aplicação ativa.
- O resultado do estudo pode ser salvo diretamente na mesma persistência de Anotações usada pelo fluxo ativo.
- O registro preserva referência contextual, consulta e resposta.
- O botão de salvamento só é exibido junto ao resultado do estudo.
- Após salvar, o botão confirma a operação e impede duplicação imediata do mesmo resultado.
- A implementação foi corrigida para remover estados acidentais inseridos em `BibleScreen` e `ConfessionsScreen`.
- A alteração foi integrada à `main` pela PR #5.
- O head da implementação passou por lint/build e apresentou status Vercel `success`.

## Anotações e persistência

- O fluxo ativo `App.tsx` usa `localStorage('notes')`.
- A `LibraryScreen` atualmente renderizada pelo `App.tsx` recebe diretamente o estado `notes`, `onUpdateNote` e `onDeleteNote`.
- Existe uma implementação paralela em `components/Library.tsx`/`services/db.ts` baseada em IndexedDB.
- Não migrar nem apagar dados sem mapear criação, edição, exclusão, tags, notebooks, destaque, exportação e importação.

## Problemas conhecidos

- `ENABLE_ACTIVITY_TRACKING = false` e existe limpeza silenciosa de `activity-events-v1`; decidir entre reativar corretamente ou remover a interface correspondente.
- O botão de IA das confissões está sem implementação real e deve ser removido ou conectado a uma função válida.
- O parser Strong pode não aceitar sufixos como `{H1234a}`.
- O parser de versos pode confundir linhas de continuação iniciadas por números dependendo do formato importado.
- `selectReference` reconhece `Livro capítulo:versículo`; validar o fluxo completo.
- Há duplicação de `activeGoalProfile` entre telas.
- Code splitting de serviços está inconsistente.

## Decisões permanentes

1. Não fazer merge integral da PR #1 (`Refactor critical fixes`) sem revisão.
2. Não usar workflows do GitHub Actions como arquitetura permanente para reescrever código-fonte.
3. Não iniciar redesign da Home antes da estabilidade funcional.
4. Evitar substituições completas de `src/App.tsx` por operações GitHub Contents.
5. Priorizar estabilidade funcional antes de novas mudanças visuais.
6. Preservar dados existentes antes de qualquer migração de persistência.

## Limpeza

- `.github/workflows/apply-home-v4.yml` foi desativado.
- A Home V4 não é a implementação ativa.
- O workflow temporário de correção do leitor foi removido após a aplicação da correção.
- O workflow temporário usado nas correções do Estudo foi removido após a aplicação das alterações.

## Critério de conclusão de cada etapa

Uma etapa só deve ser marcada como concluída quando:

1. O código foi alterado de forma localizada.
2. Não houve substituição destrutiva de arquivo grande.
3. A funcionalidade afetada foi revisada.
4. `npm run lint` passa.
5. `npm run build` passa.
6. Quando aplicável, `npm run check` passa.
7. O resultado foi registrado neste arquivo.

## Registro de alterações

### 2026-09-15

- Integrado o parser robusto ao fluxo `busca → referência → Reader → versículo`.
- Referências com livros numerados, como `1 João` e `1 Coríntios`, são reconhecidas.


### 2026-09-15

- Concluída e integrada a Etapa 3: salvamento de estudos em Anotações.
- Corrigidos estados acidentais inseridos em telas que não pertenciam à Etapa 3.
- Atualizado este registro para refletir as Etapas 2 e 3 como concluídas.
- PR #5 integrada à `main`.
- Vercel reportou status `success` para o head da implementação.

### 2026-09-14

- Corrigida a rolagem da tela de Estudo para evitar contêineres aninhados.
- Removida a automação temporária anterior de GitHub Actions.
