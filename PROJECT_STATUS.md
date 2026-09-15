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
6. Progresso de estudo: **EM ANDAMENTO — modelo persistente criado; integração com os planos ativos ainda pendente**
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

## Etapa 3 concluída: Salvar Estudo em Anotações

- `StudyScreen` recebe `onAddNote` da aplicação ativa.
- O resultado do estudo pode ser salvo diretamente na mesma persistência de Anotações usada pelo fluxo ativo.
- O registro preserva referência contextual, consulta e resposta.
- O botão de salvamento só é exibido junto ao resultado do estudo.
- Após salvar, o botão confirma a operação e impede duplicação imediata.
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

## Etapa 6: Progresso de estudo — em andamento

### Auditoria realizada

- Existem planos estáticos em `READING_PLANS` com valores de `progress` e `currentDay` definidos no código; esses valores não representam, por si só, progresso real do usuário.
- Existem planos personalizados persistidos em `custom-reading-plans-v1`.
- O cálculo de plano personalizado usa `getCurrentPlanDay(plan)`, derivando o dia a partir da data de início e da data atual.
- A interface de planos personalizados calcula `progress` a partir do dia atual e de `estimatedDays`.
- `reading-locations` é persistido em `localStorage` e permite recuperar o último ponto salvo de leitura.
- `goal-targets-v1` é persistido em `localStorage` e representa metas, mas não substitui um registro consolidado de capítulos/versículos efetivamente concluídos.
- A estrutura legada `StudyPlan`/`StudySession` possui `progress`, `completedSessions` e `isCompleted`, mas pertence ao fluxo legado baseado em IndexedDB e não constitui a fonte ativa do progresso.

### Implementação atual

- Criado `src/studyProgress.ts` como fonte persistente versionada para dias de planos explicitamente concluídos.
- Chave de armazenamento: `study-progress-v1`.
- Cada registro contém `planId`, `day` e `completedAt` e é identificado de forma estável por `planId:day`.
- O módulo valida o conteúdo lido do `localStorage` e tolera JSON inválido sem quebrar a aplicação.
- `toggleStudyDay` permite concluir/desmarcar um dia sem criar duplicatas.
- `getStudyPlanProgress` calcula dias concluídos e percentual exclusivamente a partir dos registros reais.
- A implementação foi integrada à `main` pela PR #8.
- Documentação detalhada registrada em `docs/ETAPA_6.md`.

### Pendências para concluir a etapa

- Integrar a fonte de progresso aos planos ativos em `App.tsx`.
- Permitir marcar a leitura do dia como concluída e atualizar imediatamente o progresso.
- Integrar o progresso real à experiência de continuidade da Home.
- Evitar que valores demonstrativos dos planos estáticos sejam apresentados como progresso pessoal real.
- Incluir `study-progress-v1` no backup/restauração futuro sem quebrar o formato existente.
- Validar o fluxo completo: iniciar plano → concluir leitura → atualizar progresso → fechar/reabrir app → continuar no ponto correto.

## Problemas conhecidos

- `ENABLE_ACTIVITY_TRACKING = false` e existe limpeza silenciosa de `activity-events-v1`; decidir entre reativar corretamente ou remover a interface correspondente.
- O botão de IA das confissões está sem implementação real e deve ser removido ou conectado a uma função válida.
- O parser Strong pode não aceitar sufixos como `{H1234a}`.
- O parser de versos pode confundir linhas de continuação iniciadas por números dependendo do formato importado.
- Há duplicação de `activeGoalProfile` entre telas.
- Code splitting de serviços está inconsistente.
- `src/studyNotes.ts` deve ser revisado para confirmar se o helper está efetivamente utilizado.
- Existe persistência legada em IndexedDB que ainda não foi migrada nem removida.
- O progresso dos planos estáticos ainda contém valores demonstrativos definidos no código.

## Decisões permanentes

1. Não fazer merge integral da PR #1 (`Refactor critical fixes`) sem revisão.
2. Não usar workflows do GitHub Actions como arquitetura permanente para reescrever código-fonte.
3. Não iniciar redesign da Home antes da estabilidade funcional.
4. Evitar substituições completas de `src/App.tsx` por operações GitHub Contents.
5. Priorizar estabilidade funcional antes de novas mudanças visuais.
6. Preservar dados existentes antes de qualquer migração de persistência.
7. Não tratar progresso demonstrativo como progresso real do usuário.

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

- Avançada a Etapa 6: criado e integrado o modelo persistente `src/studyProgress.ts`.
- Adicionada a documentação `docs/ETAPA_6.md`.
- PR #8 integrada à `main`.
- Mantida a etapa como **EM ANDAMENTO** porque a UI dos planos ativos ainda não consome o novo modelo.

### 2026-09-15

- Iniciada a Etapa 6: Progresso de estudo.
- Auditados planos estáticos, planos personalizados, localizações de leitura, metas e a estrutura legada de sessões de estudo.
- Confirmado que o progresso personalizado é atualmente derivado principalmente da data de início, enquanto o progresso dos planos estáticos contém valores definidos no código.
- Identificada a necessidade de uma fonte persistente única para sessões/capítulos efetivamente concluídos antes de marcar a etapa como concluída.

### 2026-09-15

- Reconciliado o `PROJECT_STATUS.md` com o estado atual do projeto.
- Etapa 4 marcada como concluída após auditoria documentada em `docs/ETAPA_4.md`, mantendo explícita a pendência de eventual migração do IndexedDB legado.
- Etapa 5 marcada como concluída após auditoria documentada em `docs/ETAPA_5.md`.
- Mantido o parser de referências já integrado ao fluxo `busca → referência → Reader → versículo`, incluindo livros numerados como `1 João` e `1 Coríntios`.

### 2026-09-15

- Concluída e integrada a Etapa 3: salvamento de estudos em Anotações.
- Corrigidos estados acidentais inseridos em telas que não pertenciam à Etapa 3.
- PR #5 integrada à `main`.
- Vercel reportou status `success` para o head da implementação.

### 2026-09-14

- Corrigida a rolagem da tela de Estudo para evitar contêineres aninhados.
- Removida a automação temporária anterior de GitHub Actions.
