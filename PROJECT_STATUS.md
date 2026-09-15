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
9. Confissões/IA: **CONCLUÍDA**
10. Arquitetura e performance: **EM ANDAMENTO**
11. Qualidade, CI e Vercel: **EM ANDAMENTO**
12. Evolução visual da Home: **PENDENTE**

## Etapa 9: Confissões/IA — concluída

- O serviço `src/services/internalBibleAI.ts` fornece análise interna baseada em Bíblia, léxico Strong e conhecimento local do aplicativo.
- O fluxo ativo de Confissões foi conectado ao mecanismo de estudo interno.
- O botão usa o rótulo `Estudar com recursos internos`.
- A resposta informa explicitamente que a análise é local e não é uma resposta de modelo generativo externo.
- Estados de carregamento e erro são tratados pelo fluxo ativo.
- `docs/ETAPA_9.md` registra a implementação e sua limitação conhecida.
- O workflow temporário `.github/workflows/stage-9-patch.yml` foi removido manualmente da `main`.

## Etapa 10: Arquitetura e performance — em andamento

Objetivo: reduzir concentração em `App.tsx`, revisar componentes legados, melhorar code splitting, eliminar código morto e corrigir pequenos problemas técnicos sem alterar o comportamento funcional estabelecido nas etapas anteriores.

Auditoria inicial realizada:
- `src/referenceParser.ts` não está presente na `main`.
- `src/studyNotes.ts` foi removido após confirmação de ausência de uso ativo.
- `isUselessActivityEvent` possui implementação central em `src/activityTracking.ts` e há uma implementação local duplicada em `src/App.tsx`; deve ser consolidada.
- `src/studyProgress.ts` já normaliza entradas e calcula dias concluídos por dia único.
- Há componentes legados fora de `src/components`, incluindo `components/Library.tsx` e `components/StudyDashboard.tsx`; devem ser removidos apenas após confirmação de referências.
- `services/importer.ts` e `services/db.ts` continuam ativos e não devem ser tratados como código morto.
- `App.tsx` permanece altamente concentrado; code splitting de serviços e telas é prioridade.

Próximas ações:
- confirmar referências dos arquivos/componentes candidatos a remoção;
- consolidar código duplicado sem alterar comportamento;
- melhorar carregamento sob demanda de serviços/telas pesados;
- revisar impacto dos chunks grandes do build;
- corrigir problemas de tipagem de baixo risco;
- validar com CI antes de avançar para a Etapa 11.

## Problemas conhecidos

- Há concentração elevada de código em `src/App.tsx`.
- Code splitting de serviços/telas está inconsistente.
- Há uma função duplicada de filtragem de atividade em `App.tsx`.
- Há componentes legados fora de `src/components` que precisam de auditoria antes de remoção.
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

- Etapas 6, 7, 8 e 9 permanecem concluídas.
- Workflow temporário da Etapa 9 removido manualmente da `main`.
- `src/studyNotes.ts` removido por estar sem uso ativo.
- `src/studyProgress.ts` endurecido contra entradas duplicadas e inválidas.
- Etapa 10 permanece em andamento.
- Auditoria inicial de código morto, componentes legados, persistência e concentração de `App.tsx` registrada.
