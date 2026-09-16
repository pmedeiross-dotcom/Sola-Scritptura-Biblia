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
11. Qualidade, CI e Vercel: **CONCLUÍDA**
12. Evolução visual da Home: **CONCLUÍDA**
13. Hardening da persistência IndexedDB: **CONCLUÍDA**
14. Decomposição de `App.tsx`: **EM ANDAMENTO — análise estrutural concluída; implementação ainda não aplicada**

## Etapa 14: Decomposição de App.tsx - em andamento

Objetivo: reduzir a concentração estrutural de `src/App.tsx` por extrações pequenas, independentes e de baixo risco, sem alterar comportamento funcional.

### Análise inicial - 2026-09-16

- `App.tsx` concentra utilitários, tipos, dados estáticos, múltiplas telas e o estado/orquestração do aplicativo.
- Foi identificada uma primeira extração segura: utilitários puros compartilháveis, começando por `cn` e funções de transformação/parsing que não dependem de JSX ou estado React.
- A análise também confirmou que `BibleScreen`, `ReadingPlansScreen`, `LibraryScreen` e `SettingsScreen` possuem estado e lógica próprios, portanto uma decomposição dessas telas deve ocorrer em etapas separadas.
- Não será feita substituição integral de `App.tsx`; a decisão permanente de evitar esse tipo de operação permanece válida.
- Nenhuma alteração funcional foi aplicada nesta etapa de análise.

### Próximo passo técnico

- Extrair primeiro um conjunto pequeno de funções puras para módulo dedicado.
- Ajustar os imports de `App.tsx` de forma localizada.
- Executar type check, build, CI e Vercel antes de considerar a etapa concluída.

## Etapa 13: Hardening da persistência IndexedDB - concluída

Objetivo: reduzir overhead desnecessário nas operações de persistência sem alterar o modelo de dados, os stores existentes ou o comportamento funcional da aplicação.

### Análise e implementação - 2026-09-16

- `services/db.ts` abria uma nova conexão IndexedDB em cada chamada de leitura ou escrita por meio de `indexedDB.open(...)`.
- O mesmo módulo concentra múltiplas operações de leitura/escrita sobre Notes, Highlights, History, Study Progress, Bibles e Dictionaries.
- O banco utiliza versão 5 e os stores existentes permaneceram estáveis.
- Implementado cache interno `dbPromise` para reutilizar a conexão aberta enquanto ela permanece válida.
- Falhas de abertura limpam o cache para permitir nova tentativa.
- `onversionchange` fecha a conexão antiga e limpa o cache para permitir nova conexão após atualização de versão em outra aba/contexto.
- Nenhum store, schema, chave ou formato de dado foi alterado.
- As funções públicas existentes continuam usando `initDB()` e mantêm suas assinaturas.

### Validação final

- PR #18 integrada à `main` com merge commit `d6f1478eb92050b973c21f1dc832be95857dc9cb`.
- GitHub Actions `CI` concluído com sucesso no commit da branch, incluindo as verificações de qualidade configuradas.
- Status Vercel do commit da branch validado como `success`.
- Alteração limitada à reutilização segura da conexão IndexedDB e à documentação operacional.
- Nenhuma alteração funcional, de schema, stores, contratos públicos ou dados existentes foi necessária.

## Etapa 12: Evolução visual da Home - concluída

Objetivo: evoluir a Home atual (`HomeScreenV3`) com foco em hierarquia visual, clareza das ações principais, continuidade de leitura/estudo e acabamento profissional, preservando as funcionalidades e a estabilidade conquistadas nas etapas anteriores.

### Resultado final - 2026-09-16

- Mantida a implementação ativa em `HomeScreenV3` sem alteração de lógica funcional.
- Consolidada a camada de refinamento visual em `src/home-v3-hierarchy.css`.
- Mobile até 640px recebeu ajustes finais de densidade, espaçamento, proporção dos cartões, leitura dos títulos e área de toque dos botões.
- Larguras muito estreitas (até 380px) receberam tratamento específico para evitar compressão das quatro ações rápidas, excesso horizontal e botões pequenos.
- O tema escuro recebeu reforço de contraste para textos secundários, bordas, fundos de cartões, ícones e barra de progresso.
- A hierarquia final permanece: versículo do dia como abertura, ações principais em seguida, continuidade da leitura com destaque próprio, recursos como navegação secundária e planos como conteúdo complementar.
- Nenhuma alteração foi feita em navegação, persistência, progresso, busca, compartilhamento, anotações, planos, Reader ou Study.
- PR #17 foi integrada à `main` com merge commit `d2c0b5552aaf942b826ba5e1e2e86a11612c27fa`.
- CI do PR #17 concluído com sucesso: instalação, type check e build aprovados.
- Vercel do commit da revisão visual concluído com estado `success`.
- Nenhuma alteração funcional foi necessária durante a finalização.

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

### 2026-09-16

- Etapa 14 iniciada com análise estrutural de `App.tsx`.
- Primeira extração planejada: utilitários puros e independentes de estado/JSX.
- Etapa 13 concluída após análise do estado real do código e hardening da conexão IndexedDB.
- PR #18 integrada à `main` com merge commit `d6f1478eb92050b973c21f1dc832be95857dc9cb`.
- CI da Etapa 13 aprovado.
- Vercel da Etapa 13 validado como `success`.
- `PROJECT_STATUS.md` atualizado para registrar a conclusão da Etapa 13.
- Etapa 12 concluída após revisão visual final da Home para mobile, larguras muito estreitas e tema escuro.
- PR #17 foi integrada à `main` com merge commit `d2c0b5552aaf942b826ba5e1e2e86a11612c27fa`.

### 2026-09-15

- Etapas 6, 7, 8, 9 e 10 permanecem concluídas.
- CI e build da `main` validados com sucesso.
- Status Vercel do commit de produção validado como `success`.
- Workflow legado de Home V4 confirmado como desativado.
- Etapa 11 concluída sem necessidade de alteração funcional.
