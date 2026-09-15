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
4. Auditoria de Anotações e persistência: **CONCLUÍDA — auditoria realizada; migração IndexedDB/localStorage ainda não executada**
5. Importação/exportação: **CONCLUÍDA — implementação existente auditada e documentada**
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

## Etapa 4 concluída: Auditoria de Anotações e persistência

- O fluxo ativo `App.tsx` usa `localStorage('notes')` e a `LibraryScreen` ativa recebe diretamente `notes`, `onUpdateNote` e `onDeleteNote`.
- A implementação paralela/legada em `components/Library.tsx` e `services/db.ts` usa IndexedDB (`SolaScripturaDB`) com store `notes`.
- Os dois mecanismos não são sincronizados atualmente.
- O tipo `Note` contempla `tags`, `notebook` e `pinned` como campos opcionais já utilizados pelo fluxo ativo.
- A etapa não migrou nem apagou dados; a unificação permanece para uma etapa arquitetural posterior, com estratégia reversível.
- Auditoria detalhada registrada em `docs/ETAPA_4.md`.

## Etapa 5 concluída: Importação e exportação

- `exportAppData()` gera backup JSON versionado (`version: 1`) com data de exportação e dados locais do aplicativo.
- O backup é baixado no navegador como arquivo `.json`.
- Anotações participam do backup e preservam campos opcionais como tags, notebook e fixação.
- `importAppData(file)` lê e valida JSON antes da restauração.
- As anotações importadas são verificadas como coleção e normalizadas antes de entrarem no estado ativo.
- `importBibleVersionData(file)` permanece separado do backup geral para importar versões bíblicas.
- A auditoria foi registrada em `docs/ETAPA_5.md`.
- Nenhuma substituição destrutiva de `src/App.tsx` foi necessária nesta etapa.

## Próxima etapa: Progresso de estudo

Objetivo: consolidar a experiência de acompanhamento da leitura e estudo.

- Mapear os estados de progresso já existentes.
- Validar persistência e restauração do progresso.
- Validar planos de leitura e localizações salvas.
- Consolidar cálculo e apresentação de progresso.
- Garantir continuidade da leitura a partir da Home.

## Problemas conhecidos

- `ENABLE_ACTIVITY_TRACKING = false` e existe limpeza silenciosa de `activity-events-v1`; decidir entre reativar corretamente ou remover a interface correspondente.
- O botão de IA das confissões está sem implementação real e deve ser removido ou conectado a uma função válida.
- O parser Strong pode não aceitar sufixos como `{H1234a}`.
- O parser de versos pode confundir linhas de continuação iniciadas por números dependendo do formato importado.
- Há duplicação de `activeGoalProfile` entre telas.
- Code splitting de serviços está inconsistente.
- `src/studyNotes.ts` deve ser revisado para confirmar se o helper está efetivamente utilizado.
- Existe persistência legada em IndexedDB que ainda não foi migrada nem removida.

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

1. O código foi alterado de forma localizada ou, quando nenhuma alteração funcional é necessária, a implementação existente foi auditada.
2. Não houve substituição destrutiva de arquivo grande.
3. A funcionalidade afetada foi revisada.
4. `npm run lint` passa.
5. `npm run build` passa.
6. Quando aplicável, `npm run check` passa.
7. O resultado foi registrado neste arquivo.

## Registro de alterações

### 2026-09-15

- Reconciliado o `PROJECT_STATUS.md` com o estado atual do projeto.
- Etapa 4 marcada como concluída após auditoria documentada em `docs/ETAPA_4.md`, mantendo explícita a pendência de eventual migração do IndexedDB legado.
- Etapa 5 marcada como concluída após auditoria documentada em `docs/ETAPA_5.md`.
- Definida a Etapa 6 como próxima etapa operacional: Progresso de estudo.
- Mantido o parser de referências já integrado ao fluxo `busca → referência → Reader → versículo`, incluindo livros numerados como `1 João` e `1 Coríntios`.

### 2026-09-15

- Concluída e integrada a Etapa 3: salvamento de estudos em Anotações.
- Corrigidos estados acidentais inseridos em telas que não pertenciam à Etapa 3.
- PR #5 integrada à `main`.
- Vercel reportou status `success` para o head da implementação.

### 2026-09-14

- Corrigida a rolagem da tela de Estudo para evitar contêineres aninhados.
- Removida a automação temporária anterior de GitHub Actions.
