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
2. Estudo: rolagem e controles: **PENDENTE**
3. Salvar Estudo em Anotações: **PENDENTE**
4. Auditoria de Anotações e persistência: **PENDENTE**
5. Importação/exportação: **PENDENTE**
6. Progresso de estudo: **PENDENTE**
7. Rastreamento de atividade: **PENDENTE**
8. Parser bíblico e Strong: **PENDENTE**
9. Confissões/IA: **PENDENTE**
10. Arquitetura e performance: **PENDENTE**
11. Qualidade, CI e Vercel: **PENDENTE**
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
- A estrutura foi validada pelo CI estável no commit `15d8fdd99adf03b481bbee6306ca37f5aa67ebad`; o workflow CI concluiu com sucesso, executando instalação, lint e build.
- Não foi feita substituição destrutiva de `src/App.tsx`.

## Próxima etapa

### Etapa 2 - Estudo: rolagem e controles

Objetivo: estabilizar a rolagem da tela ativa `StudyScreen`, evitando conflito entre o `main` externo do `App.tsx` e o contêiner interno de estudo, e validar os controles de topo/fim.

## Estado atual do Estudo

- A tela ativa é `StudyScreen` dentro de `src/App.tsx`.
- `components/StudyDashboard.tsx` é uma implementação paralela e não deve ser confundida com a tela ativa.
- Atualmente existem potencialmente dois contêineres roláveis: o `<main>` externo do `App.tsx` e o root do `StudyScreen`.
- `studyScrollRef` existe e os botões de topo/fim já possuem lógica, mas a arquitetura de rolagem ainda precisa ser consolidada e validada.
- As preferências de estudo continuam persistidas em `localStorage('study-analysis-preferences')`.
- Não considerar a funcionalidade de salvar estudo em Anotações como concluída até verificar o código ativo em `App.tsx`.

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
- O workflow temporário usado em tentativas de correção do Estudo não deve ser tratado como arquitetura permanente.

## Critério de conclusão de cada etapa

Uma etapa só deve ser marcada como concluída quando:

1. O código foi alterado de forma localizada.
2. Não houve substituição destrutiva de arquivo grande.
3. A funcionalidade afetada foi revisada.
4. `npm run lint` passa.
5. `npm run build` passa.
6. Quando aplicável, `npm run check` passa.
7. O resultado foi registrado neste arquivo.
