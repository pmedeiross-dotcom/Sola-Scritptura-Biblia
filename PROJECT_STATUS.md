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
6. Progresso de estudo: **CONCLUÍDA**
7. Rastreamento de atividade: **CONCLUÍDA**
8. Parser bíblico e Strong: **CONCLUÍDA**
9. Confissões/IA: **CONCLUÍDA — estudo interno funcional e transparente; remoção do workflow temporário ainda pendente por bloqueio da ferramenta**
10. Arquitetura e performance: **EM ANDAMENTO**
11. Qualidade, CI e Vercel: **EM ANDAMENTO**
12. Evolução visual da Home: **PENDENTE**

## Etapa 9: Confissões/IA — concluída funcionalmente

- O serviço `src/services/internalBibleAI.ts` fornece análise interna baseada em Bíblia, léxico Strong e conhecimento local do aplicativo.
- O fluxo ativo de Confissões foi conectado ao mecanismo de estudo interno.
- O botão passou a usar o rótulo `Estudar com recursos internos`.
- A resposta informa explicitamente que a análise é local e não é uma resposta de modelo generativo externo.
- Estados de carregamento e erro são tratados pelo fluxo ativo.
- `docs/ETAPA_9.md` registra a implementação e sua limitação conhecida.
- A remoção do workflow temporário `.github/workflows/stage-9-patch.yml` ainda precisa ser feita manualmente, pois a operação de exclusão foi bloqueada pela ferramenta nesta execução.

## Etapa 10: Arquitetura e performance — em andamento

Objetivo: reduzir concentração em `App.tsx`, revisar componentes legados, melhorar code splitting, eliminar código morto e corrigir pequenos problemas técnicos sem alterar o comportamento funcional estabelecido nas etapas anteriores.

Prioridades:
- revisar `src/studyNotes.ts` e `src/referenceParser.ts` quanto a uso real;
- revisar `isUselessActivityEvent` e outras funções/código morto;
- revisar duplicação de `activeGoalProfile`;
- revisar persistência legada em IndexedDB;
- melhorar code splitting de serviços pesados;
- reduzir impacto dos chunks grandes do build;
- corrigir problemas de tipagem identificados, sem migrações destrutivas.

## Problemas conhecidos

- Workflow temporário `stage-9-patch.yml` ainda presente e deve ser removido.
- Há duplicação de `activeGoalProfile` entre telas.
- Code splitting de serviços está inconsistente.
- `src/studyNotes.ts` e `src/referenceParser.ts` devem ser revisados para confirmar uso efetivo.
- Existe persistência legada em IndexedDB que ainda não foi migrada nem removida.
- O build apresenta avisos de tamanho de chunks.

## Decisões permanentes

1. Não fazer merge integral da PR #1 (`Refactor critical fixes`) sem revisão.
2. Não usar workflows do GitHub Actions como arquitetura permanente para reescrever código-fonte.
3. Não iniciar redesign da Home antes da estabilidade funcional.
4. Evitar substituições completas de `src/App.tsx` por operações GitHub Contents.
5. Priorizar estabilidade funcional antes de novas mudanças visuais.
6. Preservar dados existentes antes de qualquer migração de persistência.
7. Não tratar progresso demonstrativo como progresso real do usuário.
8. Não apresentar heurísticas locais como IA real.

## Registro de alterações

### 2026-09-15

- Etapas 6, 7 e 8 permanecem concluídas.
- Etapa 9 concluída funcionalmente: fluxo de estudo das Confissões conectado aos recursos internos de análise, sem apresentar heurística local como IA generativa externa.
- `docs/ETAPA_9.md` criado.
- O workflow temporário da Etapa 9 permanece como pendência operacional porque a exclusão via ferramenta foi bloqueada.
- Etapa 10 iniciada: arquitetura, código morto, persistência legada, code splitting e tamanho dos bundles passam a ser o foco.
