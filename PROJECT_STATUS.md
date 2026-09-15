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
10. Arquitetura e performance: **CONCLUÍDA**
11. Qualidade, CI e Vercel: **EM ANDAMENTO**
12. Evolução visual da Home: **PENDENTE**

## Etapa 10: Arquitetura e performance — concluída

Objetivo: reduzir concentração em `App.tsx`, revisar componentes legados, melhorar code splitting, eliminar código morto e corrigir pequenos problemas técnicos sem alterar o comportamento funcional estabelecido nas etapas anteriores.

Implementações realizadas:
- Confirmada a ausência de referências ativas aos componentes legados `components/Library.tsx` e `components/StudyDashboard.tsx`.
- `components/Library.tsx` removido da `main`.
- `components/StudyDashboard.tsx` removido da `main`.
- `src/studyNotes.ts` já havia sido removido após confirmação de ausência de uso ativo.
- `src/referenceParser.ts` não está presente na arquitetura atual da `main`.
- `isUselessActivityEvent` permanece centralizada em `src/activityTracking.ts`, sem duplicação ativa em `App.tsx`.
- `src/services/internalBibleAI.ts` passou a ser carregado sob demanda por import dinâmico.
- `services/importer.ts` e `services/db.ts` continuam ativos e foram preservados.
- A alteração de code splitting foi validada pelo CI com instalação de dependências, type check e build concluídos com sucesso.
- `docs/ETAPA_10.md` registra o resultado da etapa.

## Etapa 11: Qualidade, CI e Vercel — em andamento

Próximo foco: validação final do estado consolidado, revisão dos checks do GitHub Actions, confirmação do build/deploy na Vercel e correção de eventuais falhas ou regressões antes de iniciar a evolução visual da Home.

## Problemas conhecidos / pontos para revisão posterior

- `App.tsx` continua altamente concentrado; uma decomposição maior deve ser feita somente com testes e baixo risco.
- `services/db.ts` mantém persistência em IndexedDB por ainda possuir uso ativo.
- O build pode continuar apresentando avisos de tamanho de chunks; a melhoria feita na Etapa 10 reduz um dos pontos de carregamento inicial, mas não constitui uma refatoração integral de `App.tsx`.

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
- Componentes legados sem referências ativas removidos.
- Serviço de estudo interno movido para carregamento sob demanda.
- Duplicação de `isUselessActivityEvent` eliminada.
- CI do commit de code splitting concluído com sucesso.
- Etapa 10 concluída.
- Etapa 11 iniciada para validação final de qualidade, CI e Vercel.
